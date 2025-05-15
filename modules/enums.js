
const Enums = {
	LLPointAccomplishments: {
		SUBSCRIBE: "Subscribing",
		DO_UNDERTALE_QUIZ: "Getting 15+ on the Undertale Quiz",
		DO_DELTARUNE_QUIZ: "Getting 15+ on the Deltarune Quiz",
		DO_HOLLOW_KNIGHT_QUIZ: "Getting 15+ on the Hollow Knight Quiz",
		PARTICIPATE_IN_GAME: "Participating in a Game Show",
		PARTICIPATE_IN_EVENT: "Participating in an Event",
		DRAW_ASSET: "Drawing An Asset",
		VOICE_ACT: "Voice Acting",
	},

	LLPointPerks: {
		DrawAsset: "Draw an asset for a YouTube video",
		VoiceAct: "Voice act for a YouTube video",
		CustomRoleColor: "Get custom Discord role color",
		CustomPersonification: "Get a custom personification drawing",
		AddEmote: "Add a custom emote to the server",
	},

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