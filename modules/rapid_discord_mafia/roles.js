const { Factions, Alignments, AbilityTypes, ArgumentTypes, ArgumentSubtypes, Immunities, AbilityUses, Priorities, Durations, WinConditions } = require("../enums.js");
const { Abilities } = require("./ability.js");
const Role = require("./role.js");

const roles = {
	"Townie": new Role({
		name: "Townie",
		faction: Factions.Town,
		alignment: Alignments.Crowd,
		attack: 0,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
	}),
	"Doctor": new Role({
		name: "Doctor",
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
	"Sheriff": new Role({
		name: "Sheriff",
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
			Abilities.Escort,
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
		notes: "At night, if you were responsible for killing a player that was actually town last night, you will attack yourself with an attack level of four the next night."
	}),

	"Godfather": new Role({
		name: "Godfather",
		faction: Factions.Mafia,
		alignment: Alignments.Killing,
		isUnique: true,
		attack: 1,
		defense: 1,
		goal: WinConditions.EliminateOtherFactions,
		immunities: [Immunities.Control],
		abilities: [
			Abilities.Order,
		],
		notes: "At night, if your existing mafioso died the previous night, you'll automatically have to promote a chosen mafia member to Mafioso. They will lose their original role and become a Mafioso."
	}),
	"Mafioso": new Role({
		name: "Mafioso",
		faction: Factions.Mafia,
		alignment: Alignments.Killing,
		isUnique: true,
		attack: 1,
		defense: 0,
		goal: WinConditions.EliminateOtherFactions,
		abilities: [
			Abilities.Murder,
		],
		notes: "At night, you'll automatically become promoted to Godfather if the existing one died. You'll lose your Mafioso role and become a Godfather."
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
		"notes": "If you were lynched after 2nd day, you can only do one of the three curses at any time you want.\nIf you were lynched on the 2nd day, you can do two curses. (They can be the same or different ones and happen on the same or different nights)"
	}),
	"Executioner": new Role({
		name: "Executioner",
		faction: Factions.Neutral,
		alignment: Alignments.Evil,
		attack: 0,
		defense: 1,
		goal: WinConditions.Executioner,
		abilities: [
			Abilities.FrameTarget,
		],
		"notes": "At the beginning of the game, you will be given a target (a player with a town role). You need to try and get them lynched before the end of the game. If your target dies before then, you'll become a Fool and no longer be an Executioner."
	}),
	"Survivor": new Role({
		name: "Survivor",
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
		"notes": "You'll automatically attack anybody who roleblocked you instead of your original target."
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
	"Witch": new Role({
		name: "Witch",
		faction: Factions.Neutral,
		alignment: Alignments.Evil,
		attack: 0,
		defense: 0,
		goal: WinConditions.
		SurviveTownLose,
		immunities: [Immunities.Roleblock, Immunities.Control],
		abilities: [
			Abilities.Control,
		],
	})
}

module.exports = roles;
