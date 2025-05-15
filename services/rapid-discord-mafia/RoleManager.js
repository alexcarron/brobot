const { Alignments, Immunities, RoleNames } = require("../../modules/enums.js");
const { abilities, AbilityName } = require("./AbilityManager.js");
const {Role, Goal, Faction} = require("./Role.js");

class RoleManager {
	constructor() {}

	static roles = {
		[RoleNames.Townie]: new Role({
			name: RoleNames.Townie,
			faction: Faction.TOWN,
			alignment: Alignments.Crowd,
			attack: 0,
			defense: 0,
			goal: Goal.ELIMINATE_OTHER_FACTIONS,
		}),
		[RoleNames.Doctor]: new Role({
			name: RoleNames.Doctor,
			faction: Faction.TOWN,
			alignment: Alignments.Protective,
			attack: 0,
			defense: 0,
			goal: Goal.ELIMINATE_OTHER_FACTIONS,
			abilities: [
				abilities[AbilityName.Heal],
				abilities[AbilityName.HealSelf],
			]
		}),
		[RoleNames.Sheriff]: new Role({
			name: RoleNames.Sheriff,
			faction: Faction.TOWN,
			alignment: Alignments.Investigative,
			attack: 0,
			defense: 0,
			goal: Goal.ELIMINATE_OTHER_FACTIONS,
			abilities: [
				abilities[AbilityName.Evaluate],
			]
		}),
		[RoleNames.Tracker]: new Role({
			name: RoleNames.Tracker,
			faction: Faction.TOWN,
			alignment: Alignments.Investigative,
			attack: 0,
			defense: 0,
			goal: Goal.ELIMINATE_OTHER_FACTIONS,
			abilities: [
				abilities[AbilityName.Track],
			]
		}),
		[RoleNames.Lookout]: new Role({
			name: RoleNames.Lookout,
			faction: Faction.TOWN,
			alignment: Alignments.Investigative,
			attack: 0,
			defense: 0,
			goal: Goal.ELIMINATE_OTHER_FACTIONS,
			abilities: [
				abilities[AbilityName.Lookout],
			]
		}),
		[RoleNames.Escort]: new Role({
			name: RoleNames.Escort,
			faction: Faction.TOWN,
			alignment: Alignments.Support,
			immunities: [Immunities.Roleblock],
			attack: 0,
			defense: 0,
			goal: Goal.ELIMINATE_OTHER_FACTIONS,
			abilities: [
				abilities[AbilityName.Roleblock],
			]
		}),
		[RoleNames.Vigilante]: new Role({
			name: RoleNames.Vigilante,
			faction: Faction.TOWN,
			alignment: Alignments.Killing,
			attack: 1,
			defense: 0,
			goal: Goal.ELIMINATE_OTHER_FACTIONS,
			abilities: [
				abilities[AbilityName.Shoot],
			],
			notes: "If you shoot a town player, you will shoot yourself the next night with an attack level of four."
		}),

		// [RoleNames.Godfather]: new Role({
		// 	name: RoleNames.Godfather,
		// 	faction: Factions.Mafia,
		// 	alignment: Alignments.Killing,
		// 	isUnique: true,
		// 	attack: 1,
		// 	defense: 1,
		// 	goal: WinConditions.EliminateOtherFactions,
		// 	immunities: [Immunities.Control],
		// 	abilities: [
		// 		abilities[AbilityName.Order,
		// 	],
		// }),

		[RoleNames.Mafioso]: new Role({
			name: RoleNames.Mafioso,
			faction: Faction.MAFIA,
			alignment: Alignments.Killing,
			isUnique: true,
			attack: 1,
			defense: 0,
			goal: Goal.ELIMINATE_OTHER_FACTIONS,
			abilities: [
				abilities[AbilityName.Murder],
			],
			notes: "If you are not alive, a random mafia member will be converted to the Mafioso and take your place."
		}),
		[RoleNames.Framer]: new Role({
			name: RoleNames.Framer,
			faction: Faction.MAFIA,
			alignment: Alignments.Deception,
			attack: 0,
			defense: 0,
			goal: Goal.ELIMINATE_OTHER_FACTIONS,
			abilities: [
				abilities[AbilityName.Frame],
			]
		}),
		[RoleNames.Consort]: new Role({
			name: RoleNames.Consort,
			faction: Faction.MAFIA,
			alignment: Alignments.Support,
			immunities: [Immunities.Roleblock],
			attack: 0,
			defense: 0,
			goal: Goal.ELIMINATE_OTHER_FACTIONS,
			abilities: [
				abilities[AbilityName.Consort],
			]
		}),
		[RoleNames.Consigliere]: new Role({
			name: RoleNames.Consigliere,
			faction: Faction.MAFIA,
			alignment: Alignments.Support,
			attack: 0,
			defense: 0,
			goal: Goal.ELIMINATE_OTHER_FACTIONS,
			abilities: [
				abilities[AbilityName.Investigate],
			]
		}),
		[RoleNames.Kidnapper]: new Role({
			name: RoleNames.Kidnapper,
			faction: Faction.MAFIA,
			alignment: Alignments.Support,
			attack: 0,
			defense: 0,
			goal: Goal.ELIMINATE_OTHER_FACTIONS,
			abilities: [
				abilities[AbilityName.Kidnap],
			]
		}),
		[RoleNames.Fool]: new Role({
			name: RoleNames.Fool,
			faction: Faction.NEUTRAL,
			alignment: Alignments.Evil,
			attack: 4,
			defense: 0,
			goal: Goal.BE_LYNCHED,
			abilities: [
				abilities[AbilityName.SelfFrame],
				abilities[AbilityName.DeathCurse],
			],
		}),
		[RoleNames.Executioner]: new Role({
			name: RoleNames.Executioner,
			faction: Faction.NEUTRAL,
			alignment: Alignments.Evil,
			attack: 0,
			defense: 1,
			goal: Goal.GET_TARGET_LYNCHED,
			abilities: [
				abilities[AbilityName.FrameTarget],
			],
			"notes": "At the beginning of the game, you will be given a town player target that you must try to get lynched before the end of the game. If your target dies before then, you'll become a Fool."
		}),
		[RoleNames.Survivor]: new Role({
			name: RoleNames.Survivor,
			faction: Faction.NEUTRAL,
			alignment: Alignments.Benign,
			attack: 0,
			defense: 0,
			goal: Goal.SURVIVE,
			abilities: [
				abilities[AbilityName.SelfVest],
			]
		}),
		[RoleNames.SerialKiller]: new Role({
			name: RoleNames.SerialKiller,
			faction: Faction.NEUTRAL,
			alignment: Alignments.Killing,
			immunities: [Immunities.Roleblock],
		attack: 1,
			defense: 1,
			goal: Goal.SURVIVE_ELIMINATED_OTHER_FACTIONS,
			abilities: [
				abilities[AbilityName.Knife],
				abilities[AbilityName.Cautious],
			],
			"notes": "You'll automatically attack anybody who roleblocks you instead of your original target."
		}),
		[RoleNames.Blacksmith]: new Role({
			name: RoleNames.Blacksmith,
			faction: Faction.NEUTRAL,
			alignment: Alignments.Benign,
			attack: 0,
			defense: 0,
			goal: Goal.SAVE_PLAYER_WITH_VEST,
			abilities: [
				abilities[AbilityName.Smith],
				abilities[AbilityName.SelfSmith],
			],
		}),
		[RoleNames.Witch]: new Role({
			name: RoleNames.Witch,
			faction: Faction.NEUTRAL,
			alignment: Alignments.Evil,
			attack: 0,
			defense: 0,
			goal: Goal.SURVIVE_UNTIL_TOWN_LOSES,
			immunities: [Immunities.Roleblock, Immunities.Control],
			abilities: [
				abilities[AbilityName.Control],
			],
		}),
		[RoleNames.Oracle]: new Role({
			name: RoleNames.Oracle,
			faction: Faction.TOWN,
			alignment: Alignments.Investigative,
			attack: 0,
			defense: 0,
			goal: Goal.ELIMINATE_OTHER_FACTIONS,
			abilities: [
				abilities[AbilityName.Observe],
			],
		}),
		[RoleNames.Impersonator]: new Role({
			name: RoleNames.Impersonator,
			faction: Faction.NEUTRAL,
			alignment: Alignments.Chaos,
			attack: 2,
			defense: 0,
			goal: Goal.DO_GOAL_OF_REPLACED_PLAYER,
			abilities: [
				abilities[AbilityName.Replace],
			],
		}),
	}

