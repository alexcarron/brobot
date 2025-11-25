import { inspect } from "util";
import { hasProperty, isNull, isObject, isUndefined } from "./types/type-guards";

export class InvalidTypeError extends Error {
  constructor(value: unknown, expectedType: string) {
    const prettyValue = inspect(value, {
			depth: null,
			colors: true,
			compact: false
		});
    super(`Runtime type error: Expected value to be a ${expectedType}, but got:\n${prettyValue}`);

    this.name = 'InvalidTypeError';
  }
}

type RuntimeType<Type> = {
	orNull: RuntimeType<Type | null>;
	isType(value: unknown): value is Type;
	from(value: unknown): Type;
	fromAll(values: unknown[]): Type[];
	asTranformableType<DomainType, DomainName extends string>(
		domainName: DomainName,
		toDomainType: (rawValue: Type) => DomainType,
		fromDomainType: (domainValue: DomainType) => Type
	): NamedTransformableRuntimeType<Type, DomainType, DomainName>;

	to<DomainType>(
		toDomainType: (rawValue: Type) => DomainType
	): {
		from(
			fromDomainType: (domainValue: DomainType) => Type
		): TransformableRuntimeType<Type, DomainType>;
	}
};

type TransformableRuntimeType<RawType, DomainType> =
	& RuntimeType<RawType>
	& {
		orNull: TransformableRuntimeType<RawType | null, DomainType | null>;
		toDomain: (rawValue: unknown) => DomainType;
		toDomains: (rawValues: unknown[]) => DomainType[];
		fromDomain: (domainValue: DomainType) => RawType;
		fromDomains: (domainValues: DomainType[]) => RawType[];
	}

type NamedTransformableRuntimeType<
	RawType,
	DomainType,
	DomainName extends string,
> =
	& RuntimeType<RawType>
	& {
		orNull: NamedTransformableRuntimeType<RawType | null, DomainType | null, DomainName>;
	}
	& {
		[Key in
			| `to${DomainName}s`
			| `to${DomainName}`
			| `from${DomainName}s`
			| `from${DomainName}`
		]:
			Key extends `to${DomainName}s`
				? (rawValues: unknown[]) => DomainType[]
			: Key extends `to${DomainName}`
				? (rawValue: unknown) => DomainType
			: Key extends `from${DomainName}s`
				? (domainValues: DomainType[]) => RawType[]
			: Key extends `from${DomainName}`
				? (domainValue: DomainType) => RawType
				: never;
	};

/**
 * Provides the underlying type of the given runtime type, or never if the given runtime type is not a runtime type.
 */
export type ExtractType<SomeRuntimeType> =
	SomeRuntimeType extends RuntimeType<infer UnderlyingType>
		? UnderlyingType
		: never;

export type ExtractRawType<SomeRuntimeType> = ExtractType<SomeRuntimeType>;

export type ExtractDomainType<SomeRuntimeType> =
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	SomeRuntimeType extends NamedTransformableRuntimeType<infer RawType, infer DomainType, infer DomainName>
		? DomainType
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	: SomeRuntimeType extends TransformableRuntimeType<infer RawType, infer DomainType>
		? DomainType
		: ExtractType<SomeRuntimeType>;


/**
 * Asserts that the given value is of the given type, or throws an InvalidTypeError if it is not.
 * @param value - The value to check.
 * @param predicate - A function that takes the given value and returns true if it is of the given type.
 * @param expectedType - The type that the given value is expected to be.
 * @throws {InvalidTypeError} - If the given value is not of the given type.
 * @example
 * assertOrThrow(
 * 	someValue,
 * 	(value) => value === "hello",
 * 	"hello string"
 * );
 */
function throwIfNotType<Type>(
	value: unknown,
	predicate: (value: unknown) => value is Type,
	expectedType: string
): asserts value is Type {
	if (!predicate(value)) {
		throw new InvalidTypeError(value, expectedType);
	}
}

/**
 * Returns the given value if it is of the given type, or throws an InvalidTypeError if it is not.
 * @param value - The value to check.
 * @param predicate - A function that takes the given value and returns true if it is of the given type.
 * @param expectedType - The type that the given value is expected to be.
 * @throws {InvalidTypeError} - If the given value is not of the given type.
 * @returns The given value if it is of the given type.
 * @example
 * const someValue: string | number = "hello";
 * const someString: string = returnTypeOrThrow(someValue, (value) => typeof value === "string", "string");
 */

