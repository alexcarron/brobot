const { Factions, Alignments, AbilityTypes, ArgumentTypes, ArgumentSubtypes, Immunities, AbilityUses, Priorities, Durations, WinConditions } = require("./enums.js");
const Role = require("./role.js");

const roles_obj = {
	"Townie": {
		"name": "Townie",
		faction: Factions.Town,
		alignment: Alignments.Crowd,
		"attack": 0,
		"defense": 0,
		goal: WinConditions.EliminateOtherFactions,
	},
	"Doctor": {
		"name": "Doctor",
		faction: Factions.Town,
		alignment: Alignments.Protective,
		"attack": 0,
		"defense": 0,
		goal: WinConditions.EliminateOtherFactions,
		"abilities": [
			{
				"name": "Heal",
				type: AbilityTypes.Protection,
				priority: Priorities.Protection,
				uses: AbilityUses.Unlimited,
				"description": "At night, heal another chosen player. They will receive a level two defense ○○ for the night and the following day. You and your target will be notified if your target was attacked that night or the following day.",
				"perform": "heal",
				duration: Durations.DayAndNight,
				"args": [
					{
						"name": "Player Healing",
						type: ArgumentTypes.Player,
						subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.Another],
					}
				]
			},
			{
				"name": "Self Heal",
				type: AbilityTypes.Protection,
				priority: Priorities.Protection,
				uses: AbilityUses.Amount(1),
				"description": "At night, heal yourself. You'll get a level two defense ○○ for the night and following day.",
				"perform": "selfHeal",
				duration: Durations.DayAndNight
			}
		]
	},
	"Sheriff": {
		"name": "Sheriff",
		faction: Factions.Town,
		alignment: Alignments.Investigative,
		"attack": 0,
		"defense": 0,
		goal: WinConditions.EliminateOtherFactions,
		"abilities": [
			{
				"name": "Evaluate",
				type: AbilityTypes.Investigative,
				priority: Priorities.Investigative,
				uses: AbilityUses.Unlimited,
				"description": "At night, evaluate another chosen player. You will be notified that they're suspicious if they are Mafia, Coven, a Neutral Killing. You'll be told they're innocent if their Town or a Neutral that's not a Neutral Killing. You'll be told it's unclear if they are doused by the Arsonist. Your results will be affected by the players' perceived role.",
				"perform": "evaluate",
				"args": [
					{
						"name": "Player Evaluating",
						type: ArgumentTypes.Player,
						subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.Another]
					}
				]
			}
		]
	},
	"Tracker": {
		"name": "Tracker",
		faction: Factions.Town,
		alignment: Alignments.Investigative,
		"attack": 0,
		"defense": 0,
		goal: WinConditions.EliminateOtherFactions,
		"abilities": [
			{
				"name": "Track",
				type: AbilityTypes.Investigative,
				priority: Priorities.Investigative,
				uses: AbilityUses.Unlimited,
				"description": "At night, track another chosen player. If they are percieved to be visiting another player, you'll be told who they visited.",
				"perform": "track",
				"args": [
					{
						"name": "Player Tracking",
						type: ArgumentTypes.Player,
						subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.Another]
					}
				]
			}
		]
	},
	"Escort": {
		"name": "Escort",
		faction: Factions.Town,
		alignment: Alignments.Support,
		immunities: [Immunities.Roleblock],
		"attack": 0,
		"defense": 0,
		goal: WinConditions.EliminateOtherFactions,
		"abilities": [
			{
				"name": "Escort",
				type: AbilityTypes.Roleblock,
				priority: Priorities.Roleblock,
				uses: AbilityUses.Unlimited,
				"description": "At night, escort another chosen player. They will be roleblocked that night and the following day. Players you escort will be notified they have been roleblocked. You will not be told if your roleblock was successful or not.",
				"perform": "roleblock",
				duration: Durations.DayAndNight,
				"args": [
					{
						"name": "Player Escorting",
						type: ArgumentTypes.Player,
						subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.Another]
					}
				]
			}
		]
	},
	"Vigilante": {
		"name": "Vigilante",
		faction: Factions.Town,
		alignment: Alignments.Killing,
		"attack": 1,
		"defense": 0,
		goal: WinConditions.EliminateOtherFactions,
		"abilities": [
			{
				"name": "Shoot",
				type: AbilityTypes.Attacking,
				priority: Priorities.Attacking,
				uses: AbilityUses.Amount(3),
				"description": "At night, shoot another chosen player. They will be attacked by you.",
				"perform": "attack",
				duration: Durations.OneNight,
				"args": [
					{
						"name": "Player Shooting",
						type: ArgumentTypes.Player,
						subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.Another]
					}
				]
			},
			{
				"name": "Suicide",
				type: AbilityTypes.Suicide,
				priority: Priorities.Suicide,
				uses: AbilityUses.None,
				"description": "At night, if you were responsible for killing a player that was actually town last night, you will attack yourself with an attack level of four ●●●● the next night.",
				duration: Durations.OneNight
			}
		]
	},

	"Godfather": {
		"name": "Godfather",
		faction: Factions.Mafia,
		alignment: Alignments.Killing,
		"isUnique": true,
		"attack": 1,
		"defense": 1,
		goal: WinConditions.EliminateOtherFactions,
		immunities: [Immunities.Control],
		"abilities": [
			{
				"name": "Order",
				type: AbilityTypes.Control,
				priority: Priorities.Control,
				uses: AbilityUses.Unlimited,
				"description": "At night, order the mafia to kill a chosen non-mafia player. That player will be the mafia's target. If the Mafioso doesn't exist, is dead, or is roleblocked, you will attack the mafia's target yourself instead.",
				"perform": "order",
				duration: Durations.OneNight,
				"args": [
					{
						"name": "Player Killing",
						type: ArgumentTypes.Player,
						subtypes: [ArgumentSubtypes.NonMafia]
					}
				]
			},
			{
				"name": "Promote",
				type: AbilityTypes.RoleChange,
				priority: Priorities.RoleChange,
				uses: AbilityUses.None,
				"description": "At night, if your existing mafioso died the previous night, you'll automatically have to promote a chosen mafia member to Mafioso. They will lose their original role and become a Mafioso.",
				duration: Durations.OneNight
			}
		]
	},
	"Mafioso": {
		"name": "Mafioso",
		faction: Factions.Mafia,
		alignment: Alignments.Killing,
		"isUnique": true,
		"attack": 1,
		"defense": 0,
		goal: WinConditions.EliminateOtherFactions,
		"abilities": [
			{
				"name": "Murder",
				type: AbilityTypes.Attacking,
				priority: Priorities.Attacking,
				uses: AbilityUses.Unlimited,
				"description": "At night, chose a non-mafia player to become the mafia's target. If the godfather ordered you to kill a different player, they'll become a target instead. You'll attack the mafia's target.",
				"perform": "attack",
				duration: Durations.OneNight,
				"args": [
					{
						"name": "Player Killing",
						type: ArgumentTypes.Player,
						subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NonMafia]
					}
				]
			},
			{
				"name": "Promote",
				type: AbilityTypes.RoleChange,
				priority: Priorities.RoleChange,
				uses: AbilityUses.None,
				"description": "At night, you'll automatically become promoted to Godfather if the existing one died. You'll lose your Mafioso role and become a Godfather.",
				duration: Durations.OneNight
			}
		]
	},
	"Framer": {
		"name": "Framer",
		faction: Factions.Mafia,
		alignment: Alignments.Deception,
		"attack": 0,
		"defense": 0,
		goal: WinConditions.EliminateOtherFactions,
		"abilities": [
			{
				"name": "Frame",
				type: AbilityTypes.Manipulation,
				priority: Priorities.Manipulation,
				uses: AbilityUses.Unlimited,
				"description": "At night, frame a chosen non-mafia player. They will be perceived as the Mafioso until they're investigated by a player and percieved as Mafioso.",
				"perform": "frame",
				duration: Durations.DayAndNight,
				"args": [
					{
						"name": "Player Framing",
						type: ArgumentTypes.Player,
						subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NonMafia]
					}
				]
			}
		]
	},
	"Consort": {
		"name": "Consort",
		faction: Factions.Mafia,
		alignment: Alignments.Support,
		immunities: [Immunities.Roleblock],
		"attack": 0,
		"defense": 0,
		goal: WinConditions.EliminateOtherFactions,
		"abilities": [
			{
				"name": "Consort",
				type: AbilityTypes.Roleblock,
				priority: Priorities.Roleblock,
				uses: AbilityUses.Unlimited,
				"description": "At night, consort another chosen player. They will be roleblocked that night and the following day. Players you consort will be notified they have been roleblocked. You will not be told if your roleblock was successful or not.",
				"perform": "roleblock",
				duration: Durations.DayAndNight,
				"args": [
					{
						"name": "Player Consorting",
						type: ArgumentTypes.Player,
						subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.Another]
					}
				]
			}
		]
	},
	"Consigliere": {
		"name": "Consigliere",
		faction: Factions.Mafia,
		alignment: Alignments.Support,
		"attack": 0,
		"defense": 0,
		goal: WinConditions.EliminateOtherFactions,
		"abilities": [
			{
				"name": "Investigate",
				type: AbilityTypes.Investigative,
				priority: Priorities.Investigative,
				uses: AbilityUses.Unlimited,
				"description": "At night, investigate a chosen player. You will learn their perceived role.",
				"perform": "investigate",
				"args": [
					{
						"name": "Player Investigating",
						type: ArgumentTypes.Player,
						subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NonMafia]
					}
				]
			}
		]
	},

	"Fool": {
		"name": "Fool",
		faction: Factions.Neutral,
		alignment: Alignments.Evil,
		"attack": 4,
		"defense": 0,
		goal: WinConditions.Fool,
		"abilities": [
			{
				"name": "Self Frame",
				type: AbilityTypes.Manipulation,
				priority: Priorities.Manipulation,
				uses: AbilityUses.Amount(1),
				"description": "At night, frame yourself. You'll be perceived as the Mafioso until you're investigated by a player and percieved as Mafioso.",
				"perform": "selfFrame",
				duration: Durations.Indefinite
			},
			{
				"name": "Silence Curse",
				type: AbilityTypes.Muting,
				priority: Priorities.Muting,
				uses: AbilityUses.Amount(1),
				"description": "At night, after you've satisfied your win condition and been lynched and you haven't chosen another curse, curse the town with silence. On the day after, the voting and trial phases will be skipped.",
				"perform": "silenceCurse",
				duration: Durations.DayAndNight,
				"isLimboOnly": true
			},
			{
				"name": "Death Curse",
				type: AbilityTypes.Attacking,
				priority: Priorities.Attacking,
				uses: AbilityUses.Amount(1),
				"description": "At night, after you've satisfied your win condition and been lynched and you haven't chosen another curse, curse a chosen player with death. They will be attacked by you.",
				"perform": "attack",
				duration: Durations.OneNight,
				"isLimboOnly": true,
				"args": [
					{
						"name": "Player Killing",
						type: ArgumentTypes.Player,
						subtypes: [ArgumentSubtypes.Visiting]
					}
				]
			}
		],
		"notes": "If you were lynched after 2nd day, you can only do one of the three curses at any time you want.\nIf you were lynched on the 2nd day, you can do two curses. (They can be the same or different ones and happen on the same or different nights)"
	},
	"Executioner": {
		"name": "Executioner",
		faction: Factions.Neutral,
		alignment: Alignments.Evil,
		"attack": 0,
		"defense": 1,
		goal: WinConditions.Executioner,
		"abilities": [
			{
				"name": "Frame Target",
				type: AbilityTypes.Manipulation,
				priority: Priorities.Manipulation,
				uses: AbilityUses.Amount(1),
				"description": "At night, frame your target. They'll be perceived as the Mafioso until they're investigated by a player and percieved as Mafioso.",
				"perform": "frameTarget",
				duration: Durations.Indefinite,
			}
		],
		"notes": "At the beginning of the game, you will be given a target (a player with a town role). You need to try and get them lynched before the end of the game. If your target dies before then, you'll become a Fool and no longer be an Executioner."
	},
	"Survivor": {
		"name": "Survivor",
		faction: Factions.Neutral,
		alignment: Alignments.Benign,
		"attack": 0,
		"defense": 0,
		goal: WinConditions.Survive,
		"abilities": [
			{
				"name": "Self Vest",
				type: AbilityTypes.Protection,
				priority: Priorities.Protection,
				uses: AbilityUses.Amount(4),
				"description": "At night, put on a vest. You'll get a level two defense ○○ for the night and following day.",
				"perform": "selfHeal",
				duration: Durations.DayAndNight
			}
		]
	},
	"Serial Killer": {
		"name": "Serial Killer",
		faction: Factions.Neutral,
		alignment: Alignments.Killing,
		immunities: [Immunities.Roleblock],
		"attack": 1,
		"defense": 1,
		goal: WinConditions.SurviveEliminateOtherFactions,
		"abilities": [
			{
				"name": "Knife",
				type: AbilityTypes.Attacking,
				priority: Priorities.Attacking,
				uses: AbilityUses.Unlimited,
				"description": "At night, knife another chosen player. You'll attack them.",
				"perform": "attack",
				duration: Durations.OneNight,
				"args": [
					{
						"name": "Player Knifing",
						type: ArgumentTypes.Player,
						subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.Another]
					}
				]
			},
			{
				"name": "Cautious",
				type: AbilityTypes.Modifier,
				priority: Priorities.Modifier,
				uses: AbilityUses.Unlimited,
				"description": "At night, choose to be cautious. You won't attack anyone who roleblocks you.",
				"perform": "cautious",
				duration: Durations.OneNight
			}
		],
		"notes": "You'll automatically attack anybody who roleblocked you instead of your original target."
	},
	"Blacksmith": {
		name: "Blacksmith",
		faction: Factions.Neutral,
		alignment: Alignments.Benign,
		attack: 0,
		defense: 0,
		goal: WinConditions.Blacksmith,
		abilities: [
			{
				name: "Smith",
				type: AbilityTypes.Protection,
				priority: Priorities.Protection,
				uses: AbilityUses.Amount(3),
				duration: 1,
				description: "At night, smith a bulletproof vest for another chosen player. They will gain a defense level of one ○ at night and the next day. You and your target will be notified if they were saved from an attack by a Blacksmith.",
				args: [
					{
						name: "Player Smithing For",
						type: ArgumentTypes.Player,
						subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.Another],
					}
				],
				perform: "smith",
			},
			{
				name: "Self Smith",
				type: AbilityTypes.Protection,
				priority: Priorities.Protection,
				uses: AbilityUses.Amount(1),
				duration: 1,
				description: "At night, smith a bulletproof vest for yourself. You'll gain a defense level of one ○ for the night and the next day.",
				perform: "selfSmith",
			},
		],
	},
	"Witch": {
		name: "Witch",
		faction: Factions.Neutral,
		alignment: Alignments.Evil,
		attack: 0,
		defense: 0,
		goal: WinConditions.
		SurviveTownLose,
		immunities: [Immunities.Roleblock, Immunities.Control],
		abilities: [
			{
				name: "Control",
				type: AbilityTypes.Control,
				priority: Priorities.Control,
				uses: AbilityUses.Unlimited,
				duration: Durations.OneNight,
				description: "At night, control another chosen player to perform their ability on a player of your choice. You will learn their perceived role afterwards. (You'll perform the first ability on your target's role card for them and they'll know they're controlled. If they're unable to perform that ability or it requires special arguments, your ability will fail. If the ability requires no arguments, you'll still force them to perform it.)",
				perform: "control",
				args: [
					{
						name: "Player Controlling",
						type: ArgumentTypes.Player,
						subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.Another],
					},
					{
						name: "Player Target Is Controlled Into",
						type: ArgumentTypes.Player,
						subtypes: [],
					},
				],
			},
		],
	}
}

class Roles {
	constructor(roles_obj) {
		for (let role_name in roles_obj) {
			let role = roles_obj[role_name];
			this[role_name] = new Role(role);
		}
	}

	getRole(role_name) {
		return this[role_name];
	}
}

let roles = new Roles(roles_obj);

module.exports = roles;
