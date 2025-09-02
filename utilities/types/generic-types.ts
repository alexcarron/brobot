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

/**l
 * Requires at least one property to be defined of a given object type
 * @example
 * type ContactInfo = AtLeastOne<{
 *   email: string;
 *   phone: string;
 *   linkedIn: string;
 * }>
 */
export type AtLeastOne<ObjectType extends object> = {
  [RequiredKey in keyof ObjectType]:
		{ [Key in RequiredKey]: ObjectType[Key] } &
		Partial<Omit<ObjectType, RequiredKey>>
}[keyof ObjectType];

/**
 * Requires at least one or more given properties to be defined of a given object type
 * @example
 * type IdentifiablePlayer = AtLeast<Player, "id" | "currentName">
 */
export type AtLeast<
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
type KeepSharedProperties<
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
  Overrides extends { [K in keyof ObjectType]?: any } & KeepSharedProperties<Overrides, ObjectType>
> =
	Omit<ObjectType, keyof Overrides> & Overrides;

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
 * Expands a type to include all of its properties
 */
export type Expand<Type> =
	Type extends infer Object
		? { [Key in keyof Object]: Object[Key] }
		: never;