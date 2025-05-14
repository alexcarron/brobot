const { doArraysHaveSameElements, gcd, lcm, addOrAssignElementToArray, appendElementToNestedProperty: addElementToNestedProperty, getSentenceFromArray, splitWithNoSplitWords } = require("./functions");

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

// ^ addElementToNestedProperty
describe('addElementToNestedProperty', () => {
	it('SHOULD return {"first_level": {"second_level": {"third_level": ["element"]}}} for input "element", {}, "first_level", "second_level", "third_level"', () => {
		const element_adding = "element";
		const object_adding_to = {};
		const nested_properties = [
			"first_level",
			"second_level",
			"third_level",
		]

		addElementToNestedProperty(element_adding, object_adding_to, ...nested_properties);
		expect(object_adding_to)
		.toStrictEqual(
			{
				[nested_properties[0]]: {
					[nested_properties[1]]: {
						[nested_properties[2]]: ["element"],
					},
				},
			}
		);
	});


	it('SHOULD add element to empty array in top level property"', () => {
		const element_adding = "element";
		const object_adding_to = {
			"elements": []
		};

		addElementToNestedProperty(element_adding, object_adding_to, "elements");
		expect(object_adding_to)
		.toStrictEqual(
			{
				"elements": [element_adding]
			}
		);
	});


	it('SHOULD append element to existing array in top level property"', () => {
		const element_adding = "element";
		const object_adding_to = {
			"elements": [1, true, null, undefined]
		};

		addElementToNestedProperty(element_adding, object_adding_to, "elements");
		expect(object_adding_to)
		.toStrictEqual(
			{
				"elements": [1, true, null, undefined, element_adding]
			}
		);
	});


	it('SHOULD assign array with single element in top level property"', () => {
		const element_adding = "element";
		const object_adding_to = {
			"colors": ["red"]
		};

		addElementToNestedProperty(element_adding, object_adding_to, "elements");
		expect(object_adding_to)
		.toStrictEqual(
			{
				"colors": ["red"],
				"elements": [element_adding]
			}
		);
	});
	it('SHOULD ignore other properties in levels and go any depth', () => {
		const element_adding = "element";
		const object_adding_to = {
			"first_level": {
				"second_level": {
					"decoy_property": {
						"decoy": [],
					},
				},
				"decoy_property1": {
					"decoy": [],
				},
				"decoy_property2": [1, 2, 3]
			},
			"decoy_property1": {
				"decoy_property1": {
					"decoy": [],
				},
			},
			"decoy_property2": [1, 2, 3],
			"decoy_property3": [],
		};
		const nested_properties = [
			"first_level",
			"second_level",
			"third_level",
			"fourth_level",
			"fifth_level",
		]

		addElementToNestedProperty(element_adding, object_adding_to, ...nested_properties);
		expect(object_adding_to)
		.toStrictEqual(
			{
				"first_level": {
					"second_level": {
						"third_level": {
							"fourth_level": {
								"fifth_level": [element_adding],
							},
						},
						"decoy_property": {
							"decoy": [],
						},
					},
					"decoy_property1": {
						"decoy": [],
					},
					"decoy_property2": [1, 2, 3]
				},
				"decoy_property1": {
					"decoy_property1": {
						"decoy": [],
					},
				},
				"decoy_property2": [1, 2, 3],
				"decoy_property3": [],
			}
		);
	});
});

// ^ getSentenceFromArray
describe('getSentenceFromArray', () => {
	it('SHOULD return "" for input undefined', () => {
		expect(getSentenceFromArray(undefined)).toStrictEqual("");
	});

	it('SHOULD return "" for input []', () => {
		expect(getSentenceFromArray([])).toStrictEqual("");
	});

	it('SHOULD return "Alex" for input ["Alex"]', () => {
		expect(getSentenceFromArray(["Alex"])).toStrictEqual("Alex");
	});

	it('SHOULD return "Alex and Brock" for input ["Alex", "Brock"]', () => {
		expect(getSentenceFromArray(["Alex", "Brock"])).toStrictEqual("Alex and Brock");
	});

	it('SHOULD return "Alex, Brock, and Clark" for input ["Alex", "Brock", "Clark"]', () => {
		expect(getSentenceFromArray(["Alex", "Brock", "Clark"])).toStrictEqual("Alex, Brock, and Clark");
	});

	it('SHOULD return "Alex, Brock, Clark, and Doug" for input ["Alex", "Brock", "Clark", "Doug"]', () => {
		expect(getSentenceFromArray(["Alex", "Brock", "Clark", "Doug"])).toStrictEqual("Alex, Brock, Clark, and Doug");
	});
});

// ^ splitWithNoSplitWords
describe('splitWithNoSplitWords', () => {
	it('SHOULD return expected_return_value for input input_value', () => {
		expect(splitWithNoSplitWords("a sentence filled with words and words and words", 10)).toStrictEqual([
			"a sentence",
			"filled",
			"with words",
			"and words",
			"and words",
		]);
	});
});