/* eslint-disable jsdoc/require-param */
/* eslint-disable jsdoc/require-returns */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { inspect } from "util";
import { hasProperty, isDefined, isNotNullable, isNull, isObject, isUndefined } from "./types/type-guards";
import { Expand, IsAnyPropertyNever, UndefinedAsOptional, Without } from "./types/generic-types";

/* ————— Error ————— */

export class InvalidTypeError extends Error {
  constructor(value: unknown, typeName: string) {
    const prettyValue = inspect(value, {
      depth: null,
      colors: true,
      compact: false,
    });

    super(
      `Runtime type error: Expected value to be a ${typeName}, but got:\n${prettyValue}`
    );

    this.name = "InvalidTypeError";
  }
}

/* ————— Types ————— */

type RuntimeType<
	Type,
	DefaultValue extends Type | undefined = undefined
> = {
  orNull: RuntimeType<Type | null>;
	default<NewDefaultValue extends Type>(
		defaultValue: NewDefaultValue
	): RuntimeType<Type, NewDefaultValue>;
	defaultValue: DefaultValue;

	isType(value: unknown): value is Type;
	throwIfNotType(value: unknown): asserts value is Type;
  from(value: unknown): Type;
  fromAll(values: unknown[]): Type[];
  asTransformableType<DomainType, DomainName extends string>(
    domainName: DomainName,
    toDomainType: (rawValue: Type) => DomainType,
    fromDomainType: (domainValue: DomainType) => Type
  ): NamedTransformableRuntimeType<Type, DomainType, DomainName>;

  to<DomainType>(
    toDomainType: (rawValue: Type) => DomainType
  ): {
    from(
      fromDomainType: (domainValue: DomainType) => Type
    ): TransformableRuntimeType<Type, DomainType, DefaultValue, undefined>;
  };
};

type TransformableRuntimeType<
	RawType,
	DomainType,
	DefaultRawValue extends RawType | undefined = undefined,
	DefaultDomainValue extends DomainType | undefined = undefined,
	AcceptableDomainType extends DomainType | undefined =
		DefaultRawValue extends undefined
			? DefaultDomainValue extends undefined
				? DomainType
				: DomainType | undefined
			: DomainType | undefined
> =
  & RuntimeType<RawType, DefaultRawValue>
  & {
    orNull: TransformableRuntimeType<
			RawType | null,
			DomainType | null,
			DefaultRawValue,
			DefaultDomainValue
		>;
		default: <NewDefaultValue extends DomainType>(
			defaultValue: NewDefaultValue
		) => TransformableRuntimeType<RawType, DomainType, DefaultRawValue, NewDefaultValue>;
		defaultValue: DefaultRawValue;
		defaultDomainValue: DefaultDomainValue;

    toDomain: (rawValue: unknown) => DomainType;
    toDomains: (rawValues: unknown[]) => DomainType[];
    fromDomain: (domainValue: AcceptableDomainType) => RawType;
    fromDomains: (domainValues: AcceptableDomainType[]) => RawType[];
  };

type NamedTransformableRuntimeType<
  RawType,
  DomainType,
  DomainName extends string,
	DefaultRawValue extends RawType | undefined = undefined,
	DefaultDomainValue extends DomainType | undefined = undefined,
	AcceptableDomainType extends DomainType | undefined =
		DefaultRawValue extends undefined
			? DefaultDomainValue extends undefined
				? DomainType
				: DomainType | undefined
			: DomainType | undefined
> =
  & RuntimeType<RawType>
  & {
    orNull: NamedTransformableRuntimeType<
			RawType | null,
			DomainType | null,
			DomainName,
			DefaultRawValue,
			DefaultDomainValue
		>;
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
        ? (domainValues: AcceptableDomainType[]) => RawType[]
      : Key extends `from${DomainName}`
        ? (domainValue: AcceptableDomainType) => RawType
      : never;
  };

type NamedTransformableRuntimeTypeFromResolvable<
	RawType extends Record<keyof Resolvable, unknown>,
	DomainType extends Record<keyof Resolvable, unknown>,
	DomainName extends string,
	Resolvable extends ObjectRuntimeTypeResolvable,
