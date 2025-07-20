export type Class<ClassType = any> = new (...args: any[]) => ClassType;

export type TypedNamedValue<
	NameType extends string = string,
	ValueType = any,
	TypeType extends string | Class = string | Class
> =
	{
		[PossibleProperty in NameType]: ValueType;
	} & {
		type: TypeType;
	};