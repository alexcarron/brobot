import { makeSure } from "./jest/jest-utils";
import { resolveOptional, resolveOptionals } from "./optional-utils";

describe('optional-utils.ts', () => {
	type Resolvable = string | number | object;

	const resolveString =
	(resolvable: Resolvable) => {
		if (typeof resolvable === 'string') {
			return resolvable;
		}
		return resolvable.toString();
	}

	describe('resolveOptional', () => {
		it('resolves null to null', () => {
			const result = resolveOptional(resolveString, null)
			makeSure(result).isNull();
		});

		it('resolves undefined to undefined', () => {
			const result = resolveOptional(resolveString, undefined)
			makeSure(result).isUndefined();
		});

		it('resolves a string resolvable to the string', () => {
			const result = resolveOptional(resolveString, "a string")
			makeSure(result).is("a string");
		});

		it('resolves a number resolvable to the string representation of the number', () => {
			const result = resolveOptional(resolveString, 42)
			makeSure(result).is("42");
		});

		it('resolves an object resolvable to the string representation of the object', () => {
			const obj = {key: "value"};
			const result = resolveOptional(resolveString, obj)
			makeSure(result).is("[object Object]");
		});

		it('type narrows undefined or null correctly', () => {
			const maybeNull: undefined | null =
				Math.random() > 0.5 ? null : undefined;
			const resolvedValue = resolveOptional(resolveString, maybeNull);
			makeSure(resolvedValue).isNotAString();
		});

		it('type narrows undefined or resolvable correctly', () => {
			const maybeUndefined: Resolvable | undefined =
				Math.random() < 0.25
					? "a string"
				: Math.random() < 0.33
					? 123
				: Math.random() < 0.5
					? {key: "value"}
					: undefined;

			const resolvedValue = resolveOptional(resolveString, maybeUndefined);
			makeSure(resolvedValue).isNotNull();
		});

		it('type narrows null or resolvable correctly', () => {
			const maybeNull: Resolvable | null =
				Math.random() < 0.25
					? "a string"
				: Math.random() < 0.33
					? 123
				: Math.random() < 0.5
					? {key: "value"}
					: null;
					
			const resolvedValue = resolveOptional(resolveString, maybeNull);
			makeSure(resolvedValue).isNotUndefined();
		});
	});
	
	describe('resolveOptionals', () => {
		it('resolves an empty array to an empty array', () => {
			const result = resolveOptionals(resolveString, []);
			makeSure(result).isEmpty();
		});
	
		it('resolves an array of single values to an array of resolved values', () => {
			const values = [null, undefined, "test string", 42, {key: "value"}];
			const result = resolveOptionals(resolveString, values);
			makeSure(result).is([
				null,
				undefined,
				"test string",
				"42",
				"[object Object]"
			]);
		});
	
		it('resolves an array passed as a rest parameter to an array of resolved values', () => {
			const result = resolveOptionals(resolveString, null, undefined, "test string", 42, {key: "value"});
			makeSure(result).is([
				null,
				undefined,
				"test string",
				"42",
				"[object Object]"
			]);
		});
	});
});

