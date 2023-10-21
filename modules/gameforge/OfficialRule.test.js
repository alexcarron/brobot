const OfficialRule = require("./OfficialRule");

// ^ .isAboutChallenge()
{
	test.concurrent(
		`.isAboutChallenge(2) returns true when rule description includes 'chAllenge 2 will be a game!'`,
		() => {
			const input_challenge_num = 2;
			const input_rule_description = "chAllenge 2 will be a game!";
			const expected_output = true;

			const official_rule = new OfficialRule({
				description: input_rule_description,
				number: 1
			});
			const actual_output = official_rule.isAboutChallenge(input_challenge_num);

			console.log({expected_output})
			console.log({actual_output})

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		`.isAboutChallenge(5) returns false when rule description includes 'chAllenge 2 will be a game!'`,
		() => {
			const input_challenge_num = 5;
			const input_rule_description = "chAllenge 2 will be a game!";
			const expected_output = false;

			const official_rule = new OfficialRule({
				description: input_rule_description,
				number: 1
			});
			const actual_output = official_rule.isAboutChallenge(input_challenge_num);

			console.log({expected_output})
			console.log({actual_output})

			expect(actual_output).toStrictEqual(expected_output);
		}
	)
}