> =
  & RuntimeType<RawType>
  & {
		without: <
			Keys extends Array<keyof Resolvable>
		>(...keys: Keys) => NamedTransformableRuntimeTypeFromResolvable<
			// @ts-ignore
			Expand<Without<RawType, Keys[number]>>,
			Expand<Without<DomainType, Keys[number]>>,
			DomainName,
			Expand<Without<Resolvable, Keys[number]>>
		>;
    orNull: NamedTransformableRuntimeType<
			RawType | null,
			DomainType | null,
			DomainName
		>;
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
        ? (domainValues: AcceptableObjectOfResolvable<Resolvable>[]) => RawType[]
      : Key extends `from${DomainName}`
        ? (domainValue: AcceptableObjectOfResolvable<Resolvable>) => RawType
      : never;
  };

export type ExtractType<SomeRuntimeType> =
  SomeRuntimeType extends RuntimeType<infer UnderlyingType, infer DefaultType>
    ? UnderlyingType
    : never;

export type ExtractRawType<SomeRuntimeType> = ExtractType<SomeRuntimeType>;

export type ExtractDomainType<SomeRuntimeType> =
  SomeRuntimeType extends NamedTransformableRuntimeTypeFromResolvable<infer RawType, infer DomainType, infer DomainName, infer Resolvable>
    ? DomainType
  : SomeRuntimeType extends NamedTransformableRuntimeType<infer RawType, infer DomainType, infer DomainName, infer DefaultRawValue, infer DefaultDomainValue, infer AcceptableDomainType>
    ? DomainType
  : SomeRuntimeType extends TransformableRuntimeType<infer RawType, infer DomainType, infer DefaultRawValue, infer DefaultDomainValue, infer AcceptableDomainType>
    ? DomainType
    : ExtractType<SomeRuntimeType>;

export type ExtractAcceptableDomainType<SomeRuntimeType> =
	SomeRuntimeType extends NamedTransformableRuntimeType<infer RawType, infer DomainType, infer DomainName, infer DefaultRawValue, infer DefaultDomainValue, infer AcceptableDomainType>
		? AcceptableDomainType
	: SomeRuntimeType extends TransformableRuntimeType<infer RawType, infer DomainType, infer DefaultRawValue, infer DefaultDomainValue, infer AcceptableDomainType>
		? AcceptableDomainType
		: ExtractDomainType<SomeRuntimeType>;

type RuntimeTypeResolvable =
	| RuntimeType<unknown, unknown>
	| null
	| undefined;

type ResolveRuntimeType<
	Resolvable extends RuntimeTypeResolvable
> =
	Resolvable extends null
		? RuntimeType<null>
	: Resolvable extends undefined
		? RuntimeType<undefined>
	: Resolvable;

type ObjectRuntimeTypeResolvable =
	Record<string, RuntimeTypeResolvable>;

type ExtractTypeFromResolvable<
	Resolvable extends RuntimeTypeResolvable
> =
	Resolvable extends null
		? null
	: Resolvable extends undefined
		? undefined
		: ExtractType<Resolvable>;

type ExtractDomainTypeFromResolvable<
	Resolvable extends RuntimeTypeResolvable
> = Resolvable extends null
		? null
	: Resolvable extends undefined
		? undefined
		: ExtractDomainType<Resolvable>;

type ObjectTypeOfResolvable<
	Resolvable extends ObjectRuntimeTypeResolvable
> = {
	[Key in keyof Resolvable]: ExtractTypeFromResolvable<Resolvable[Key]>;
};

type DefaultOfRuntimeTypeResolvable<
	Resolvable extends RuntimeTypeResolvable
> =
	Resolvable extends null
		? never
	: Resolvable extends undefined
		? never
	: Resolvable extends RuntimeType<unknown, infer Default>
		? undefined extends Default
			? never
			: Default
		: never;

type KeyToDefaultOfResolvable<
	Resolvable extends ObjectRuntimeTypeResolvable
> = {
	[Key in keyof Resolvable]: DefaultOfRuntimeTypeResolvable<Resolvable[Key]>;
};

type DefaultObjectOfResolvable<
	Resolvable extends ObjectRuntimeTypeResolvable,
> =
	IsAnyPropertyNever<KeyToDefaultOfResolvable<Resolvable>> extends true
		? undefined
		: KeyToDefaultOfResolvable<Resolvable>;

type AcceptableObjectOfResolvable<
	Resolvable extends ObjectRuntimeTypeResolvable,
