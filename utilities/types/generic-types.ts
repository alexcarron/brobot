 export type Class<ClassType = any> = new (...args: any[]) => ClassType;

/**
 * Represents a error class that extends the Error class
 * @example
 * const errorType: ErrorClass = RangeError;
 */
export type ErrorClass<ErrorType extends Error = Error> = Class<ErrorType>;

/**
 * Represents a value that is either true or false if known, otherwise null meaning unknown
 * @example
 * let isPublic: BooleanIfKnown = null;

 * if (player.location === 'town')
 *   isPublic = true;
 */
export type BooleanIfKnown = boolean | null;

/**
 * Represents a typed and named value.
 * The type of the value is specified by a type property (primitive type or class).
 * The name of the value is specified by the name of the other property
 * The value is specified by the value of that other property
 * @example
 * type NameParameter = TypedNamedValue<"name", string, "string">
 */
export type TypedNamedValue<
	Name extends string = string,
	ValueType = any,
	TypeType extends string | Class = string | Class
> =
	{ [PossibleProperty in Name]: ValueType; } &
	{ type: TypeType; };

/**
 * Remove all properties from an object type that are not given
 * @example
 * type Player = {
 *   id: number;
 *   name: string;
 *   currentName: string;
 * }
 *
 * type PlayerIdentifier = WithOnly<Player, "id" | "currentName">
 * type PlayerName = WithOnly<Player, "name">
 */
export type WithOnly<
	ObjectType extends object,
	RequiredKeys extends keyof ObjectType
> =
	Pick<ObjectType, RequiredKeys>;

/**
 * Requires at least one property to be defined of a given object type
 * @example
 * type ContactInfo = AtLeastOne<{
 *   email: string;
 *   phone: string;
 *   linkedIn: string;
 * }>
 */
export type WithAtLeastOneProperty<ObjectType extends object> =
& Partial<ObjectType>
& {
  [Key in keyof ObjectType]:
      & Required<WithOnly<ObjectType, Key>>
			& Partial<Without<ObjectType, Key>>
  }[keyof ObjectType];

/**
 * Requires at least one or more given properties to be defined of a given object type
 * @example
 * type IdentifiablePlayer = AtLeast<Player, "id" | "currentName">
 */
export type WithAtLeast<
	ObjectType extends object,
	RequiredKeys extends keyof ObjectType
> =
	{ [Key in RequiredKeys]-?: ObjectType[Key] } &
	{ [Key in Exclude<keyof ObjectType, RequiredKeys>]?: ObjectType[Key] };

/**
 * Removes all properties from an object type that are not in another object type
 * @example
 * type PlayerIdentifier = KeepSharedProperties<Player, { id: string }>
 */
type WithOnlySharedProperties<
	PossibleProperties extends object,
	AllowedProperties extends object
> = {
  [Property in keyof PossibleProperties]:
		Property extends keyof AllowedProperties
			? PossibleProperties[Property]
			: never
};

/**
 * Overrides one or more properties of a given object type with a new type
 * @example
 * type PlayerWithoutName = Override<Player, "currentName", null>
 */
export type Override<
	ObjectType extends object,
  Overrides extends { [K in keyof ObjectType]?: any } & WithOnlySharedProperties<Overrides, ObjectType>
> =
	Omit<ObjectType, keyof Overrides> & Overrides;

/**
 * Removes one or more properties from an object type
 * @example
 * type PlayerCreationOptions = Without<Player, "id" | "status">
 */
export type Without<
  ObjectType extends object,
  PropertyNames extends keyof ObjectType
> = Omit<ObjectType, PropertyNames>;


/**
 * Makes one or more properties of a given object type optional
 * @example
 * type Player = WithOptional<DBPlayer, "id" | "index">
 */
export type WithOptional<
	ObjectType extends object,
	PropertyName extends keyof ObjectType
> =
	Omit<ObjectType, PropertyName> &
	Partial<Pick<ObjectType, PropertyName>>;

export type AnyFunction = (...args: any[]) => any;

/**
 * Make all properties of a given object type optional
 * @example
 * type Player = WithAllOptional<{
 *   id: number;
 *   name: string;
 *   currentName: string;
 * }>
 */