	/**
	 * Get a role from a role name
	 * @param {string} role_name
	 * @returns {Role | undefined} role if role name exists, otherwise undefined
	 */
	getRole(role_name) {
		return RoleManager.roles[role_name];
	}

	/**
	 * @returns {Role[]} An array of all roles that exist
	 */
	getListOfRoles() {
		return Object.values(RoleManager.roles);
	}

	/**
	 * @returns {Role[]} An array of all roles that exist
	 */
	static getListOfRoles() {
		return Object.values(RoleManager.roles);
	}

	/**
	 * @returns {string[]} An array of the names of all roles that exist
	 */
	getListOfRoleNames() {
		return Object.keys(RoleManager.roles)
	}


	static getPossibleFactions() {
		return [
			Faction.MAFIA,
			Faction.TOWN,
			...RoleManager.getListOfRoles()
				.filter((role) => `${role.faction} ${role.alignment}` === `${Faction.NEUTRAL} ${Alignments.Killing}`)
				.map((role) => role.name)
		];
	}

	/**
	 * Determines if a role is in one of the possible factions
	 * @param {Role} role
	 * @returns {boolean}
	 */
	static isRoleInPossibleFaction(role) {
		return RoleManager.getPossibleFactions().some(faction =>
			RoleManager.isRoleInFaction(role, faction)
		)
	}