> = Expand<UndefinedAsOptional<{
	[Key in keyof Resolvable]: ExtractAcceptableDomainType<ResolveRuntimeType<Resolvable[Key]>>;
}>>;

/* ————— Assertion helpers ————— */


/**
 * Checks if a given runtime type has a default value set.
 * @returns True if the runtime type has a default value, false otherwise.
 */
function doesRuntimeTypeHaveDefault(runtimeType:
	| RuntimeType<unknown, unknown>
	| TransformableRuntimeType<unknown, unknown, unknown, unknown, unknown>
	| NamedTransformableRuntimeType<unknown, unknown, string, unknown, unknown, unknown>
): boolean {
	if (isDefined(runtimeType.defaultValue))
		return true;

	if ('defaultDomainValue' in runtimeType)
		return isDefined(runtimeType.defaultDomainValue);

	return false;
}

/**
 * Checks if all properties in a given key-to-runtime-type object have a default value set.
 * @param keyToRuntimeType - An object mapping property names to runtime types.
 * @returns True if all runtime types have a default value, false otherwise.
 */
function doesRuntimeTypeObjectHaveAllDefaults<
	DefaultValueOrUndefined
>(
	keyToRuntimeType: Record<
		string,
		RuntimeType<unknown, DefaultValueOrUndefined> | null | undefined
	>
): keyToRuntimeType is Record<string,
	RuntimeType<unknown, Exclude<DefaultValueOrUndefined, undefined>>
> {
	return Object.values(keyToRuntimeType)
		.every(runtimeType => {
			if (isNotNullable(runtimeType))
				return doesRuntimeTypeHaveDefault(runtimeType)

			return false;
		}) as any;
}

function throwIfNotType<Type>(
	value: unknown,
	{ isType, typeName }: {
		isType: (value: unknown) => value is Type,
		typeName: string,
	}
): asserts value is Type {
  if (!isType(value)) {
    throw new InvalidTypeError(value, typeName);
  }
}

function returnTypeOrThrow<Type>(
  value: unknown,
	{isType, typeName, defaultValue}: {
		isType: (value: unknown) => value is Type,
		typeName: string,
		defaultValue?: Type
	}
): Type {
	if (isDefined(defaultValue) && isUndefined(value))
		return defaultValue;

  throwIfNotType(value, { isType: isType, typeName: typeName });
  return value;
}

/**
 * Maps an array of values to an array of the given type, or throws
 * an error if any of the values are not of the given type.
 * @param values - The array of values to map.
 * @param parameters - An object of the following parameters:
 * @param parameters.isType - The type guard function to check the values against.
 * @param parameters.typeName - The name of the type.
 * @param parameters.defaultValue - The default value to return if a value is undefined.
 * @returns An array of values of the given type.
 * @throws {InvalidTypeError} If any of the values are not of the given type.
 */
function returnArrayOfTypeOrThrow<Type>(
	values: unknown[],
	{isType, typeName, defaultValue}: {
		isType: (value: unknown) => value is Type,
		typeName: string,
		defaultValue?: Type
	}
): Type[] {
	return values.map((value) => {
		return returnTypeOrThrow(value, { isType, typeName, defaultValue });
	});
}

/**
 * Asserts that the values are of the expected type and converts them to the output type if a type converter function is provided
 * @param values - The values to assert and convert
 * @param parameters - An object of the following parameters
 * @param parameters.isInputType - The type guard function to check the input values against
 * @param parameters.inputTypeName - The name of the input type
 * @param parameters.toOutputType - The function to convert the input type to the output type if you want to convert the given values
 * @param parameters.defaultValue - The default value to return if a value is undefined
 * @returns An array of the values, converted if a type converter funciton is provided
 */
function returnArrayOfConvertedTypesOrThrow<
  InputType,
  OutputType,
	DefaultInputValue extends InputType,
	DefaultOutputValue extends OutputType,
>(
  values: unknown[],
	{isInputType, inputTypeName, toOutputType, defaultInputValue, defaultOutputValue}: {
		isInputType: (value: unknown) => value is InputType,
		inputTypeName: string,
		toOutputType: (value: InputType) => OutputType,
		defaultInputValue?: DefaultInputValue,
		defaultOutputValue?: DefaultOutputValue
	}
): OutputType[] {
  return values.map((value) => {
		if (isUndefined(value)) {
			if (isDefined(defaultInputValue))
				return toOutputType(defaultInputValue);

			if (isDefined(defaultOutputValue))
				return defaultOutputValue;
		}

    throwIfNotType(value, {
			isType: isInputType,
			typeName: inputTypeName
		});

		return toOutputType(value);
  });
}