function returnTypeOrThrow<Type>(
	value: unknown,
	predicate: (value: unknown) => value is Type,
	expectedType: string
): Type {
	throwIfNotType(value, predicate, expectedType);
	return value;
}

/**
 * Returns all values in the given array that are of the given type, or throws an InvalidTypeError if any of the values are not of the given type.
 * @param values - The values to check.
 * @param predicate - A function that takes the given value and returns true if it is of the given type.
 * @param expectedType - The type that the given values are expected to be.
 * @throws {InvalidTypeError} - If any of the given values are not of the given type.
 * @returns An array of values that are of the given type.
 * @example
 * const someValues: string | number[] = ["hello", 10];
 * const someStrings: string[] = returnAllOfTypeOrThrow(someValues, (value) => typeof value === "string", "string");
 */
function returnAllOfTypeOrThrow<Type>(
	values: unknown[],
	predicate: (value: unknown) => value is Type,
	expectedType: string
): Type[] {
	return values.map((value) =>
		returnTypeOrThrow(value, predicate, expectedType)
	);
}

/**
 * Creates a runtime type that can be used to assert that a given value is of a specific type.
 * @param expectedType - The type that the given value is expected to be.
 * @param predicate - A function that takes the given value and returns true if it is of the given type.
 * @returns A runtime type that includes throwIfNot and from functions for asserting the type of the given value.
 * @example
 * const string = createRuntimeType<string>("string", (value) => typeof value === "string");
 * const someString: string = string.from(someValue);
 */
function createRuntimeType<Type>(
	expectedType: string,
	predicate: (value: unknown) => value is Type
): RuntimeType<Type> {
	const partialRuntimeType = {
		isType: (value: unknown): value is Type => predicate(value),
		from: (value: unknown): Type => {
			return returnTypeOrThrow(value, predicate, expectedType);
		},
		fromAll: (values: unknown[]): Type[] => {
			return returnAllOfTypeOrThrow(values, predicate, expectedType);
		},
		asTranformableType: <DomainType, DomainName extends string>(
			domainName: DomainName,
			toDomainType: (rawValue: Type) => DomainType,
			fromDomainType: (domainValue: DomainType) => Type
		) => createNamedTransformableRuntimeType<Type, DomainType, DomainName>(
			domainName,
			predicate,
			toDomainType,
			fromDomainType
		),
		to: <DomainType>(
			toDomainType: (rawValue: Type) => DomainType
		) => ({
			from: (fromDomainType: (domainValue: DomainType) => Type) =>
				createTransformableRuntimeType(
					expectedType,
					predicate,
					toDomainType,
					fromDomainType
				),
		}),
	};

	Object.defineProperty(partialRuntimeType, "orNull", {
		get() {
			if (partialRuntimeType.isType(null)) {
				return partialRuntimeType;
			}

      const createdRuntimeType = createRuntimeType<Type | null>(
        `${expectedType} or null`,
        (value): value is Type | null =>
					value === null || predicate(value)
      );

      Object.defineProperty(partialRuntimeType, 'orNull', {
				value: createdRuntimeType,
				configurable: true,
				writable: false
			});

      return createdRuntimeType;
    },
    configurable: true,
	});

	return partialRuntimeType as RuntimeType<Type>;
}