	/**
	 * @returns {string[]} An array of the names of all factions.
	 */
	static getListOfFactions() {
		return Object.values(Faction);
	}

	/**
	 * Determines if a role is apart of a faction
	 * @param {Role} role
	 * @param {string} faction The name of the faction.
	 * @returns {boolean}
	 */
	static isRoleInFaction(role, faction) {
		if (RoleManager.getListOfFactions().includes(faction))
			return role.faction === faction;
		else
			return role.name === faction;
	}
}

// const roles = {
// 	[RoleNames.Townie]: new Role({
// 		name: RoleNames.Townie,
// 		faction: Factions.Town,
// 		alignment: Alignments.Crowd,
// 		attack: 0,
// 		defense: 0,
// 		goal: WinConditions.EliminateOtherFactions,
// 	}),
// 	[RoleNames.Doctor]: new Role({
// 		name: RoleNames.Doctor,
// 		faction: Factions.Town,
// 		alignment: Alignments.Protective,
// 		attack: 0,
// 		defense: 0,
// 		goal: WinConditions.EliminateOtherFactions,
// 		abilities: [
// 			abilities[AbilityName.Heal],
// 			abilities[AbilityName.HealSelf],
// 		]
// 	}),
// 	[RoleNames.Sheriff]: new Role({
// 		name: RoleNames.Sheriff,
// 		faction: Factions.Town,
// 		alignment: Alignments.Investigative,
// 		attack: 0,
// 		defense: 0,
// 		goal: WinConditions.EliminateOtherFactions,
// 		abilities: [
// 			abilities[AbilityName.Evaluate],
// 		]
// 	}),
// 	[RoleNames.Tracker]: new Role({
// 		name: RoleNames.Tracker,
// 		faction: Factions.Town,
// 		alignment: Alignments.Investigative,
// 		attack: 0,
// 		defense: 0,
// 		goal: WinConditions.EliminateOtherFactions,
// 		abilities: [
// 			abilities[AbilityName.Track],
// 		]
// 	}),
// 	[RoleNames.Lookout]: new Role({
// 		name: RoleNames.Lookout,
// 		faction: Factions.Town,
// 		alignment: Alignments.Investigative,
// 		attack: 0,
// 		defense: 0,
// 		goal: WinConditions.EliminateOtherFactions,
// 		abilities: [
// 			abilities[AbilityName.Lookout],
// 		]
// 	}),
// 	[RoleNames.Escort]: new Role({
// 		name: RoleNames.Escort,
// 		faction: Factions.Town,
// 		alignment: Alignments.Support,
// 		immunities: [Immunities.Roleblock],
// 		attack: 0,
// 		defense: 0,
// 		goal: WinConditions.EliminateOtherFactions,
// 		abilities: [
// 			abilities[AbilityName.Roleblock],
// 		]
// 	}),
// 	[RoleNames.Vigilante]: new Role({
// 		name: RoleNames.Vigilante,
// 		faction: Factions.Town,
// 		alignment: Alignments.Killing,
// 		attack: 1,
// 		defense: 0,
// 		goal: WinConditions.EliminateOtherFactions,
// 		abilities: [
// 			abilities[AbilityName.Shoot],
// 		],
// 		notes: "If you shoot a town player, you will shoot yourself the next night with an attack level of four."
// 	}),