/* ------------------------- Nullable wrapper helpers --------------------- */

/**
 * Converts a type guard function to a nullable type guard function that accepts a null value
 * @param isType - The type guard function to convert
 * @returns A nullable type guard function
 */
function toIsTypeOrNull<Type>(
  isType: (value: unknown) => value is Type
): (value: unknown) => value is Type | null {
  return (value: unknown): value is Type | null =>
		(value === null) || isType(value);
}

/**
 * Wrap a raw->domain converter so it passes through `null` unchanged.
 */
function toToDomainOrNull<RawType, DomainType>(
  toDomain: (rawValue: RawType) => DomainType
): (rawValue: RawType | null) => DomainType | null {
  return (rawValue: RawType | null) =>
		rawValue === null
			? null
			: toDomain(rawValue);
}

/**
 * Wrap a domain->raw converter so it passes through `null` unchanged.
 */
function toFromDomainOrNull<RawType, DomainType>(
  fromDomain: (domainValue: DomainType) => RawType
): (domainValue: DomainType | null) => RawType | null {
  return (domainValue: DomainType | null) => domainValue === null ? null : fromDomain(domainValue);
}

/* ————— Shared property helper ————— */

/**
 * Attach a lazily-evaluated `orNull` getter to `targetObject`.
 * The createNullable function may create a variant with different generic parameters,
 * so we use a local assertion when caching/returning to satisfy TypeScript.
 */
function attachOrNullGetter<Target extends { isType(value: unknown): boolean }>(
  targetObject: Target,
  createNullable: () => unknown
): void {
  Object.defineProperty(targetObject, "orNull", {
    get() {
      // If the target already accepts `null`, return the target itself.
      if (targetObject.isType(null)) {
        // We return `targetObject` — caller expects some RuntimeType-like object.
        return targetObject as unknown;
      }

      const createdNullable = createNullable();

      // Cache the created nullable variant (we assert its type here).
      // Using the `as unknown` assertion is required because TypeScript cannot
      // prove the createdNullable's `isType` predicate matches the original generic.
      Object.defineProperty(targetObject, "orNull", {
        value: createdNullable as unknown,
        configurable: true,
        writable: false,
      });

      return createdNullable as unknown;
    },
    configurable: true,
  });
}

/* ————— Runtime factories ————— */


function createRuntimeType<
	Type,
	DefaultValue extends Type | undefined = undefined
>(
	{typeName, isType, defaultValue}: {
		typeName: string,
		isType: (value: unknown) => value is Type,
		defaultValue?: DefaultValue
	}
): RuntimeType<Type, DefaultValue> {
  const baseRuntime = {
		default: function<NewDefaultValue extends Type>(
			defaultValue: NewDefaultValue
		): RuntimeType<Type, NewDefaultValue> {
			return createRuntimeType({typeName, isType, defaultValue});
		},
		defaultValue: defaultValue,

    isType: (value: unknown): value is Type => isType(value),
		throwIfNotType: (value: unknown) => throwIfNotType(value, {isType, typeName}),
    from: (value: unknown): Type => {
      return returnTypeOrThrow(value, {isType, typeName, defaultValue});
    },

    fromAll: (values: unknown[]): Type[] => {
      return returnArrayOfTypeOrThrow<Type>(values,
				{isType, typeName, defaultValue},
      );
    },

    asTransformableType: <DomainType, DomainName extends string>(
      domainName: DomainName,
      toDomainType: (rawValue: Type) => DomainType,
      fromDomainType: (domainValue: DomainType) => Type
    ) => {
      return createNamedTransformableRuntimeType(
        domainName,
        isType,
        toDomainType,
        fromDomainType,
				defaultValue,
      );
    },

    to: <DomainType>(toDomainType: (rawValue: Type) => DomainType) => ({
			from: (fromDomainType: (domainValue: DomainType) => Type) =>
				createTransformableRuntimeType(
					typeName,
					isType,
					toDomainType,
					fromDomainType,
					defaultValue,
				),
		}),
  };

  // attach orNull lazily via helper
  attachOrNullGetter(baseRuntime, () =>
    createRuntimeType({
      typeName: `${typeName} or null`,
      isType: toIsTypeOrNull(isType),
			defaultValue,
    })
  );

  return baseRuntime as unknown as RuntimeType<Type, DefaultValue>;
}

