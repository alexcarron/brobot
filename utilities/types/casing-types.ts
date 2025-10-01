/**
 * Converts a kebab case string to camel case.
 * @template KebabCaseString A string in kebab case to convert to camel case.
 * @example
 * type CamelCaseString = ToCamelCase<"hello-world"> // "helloWorld"
 */
export type ToCamelCase<
	KebabCaseString extends string
> =
	KebabCaseString extends ''
		? ''
	: KebabCaseString extends `-${infer Rest}`
		? ToCamelCase<Rest>
	: KebabCaseString extends `${infer Head}-${infer Rest}`
    ? `${Lowercase<Head>}${Capitalize<ToCamelCase<Rest>>}`
    : Lowercase<KebabCaseString>;