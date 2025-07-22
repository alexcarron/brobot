const { EffectName } = require("./effect-manager");
const { Ability, AbilityUseCount, AbilityType, AbilityPriority, AbilityDuration, AbilityName } = require("./ability");
const {Arg, AbilityArgType, ArgumentSubtype, AbilityArgName} = require("./arg");
const { Phase } = require("./game-state-manager");

describe('Ability', () => {
	describe('constructor', () => {
		it('SHOULD set name, type, uses, feedback functoin, phases_can_use, description, priority, duration, args, and effects fields', () => {
			const name = AbilityName.Cautious;
			const description = "description";
			const type = AbilityType.ATTACKING;
			const priority = AbilityPriority.ATTACKING;
			const uses = AbilityUseCount.None;
			const duration = AbilityDuration.DAY_AND_NIGHT;
			const phases_can_use = [Phase.DAY, Phase.TRIAL];
			const effects = [EffectName.Control];
			const feedback = () => {return "feedback"}
			const args = [
				new Arg({
					name: AbilityArgName.PLAYER_CONSORTING,
					description: "description",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.CERTAIN_PLAYERS],
				})
			]

			const ability = new Ability({
				name: name,
				type: type,
				priority: priority,
				uses: uses,
				duration: duration,
				phases_can_use: phases_can_use,
				description: description,
				feedback: feedback,
				args: args,
				effects: effects,
			});

			expect(ability.name).toBe(name);
			expect(ability.type).toBe(type);
			expect(ability.priority).toBe(priority);
			expect(ability.uses).toBe(uses);
			expect(ability.duration).toBe(duration);
			expect(ability.phases_can_use).toBe(phases_can_use);
			expect(ability.description).toBe(description);
			expect(ability.feedback).toBe(feedback);
			expect(ability.args).toBe(args);
			expect(ability.effects).toBe(effects);

			for (const arg of ability.args) {
				expect(arg instanceof Arg).toBe(true);
			}
		});

		it('SHOULD make args instance of Arg WHEN passed args are not instances of Arg', () => {
			const name = AbilityName.Cautious;
			const description = "description";
			const type = AbilityType.ATTACKING;
			const priority = AbilityPriority.ATTACKING;
			const uses = AbilityUseCount.None;
			const duration = AbilityDuration.DAY_AND_NIGHT;
			const phases_can_use = [Phase.DAY, Phase.TRIAL];
			const effects = [EffectName.Control];
			const feedback = () => {return "feedback"}
			const args = [
				{
					name: AbilityArgName.PLAYER_CONSORTING,
					description: "description",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.CERTAIN_PLAYERS],
				}
			]

			const ability = new Ability({
				name: name,
				type: type,
				priority: priority,
				uses: uses,
				duration: duration,
				phases_can_use: phases_can_use,
				description: description,
				feedback: feedback,
				args: args,
				effects: effects,
			});

			for (const arg of ability.args) {
				expect(arg instanceof Arg).toBe(true);
			}
		});
	});
});