function createTransformableRuntimeType<
	RawType,
	DomainType,
	DefaultRawValue extends RawType | undefined = undefined,
	DefaultDomainValue extends DomainType | undefined = undefined,
	AcceptableDomainType extends DomainType | undefined =
		DefaultRawValue extends undefined
			? DefaultDomainValue extends undefined
				? DomainType
				: DomainType | undefined
			: DomainType | undefined
>(
  typeName: string,
  isType: (value: unknown) => value is RawType,
  toDomainType: (rawValue: RawType) => DomainType,
  fromDomainType: (domainValue: DomainType) => RawType,
	defaultRawValue?: DefaultRawValue,
	defaultDomainValue?: DefaultDomainValue,
): TransformableRuntimeType<RawType, DomainType, DefaultRawValue, DefaultDomainValue, AcceptableDomainType> {
  const runtimeBase = createRuntimeType({typeName, isType, defaultValue: defaultRawValue});

  const baseProperties = {
		defaultDomainValue,

    toDomain: (value: unknown): DomainType => {
			if (isUndefined(value)) {
				if (isDefined(defaultRawValue))
					return toDomainType(defaultRawValue);

				if (isDefined(defaultDomainValue))
					return defaultDomainValue;
			}

      throwIfNotType(value, {isType, typeName});
      return toDomainType(value);
    },

    fromDomain: (domainValue: AcceptableDomainType): RawType => {
			if (isUndefined(domainValue)) {
				if (isDefined(defaultDomainValue))
					return fromDomainType(defaultDomainValue);

				if (isDefined(defaultRawValue))
					return defaultRawValue;
			}

      return fromDomainType(domainValue!);
    },

    toDomains: (values: unknown[]): DomainType[] => {
      return values.map(value =>
				baseProperties.toDomain(value)
			);
    },

    fromDomains: (domainValues: AcceptableDomainType[]): RawType[] => {
			return domainValues.map(domainValue =>
				baseProperties.fromDomain(domainValue)
			);
    },
  };

  const transformableRuntime = Object.assign(runtimeBase, baseProperties);

  // attach orNull lazily; create nullable predicate and wrapped converters
  attachOrNullGetter(transformableRuntime, () => {
    const isTypeOrNull = toIsTypeOrNull(isType);
    const toDomainOrNull = toToDomainOrNull(toDomainType);
    const fromDomainOrNull = toFromDomainOrNull(fromDomainType);

    return createTransformableRuntimeType(
      `${typeName} or null`,
      isTypeOrNull,
      toDomainOrNull,
      fromDomainOrNull,
			defaultRawValue,
			defaultDomainValue,
    );
  });

	Object.defineProperty(transformableRuntime, 'default',
		{
			value: function<NewDefaultDomainValue extends DomainType | undefined>(
				defaultDomainValue: NewDefaultDomainValue
			): TransformableRuntimeType<RawType, DomainType, DefaultRawValue, NewDefaultDomainValue> {
				return createTransformableRuntimeType<RawType, DomainType, DefaultRawValue, NewDefaultDomainValue>(
					typeName,
					isType,
					toDomainType,
					fromDomainType,
					defaultRawValue,
					defaultDomainValue
				);
			}
		}
	);

  return transformableRuntime as TransformableRuntimeType<RawType, DomainType, DefaultRawValue, DefaultDomainValue, AcceptableDomainType>;
}

function createNamedTransformableRuntimeType<
	RawType, DomainType, DomainName extends string,
	DefaultRawValue extends RawType | undefined = undefined,
	DefaultDomainValue extends DomainType | undefined = undefined,
	AcceptableDomainType extends DomainType | undefined =
		DefaultRawValue extends undefined
			? DefaultDomainValue extends undefined
				? DomainType
				: DomainType | undefined
			: DomainType | undefined
