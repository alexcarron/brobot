
const Enums = {
	LLPointThresholds: {
		WORSHIPER: 50000,
		DEVOTEE: 10000,
		ADDICT: 5000,
		FANATIC: 1000,
		ENTHUSIAST: 100,
		FOLLOWER: 50,
		FAN: 10,
		VIEWER: 0,
	},

	LLPointRewards: {
		Subscribe: 1,
		DoUndertaleQuiz: 1,
		DoDeltaruneQuiz: 1,
		DoHollowKnightQuiz: 1,
		ParticipateInGame: 1,
		ParticipateInEvent: 1,
		DrawAsset: 2,
		VoiceAct: 3,
	},

	LLPointAccomplishments: {
		Subscribe: "Subscribing",
		DoUndertaleQuiz: "Getting 15+ on the Undertale Quiz",
		DoDeltaruneQuiz: "Getting 15+ on the Deltarune Quiz",
		DoHollowKnightQuiz: "Getting 15+ on the Hollow Knight Quiz",
		ParticipateInGame: "Participating in a Game Show",
		ParticipateInEvent: "Participating in an Event",
		DrawAsset: "Drawing An Asset",
		VoiceAct: "Voice Acting",
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