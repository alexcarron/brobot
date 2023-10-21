const { ArgumentSubtypes, ArgumentTypes, AbilityUses, Durations, Phases, AbilityTypes, Priorities, AbilityNames } = require("../enums");
const Arg = require("./arg.js");
const Types = require("./types.js");
const perform = require("./perform");

class Ability {
	constructor( { name, type, uses, feedback=()=>``, phases_can_use=[Phases.Night], description, priority, duration=0.5, args=[], effects=[], perform } ) {
		this.name = name;
		this.type = type;
		this.priority = priority;
		this.uses = uses;
		this.duration = duration;
		this.phases_can_use = phases_can_use;
		this.description = description;
		this.feedback = feedback;
		this.args = [];
		this.effects = effects;
		for (let arg of args) {
			this.args.push( new Arg(arg) )
		}
	}

	static Abilities = {
		Heal: new Ability({
			name: "Heal",
			description: "You can heal a player that's not yourself at night to give them a level two defense for the night and following day. You and your target will be notified if your target was attacked while healed.",
			type: AbilityTypes.Protection,
			priority: Priorities.Protection,
			uses: AbilityUses.Unlimited,
			duration: Durations.DayAndNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.heal
			],
			feedback: function(player_healing, player_name="You") {
				return `**${player_name}** will attempt to heal **${player_healing}** tonight`
			},
			args: [
				new Arg({
					name: "Player Healing",
					description: "The player you're healing",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf],
				})
			]
		}),
		HealSelf: new Ability({
			name: "Heal Self",
			description: "You can heal yourself at night to give yourself a level two defense for the night and following day.",
			type: AbilityTypes.Protection,
			priority: Priorities.Protection,
			uses: AbilityUses.Amount(1),
			duration: Durations.DayAndNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.selfHeal
			],
			feedback: function(player_name="You") {
				return `**${player_name}** will attempt to heal ${player_name==="You" ? "yourself" : "themself"} tonight`
			},
		}),
		Evaluate: new Ability({
			name: "Evaluate",
			description: "You can evaluate a player that's not yourself at night to see if their suspicious or innocent. Mafia, Coven, and Neutral Killing seem suspicious. Town and non-Killing Neutrals seem innocent. Those douesd by an Arsonist will be unclear. These results are affected by the players' perceived role.",
			type: AbilityTypes.Investigative,
			priority: Priorities.Investigative,
			uses: AbilityUses.Unlimited,
			phases_can_use: [Phases.Night],
			effects: [
				perform.evaluate
			],
			feedback: function(player_evaluating, player_name="You") {return `**${player_name}** will attempt to evaluate **${player_evaluating}** tonight`},
			args: [
				new Arg({
					name: "Player Evaluating",
					description: "The player you are evaluating",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				})
			]
		}),
		Track: new Ability({
			name: "Track",
			description: "You can track a player that's not yourself at night to see who they are percieved to be visiting.",
			type: AbilityTypes.Investigative,
			priority: Priorities.Investigative,
			uses: AbilityUses.Unlimited,
			phases_can_use: [Phases.Night],
			effects: [
				perform.track
			],
			feedback: function(player_tracking, player_name="You") {return `**${player_name}** will attempt to track the visit of **${player_tracking}** tonight`},
			args: [
				new Arg({
					name: "Player Tracking",
					description: "The player whose visit your tracking",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				})
			]
		}),
		Roleblock: new Ability({
			name: "Roleblock",
			description: "You can roleblock a player that is not yourself at night so that they can't perform their ability that night and following day. They will be notified of this.",
			type: AbilityTypes.Roleblock,
			priority: Priorities.Roleblock,
			uses: AbilityUses.Unlimited,
			duration: Durations.DayAndNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.roleblock
			],
			feedback: function(player_roleblocking, player_name="You") {return `**${player_name}** will attempt to roleblock **${player_roleblocking}** tonight`},
			args: [
				new Arg({
					name: "Player Roleblocking",
					description: "The player your roleblocking",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				})
			]
		}),
		Shoot: new Ability({
			name: "Shoot",
			description: "You can shoot a player that isn't yourself at night, attacking them.",
			type: AbilityTypes.Attacking,
			priority: Priorities.Attacking,
			uses: AbilityUses.Amount(3),
			duration: Durations.OneNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.attack
			],
			feedback: function(player_shooting, player_name="You") {return `**${player_name}** will attempt to shoot **${player_shooting}** tonight`},
			args: [
				new Arg({
					name: "Player Shooting",
					description: "The player your shooting",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				})
			]
		}),
		Order: new Ability({
			name: "Order",
			description: "You can order the Mafia to kill a non-mafia player at night so that they become the Mafioso's target. If the Mafioso doesn't exist, is dead, or is roleblocked, you will attack them yourself instead.",
			type: AbilityTypes.Control,
			priority: Priorities.Control,
			uses: AbilityUses.Unlimited,
			duration: Durations.OneNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.order
			],
			feedback: function(player_ordering_to_kill, player_name="You") {return `**${player_name}** will attempt to order the Mafioso to murder **${player_ordering_to_kill}** tonight`},
			args: [
				new Arg({
					name: "Player Killing",
					description: "The player you want the Mafioso to kill",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.NonMafia]
				})
			]
		}),
		Murder: new Ability({
			name: AbilityNames.Murder,
			description: "You can murder a non-mafia player at night, attacking them.",
			type: AbilityTypes.Attacking,
			priority: Priorities.Attacking,
			uses: AbilityUses.Unlimited,
			duration: Durations.OneNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.attack
			],
			feedback: function(player_murdering, player_name="You") {return `**${player_name}** will attempt to murder **${player_murdering}** tonight`},
			args: [
				new Arg({
					name: "Player Killing",
					description: "The player your killing",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NonMafia]
				})
			]
		}),
		Frame: new Ability({
			name: "Frame",
			description: "You can frame a non-mafia player at night, making them perceived to be a Mafioso until after they're investigated by a player that gets any information based off of percieved roles.",
			type: AbilityTypes.Manipulation,
			priority: Priorities.Manipulation,
			uses: AbilityUses.Unlimited,
			duration: Durations.DayAndNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.frame
			],
			feedback: function(player_frame, player_name="You") {return `**${player_name}** will attempt to frame **${player_frame}** as the Mafioso tonight`},
			args: [
				new Arg({
					name: "Player Framing",
					description: "The player your framing to be the Mafioso",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NonMafia]
				})
			]
		}),
		Consort: new Ability({
			name: "Consort",
			description: "You can consort a player who's not yourself at night, roleblocking them that night and following day. They will be notified.",
			type: AbilityTypes.Roleblock,
			priority: Priorities.Roleblock,
			uses: AbilityUses.Unlimited,
			duration: Durations.DayAndNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.frame
			],
			feedback: function(player_roleblocking, player_name="You") {return `**${player_name}** will attempt to roleblock **${player_roleblocking}** tonight`},
			args: [
				new Arg({
					name: "Player Consorting",
					description: "The player your roleblocking",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				})
			]
		}),
		Investigate: new Ability({
			name: "Investigate",
			description: "You can investigate a non-mafia player at night, learning their percieved role.",
			type: AbilityTypes.Investigative,
			priority: Priorities.Investigative,
			uses: AbilityUses.Unlimited,
			phases_can_use: [Phases.Night],
			effects: [
				perform.investigate
			],
			feedback: function(player_investigating, player_name="You") {return `**${player_name}** will attempt to investigate the role of **${player_investigating}** tonight`},
			args: [
				new Arg({
					name: "Player Investigating",
					description: "The player whose role your investigating",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NonMafia]
				})
			]
		}),
		SelfFrame: new Ability({
			name: "Self Frame",
			description: "You can frame yourself at night, making yourself perceived as a Mafioso until after you're investigated by a player that gets any information based off of percieved roles.",
			type: AbilityTypes.Manipulation,
			priority: Priorities.Manipulation,
			uses: AbilityUses.Amount(1),
			duration: Durations.Indefinite,
			phases_can_use: [Phases.Night],
			effects: [
				perform.selfFrame
			],
			feedback: function(player_name="You") {return `**${player_name}** will attempt to frame ${player_name==="You" ? "yourself" : "themself"} as the mafioso tonight`},
		}),
		DeathCurse: new Ability({
			name: "Death Curse",
			description: "After you've satisfied your win condition and been lynched, you can curse a chosen player with death at night, attacking them.",
			type: AbilityTypes.Attacking,
			priority: Priorities.Attacking,
			uses: AbilityUses.Amount(1),
			duration: Durations.OneNight,
			phases_can_use: [Phases.Limbo],
			effects: [
				perform.attack
			],
			feedback: function(player_cursing, player_name="You") {return `**${player_name}** will attempt to curse **${player_cursing}** with death tonight`},
			args: [
				new Arg({
					name: "Player Killing",
					description: "The player your cursing with death",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting]
				})
			],
		}),
		FrameTarget: new Ability({
			name: "Frame Target",
			description: "You can frame your target at night, making them perceived as a Mafioso until after you're investigated by a player that gets any information based off of percieved roles.",
			type: AbilityTypes.Manipulation,
			priority: Priorities.Manipulation,
			uses: AbilityUses.Amount(1),
			duration: Durations.Indefinite,
			phases_can_use: [Phases.Night],
			effects: [
				perform.frameTarget
			],
			feedback: function(player_name="You") {return `**${player_name}** will attempt to frame ${player_name==="You" ? "your" : "their"} target as the Mafioso tonight`},
		}),
		SelfVest: new Ability({
			name: "Self Vest",
			description: "You can put on a vest at night, gaining a level two defense for the night and following day.",
			type: AbilityTypes.Protection,
			priority: Priorities.Protection,
			uses: AbilityUses.Amount(4),
			duration: Durations.DayAndNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.selfHeal
			],
			feedback: function(player_name="You") {return `**${player_name}** will attempt to put on a vest tonight`},
		}),
		Knife: new Ability({
			name: AbilityNames.Knife,
			description: "You can knife a player that's not yourself at night, attacking them.",
			type: AbilityTypes.Attacking,
			priority: Priorities.Attacking,
			uses: AbilityUses.Unlimited,
			duration: Durations.OneNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.attack
			],
			feedback(player_knifing) {
				return `You will attempt to knife ${player_knifing} to death tonight`
			},
			args: [
				new Arg({
					name: "Player Knifing",
					description: "The player your stabbing",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				})
			],
		}),
		Cautious: new Ability({
			name: "Cautious",
			description: "You can choose to be cautious at night, not attacking anyone who roleblocks you.",
			type: AbilityTypes.Modifier,
			priority: Priorities.Modifier,
			uses: AbilityUses.Unlimited,
			duration: Durations.OneNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.cautious
			],
			feedback: function(player_name="You") {return `**${player_name}** will attempt to be cautious of roleblockers tonight`},
		}),
		Smith: new Ability({
			name: "Smith",
			description: "You can smith a bulletproof vest for a player that's not yourself at night, giving them a level one defense that night and following day. You and your target will be notified if your target was attacked while wearing the vest.",
			type: AbilityTypes.Protection,
			priority: Priorities.Protection,
			uses: AbilityUses.Amount(3),
			duration: Durations.DayAndNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.smith
			],
			feedback: function(player_smithing_for, player_name="You") {return `**${player_name}** will attempt to smith a bulletproof vest for **${player_smithing_for}** tonight`},
			args: [
				new Arg({
					name: "Player Smithing For",
					description: "The player your smithing a bulletproof vest for",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				})
			],
		}),
		SelfSmith: new Ability({
			name: "Self Smith",
			description: "You can smith a bulletproof vest for yourself at night, gaining a level one defense that night and following day.",
			type: AbilityTypes.Protection,
			priority: Priorities.Protection,
			uses: AbilityUses.Amount(1),
			duration: Durations.DayAndNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.selfSmith
			],
			feedback: function(player_name="You") {return `**${player_name}** will attempt to smith a bulletproof vest for ${player_name==="You" ? "yourself" : "themself"} tonight`},
		}),
		Suicide: new Ability({
			name: AbilityNames.Suicide,
			description: "You will shoot yourself, attacking yourself with a level four attack.",
			type: AbilityTypes.Suicide,
			priority: Priorities.Attacking,
			uses: AbilityUses.None,
			duration: Durations.OneNight,
			phases_can_use: [],
			effects: [
				perform.attack
			],
		}),
		Control: new Ability({
			name: "Control",
			description: "You can control a player that's not yourself, forcing them to use their main ability on another player or themself. You will learn the perceived role of who you controlled and they will be notified that they were controlled. Your control will fail if the player has no ability that can be used on another player or themself.",
			type: AbilityTypes.Control,
			priority: Priorities.Control,
			uses: AbilityUses.Unlimited,
			duration: Durations.OneNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.control
			],
			feedback: function(player_controlling, player_controlled_into, player_name="You") {return `**${player_name}** will attempt to control **${player_controlling}** into using their ability on **${player_controlled_into}** tonight`},
			args: [
				new Arg({
					name: "Player Controlling",
					description: "The player your controlling",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				}),
				new Arg({
					name: "Player Target Is Controlled Into",
					description: "The player your forcing whoever your controlling to visit",
					type: ArgumentTypes.Player,
					subtypes: []
				}),
			],
		}),
	}

	static getPropertyTypes() {
		return {
			'name': Types.string,
			'type': Types.ability_type,
			'uses': Types.ability_uses,
			'phases_can_use': Types.array(Types.phase),
			'description': Types.string,
			'priority': Types.priority,
			'duration': Types.duration,
			'args': Types.array(Types.ability_arg),
		}
	}

	toString() {
		let
			ability_msg = "",
			use_count_msg = "",
			command_example_msg = `\`/use ${this.name.toLowerCase().split(" ").join("-")}...\``;

		// Set ability use count text
		switch (true) {
			case this.uses == AbilityUses.Unlimited:
				use_count_msg = `Unlimited Uses`;
				break;

			case this.uses == AbilityUses.None:
				command_example_msg = ""
				use_count_msg = "Can't be used voluntarily";
				break;

			case this.uses == AbilityUses.Amount(1):
				use_count_msg = "1 Use";
				break;

			case this.uses > 1:
				use_count_msg = `${this.uses} Uses`;
				break;
		}

		ability_msg =
			`\n**${this.name.toUpperCase()}** - \`${use_count_msg}\`` + "\n" +
			command_example_msg + "\n" +
			this.description + "\n";

		return ability_msg;

	}
}

module.exports = Ability;