>(
  domainName: DomainName,
  isType: (value: unknown) => value is RawType,
  toDomainType: (rawValue: RawType) => DomainType,
  fromDomainType: (domainValue: DomainType) => RawType,
	defaultRawValue?: DefaultRawValue,
	defaultDomainValue?: DefaultDomainValue,
): NamedTransformableRuntimeType<RawType, DomainType, DomainName, DefaultRawValue, DefaultDomainValue, AcceptableDomainType> {
  // create a transformable runtime (it contains isType/from/fromAll plus toDomain/fromDomain)
  const transformable = createTransformableRuntimeType(
    domainName,
    isType,
    toDomainType,
    fromDomainType,
		defaultRawValue,
		defaultDomainValue,
  );

  // build named method aliases (toX, toXs, fromX, fromXs) that delegate to transformable methods
  const singleToMethodName = (`to${domainName}` as unknown) as keyof any;
  const pluralToMethodName = (`to${domainName}s` as unknown) as keyof any;
  const singleFromMethodName = (`from${domainName}` as unknown) as keyof any;
  const pluralFromMethodName = (`from${domainName}s` as unknown) as keyof any;

  // Attach named methods as small delegating wrappers
  (transformable as any)[singleToMethodName] = (value: unknown) => transformable.toDomain(value);
  (transformable as any)[pluralToMethodName] = (values: unknown[]) => transformable.toDomains(values);
  (transformable as any)[singleFromMethodName] = (domainValue: DomainType) => transformable.fromDomain(domainValue);
  (transformable as any)[pluralFromMethodName] = (domainValues: DomainType[]) => transformable.fromDomains(domainValues);

  // Now attach a specialized `orNull` getter that returns a NamedTransformable type
  attachOrNullGetter(transformable, () => {
    const isTypeOrNull = toIsTypeOrNull(isType);
    const toDomainOrNull = toToDomainOrNull(toDomainType);
    const fromDomainOrNull = toFromDomainOrNull(fromDomainType);

    // create a nullable transformable first
    const nullableTransformable = createNamedTransformableRuntimeType(
      domainName,
      isTypeOrNull,
      toDomainOrNull,
      fromDomainOrNull,
			defaultRawValue,
			defaultDomainValue,
    );

    return nullableTransformable;
  });

  return transformable as unknown as NamedTransformableRuntimeType<RawType, DomainType, DomainName, DefaultRawValue, DefaultDomainValue, AcceptableDomainType>;
}

/* ————— Primitive runtime types ————— */

export const number = createRuntimeType<number>({
	typeName: "number",
	isType: (value): value is number =>
		typeof value === "number",
});

export const string = createRuntimeType<string>({
	typeName: "string",
	isType: (value): value is string =>
		typeof value === "string"
});

export const boolean = createRuntimeType<boolean>({
	typeName: "boolean",
	isType: (value): value is boolean =>
		typeof value === "boolean"
});

export const zeroOrOne = createRuntimeType<0 | 1>({
	typeName: "0 or 1",
	isType: (value): value is 0 | 1 =>
		typeof value === "number"
		&& (value === 0 || value === 1)
});

export const date = createRuntimeType<Date>({
	typeName: "Date",
	isType: (value): value is Date =>
		value instanceof Date &&
		!isNaN(value.getTime()),
});

export const strings = <const Strings extends readonly string[]>(...allowedStringLiterals: Strings) => {
  const allowedStringsSet = new Set<string>(allowedStringLiterals as readonly string[]);
  const typeName = allowedStringLiterals.map((s) => `"${s}"`).join(" | ");
  return createRuntimeType<Strings[number]>({
		typeName,
		isType: (value): value is Strings[number] =>
			typeof value === "string" &&
			allowedStringsSet.has(value),
  });
};

/* ————— Object helpers ————— */

/**
 * Validate that `candidateValue` is an object and that for each key in `keyToRuntimeMap`
 * the property exists and matches the associated runtime type, null, or undefined marker.
 */
function validateObjectAgainstKeyToRuntimeType<
	KeyToRuntimeType extends ObjectRuntimeTypeResolvable
