
const Enums = {

	AbilityName: {
		Knife: "Knife",
		Murder: "Murder",
		Suicide: "Suicide",
		Smith: "Smith",
		SelfSmith: "Self Smith",
		Kidnap: "Kidnap",
		Track: "Track",
		Lookout: "Lookout",
		Nothing: "Nothing",
		DeathCurse: "Death Curse",
		Heal: "Heal",
		HealSelf: "Heal Self",
		Roleblock: "Roleblock",
		Cautious: "Cautious",
		Shoot: "Shoot",
		Frame: "Frame",
		SelfFrame: "Self Frame",
		FrameTarget: "Frame Target",
		Evaluate: "Evaluate",
		Investigate: "Investigate",
		Consort: "Consort",
		SelfVest: "Self Vest",
		Control: "Control",
		Observe: "Observe",
		Replace: "Replace",
	},

	AbilityArgName: {
		PlayerKidnapping: "Player Kidnapping",
		PlayerKilling: "Player Killing",
		PlayerTracking: "Player Tracking",
		PlayerWatching: "Player Watching",
		PlayerRoleblocking: "Player Roleblocking",
		PlayerHealing: "Player Healing",
		PlayerShooting: "Player Shooting",
		PlayerFraming: "Player Framing",
		PlayerEvaluating: "Player Evaluating",
		PlayerInvestigating: "Player Investigating",
		PlayerConsorting: "Player Consorting",
		PlayerKnifing: "Player Knifing",
		PlayerSmithingFor: "Player Smithing For",
		PlayerControlling: "Player Controlling",
		PlayerControlledInto: "Player Target Is Controlled Into",
		PlayerObserving: "Player Observing",
		PlayerReplacing: "Player Replacing",
	},

	RoleNames: {
		Mafioso: "Mafioso",
		Godfather: "Godfather",
		Framer: "Framer",
		Consort: "Consort",
		Executioner: "Executioner",
		Doctor: "Doctor",
		Witch: "Witch",
		Escort: "Escort",
		Townie: "Townie",
		Sheriff: "Sheriff",
		Survivor: "Survivor",
		Fool: "Fool",
		Oracle: "Oracle",
		Impersonator: "Impersonator",
		Kidnapper: "Kidnapper",
		Vigilante: "Vigilante",
		Tracker: "Tracker",
		Lookout: "Lookout",
		SerialKiller: "Serial Killer",
		Consigliere: "Consigliere",
		Blacksmith: "Blacksmith",
	},

	ServerPort: {
		LMStudioMistral: "1234",
	},

	LLPointTiers: {
		LLWorshiper: "LL Worshiper!",
		LLDevotee: "LL Devotee!",
		LLAddict: "LL Addict!",
		LLFanatic: "LL Fanatic!",
		LLEnthusiast: "LL Enthusiast!",
		LLFollower: "LL Follower!",
		LLFan: "LL Fan!",
		LLViewer: "LL Viewer!",
	},

	LLPointThresholds: {
		LLWorshiper: 50000,
		LLDevotee: 10000,
		LLAddict: 5000,
		LLFanatic: 1000,
		LLEnthusiast: 100,
		LLFollower: 50,
		LLFan: 10,
		LLViewer: 0,
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