function createTransformableRuntimeType<RawType, DomainType>(
	expectedType: string,
	predicate: (value: unknown) => value is RawType,
	toDomainType: (rawValue: RawType) => DomainType,
	fromDomainType: (domainValue: DomainType) => RawType
): TransformableRuntimeType<RawType, DomainType> {
	const runtimeType = createRuntimeType<RawType>("RawType", predicate);
	const transformableRuntimeType = Object.assign(runtimeType, {
		toDomain: (value: unknown) => {
			throwIfNotType(value, predicate, expectedType);
			return toDomainType(value);
		},
		fromDomain: fromDomainType,
		toDomains: (values: unknown[]) =>
			values.map((value) => {
				throwIfNotType(value, predicate, expectedType);
				return toDomainType(value);
			}),
		fromDomains: (domainValues: DomainType[]) =>
			domainValues.map(fromDomainType),
	});

	Object.defineProperty(transformableRuntimeType, "orNull", {
    get() {
      if (transformableRuntimeType.isType(null)) {
        return transformableRuntimeType;
      }

      const nullablePredicate =
				(value: unknown): value is RawType | null =>
					value === null || predicate(value);

      const nullableToDomain = (raw: RawType | null) => {
				if (raw === null) {
					return null;
				}

				return toDomainType(raw);
			}

      const nullableFromDomain = (domain: DomainType | null) => {
				if (domain === null) {
					return null;
				}

				return fromDomainType(domain);
			}

      const createdRuntimeType = createTransformableRuntimeType<RawType | null, DomainType | null>(
        `${expectedType} or null`,
        nullablePredicate,
        nullableToDomain,
        nullableFromDomain
      );

      Object.defineProperty(transformableRuntimeType, "orNull", {
        value: createdRuntimeType,
        writable: false,
        configurable: true,
      });

      return createdRuntimeType as RuntimeType<RawType | null>;
    },
    configurable: true,
  });

	return transformableRuntimeType as any;
}

function createNamedTransformableRuntimeType<
	RawType,
	DomainType,
	DomainName extends string
>(
	domainName: DomainName,
	predicate: (value: unknown) => value is RawType,
	toDomainType: (rawValue: RawType) => DomainType,
	fromDomainType: (domainValue: DomainType) => RawType
): NamedTransformableRuntimeType<RawType, DomainType, DomainName> {
	const runtimeType = createRuntimeType(domainName, predicate);
	const namedTransformableRuntimeType = Object.assign(runtimeType, {
		[`to${domainName}`]: (value: unknown) => {
			throwIfNotType(value, predicate, domainName);
			return toDomainType(value);
		},
		[`from${domainName}`]: fromDomainType,
		[`to${domainName}s`]: (values: unknown[]) =>
			values.map(value => {
				throwIfNotType(value, predicate, domainName);
				return toDomainType(value);
			}),
		[`from${domainName}s`]: (domainValues: DomainType[]) =>
			domainValues.map(fromDomainType),
	}) as NamedTransformableRuntimeType<RawType, DomainType, DomainName>;

	Object.defineProperty(namedTransformableRuntimeType, "orNull", {
		get() {
			if (namedTransformableRuntimeType.isType(null)) {
				return namedTransformableRuntimeType;
			}

			const nullablePredicate =
				(value: unknown): value is RawType | null =>
					value === null || predicate(value);

			const nullableToDomain = (raw: RawType | null) => {
				if (raw === null) {
					return null;
				}

				return toDomainType(raw);
			}

			const nullableFromDomain = (domain: DomainType | null) => {
				if (domain === null) {
					return null;
				}

				return fromDomainType(domain);
			}

			const createdRuntimeType = createNamedTransformableRuntimeType<RawType | null, DomainType | null, DomainName>(
				domainName,
				nullablePredicate,
				nullableToDomain,
				nullableFromDomain
			);

			Object.defineProperty(namedTransformableRuntimeType, "orNull", {
				value: createdRuntimeType,
				writable: false,
				configurable: true,
			});

			return createdRuntimeType as RuntimeType<RawType | null>;
		},
		configurable: true,
	});

	return namedTransformableRuntimeType;
}

export const number = createRuntimeType<number>("number",
	(value) => typeof value === "number"
);

export const string = createRuntimeType<string>("string",
	(value) => typeof value === "string"
);

export const boolean = createRuntimeType<boolean>("boolean",
	(value) => typeof value === "boolean"
);

export const zeroOrOne = createRuntimeType<0 | 1>("0 or 1",
	(value) =>
		typeof value === "number" &&
		(value === 0 || value === 1)
);

export const date = createRuntimeType<Date>("Date",
	(value): value is Date =>
		value instanceof Date &&
		!isNaN(value.getTime())
);

export const strings = <const Strings extends readonly string[]>(...strings: Strings) => {
	const allowedStrings = new Set<string>(strings as readonly string[]);
	const typeName = strings.map(str => `"${str}"`).join(' | ');
	return createRuntimeType<Strings[number]>(typeName,
		(value): value is Strings[number] =>
			allowedStrings.has(value as string)
	);
}

