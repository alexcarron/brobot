const { Factions, Alignments, Immunities, WinConditions, RoleNames } = require("../enums.js");
const { Abilities } = require("./ability.js");
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
	"Tracker": new Role({
		name: "Tracker",
		faction: Factions.Town,
		alignment: Alignments.Investigative,
		attack: 0,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
		abilities: [
			Abilities.Track,
		]
	}),
	"Escort": new Role({
		name: "Escort",
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
	"Vigilante": new Role({
		name: "Vigilante",
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
	"Framer": new Role({
		name: "Framer",
		faction: Factions.Mafia,
		alignment: Alignments.Deception,
		attack: 0,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
		abilities: [
			Abilities.Frame,
		]
	}),
	"Consort": new Role({
		name: "Consort",
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
	"Consigliere": new Role({
		name: "Consigliere",
		faction: Factions.Mafia,
		alignment: Alignments.Support,
		attack: 0,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
		abilities: [
			Abilities.Investigate,
		]
	}),
	"Fool": new Role({
		name: "Fool",
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
	"Serial Killer": new Role({
		name: "Serial Killer",
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
	"Blacksmith": new Role({
		name: "Blacksmith",
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
	[RoleNames.Stranger]: new Role({
		name: RoleNames.Stranger,
		faction: Factions.Neutral,
		alignment: Alignments.Chaos,
		attack: 2,
		defense: 0,
		goal: WinConditions.Stranger,
		abilities: [
			Abilities.Replace
		],
	}),
}

module.exports = roles;
