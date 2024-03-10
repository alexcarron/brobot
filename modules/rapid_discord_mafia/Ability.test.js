const { AbilityName, AbilityTypes, AbilityPriority, AbilityUses, Duration, Phases, AbilityArgName, ArgumentTypes, ArgumentSubtypes } = require("../enums");
const { EffectName } = require("./EffectManager");
const Ability = require("./Ability");
const Arg = require("./Arg");

describe('Ability', () => {
	describe('constructor', () => {
		it('SHOULD set name, type, uses, feedback functoin, phases_can_use, description, priority, duration, args, and effects fields', () => {
			const name = AbilityName.Cautious;
			const description = "description";
			const type = AbilityTypes.Attacking;
			const priority = AbilityPriority.Attacking;
			const uses = AbilityUses.None;
			const duration = Duration.DayAndNight;
			const phases_can_use = [Phases.Day, Phases.Trial];
			const effects = [EffectName.Control];
			const feedback = (player_healing, player_name="You", isYou=true) => {return "feedback"}
			const args = [
				new Arg({
					name: AbilityArgName.PlayerConsorting,
					description: "description",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.CertainPlayers],
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
			const type = AbilityTypes.Attacking;
			const priority = AbilityPriority.Attacking;
			const uses = AbilityUses.None;
			const duration = Duration.DayAndNight;
			const phases_can_use = [Phases.Day, Phases.Trial];
			const effects = [EffectName.Control];
			const feedback = (player_healing, player_name="You", isYou=true) => {return "feedback"}
			const args = [
				{
					name: AbilityArgName.PlayerConsorting,
					description: "description",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.CertainPlayers],
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