export type WithAllOptional<ObjectType extends object> =
	{ [Key in keyof ObjectType]?: ObjectType[Key] };

/**
 * Requires one or more properties to be defined of a given object type
 * @example
 * type IdentifiedPlayer = WithRequired<Player, "id" | "currentName">
 */
export type WithRequired<
	ObjectType extends object,
	RequiredPropertyNames extends keyof ObjectType
> =
	Required<Pick<ObjectType, RequiredPropertyNames>> &
	Without<ObjectType, RequiredPropertyNames>;

/**
 * Requires an object type to have its id property
 * @example
 * type IdentifiedPlayer = WithID<Player>
 */
export type WithID<
	ObjectType extends { id?: unknown }
> = WithRequired<ObjectType, "id">;

/**
 * Require identifier(s) and at least one other property for update-style params.
 * @example
 * type PlayerUpdate = WithRequiredAndOneOther<Player, "id">
 * const playerUpdate: PlayerUpdate = { id: 1, name: "John Doe" };
 */
export type WithRequiredAndOneOther<
  ObjectType extends object,
  Identifier extends keyof ObjectType
> =
  // If there are no other keys besides the identifier(s) -> just require the identifier(s)
  Exclude<keyof ObjectType, Identifier> extends never
    ? Required<Pick<ObjectType, Identifier>>
    // Otherwise: require identifier(s) + require at least one property from the remaining keys
    : Required<Pick<ObjectType, Identifier>> &
        WithAtLeastOneProperty<
					Pick<ObjectType, Exclude<keyof ObjectType, Identifier>>
				>;

console.log(test);

/**
 * Expands a type to include all of its properties
 */
export type Expand<Type> =
	Type extends infer Object
		? { [Key in keyof Object]: Object[Key] }
		: never;


/**
 * Converts a type to a readonly type including any nested types
 * @example
 * type ComplexType = {
 * 	name: string;
 * 	roles: Array<{
 * 		name: string;
 * 		description: string;
 * 		perks: Array<{
 * 			name: string;
 * 			description: string;
 * 		}>
 * 	}>
 * }
 *
 * type ReadonlyComplexType = DeepReadonly<ComplexType>
 */
export type DeepReadonly<GivenType> =
	// If the type is a function,
  GivenType extends (...args: any[]) => any
		// Leave it as is
		? GivenType
	// If the type is a non-function object,
	: GivenType extends object
		// Make all indexes and elements readonly
		? {
			readonly [Key in keyof GivenType]:
				DeepReadonly<GivenType[Key]>
		}
		// Else, leave it as is
		: GivenType;

/**
 * Returns the type of the elements of an array type
 * @example
 * type Strings = string[];
 * const modifyItem: (item: ElementOfArray<Strings>) => string =
 *   (item: string) => item.toUpperCase();
 */
export type ElementOfArray<T> = T extends (infer U)[] ? U : never;

/**
 * A union of all possible keys in an array of objects
 * @example
 * type PlayerKeys = KeysOf<[
 * 	{ id: string, name: string },
 * 	{ email: string, name: string }
 * ]>
 * // 'id' | 'name' | 'email'
 */
export type KeysOf<
	SpecificArray extends Record<string, unknown>[]
> = {
	[Index in keyof SpecificArray]: keyof SpecificArray[Index]
}[number];

export type ToTypeName<Type> =
	Type extends string ? "string" :
	Type extends number ? "number" :
	Type extends boolean ? "boolean" :
	Type extends bigint ? "bigint" :
	Type extends symbol ? "symbol" :
	Type extends null ? "null" :
	Type extends undefined ? "undefined" :
	Type extends AnyFunction ? "function" :
	Type extends Date ? "date" :
	Type extends RegExp ? "regexp" :
	Type extends Map<any, any> ? "map" :
	Type extends Set<any> ? "set" :
	Type extends WeakMap<any, any> ? "weakmap" :
	Type extends WeakSet<any> ? "weakset" :
	Type extends Promise<any> ? "promise" :
	Type extends readonly any[] ? "array" :
	Type extends object ? "object" :
	"unknown";