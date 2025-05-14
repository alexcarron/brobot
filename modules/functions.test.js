const { doArraysHaveSameElements, gcd, lcm } = require("./functions");

// ^ doArraysHaveSameElements
{
	test.concurrent(
		"doArraysHaveSameElements() SHOULD return true for [1, 2, 3] and [3, 2, 1]",
		() => {
			const input_array1 = [1, 2, 3];
			const input_array2 = [3, 2, 1];
			const expected_output = true;

			const actual_output = doArraysHaveSameElements(input_array1, input_array2)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		"doArraysHaveSameElements() SHOULD return false for [1, 2, 3] and [1, 2, 3, 4]",
		() => {
			const input_array1 = [1, 2, 3];
			const input_array2 = [1, 2, 3, 4];
			const expected_output = false;

			const actual_output = doArraysHaveSameElements(input_array1, input_array2)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		"doArraysHaveSameElements() SHOULD return false for [1, 2, 3, 4] and [1, 2, 3]",
		() => {
			const input_array1 = [1, 2, 3, 4];
			const input_array2 = [1, 2, 3];
			const expected_output = false;

			const actual_output = doArraysHaveSameElements(input_array1, input_array2)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		"doArraysHaveSameElements() SHOULD return false for [1, 2, 3] and [1, 2, 4]",
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