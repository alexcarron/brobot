/**
 * Converts the seperators of a string literal type to underscores
 */
type NormalizeSeparators<String extends string> =
  String extends `${infer LeftWord}-${infer RightWord}` ? NormalizeSeparators<`${LeftWord}_${RightWord}`> :
  String extends `${infer LeftWord} ${infer RightWord}` ? NormalizeSeparators<`${LeftWord}_${RightWord}`> :
  String extends `${infer LeftWord}.${infer RightWord}` ? NormalizeSeparators<`${LeftWord}_${RightWord}`> :
  String;

/**
 * Inserts underscores between words of a string literal type
 */
type InsertUnderscores<String extends string> =
	// If the string is all uppercase, then we're done
  String extends Uppercase<String>
    ? String
	: String extends `${infer First}${infer Second}${infer Rest}`
		? First extends Lowercase<First>
			? Second extends Uppercase<Second>
				? `${First}_${InsertUnderscores<`${Second}${Rest}`>}`
				: `${First}${InsertUnderscores<`${Second}${Rest}`>}`
			: First extends Uppercase<First>
				? Second extends Uppercase<Second>
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ? Rest extends `${infer Third}${infer _Unused}`
						? Third extends Lowercase<Third>
							? `${First}_${InsertUnderscores<`${Second}${Rest}`>}`
							: `${First}${InsertUnderscores<`${Second}${Rest}`>}`
						: `${First}${InsertUnderscores<`${Second}${Rest}`>}`
					: `${First}${InsertUnderscores<`${Second}${Rest}`>}`
				: `${First}${InsertUnderscores<`${Second}${Rest}`>}`
		: String;

/**
 * Removes leading and trailing underscores of a string literal type
 */
type TrimUnderscores<String extends string> =
  String extends `_${infer RightSide}` ? TrimUnderscores<RightSide> :
  String extends `${infer LeftSide}_` ? TrimUnderscores<LeftSide> :
  String;

/**
 * Reduces consecutive underscores to a single underscore of a string literal type
 */
type CollapseUnderscores<String extends string> =
  String extends `${infer LeftSide}__${infer RightSide}`
    ? CollapseUnderscores<`${LeftSide}_${RightSide}`>
    : String;

/**
 * Converts a string literal type to upper snake case
 */
export type UpperSnakeCase<String extends string> =
  Uppercase<
    TrimUnderscores<
			CollapseUnderscores<
				InsertUnderscores<NormalizeSeparators<String>>
			>
    >
  >;


/**
 * Convert any string to UPPER_SNAKE_CASE.
 * Handles:
 *  - camelCase / PascalCase
 *  - kebab-case / spaces / dots
 *  - sequences like XMLHttpRequest -> XML_HTTP_REQUEST
 *  - digits (kept and separated properly)
 * @param stringValue The string to convert to UPPER_SNAKE_CASE
 * @returns The UPPER_SNAKE_CASE version of the input string
 */
export function toUpperSnakeCase<
	StringValue extends string
>(stringValue: StringValue):
	UpperSnakeCase<StringValue>
{  return stringValue
    // Converts -, ., and spaces to underscores
    .replace(/[-\s.]+/g, '_')
    // put underscore between lowercase/digit and Uppercase: "fooBar" -> "foo_Bar"
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    // Puts underscore between uppercase and lowercase
		// "XMLHttpRequest" -> "XML_HTTP_REQUEST"
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    // Collapses multiple underscores
		// "foo__bar" -> "foo_bar"
    .replace(/_+/g, '_')
    // Trims leading/trailing underscores
		// "_foo_bar_" -> "foo_bar"
    .replace(/^_+|_+$/g, '')
    // uppercase final result
		// "foo_bar" -> "FOO_BAR"
    .toUpperCase() as UpperSnakeCase<StringValue>;
}