import { InvalidArgumentError } from "./error-utils";
import { repeat } from "./loop-utils";

describe('loop-utils', () => {
	describe(`repeat()`, () => {
		it(`executes the given function 10 times`, () => {
			let numExecutions = 0;

			repeat(10, () => {
				numExecutions++;
			});

			expect(numExecutions).toBe(10);
		});
	
		it('provides the correct index as the first argument', () => {
			let numExecutions = 0;
	
			repeat(10, (index) => {
				numExecutions += index;
			});
	
			expect(numExecutions).toBe(45);
		});

		it('does not execute the function if numRepeats is 0', () => {
			let numExecutions = 0;
	
			repeat(0, () => {
				numExecutions++;
			});
	
			expect(numExecutions).toBe(0);
		});

		it('does not execute the function if numRepeats is negative', () => {
			let numExecutions = 0;
	
			repeat(-999, () => {
				numExecutions++;
			});
	
			expect(numExecutions).toBe(0);
		});

		it('throws an error if numRepeats is NaN or infinity', () => {
			expect(() => repeat(NaN, () => {})).toThrow(InvalidArgumentError);
			expect(() => repeat(Infinity, () => {})).toThrow(InvalidArgumentError);
		});
	});
});