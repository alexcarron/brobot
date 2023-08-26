const Enums = {
	WinConditions: {
		EliminateOtherFactions: "Eliminate all non-neutral factions as well as any Neutral Killing/Tyrant roles.",
		SurviveEliminateOtherFactions: "Survive until the end of the game and eliminate all non-neutral factions as well as any different Neutral Killing/Tyrant roles.",
		Survive: "Survive until the end of the game.",
		SurviveTownLose: "Survive until the end of the game to see town lose.",

		Fool: "Be successfully lynched.",
		Executioner: "Get your target successfully lynched.",
		Blacksmith: "Have a player you smithed a vest for be saved from an attack.",
	},

	AbilityUses: {
		Unlimited: -1,
		None: 0,
		Amount: (amount) => {
			if ( !Number.isInteger(amount) || amount <= 0 )
				throw new Error(`Error: Invalid AbilityUses.Amount ${amount}. Must be positive non-zero integer.`);
			return amount
		},
	},

	Factions: {
		Mafia: "Mafia",
		Town: "Town",
		Neutral: "Neutral",
	},

	Alignments: {
		Crowd: "Crowd",
		Investigative: "Investigative",
		Protective: "Protective",
		Killing: "Killing",
		Support: "Support",
		Deception: "Deception",
		Evil: "Evil",
		Chaos: "Chaos",
		Benign: "Benign",
		Tyrant: "Tyrant",
		Random: "Random",
	},

	AbilityTypes: {
		Protection: "protection",
		Manipulation: "manipulation",
		Roleblock: "roleblock",
		Modifier: "modifier",
		Attacking: "attacking",
		Muting: "muting",
		Investigative: "investigative",
		Control: "control",
		Suicide: "suicide",
		RoleChange: "role change",
	},

	Priorities: {
		Muting: 1,
		RoleChange: 1,
		Modifier: 1,
		Roleblock: 2,
		Protection: 3,
		Control: 2,
		Attacking: 4,
		Suicide: 4,
		Manipulation: 5,
		Investigative: 6,
	},

	Durations: {
		DayAndNight: 1,
		OneDay: 0.5,
		OneNight: 0.5,
		Indefinite: -1,
	},

	Immunities: {
		Roleblock: "roleblock",
		Control: "control",
	},

	ArgumentTypes: {
		Player: "player",
	},

	ArgumentSubtypes: {
		Visiting: "visiting",
		Another: "another",
		NonMafia: "non-mafia",
		None: "",
	},

	Phases: {
		Day: "day",
		Night: "night",
		Voting: "voting",
		Trial: "trial",
	},

	Subphases: {
		Voting: "voting",
		Trial: "trial",
		TrialResults: "results",
		Announcements: "announcements",
	},

	GameStates: {
		SignUp: "sign-up",
		ReadyToBegin: "ready",
		InProgress: "in progress",
		Ended: "ended",
	},

	Feedback: {
		DidSuccesfulSmith: "You have accomplished your goal and saved someone from death.",
		DidSilenceCurse: "You cursed the town with silence.",
		DidCautious: "You were cautious last night and didn't attack any roleblockers.",
		WasRoleblocked: "You were roleblocked.",
		WasRoleblockedButImmune: "Someone attempted to roleblock you, but you were immune.",
		AttackedRoleblocker: "You attacked the player who attempted to roleblock you instead of your original target.",
		KilledByAttack: "You were attacked and killed.",
		ProtectedAnAttackedPlayer: "The player you protected was attacked!",
		AttackedButSurvived: "You were attacked, but your defense was strong enough to survive it.",
		VigilanteComittedSuicide: "You comitted suicide over the guilt of killing a town member.",
		Controlled: "You were controlled.",
		EvaluatedPlayersRole: (player_evaluating, player_role) => {return `**${player_evaluating}** seemed to be the role, **${player_role}**.`},
		GotUnclearEvaluation: (player_evaluating) => {return `The results on **${player_evaluating}** were unclear.`},
		GotSuspiciousEvaluation: (player_evaluating) => {return `**${player_evaluating}** seemed to be suspicious.`},
		GotInnocentEvaluation: (player_evaluating) => {return `**${player_evaluating}** seemed to be innocent.`},
		SawPlayerVisit: (player_tracked, percieved_visit) => {return `It looked like **${player_tracked}** visited **${percieved_visit}** last night.`},
		SawPlayerNotVisit: (player_tracked) => {return `It looked like **${player_tracked}** didn't visit anyone last night.`},
		AttackFailed: (player_attacking) => {return `You tried to attack **${player_attacking}**, but their defense was too strong.`},
		KilledPlayer: (player_attacking) => {return `You attacked and killed **${player_attacking}**.`},
		OrderedByGodfather: (player_attacking) => {return `The Godfather ordered you to attack **${player_attacking}**.`},
		ControlFailed: (player_controlled) => {return `You tried to control **${player_controlled}**, but you were unable to.`},
		ControlSucceeded: (player_controlled, player_controlled_into) => {return `You controlled **${player_controlled}** into **${player_controlled_into}**.`},
	},

	LLPointTiers: {
		LLFanatic: "LL Fanatic!",
		LLEnthusiast: "LL Enthusiast!",
		LLFollower: "LL Follower!",
		LLFan: "LL Fan!",
		LLViewer: "LL Viewer!",
	},

	LLPointThresholds: {
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
		ParticipateInGame: 1,
		DrawAsset: 2,
		VoiceAct: 3,
	},

	LLPointAccomplishments: {
		Subscribe: "Subscribing",
		DoUndertaleQuiz: "Doing The Undertale Quiz",
		DoDeltaruneQuiz: "Doing The Deltarune Quiz",
		ParticipateInGame: "Participating In A Game Show",
		DrawAsset: "Drawing An Asset",
		VoiceAct: "Voice Acting",
	},

	DatabaseURLs: {
		Viewers: "https://raw.githubusercontent.com/alexcarron/brobot-database/main/viewers.json",
		Messages: "https://raw.githubusercontent.com/alexcarron/brobot-database/main/messages.json",
	},

	MessageDelays: {
		Short: 1,
		Normal: 6,
		Long: 10
	},

	PhaseWaitTimes: {
		FirstDay: 1,
		Night: 5,
		SignUps: 15,
		Voting: 5,
		Trial: 5
	},

	MaxFactionMembersRatios: {
		MafiaToTown: 2/3,
		TownToMafia: 5
	},

	RDMRoles: {
		Living: "Living",
		Spectator: "Spectators",
	},
}

module.exports = Enums;