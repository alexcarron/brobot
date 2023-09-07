const { ArgumentSubtypes, ArgumentTypes, AbilityUses, Durations, Phases, AbilityTypes, Priorities } = require("../enums");
const Arg = require("./arg.js");
const Types = require("./types.js");
const perform = require("./perform");

class Ability {
	constructor( { name, type, uses, phases_can_use=[Phases.Night], description, priority, duration=0.5, args=[], effects=[], perform } ) {
		this.name = name;
		this.type = type;
		this.priority = priority;
		this.uses = uses;
		this.duration = duration;
		this.phases_can_use = phases_can_use;
		this.description = description;
		this.args = [];
		this.effects = effects;
		for (let arg of args) {
			this.args.push( new Arg(arg) )
		}
	}

	static Abilities = {
		Heal: new Ability({
			name: "Heal",
			description: "At night, heal a player that's not yourself. They will receive a level two defense for the night and the following day. You and your target will be notified if your target was attacked that night or the following day.",
			type: AbilityTypes.Protection,
			priority: Priorities.Protection,
			uses: AbilityUses.Unlimited,
			duration: Durations.DayAndNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.heal
			],
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
			description: "At night, heal yourself. You'll get a level two defense for the night and following day.",
			type: AbilityTypes.Protection,
			priority: Priorities.Protection,
			uses: AbilityUses.Amount(1),
			duration: Durations.DayAndNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.selfHeal
			],
		}),
		Evaluate: new Ability({
			name: "Evaluate",
			description: "At night, evaluate a player that's not yourself. You will be notified that they're suspicious if they are Mafia, Coven, a Neutral Killing. You'll be told they're innocent if their Town or a Neutral that's not a Neutral Killing. You'll be told it's unclear if they are doused by the Arsonist. Your results will be affected by the players' perceived role.",
			type: AbilityTypes.Investigative,
			priority: Priorities.Investigative,
			uses: AbilityUses.Unlimited,
			phases_can_use: [Phases.Night],
			effects: [
				perform.evaluate
			],
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
			description: "At night, track a player that's not yourself. If they are percieved to be visiting another player, you'll be told who they visited.",
			type: AbilityTypes.Investigative,
			priority: Priorities.Investigative,
			uses: AbilityUses.Unlimited,
			phases_can_use: [Phases.Night],
			effects: [
				perform.track
			],
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
			description: "At night, roleblock a player that is not yourself. They will not be able to perform their ability that night and the following day. Players you roleblock will be notified they have been.",
			type: AbilityTypes.Roleblock,
			priority: Priorities.Roleblock,
			uses: AbilityUses.Unlimited,
			duration: Durations.DayAndNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.roleblock
			],
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
			description: "At night, shoot a player that isn't yourself.",
			type: AbilityTypes.Attacking,
			priority: Priorities.Attacking,
			uses: AbilityUses.Amount(3),
			duration: Durations.OneNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.attack
			],
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
			description: "At night, order the mafia to kill a chosen non-mafia player. That player will be the mafia's target. If the Mafioso doesn't exist, is dead, or is roleblocked, you will attack the mafia's target yourself instead.",
			type: AbilityTypes.Control,
			priority: Priorities.Control,
			uses: AbilityUses.Unlimited,
			duration: Durations.OneNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.order
			],
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
			name: "Murder",
			description: "At night, chose a non-mafia player to become the mafia's target. If the godfather ordered you to kill a different player, they'll become a target instead. You'll attack the mafia's target.",
			type: AbilityTypes.Attacking,
			priority: Priorities.Attacking,
			uses: AbilityUses.Unlimited,
			duration: Durations.OneNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.attack
			],
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
			description: "At night, frame a chosen non-mafia player. They will be perceived as the Mafioso until they're investigated by a player and percieved as Mafioso.",
			type: AbilityTypes.Manipulation,
			priority: Priorities.Manipulation,
			uses: AbilityUses.Unlimited,
			duration: Durations.DayAndNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.frame
			],
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
			description: "At night, consort a player who's not yourself. They will be roleblocked that night and the following day. Players you consort will be notified they have been roleblocked. You will not be told if your roleblock was successful or not.",
			type: AbilityTypes.Roleblock,
			priority: Priorities.Roleblock,
			uses: AbilityUses.Unlimited,
			duration: Durations.DayAndNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.frame
			],
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
			description: "At night, consort another chosen player. They will be roleblocked that night and the following day. Players you consort will be notified they have been roleblocked. You will not be told if your roleblock was successful or not.",
			type: AbilityTypes.Investigative,
			priority: Priorities.Investigative,
			uses: AbilityUses.Unlimited,
			phases_can_use: [Phases.Night],
			effects: [
				perform.investigate
			],
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
			description: "At night, frame yourself. You'll be perceived as the Mafioso until you're investigated by a player and percieved as Mafioso.",
			type: AbilityTypes.Manipulation,
			priority: Priorities.Manipulation,
			uses: AbilityUses.Amount(1),
			duration: Durations.Indefinite,
			phases_can_use: [Phases.Night],
			effects: [
				perform.selfFrame
			]
		}),
		DeathCurse: new Ability({
			name: "Death Curse",
			description: "At night, after you've satisfied your win condition and been lynched and you haven't chosen another curse, curse a chosen player with death. They will be attacked by you.",
			type: AbilityTypes.Attacking,
			priority: Priorities.Attacking,
			uses: AbilityUses.Amount(1),
			duration: Durations.OneNight,
			phases_can_use: [Phases.Limbo],
			effects: [
				perform.attack
			],
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
			description: "At night, frame your target. They'll be perceived as the Mafioso until they're investigated by a player and percieved as Mafioso.",
			type: AbilityTypes.Manipulation,
			priority: Priorities.Manipulation,
			uses: AbilityUses.Amount(1),
			duration: Durations.Indefinite,
			phases_can_use: [Phases.Night],
			effects: [
				perform.frameTarget
			],
		}),
		SelfVest: new Ability({
			name: "Self Vest",
			description: "At night, put on a vest. You'll get a level two defense for the night and following day.",
			type: AbilityTypes.Protection,
			priority: Priorities.Protection,
			uses: AbilityUses.Amount(4),
			duration: Durations.DayAndNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.selfHeal
			],
		}),
		Knife: new Ability({
			name: "Knife",
			description: "At night, knife another chosen player. You'll attack them.",
			type: AbilityTypes.Attacking,
			priority: Priorities.Attacking,
			uses: AbilityUses.Unlimited,
			duration: Durations.OneNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.selfHeal
			],
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
			description: "At night, choose to be cautious. You won't attack anyone who roleblocks you.",
			type: AbilityTypes.Modifier,
			priority: Priorities.Modifier,
			uses: AbilityUses.Unlimited,
			duration: Durations.OneNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.cautious
			],
		}),
		Smith: new Ability({
			name: "Smith",
			description: "At night, smith a bulletproof vest for another chosen player. They will gain a defense level of one ○ at night and the next day. You and your target will be notified if they were saved from an attack by a Blacksmith.",
			type: AbilityTypes.Protection,
			priority: Priorities.Protection,
			uses: AbilityUses.Amount(3),
			duration: Durations.DayAndNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.cautious
			],
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
			description: "At night, smith a bulletproof vest for yourself. You'll gain a defense level of one ○ for the night and the next day.",
			type: AbilityTypes.Protection,
			priority: Priorities.Protection,
			uses: AbilityUses.Amount(1),
			duration: Durations.DayAndNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.selfSmith
			],
		}),
		Control: new Ability({
			name: "Control",
			description: "At night, control another chosen player to perform their ability on a player of your choice. You will learn their perceived role afterwards. (You'll perform the first ability on your target's role card for them and they'll know they're controlled. If they're unable to perform that ability or it requires special arguments, your ability will fail. If the ability requires no arguments, you'll still force them to perform it.)",
			type: AbilityTypes.Control,
			priority: Priorities.Control,
			uses: AbilityUses.Unlimited,
			duration: Durations.OneNight,
			phases_can_use: [Phases.Night],
			effects: [
				perform.control
			],
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
}

module.exports = Ability;