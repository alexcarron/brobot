export function resolveOptional<ResolvableType, DefiniteType>(
  value: null,
  resolver: (resolvable: ResolvableType) => DefiniteType
): null;

export function resolveOptional<ResolvableType, DefiniteType>(
  value: undefined,
  resolver: (resolvable: ResolvableType) => DefiniteType
): undefined;

export function resolveOptional<ResolvableType, DefiniteType>(
  value: ResolvableType,
  resolver: (resolvable: ResolvableType) => DefiniteType
): DefiniteType;

export function resolveOptional<ResolvableType, DefiniteType>(
  value: null | undefined,
  resolver: (resolvable: ResolvableType) => DefiniteType
): null | undefined;

export function resolveOptional<ResolvableType, DefiniteType>(
  value: ResolvableType | undefined,
  resolver: (resolvable: ResolvableType) => DefiniteType
): DefiniteType | undefined;

export function resolveOptional<ResolvableType, DefiniteType>(
	value: ResolvableType | null,
	resolver: (resolvable: ResolvableType) => DefiniteType
): DefiniteType | null;

export function resolveOptional<ResolvableType, DefiniteType>(
  value: ResolvableType | null | undefined,
  resolver: (resolvable: ResolvableType) => DefiniteType
): DefiniteType | null | undefined;

/**
 * Resolves a value that may be null, undefined, or a resolvable value using the provided resolver function.
 * @param value - The value to resolve, which may be null, undefined, or a resolvable value.
 * @param resolver - The function to use to resolve the value if it is not null or undefined.
 * @returns The resolved value, or null/undefined if the input value was null/undefined.
 */
export function resolveOptional<ResolvableType, DefiniteType>(
  value: ResolvableType | null | undefined,
  resolver: (resolvable: ResolvableType) => DefiniteType
): DefiniteType | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  return resolver(value);
}
