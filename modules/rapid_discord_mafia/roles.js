const { Factions, Alignments, Immunities, WinConditions, RoleNames, AbilityUses } = require("../enums.js");
const { Abilities } = require("./Ability.js");
const Role = require("./role.js");

const roles = {
	[RoleNames.Townie]: new Role({
		name: RoleNames.Townie,
		faction: Factions.Town,
		alignment: Alignments.Crowd,
		attack: 0,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
	}),
	[RoleNames.Doctor]: new Role({
		name: RoleNames.Doctor,
		faction: Factions.Town,
		alignment: Alignments.Protective,
		attack: 0,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
		abilities: [
			Abilities.Heal,
			Abilities.HealSelf,
		]
	}),
	[RoleNames.Sheriff]: new Role({
		name: RoleNames.Sheriff,
		faction: Factions.Town,
		alignment: Alignments.Investigative,
		attack: 0,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
		abilities: [
			Abilities.Evaluate,
		]
	}),
	[RoleNames.Tracker]: new Role({
		name: RoleNames.Tracker,
		faction: Factions.Town,
		alignment: Alignments.Investigative,
		attack: 0,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
		abilities: [
			Abilities.Track,
		]
	}),
	[RoleNames.Lookout]: new Role({
		name: RoleNames.Lookout,
		faction: Factions.Town,
		alignment: Alignments.Investigative,
		attack: 0,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
		abilities: [
			Abilities.Lookout,
		]
	}),
	[RoleNames.Escort]: new Role({
		name: RoleNames.Escort,
		faction: Factions.Town,
		alignment: Alignments.Support,
		immunities: [Immunities.Roleblock],
		attack: 0,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
		abilities: [
			Abilities.Roleblock,
		]
	}),
	[RoleNames.Vigilante]: new Role({
		name: RoleNames.Vigilante,
		faction: Factions.Town,
		alignment: Alignments.Killing,
		attack: 1,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
		abilities: [
			Abilities.Shoot,
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
	// 		Abilities.Order,
	// 	],
	// }),
	[RoleNames.Mafioso]: new Role({
		name: RoleNames.Mafioso,
		faction: Factions.Mafia,
		alignment: Alignments.Killing,
		isUnique: true,
		attack: 1,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
		abilities: [
			Abilities.Murder,
		],
		notes: "If you are not alive, a random mafia member will be converted to the Mafioso and take your place."
	}),
	[RoleNames.Framer]: new Role({
		name: RoleNames.Framer,
		faction: Factions.Mafia,
		alignment: Alignments.Deception,
		attack: 0,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
		abilities: [
			Abilities.Frame,
		]
	}),
	[RoleNames.Consort]: new Role({
		name: RoleNames.Consort,
		faction: Factions.Mafia,
		alignment: Alignments.Support,
		immunities: [Immunities.Roleblock],
		attack: 0,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
		abilities: [
			Abilities.Consort,
		]
	}),
	[RoleNames.Consigliere]: new Role({
		name: RoleNames.Consigliere,
		faction: Factions.Mafia,
		alignment: Alignments.Support,
		attack: 0,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
		abilities: [
			Abilities.Investigate,
		]
	}),
	[RoleNames.Kidnapper]: new Role({
		name: RoleNames.Kidnapper,
		faction: Factions.Mafia,
		alignment: Alignments.Support,
		attack: 0,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
		abilities: [
			Abilities.Kidnap,
		]
	}),
	[RoleNames.Fool]: new Role({
		name: RoleNames.Fool,
		faction: Factions.Neutral,
		alignment: Alignments.Evil,
		attack: 4,
		defense: 0,
		goal: WinConditions.Fool,
		abilities: [
			Abilities.SelfFrame,
			Abilities.DeathCurse,
		],
	}),
	[RoleNames.Executioner]: new Role({
		name: RoleNames.Executioner,
		faction: Factions.Neutral,
		alignment: Alignments.Evil,
		attack: 0,
		defense: 1,
		goal: WinConditions.Executioner,
		abilities: [
			Abilities.FrameTarget,
		],
		"notes": "At the beginning of the game, you will be given a town player target that you must try to get lynched before the end of the game. If your target dies before then, you'll become a Fool."
	}),
	[RoleNames.Survivor]: new Role({
		name: RoleNames.Survivor,
		faction: Factions.Neutral,
		alignment: Alignments.Benign,
		attack: 0,
		defense: 0,
		goal: WinConditions.Survive,
		abilities: [
			Abilities.SelfVest,
		]
	}),
	[RoleNames.SerialKiller]: new Role({
		name: RoleNames.SerialKiller,
		faction: Factions.Neutral,
		alignment: Alignments.Killing,
		immunities: [Immunities.Roleblock],
	attack: 1,
		defense: 1,
		goal: WinConditions.SurviveEliminateOtherFactions,
		abilities: [
			Abilities.Knife,
			Abilities.Cautious,
		],
		"notes": "You'll automatically attack anybody who roleblocks you instead of your original target."
	}),
	[RoleNames.Blacksmith]: new Role({
		name: RoleNames.Blacksmith,
		faction: Factions.Neutral,
		alignment: Alignments.Benign,
		attack: 0,
		defense: 0,
		goal: WinConditions.Blacksmith,
		abilities: [
			Abilities.Smith,
			Abilities.SelfSmith,
		],
	}),
	[RoleNames.Witch]: new Role({
		name: RoleNames.Witch,
		faction: Factions.Neutral,
		alignment: Alignments.Evil,
		attack: 0,
		defense: 0,
		goal: WinConditions.SurviveTownLose,
		immunities: [Immunities.Roleblock, Immunities.Control],
		abilities: [
			Abilities.Control,
		],
	}),
	[RoleNames.Oracle]: new Role({
		name: RoleNames.Oracle,
		faction: Factions.Town,
		alignment: Alignments.Investigative,
		attack: 0,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
		abilities: [
			Abilities.Observe
		],
	}),
	[RoleNames.Impersonator]: new Role({
		name: RoleNames.Impersonator,
		faction: Factions.Neutral,
		alignment: Alignments.Chaos,
		attack: 2,
		defense: 0,
		goal: WinConditions.Impersonator,
		abilities: [
			Abilities.Replace
		],
	}),
}

module.exports = roles;