>(
  candidateValue: unknown,
  keyToRuntimeMap: KeyToRuntimeType
): candidateValue is {
	[Key in keyof KeyToRuntimeType]:
		KeyToRuntimeType[Key] extends RuntimeType<infer InnerType>
			? InnerType
		: KeyToRuntimeType[Key] extends null
			? null
		: KeyToRuntimeType[Key] extends undefined
			? undefined
			: unknown;
} {
	const hasAllDefaultProperties = doesRuntimeTypeObjectHaveAllDefaults(keyToRuntimeMap);

	if (hasAllDefaultProperties)
		return true;

  if (!isObject(candidateValue)) return false;

  for (const key in keyToRuntimeMap as object) {
    const runtimeOrNullOrUndefined: any = (keyToRuntimeMap as any)[key];
    const propertyValue: any = (candidateValue as any)[key];

		const hasDefault =
			isNotNullable(runtimeOrNullOrUndefined) &&
			doesRuntimeTypeHaveDefault(runtimeOrNullOrUndefined);

    if (!hasProperty(candidateValue, key)) {
			if (hasDefault)
				continue;
			else
				return false;
		}

    if (isNull(runtimeOrNullOrUndefined)) {
      if (!isNull(propertyValue)) return false;
      continue;
    }

    if (isUndefined(runtimeOrNullOrUndefined)) {
      if (!isUndefined(propertyValue)) return false;
      continue;
    }

    // runtimeOrNullOrUndefined is a RuntimeType-like object
    if (!runtimeOrNullOrUndefined.isType(propertyValue)) return false;
  }

  return true;
}

/**
 * Convert a single property value from raw -> domain (or vice versa) given the runtime descriptor.
 * Handles the three descriptor kinds:
 * - null marker: always produce null
 * - undefined marker: always produce undefined
 * - runtime object: either use generic transformable methods, named transformable methods, or pass-through
 */
function convertPropertyForDomainDirection(
  runtimeDescriptor: any,
  rawPropertyValue: any,
  domainName: string
): any {
  if (isNull(runtimeDescriptor)) {
    return null;
  }

  if (isUndefined(runtimeDescriptor)) {
    return undefined;
  }

  // runtimeDescriptor is a runtime object. Prefer generic 'toDomain' if present,
  // otherwise prefer named 'toX' method if present, otherwise pass-through value
  if ("toDomain" in runtimeDescriptor) {
    return runtimeDescriptor.toDomain(rawPropertyValue);
  }

  const namedMethodName = `to${domainName}` as keyof any;
  if (namedMethodName in runtimeDescriptor) {
    return runtimeDescriptor[namedMethodName](rawPropertyValue);
  }

  // plain runtime type: value passes through
  return rawPropertyValue;
}

/**
 * Convert a single property value from domain -> raw. Mirror of convertPropertyForDomainDirection.
 */
function convertPropertyForRawDirection(
  runtimeDescriptor: any,
  domainPropertyValue: any,
  domainName: string
): any {
  if (isNull(runtimeDescriptor)) {
    return null;
  }

  if (isUndefined(runtimeDescriptor)) {
    return undefined;
  }

  if ("fromDomain" in runtimeDescriptor) {
    return runtimeDescriptor.fromDomain(domainPropertyValue);
  }

  const namedMethodName = `from${domainName}` as keyof any;
  if (namedMethodName in runtimeDescriptor) {
    return runtimeDescriptor[namedMethodName](domainPropertyValue);
  }

  // plain runtime type: value passes through
  return domainPropertyValue;
}

