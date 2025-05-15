
const Enums = {
	DatabaseURLs: {
		Viewers: "https://raw.githubusercontent.com/alexcarron/brobot-database/main/viewers.json",
		Messages: "https://raw.githubusercontent.com/alexcarron/brobot-database/main/messages.json",
	},

	MessageDelays: {
		Short: 1,
		Normal: 4,
		Long: 8
	},

	PhaseWaitTimes: {
		FirstDay: 2,
		Night: 5,
		SignUps: 15,
		Voting: 7,
		Trial: 5
	},

	MaxFactionMembersRatios: {
		MafiaToTown: 2/3,
		TownToMafia: 5
	},

	RDMRoles: {
		Living: "Living",
		Spectator: "Spectators",
		Ghosts: "Ghosts",
		OnTrial: "On Trial"
	},

	CoinRewards: {
		Winning: 10,
		Participation: 1,
	},
}

module.exports = Enums;