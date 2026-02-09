import { RestOrArray } from "discord.js";
import { isArray } from "./types/type-guards";

export function resolveOptional<ResolvableType, DefiniteType>(
  resolver: (resolvable: ResolvableType) => DefiniteType,
  value: null,
): null;

export function resolveOptional<ResolvableType, DefiniteType>(
  resolver: (resolvable: ResolvableType) => DefiniteType,
  value: undefined,
): undefined;

export function resolveOptional<ResolvableType, DefiniteType>(
  resolver: (resolvable: ResolvableType) => DefiniteType,
  value: ResolvableType,
): DefiniteType;

export function resolveOptional<ResolvableType, DefiniteType>(
  resolver: (resolvable: ResolvableType) => DefiniteType,
  value: null | undefined,
): null | undefined;

export function resolveOptional<ResolvableType, DefiniteType>(
  resolver: (resolvable: ResolvableType) => DefiniteType,
  value: ResolvableType | undefined,
): DefiniteType | undefined;

export function resolveOptional<ResolvableType, DefiniteType>(
	resolver: (resolvable: ResolvableType) => DefiniteType,
	value: ResolvableType | null,
): DefiniteType | null;

export function resolveOptional<ResolvableType, DefiniteType>(
  resolver: (resolvable: ResolvableType) => DefiniteType,
  value: ResolvableType | null | undefined,
): DefiniteType | null | undefined;

/**
 * Resolves a value that may be null, undefined, or a resolvable value using the provided resolver function.
 * @param resolver - The function to use to resolve the value if it is not null or undefined.
 * @param value - The value to resolve, which may be null, undefined, or a resolvable value.
 * @returns The resolved value, or null/undefined if the input value was null/undefined.
 */
export function resolveOptional<ResolvableType, DefiniteType>(
  resolver: (resolvable: ResolvableType) => DefiniteType,
  value: ResolvableType | null | undefined,
): DefiniteType | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  return resolver(value);
}




export function resolveOptionals<ResolvableType, DefiniteType>(
	resolver: (resolvable: ResolvableType) => DefiniteType,
	...values: RestOrArray<null>
): (null)[];

export function resolveOptionals<ResolvableType, DefiniteType>(
	resolver: (resolvable: ResolvableType) => DefiniteType,
	...values: RestOrArray<undefined>
): (undefined)[];

export function resolveOptionals<ResolvableType, DefiniteType>(
	resolver: (resolvable: ResolvableType) => DefiniteType,
	...values: RestOrArray<ResolvableType>
): (DefiniteType)[];

export function resolveOptionals<ResolvableType, DefiniteType>(
	resolver: (resolvable: ResolvableType) => DefiniteType,
	...values: RestOrArray<null | undefined>
): (null | undefined)[];

export function resolveOptionals<ResolvableType, DefiniteType>(
	resolver: (resolvable: ResolvableType) => DefiniteType,
	...values: RestOrArray<ResolvableType | null>
): (DefiniteType | null)[];

export function resolveOptionals<ResolvableType, DefiniteType>(
	resolver: (resolvable: ResolvableType) => DefiniteType,
	...values: RestOrArray<ResolvableType | undefined>
): (DefiniteType | undefined)[];

export function resolveOptionals<ResolvableType, DefiniteType>(
	resolver: (resolvable: ResolvableType) => DefiniteType,
	...values: RestOrArray<ResolvableType | null | undefined>
): (DefiniteType | null | undefined)[];

/**
 * Resolves a list of values that may be null, undefined, or a resolvable value using the provided resolver function.
 * @param resolver - The function to use to resolve the values if they are not null or undefined.
 * @param values - The list of values to resolve, which may be null, undefined, or a resolvable value.
 * @returns The resolved list of values, or an empty array if the input list was empty.
 */
export function resolveOptionals<ResolvableType, DefiniteType>(
	resolver: (resolvable: ResolvableType) => DefiniteType,
	...values: RestOrArray<ResolvableType | null | undefined>
): (DefiniteType | null | undefined)[] {
	if (values.length === 0) return [];

	if (isArray(values[0])) {
		values = values[0];
	}
	else {
		values = values as (ResolvableType | null | undefined)[];
	}
	
	return values.map((value) => resolveOptional(resolver, value));
}


