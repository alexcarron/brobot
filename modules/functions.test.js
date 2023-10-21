const { doArraysHaveSameElements, gcd, lcm, toOrdinal, toWordOrdinal } = require("./functions");

// ^ doArraysHaveSameElements
{
	test.concurrent(
		"doArraysHaveSameElements() should return true for [1, 2, 3] and [3, 2, 1]",
		() => {
			const input_array1 = [1, 2, 3];
			const input_array2 = [3, 2, 1];
			const expected_output = true;

			const actual_output = doArraysHaveSameElements(input_array1, input_array2)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		"doArraysHaveSameElements() should return false for [1, 2, 3] and [1, 2, 3, 4]",
		() => {
			const input_array1 = [1, 2, 3];
			const input_array2 = [1, 2, 3, 4];
			const expected_output = false;

			const actual_output = doArraysHaveSameElements(input_array1, input_array2)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		"doArraysHaveSameElements() should return false for [1, 2, 3, 4] and [1, 2, 3]",
		() => {
			const input_array1 = [1, 2, 3, 4];
			const input_array2 = [1, 2, 3];
			const expected_output = false;

			const actual_output = doArraysHaveSameElements(input_array1, input_array2)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		"doArraysHaveSameElements() should return false for [1, 2, 3] and [1, 2, 4]",
		() => {
			const input_array1 = [1, 2, 3];
			const input_array2 = [1, 2, 4];
			const expected_output = false;

			const actual_output = doArraysHaveSameElements(input_array1, input_array2)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)
}

// ^ gcd
{
	test.concurrent(
		`gcd(20, 8) returns 4`,
		() => {
			const input_num1 = 20;
			const input_num2 = 4;
			const expected_output = 4;

			const actual_output = gcd(input_num1, input_num2)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)
}

// ^ lcm
{
	test.concurrent(
		`lcm(2, 3) returns 6`,
		() => {
			const input_num1 = 2;
			const input_num2 = 3;
			const expected_output = 6;

			const actual_output = lcm(input_num1, input_num2)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)
	test.concurrent(
		`lcm(5, 7) returns 35`,
		() => {
			const input_num1 = 5;
			const input_num2 = 7;
			const expected_output = 35;

			const actual_output = lcm(input_num1, input_num2)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)
}

// ^ toOrdinal(number)
describe('toOrdinal function tests', () => {
	it('Should return "1st" for input 1', () => {
			expect(toOrdinal(1)).toBe('1st');
	});

	it('Should return "2nd" for input 2', () => {
			expect(toOrdinal(2)).toBe('2nd');
	});

	it('Should return "3rd" for input 3', () => {
			expect(toOrdinal(3)).toBe('3rd');
	});

	it('Should return "4th" for input 4', () => {
			expect(toOrdinal(4)).toBe('4th');
	});

	it('Should return "11th" for input 11', () => {
			expect(toOrdinal(11)).toBe('11th');
	});

	it('Should return "42nd" for input 42', () => {
			expect(toOrdinal(42)).toBe('42nd');
	});

	it('Should return "31st" for input 31', () => {
			expect(toOrdinal(31)).toBe('31st');
	});

	it('Should return "53rd" for input 53', () => {
			expect(toOrdinal(53)).toBe('53rd');
	});
});

// ^ toWordOrdinal(number)
describe('toWordOrdinal', () => {
	it('should return "first" for input 1', () => {
			expect(toWordOrdinal(1)).toBe('first');
	});

	it('should return "second" for input 2', () => {
			expect(toWordOrdinal(2)).toBe('second');
	});

	it('should return "third" for input 3', () => {
			expect(toWordOrdinal(3)).toBe('third');
	});

	it('should return "fourth" for input 4', () => {
			expect(toWordOrdinal(4)).toBe('fourth');
	});

	it('should return "eleventh" for input 11', () => {
			expect(toWordOrdinal(11)).toBe('eleventh');
	});

	it('should return "fifteenth" for input 15', () => {
			expect(toWordOrdinal(15)).toBe('fifteenth');
	});

	it('should return "twentieth" for input 20', () => {
			expect(toWordOrdinal(20)).toBe('twentieth');
	});

	it('should return "thirty-first" for input 31', () => {
			expect(toWordOrdinal(31)).toBe('thirty-first');
	});

	it('should return "fifty-second" for input 52', () => {
			expect(toWordOrdinal(52)).toBe('fifty-second');
	});

	it('should return "ninety-ninth" for input 99', () => {
			expect(toWordOrdinal(99)).toBe('ninety-ninth');
	});
});