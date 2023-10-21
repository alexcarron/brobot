const GameForge = require("./GameForge");
const OfficialRule = require("./OfficialRule");

// ^ .resetTopic()
{
	test.concurrent(
		`.resetTopic() should set the topic to "The mechanics of the overall game" if all challenges are talked about`,
		() => {
			const expected_output = "The mechanics of the overall game";

			const official_rules = [];
			for (let challenge_num = 1; challenge_num <= GameForge.NUM_CHALLENGES; challenge_num++) {
				official_rules.push(
					new OfficialRule({
						description: `Challenge ${challenge_num}`,
						number: challenge_num,
					})
				)
			}

			const gameforge = new GameForge({
				official_rules: official_rules
			});
			gameforge.resetTopic();
			const actual_output = gameforge.topic;

			if (GameForge.TOPICS.length <= 0)
				expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		`.resetTopic() should set the topic to "The rules, base, story, or theme of Challenge 5" if all challenges but 5 are talked about`,
		() => {
			const expected_output = "The rules, base, story, or theme of Challenge 5";

			const official_rules = [];
			for (let challenge_num = 1; challenge_num <= GameForge.NUM_CHALLENGES; challenge_num++) {
				if (challenge_num !== 5)
					official_rules.push(
						new OfficialRule({
							description: `Challenge ${challenge_num}`,
							number: challenge_num,
						})
					)
			}

			const gameforge = new GameForge({
				official_rules: official_rules
			});
			gameforge.resetTopic();
			const actual_output = gameforge.topic;

			if (GameForge.TOPICS.length <= 0)
				expect(actual_output).toStrictEqual(expected_output);
		}
	)
}