export const object = {
  isType: (value: unknown): value is object => isObject(value),

  from: (value: unknown): object => {
    return returnTypeOrThrow(value, {
			isType: isObject,
			typeName: "object"
		});
  },

  fromAll: (values: unknown[]): object[] => {
    return returnArrayOfTypeOrThrow(values, {
      isType: isObject,
      typeName: "object",
    });
  },

  asType: function<
		KeyToRuntimeResolvable extends ObjectRuntimeTypeResolvable,
	>(
    keyToRuntimeType: KeyToRuntimeResolvable,
  ): RuntimeType<
		ObjectTypeOfResolvable<KeyToRuntimeResolvable>,
		DefaultObjectOfResolvable<KeyToRuntimeResolvable>
	> {
		type ObjectType = ObjectTypeOfResolvable<KeyToRuntimeResolvable>;
		type DefaultObject = DefaultObjectOfResolvable<KeyToRuntimeResolvable>;

		const hasAllDefaults = doesRuntimeTypeObjectHaveAllDefaults(keyToRuntimeType);

		let defaultValue: DefaultObject | undefined = undefined;
		if (hasAllDefaults) {
			defaultValue = Object.entries(keyToRuntimeType)
				.map(([key, runtimeType]) => ({
					[key]: runtimeType.defaultValue
				}))
				.reduce((prev, curr) => ({ ...prev, ...curr }), {}) as DefaultObject;
		}

    const baseRuntimeType: RuntimeType<ObjectType, DefaultObject> = createRuntimeType({
			typeName: "object",
			isType: (value): value is ObjectType =>
				validateObjectAgainstKeyToRuntimeType(value, keyToRuntimeType),
			defaultValue: defaultValue,
    });

		baseRuntimeType.from = (value: unknown): ObjectType => {
			baseRuntimeType.throwIfNotType(value);

			if (isUndefined(value) && isDefined(defaultValue))
				return defaultValue;

			const returnedObject = {} as any;
			for (const [key, runtimeType] of Object.entries(keyToRuntimeType)) {
				const valueGiven = value[key];
				const defaultValue = isNotNullable(runtimeType)
					? runtimeType.defaultValue
					: undefined;

				if (isUndefined(valueGiven) && isDefined(defaultValue)) {
					returnedObject[key] = defaultValue;
				} else {
					returnedObject[key] = valueGiven;
				}
			}

			return returnedObject;
		};

		baseRuntimeType.fromAll = (values: unknown[]): ObjectType[] =>
			values.map((value) => baseRuntimeType.from(value));

		return baseRuntimeType;
  },

  asTransformableType: function<
    DomainName extends string,
    KeyToRuntimeResolvable extends ObjectRuntimeTypeResolvable,
    RawObjectType extends Record<keyof KeyToRuntimeResolvable, unknown> = {
      [Key in keyof KeyToRuntimeResolvable]: ExtractTypeFromResolvable<KeyToRuntimeResolvable[Key]>
    },
    DomainObjectType extends Record<keyof KeyToRuntimeResolvable, unknown> = {
      [Key in keyof KeyToRuntimeResolvable]: ExtractDomainTypeFromResolvable<KeyToRuntimeResolvable[Key]>
    }
  >(
    domainName: DomainName,
    keyToRuntimeType: KeyToRuntimeResolvable
  ): NamedTransformableRuntimeTypeFromResolvable<RawObjectType, DomainObjectType, DomainName, KeyToRuntimeResolvable> {
    // Predicate for raw object shape
    const isRawObject = (value: unknown): value is RawObjectType =>
      validateObjectAgainstKeyToRuntimeType(value, keyToRuntimeType as unknown as KeyToRuntimeResolvable);

    // Convert raw -> domain object using centralized convertPropertyForDomainDirection
    const rawToDomain = (value: RawObjectType): DomainObjectType => {
      const domainObject: any = {};
      for (const key in keyToRuntimeType as object) {
        // @ts-ignore access by key
        const runtimeOrNullOrUndefined = (keyToRuntimeType as any)[key];
        // @ts-ignore access value by key
        const rawPropertyValue = (value as any)[key];

        domainObject[key] = convertPropertyForDomainDirection(runtimeOrNullOrUndefined, rawPropertyValue, domainName as unknown as string);
      }
      return domainObject;
    };

    // Convert domain -> raw object using centralized convertPropertyForRawDirection
    const domainToRaw = (value: DomainObjectType): RawObjectType => {
      const rawObject: any = {};
      for (const key in keyToRuntimeType as object) {
        // @ts-ignore
        const runtimeOrNullOrUndefined = (keyToRuntimeType as any)[key];
        // @ts-ignore
        const domainPropertyValue = (value as any)[key];

        rawObject[key] = convertPropertyForRawDirection(runtimeOrNullOrUndefined, domainPropertyValue, domainName as unknown as string);
      }
      return rawObject;
    };

    const baseRuntimeType = createNamedTransformableRuntimeType(
      domainName,
      isRawObject,
      rawToDomain,
      domainToRaw
    )

		Object.defineProperty(baseRuntimeType, 'without', {
			value: function<
				Keys extends Array<keyof KeyToRuntimeResolvable>
			>(...keys: Keys) {
				const newKeyToRuntimeType = keyToRuntimeType
				for (const key of keys) {
					delete newKeyToRuntimeType[key]
				}

				return object.asTransformableType(
					domainName,
					newKeyToRuntimeType as Without<KeyToRuntimeResolvable, Keys[number]>
				)
			}
		});

		return baseRuntimeType as any;
  },
};
