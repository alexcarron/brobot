import { makeSure } from "./jest/jest-utils";
import { resolveOptional } from "./optional-utils";

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
			const result = resolveOptional(null, resolveString)
			makeSure(result).isNull();
		});

		it('resolves undefined to undefined', () => {
			const result = resolveOptional(undefined, resolveString)
			makeSure(result).isUndefined();
		});

		it('resolves a string resolvable to the string', () => {
			const result = resolveOptional("test string", resolveString)
			makeSure(result).is("test string");
		});

		it('resolves a number resolvable to the string representation of the number', () => {
			const result = resolveOptional(42, resolveString)
			makeSure(result).is("42");
		});

		it('resolves an object resolvable to the string representation of the object', () => {
			const obj = {key: "value"};
			const result = resolveOptional(obj, resolveString)
			makeSure(result).is("[object Object]");
		});

		it('type narrows undefined or null correctly', () => {
			const maybeNull: undefined | null =
				Math.random() > 0.5 ? null : undefined;
			const resolvedValue = resolveOptional(maybeNull, resolveString);
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

			const resolvedValue = resolveOptional(maybeUndefined, resolveString);
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
					
			const resolvedValue = resolveOptional(maybeNull, resolveString);
			makeSure(resolvedValue).isNotUndefined();
		});
	});
});