// 	// [RoleNames.Godfather]: new Role({
// 	// 	name: RoleNames.Godfather,
// 	// 	faction: Factions.Mafia,
// 	// 	alignment: Alignments.Killing,
// 	// 	isUnique: true,
// 	// 	attack: 1,
// 	// 	defense: 1,
// 	// 	goal: WinConditions.EliminateOtherFactions,
// 	// 	immunities: [Immunities.Control],
// 	// 	abilities: [
// 	// 		abilities[AbilityName.Order,
// 	// 	],
// 	// }),

// 	[RoleNames.Mafioso]: new Role({
// 		name: RoleNames.Mafioso,
// 		faction: Factions.Mafia,
// 		alignment: Alignments.Killing,
// 		isUnique: true,
// 		attack: 1,
// 		defense: 0,
// 		goal: WinConditions.EliminateOtherFactions,
// 		abilities: [
// 			abilities[AbilityName.Murder],
// 		],
// 		notes: "If you are not alive, a random mafia member will be converted to the Mafioso and take your place."
// 	}),
// 	[RoleNames.Framer]: new Role({
// 		name: RoleNames.Framer,
// 		faction: Factions.Mafia,
// 		alignment: Alignments.Deception,
// 		attack: 0,
// 		defense: 0,
// 		goal: WinConditions.EliminateOtherFactions,
// 		abilities: [
// 			abilities[AbilityName.Frame],
// 		]
// 	}),
// 	[RoleNames.Consort]: new Role({
// 		name: RoleNames.Consort,
// 		faction: Factions.Mafia,
// 		alignment: Alignments.Support,
// 		immunities: [Immunities.Roleblock],
// 		attack: 0,
// 		defense: 0,
// 		goal: WinConditions.EliminateOtherFactions,
// 		abilities: [
// 			abilities[AbilityName.Consort],
// 		]
// 	}),
// 	[RoleNames.Consigliere]: new Role({
// 		name: RoleNames.Consigliere,
// 		faction: Factions.Mafia,
// 		alignment: Alignments.Support,
// 		attack: 0,
// 		defense: 0,
// 		goal: WinConditions.EliminateOtherFactions,
// 		abilities: [
// 			abilities[AbilityName.Investigate],
// 		]
// 	}),
// 	[RoleNames.Kidnapper]: new Role({
// 		name: RoleNames.Kidnapper,
// 		faction: Factions.Mafia,
// 		alignment: Alignments.Support,
// 		attack: 0,
// 		defense: 0,
// 		goal: WinConditions.EliminateOtherFactions,
// 		abilities: [
// 			abilities[AbilityName.Kidnap],
// 		]
// 	}),
// 	[RoleNames.Fool]: new Role({
// 		name: RoleNames.Fool,
// 		faction: Factions.Neutral,
// 		alignment: Alignments.Evil,
// 		attack: 4,
// 		defense: 0,
// 		goal: WinConditions.Fool,
// 		abilities: [
// 			abilities[AbilityName.SelfFrame],
// 			abilities[AbilityName.DeathCurse],
// 		],
// 	}),
// 	[RoleNames.Executioner]: new Role({
// 		name: RoleNames.Executioner,
// 		faction: Factions.Neutral,
// 		alignment: Alignments.Evil,
// 		attack: 0,
// 		defense: 1,
// 		goal: WinConditions.Executioner,
// 		abilities: [
// 			abilities[AbilityName.FrameTarget],
// 		],
// 		"notes": "At the beginning of the game, you will be given a town player target that you must try to get lynched before the end of the game. If your target dies before then, you'll become a Fool."
// 	}),
// 	[RoleNames.Survivor]: new Role({
// 		name: RoleNames.Survivor,
// 		faction: Factions.Neutral,
// 		alignment: Alignments.Benign,
// 		attack: 0,
// 		defense: 0,
// 		goal: WinConditions.Survive,
// 		abilities: [
// 			abilities[AbilityName.SelfVest],
// 		]
// 	}),
// 	[RoleNames.SerialKiller]: new Role({
// 		name: RoleNames.SerialKiller,
// 		faction: Factions.Neutral,
// 		alignment: Alignments.Killing,
// 		immunities: [Immunities.Roleblock],
// 	attack: 1,
// 		defense: 1,
// 		goal: WinConditions.SurviveEliminateOtherFactions,
// 		abilities: [
// 			abilities[AbilityName.Knife],
// 			abilities[AbilityName.Cautious],
// 		],
// 		"notes": "You'll automatically attack anybody who roleblocks you instead of your original target."
// 	}),
// 	[RoleNames.Blacksmith]: new Role({
// 		name: RoleNames.Blacksmith,
// 		faction: Factions.Neutral,
// 		alignment: Alignments.Benign,
// 		attack: 0,
// 		defense: 0,
// 		goal: WinConditions.Blacksmith,
// 		abilities: [
// 			abilities[AbilityName.Smith],
// 			abilities[AbilityName.SelfSmith],
// 		],
// 	}),
// 	[RoleNames.Witch]: new Role({
// 		name: RoleNames.Witch,
// 		faction: Factions.Neutral,
// 		alignment: Alignments.Evil,
// 		attack: 0,
// 		defense: 0,
// 		goal: WinConditions.SurviveTownLose,
// 		immunities: [Immunities.Roleblock, Immunities.Control],
// 		abilities: [
// 			abilities[AbilityName.Control],
// 		],
// 	}),
// 	[RoleNames.Oracle]: new Role({
// 		name: RoleNames.Oracle,
// 		faction: Factions.Town,
// 		alignment: Alignments.Investigative,
// 		attack: 0,
// 		defense: 0,
// 		goal: WinConditions.EliminateOtherFactions,
// 		abilities: [
// 			abilities[AbilityName.Observe],
// 		],
// 	}),
// 	[RoleNames.Impersonator]: new Role({
// 		name: RoleNames.Impersonator,
// 		faction: Factions.Neutral,
// 		alignment: Alignments.Chaos,
// 		attack: 2,
// 		defense: 0,
// 		goal: WinConditions.Impersonator,
// 		abilities: [
// 			abilities[AbilityName.Replace],
// 		],
// 	}),
// }

module.exports = RoleManager;