export const object = {
	isType: (value: unknown): value is object => isObject(value),
	from: (value: unknown): object => {
		return returnTypeOrThrow(value, isObject, "object");
	},
	fromAll: (values: unknown[]): object[] => {
		return returnAllOfTypeOrThrow(values, isObject, "object");
	},
	asType<ObjectType extends Record<string, any>>(
		keyToRuntimeType: {
			[Key in keyof ObjectType]: RuntimeType<ObjectType[Key]> | null | undefined;
		}
	): RuntimeType<ObjectType> {
		return createRuntimeType<ObjectType>("object",
			(value): value is ObjectType => {
				console.log({value});

				if (!isObject(value))
					return false;

				for (const key in keyToRuntimeType) {
					if (!hasProperty(value, key))
						return false;

					const runtimeType = keyToRuntimeType[key];
					const propertyValue = value[key];
					if (isNull(runtimeType)) {
						if (!isNull(propertyValue))
							return false;
					}
					else if (isUndefined(runtimeType)) {
						if (!isUndefined(propertyValue))
							return false;
					}
					else {
						if (!runtimeType.isType(propertyValue))
							return false;
					}
				}

				return true;
		});
	},
	asTransformableType:<
		DomainName extends string,
		KeyToRuntime extends {
			[K in keyof KeyToRuntime]:
				| RuntimeType<any>
				| TransformableRuntimeType<any, any>
				| NamedTransformableRuntimeType<any, any, string>
				| null
				| undefined;
		},
		RawObjectType = {
			[Key in keyof KeyToRuntime]:
				KeyToRuntime[Key] extends RuntimeType<infer InnerType>
					? InnerType
				: KeyToRuntime[Key] extends null
					? null
				: KeyToRuntime[Key] extends undefined
					? undefined
				: never;
		},
		DomainObjectType = {
			[Key in keyof KeyToRuntime]:
				KeyToRuntime[Key] extends TransformableRuntimeType<any, infer DomainType>
					? DomainType
				: KeyToRuntime[Key] extends NamedTransformableRuntimeType<any, infer DomainType, any>
					? DomainType
				: KeyToRuntime[Key] extends RuntimeType<infer InnerType>
					? InnerType
				: KeyToRuntime[Key] extends null
					? null
				: KeyToRuntime[Key] extends undefined
					? undefined
				: never;
		},
	>(
		domainName: DomainName,
		keyToRuntimeType: KeyToRuntime,
	) => {

		return createNamedTransformableRuntimeType<RawObjectType, DomainObjectType, DomainName>(
			domainName,
			(value): value is RawObjectType => {
				if (!isObject(value))
					return false;

				for (const key in keyToRuntimeType) {
					if (!hasProperty(value, key))
						return false;

					const runtimeType = keyToRuntimeType[key];
					const propertyValue = value[key];
					if (isNull(runtimeType)) {
						if (!isNull(propertyValue))
							return false;
					}
					else if (isUndefined(runtimeType)) {
						if (!isUndefined(propertyValue))
							return false;
					}
					else {
						if (!runtimeType.isType(propertyValue))
							return false;
					}
				}

				return true;
			},
			(value: RawObjectType): DomainObjectType => {
				const domainObject = {} as any;
				for (const key in keyToRuntimeType) {
					const runtimeType = keyToRuntimeType[key];
					// @ts-ignore
					const propertyValue = value[key];

					if (isNull(runtimeType)) {
						domainObject[key] = null;
					}
					else if (isUndefined(runtimeType)) {
						domainObject[key] = undefined;
					}
					else if ('toDomain' in runtimeType!) {
						domainObject[key] = runtimeType.toDomain(propertyValue);
					}
					else {
						domainObject[key] = propertyValue;
					}
				}

				return domainObject;
			},
			(value: DomainObjectType): RawObjectType => {
				const rawObject = {} as any;
				for (const key in keyToRuntimeType) {
					const runtimeType = keyToRuntimeType[key];
					// @ts-ignore
					const propertyValue = value[key];

					if (isNull(runtimeType)) {
						rawObject[key] = null;
					}
					else if (isUndefined(runtimeType)) {
						rawObject[key] = undefined;
					}
					else if ('fromDomain' in runtimeType!) {
						rawObject[key] = runtimeType.fromDomain(propertyValue);
					}
					else {
						rawObject[key] = propertyValue;
					}
				}

				return rawObject;
			},
		);
	},
};