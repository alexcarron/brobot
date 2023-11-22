const { getUnixTimestamp } = require("./functions");

const Enums = {
	WinConditions: {
		EliminateOtherFactions: "Eliminate all non-neutral factions as well as any Neutral Killing/Tyrant roles.",
		SurviveEliminateOtherFactions: "Survive until the end of the game and eliminate all non-neutral factions as well as any different Neutral Killing/Tyrant roles.",
		Survive: "Survive until the end of the game.",
		SurviveTownLose: "Survive until the end of the game to see town lose.",

		Fool: "Be successfully lynched.",
		Executioner: "Get your target successfully lynched.",
		Blacksmith: "Have a player you smithed a vest for be saved from an attack.",
		Stranger: "Replace someone and accomplish their win condition.",
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

	Effects: {
		Attack: {name: "attack"},
		Defend: (defense_level) => {
			if ( !Number.isInteger(defense_level) || defense_level <= 0 )
				throw new Error(`Error: Invalid Defense Level ${defense_level}. Must be positive non-zero integer.`);
			return {name: "defend", parameters: [defense_level]}
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

	Votes: {
		Nobody: "Nobody",
		Abstain: "Abstain",
		Player: (player_name) => `${player_name}`,
	},

	VotingOutcomes: {
		Nobody: "Nobody",
		NoVotes: "none",
		Tie: "tie",
		Player: (player_name) => `${player_name}`,
	},

	TrialVotes: {
		Guilty: "guilty",
		Innocent: "innocent",
		Abstain: "abstain",
	},

	TrialOutcomes: {
		Guilty: "guilty",
		Innocent: "innocent",
		Tie: "tie",
		NoVotes: "none",
	},

	GameForgePhases: {
		Brainstorming: "Brainstorming",
		Proposing: "Proposing",
		Voting: "Voting",
	},

	ArgumentSubtypes: {
		Visiting: "visiting",
		NotSelf: "not yourself",
		NonMafia: "non-mafia",
		CertainPlayers: "certain players",
		None: "",
	},

	Phases: {
		Day: "day",
		Night: "night",
		Voting: "voting",
		Trial: "trial",
		Limbo: "limbo",
	},

	Subphases: {
		Voting: "voting",
		Trial: "trial",
		TrialResults: "results",
		Announcements: "announcements",
		None: null,
	},

	GameStates: {
		SignUp: "sign-up",
		ReadyToBegin: "ready",
		InProgress: "in progress",
		Ended: "ended",
	},

	XPRewards: {
		Discuss: 1,
		Vote: 3,
		Propose: 3,
		CreateOfficialRule: 3,
		ProposeDissaprovedRule: -4,
		DailyPropose: 6,
	},

	XPTaskKeys: {
		Discuss: "Discuss",
		Vote: "Vote",
		Propose: "Propose",
		CreateOfficialRule: "CreateOfficialRule",
		ProposeDissaprovedRule: "ProposeDissaprovedRule",
		DailyPropose: "DailyPropose",
	},

	XPTaskVerbs: {
		Discuss: "discussing",
		Vote: "voting",
		Propose: "proposing",
		CreateOfficialRule: "creating an official rule",
		ProposeDissaprovedRule: "proposing a very dissaproved rule",
		DailyPropose: "doing your daily proposal",
	},

	GameForgeMilestones: {
		Vote: 100,
		Propose: 50,
		CreateOfficialRule: 15,
	},

	XPMilestoneRewards: {
		Vote: 200,
		Propose: 200,
		CreateOfficialRule: 200,
	},

	GameForgeBadges: {
		UltimateVoter: "Ultimate Voter",
		UltimateProposer: "Ultimate Proposer",
		UltimateRuleForger: "Ultimate Rule Forger",
		FirstSteps: "First Steps",
		Contributor: "Contributer",
		MajorContributor: "Major Contributer",
		Ruler: "Ruler",
		RuleLeader: "Rule Leader",
		TheContestant: "The Contestant",
	},

	GameForgeBadgeChanceRewards: {
		UltimateVoter: 2,
		UltimateProposer: 2,
		UltimateRuleForger: 2,
		FirstSteps: 1,
		Contributor: 3,
		MajorContributor: 5,
		Ruler: 8,
		RuleLeader: 10,
		TheContestant: 999999999999999999999,
	},

	LevelXPRequirements: {
		1: 30,
		2: 50,
		3: 70,
		4: 85,
		5: 100,
	},

	LevelXPRequirementMultiplier: 10,

	Announcements: {
		StartSignUps: (sign_up_ping_id, join_chat_id, unix_timestamp) =>
			`<@&${sign_up_ping_id}> A Rapid Discord Mafia game is starting <t:${unix_timestamp}:R>.` + "\n" +
			`To join the game, go to <#${join_chat_id}> and use the command \`/join\`.`,
		SignUpsReminder: (join_chat_id, unix_timestamp) =>
			`@here A Rapid Discord Mafia game will begin <t:${unix_timestamp}:R>!` + "\n" +
			`To join the game, go to <#${join_chat_id}> and use the command \`/join\`.`,
		SignUpsFinalReminder: (join_chat_id, unix_timestamp) =>
			`@here Final call to sign up for the Rapid Discord Mafia game!` + "\n" +
			`Sign-ups will close and the game will begin <t:${unix_timestamp}:R>.` + "\n" +
			`To join the game, go to <#${join_chat_id}> and use the command \`/join\`.`,
		SignUpsClosed: (ll_user_id, living_role_id, player_count) =>
			`<@${ll_user_id}> <@&${living_role_id}> Sign-ups are now closed and the game will now begin with \`${player_count}\` players!` + "\n" +
			`Standby for role assignments in your player action channel...`,
		NotEnoughSignUps: (player_count, min_player_count) =>
			`Unfortunately we didn't get enough players. We needed \`${min_player_count}\` but we got \`${player_count}\`. Game cancelled :(`,
		ExeTarget: (target_name) =>
			`Your target is **${target_name}**! Make sure they are lynched by any means necessary.`,
		LivingPlayers: (living_player_names) =>
			`# Living Players` + "\n" +
			">>> " + living_player_names.map(name => `**${name}**\n`).join(""),
		RoleList: (role_identifiers) =>
			`# Role List` + "\n" +
			">>> " + role_identifiers.map(identifier => `**${identifier.name}**\n`).join(""),
		GameStarted: (living_role_id, role_list_chnl_id) => [
			`<@&${living_role_id}> Good morning! The game will now begin!`,
			`_ _\n__Helpful Reminders__`,
			`> — The role list is in <#${role_list_chnl_id}>`,
			`> — Type a \`/\` to get a list of all the commands you can use.`,
			`> — You can use \`/whisper\` to secretly talk to another player privately. Brobot will announce that you're whispering to that player, but not the contents of the whisper.`,
			`> — You can use \`/report\` to report any bugs or errors you come across or give feedback and ideas.`,
			`> — You can use \`/last-will\` to create, edit, or remove a will that's shown when you die`,
			`> — You can use \`/death-note\` to create, edit, or remove a note to show on your victim's death.`,
			`> — You can use \`/roles\` to get a list of all possible roles and their factions and alignments.`,
			`> — You can use \`/role-info\` to get all the information about a chosen role.`,
			`> — You can use \`/role-list\` to see the current role list.`,
			`> — You can use \`/leave-game\` to commit suicide in-game if you have to go. Only do this if absolutely necessary`,
		],
		Day1Started: () => [
			`_ _\n# Day 1`,
			`**The day phase will end <t:${getUnixTimestamp() + Enums.PhaseWaitTimes.FirstDay*60}:R>**`,
		],
		StartDay: (living_role_id, day_num) => [
			`_ _\n# Day ${day_num}`,
			`<@&${living_role_id}> Good morning! It is now day.`,
			`Let's see what happened last night...\n`
		],
		StartVoting: () => [
			`_ _\n## Voting Subphase`,
			`The voting part of the day phase will now begin. **It ends in <t:${getUnixTimestamp() + Enums.PhaseWaitTimes.Voting*60}:R>** `,
			"Use `/vote for-player` in your player action channel to vote for a player to put on trial. Your votes are not anonymous.",
		],
		VotingReminder: `Use the command \`/vote for-player\` in this channel to vote for a player you want to put on trial, abstain, or vote nobody.`,
		UseNightAbilityReminder: "It's night time. Use `/use ABILITY` to perform an ability or `/use nothing`.",
		VotingOver: (living_role_id) =>
			`_ _\n<@&${living_role_id}> Voting is closed. Let's see who is put on trial...`,
		VotingOutcomeNobody: `The town decided to lynch nobody, so we will be skipping the trial.`,
		VotingOutcomeTie: `It was a tie. The town couldn't agree on who to lynch, so we will be skipping the trial.`,
		VotingOutcomeNoVotes: `Nobody voted, so we will be skipping the trial.`,
		VotingOutcomePlayer: (player_name_on_trial) => `The town puts **${player_name_on_trial}** on trial.`,
		TrialVotesHeader: (num_day) => `## Trial Vote (Day ${num_day})`,
		OnTrialPlayerGiveDefense: (on_trial_role_id) =>
			`<@&${on_trial_role_id}> You can now give your defense here:`,
		StartTrial: (player_on_trial) => [
			`_ _\n## Trial Phase`,
			`The trial part of the day will now begin and **end <t:${getUnixTimestamp() + Enums.PhaseWaitTimes.Trial*60}:R>**.`,
			`Use \`/vote for-trial-outcome\` in your player action channel to vote whether or not **${player_on_trial.name}** should be hung. (Or abstain)\nYour votes will be anonymous until day starts.`
		],
		TrialVotingReminder: (player_on_trial) =>
			`Use the command \`/vote for-trial-outcome\` in this channel to vote whether or not **${player_on_trial.name}** should be hung.`,
		TrialOver: (living_role_id) =>
			`_ _\n<@&${living_role_id}> Trial voting is closed. Let's see the verdict...`,
		TrialOutcomeTie: (player_on_trial) =>
			`It was a tie. The town couldn't agree whether or not to lynch **${player_on_trial.name}**, so they live.`,
		TrialOutcomeNoVotes: (player_on_trial) =>
			`Nobody voted, so **${player_on_trial.name}** lives.`,
		TrialOutcomeInnocent: (player_on_trial) =>
			`**${player_on_trial.name}** was deemed innocent by the town. They get to live another day.`,
		TrialOutcomeGuilty: (player_on_trial) =>
			`**${player_on_trial.name}** was deemed guilty by the town. They will be hung to death this instant.`,
		StartNight: (living_role_id, night_num) => [
			`_ _\n# Night ${night_num}`,
			`<@&${living_role_id}> Goodnight! It is now nightime.`,
			`**The night phase will end <t:${getUnixTimestamp() + Enums.PhaseWaitTimes.Night*60}:R>**`,
			`Time to do your night abilities in your player action channels with \`/use ABILITY...\``,
			`If you're not using an ability, do \`/use nothing\` to speed up the night`,
		],
		PhaseAlmostOverWarning: (min_left) =>
			`**WARNING: Phase ends <t:${getUnixTimestamp() + min_left*60}:R>**`,
		PlayerSuicide: `They left the game, committing suicide.`,
		PlayerSmitten: `They were smitten by the host for inactivity.`,
		VigilanteSuicide: "They comitted suicide over the guilt of killing a town member.",
		RoleReveal: (player) => `**${player.name}**'s role was revealed to be **${player.role}**.`,
		RoleIsUnidentifiable: (player) => `**${player.name}**'s role could not be determined.`,
		LynchVoteHeader: (num_day) => `# Day ${num_day} Lynch Vote`,
		OpenDayChat: (day_chat_chnl_id) => `_ _\nYou may now discuss in <#${day_chat_chnl_id}>`,
		PlayerFoundDead: (player) =>
		 	`:skull: **${player.name}** was found dead.`,
		LastWillUnidentifiable: () =>
			`The contents of their last will could not be determined.`,
		LastWillNotFound: () =>
			`No last will could be found.`,
		LastWillFound: (last_will) =>
			`They left behind a last will: \`\`\`\n${last_will}\n\`\`\``,
		CongratulateWinners: (winning_factions, winning_player_names) =>
			[
				`_ _\n**${winning_factions.join("**, **")} **won!`,
				`Congratulations** ${winning_player_names.join("**, **")}**!`
			],
		Whisper: (player_whispering, player_whispering_to) =>
			`> **${player_whispering.name}** whispers to **${player_whispering_to.name}**`,
		WhisperLog: (player_whispering, player_whispering_to, whisper_contents) =>
			`\`[${player_whispering.role}]\` **${player_whispering.name}** whispers to \`[${player_whispering_to.role}]\` **${player_whispering_to.name}**\n>>> ${whisper_contents}`,
		RewardCoinsToPlayer: (player_name, coins) =>
			`**${player_name}** is rewarded with \`${coins}\` coins!`,
		RewardCoinsToPlayers: (player_names, coins) =>
			`**${player_names.join(", ")}** is rewarded with \`${coins}\` coins!`,
	},

	Feedback: {
		CreatedPlayerActionChannel: (player) =>
		  `<@${player.id}> Welcome to your player action channel!` + "\n" +
			`If you'd like to rename yourself use the \`/rename\` command.`,
		DidSuccesfulSmith: "You have accomplished your goal and saved someone from death.",
		DidSilenceCurse: "You cursed the town with silence.",
		DidCautious: "You were cautious last night and didn't attack any roleblockers.",
		RoleblockedPlayer: (roleblocked_player) =>
			`You attempted to roleblock **${roleblocked_player.name}** last night.`,
		WasRoleblocked: "You were roleblocked.",
		WasRoleblockedButImmune: "Someone attempted to roleblock you, but you were immune.",
		AttackedRoleblocker: "You attacked the player who attempted to roleblock you instead of your original target.",
		KilledByAttack: "You were attacked and killed.",
		ProtectedAnAttackedPlayer: "The player you protected was attacked!",
		AttackedButSurvived: "You were attacked, but your defense was strong enough to survive it.",
		ComittingSuicide: "You will comitt suicide over the guilt of killing a town member tonight.",
		ComittedSuicide: "You comitted suicide over the guilt of killing a town member.",
		AnnounceMurderByFaction: (faction) =>  `They were killed by the **${faction}**.`,
		AnnounceAnotherMurderByFaction: (faction) =>  `They were also killed by the **${faction}**.`,
		AnnounceMurderByRole: (role) => {
			switch (role) {
				case Enums.RoleNames.Stranger:
					return "They were replaced by a **Stranger**.";

				default:
					return `They were killed by a(n) **${role}**.`;
			}
		},
		AnnounceAnotherMurderByRole: (role) =>  `They were also killed by a(n) **${role}**.`,
		Controlled: "You were controlled.",
		EvaluatedPlayersRole: (player_evaluating, player_role) => {return `**${player_evaluating}** seemed to be the role, **${player_role}**.`},
		GotUnclearEvaluation: (player_evaluating) => {return `The results on **${player_evaluating}** were unclear.`},
		GotSuspiciousEvaluation: (player_evaluating) => {return `**${player_evaluating}** seemed to be suspicious.`},
		GotInnocentEvaluation: (player_evaluating) => {return `**${player_evaluating}** seemed to be innocent.`},
		LookoutSeesNoVisits: (target_player) =>
			`It seems like nobody visited **${target_player}** last night.`,
		LookoutSeesVisits: (target_player, players_visiting) =>
			`It seems like **${target_player}** was visited by last night.`,
		SawPlayerVisit: (player_tracked, percieved_visit) => {return `It looked like **${player_tracked}** visited **${percieved_visit}** last night.`},
		SawPlayerNotVisit: (player_tracked) => {return `It looked like **${player_tracked}** didn't visit anyone last night.`},
		AttackFailed: (player_attacking) => {return `You tried to attack **${player_attacking}**, but their defense was too strong.`},
		KilledPlayer: (player_attacking) => {return `You attacked and killed **${player_attacking}**.`},
		OrderedByGodfather: (player_attacking) => {return `The Godfather ordered you to attack **${player_attacking}**.`},
		KillForMafioso: (player_attacking) => {return `The mafioso wasn't able to attack **${player_attacking}**, so you did it for them.`},
		ControlFailed: (player_controlled) => {return `You tried to control **${player_controlled}**, but you were unable to.`},
		ControlSucceeded: (player_controlled, player_controlled_into) => {return `You controlled **${player_controlled}** into using their ability on **${player_controlled_into}**.`},
		InactivityWarning: (player, num_subphases_inactive, num_subphases_inactive_left) =>
			`\n` +
			`<@${player.id}>` + `\n` +
			`You've been inactive for **${num_subphases_inactive}** subphases. If you are inactive for **${num_subphases_inactive_left}** more subphases, you will be kicked from the game.` + `\n` +
			`Try doing \`/use nothing\`, \`/vote for-player Abstain\`, and \`/vote for-trial-outcome Abstain\` to reduce inactivity.`,
		Smitten: (player) => `<@${player.id}> You have been smitten for inactivity.`,
		WhisperedTo: (player_whispering, whisper_contents) =>
			`**${player_whispering.name}** whispers to you:\n>>> ${whisper_contents}`,
		ObservedWithNoPreviousObserve: (player_observing) =>
			`You observed **${player_observing.name}** last night. The next time you observe someone, you'll know if they and **${player_observing.name}** are working together.`,
		ObservedWorkingTogether: (player_observing, previous_player_observed) =>
			`You observed **${player_observing.name}** last night and it seems like they're in the same faction as **${previous_player_observed.name}**, the previous player you observed.`,
		ObservedNotWorkingTogether: (player_observing, previous_player_observed) =>
			`You observed **${player_observing.name}** last night and it seems like they're NOT in the same faction as **${previous_player_observed.name}**, the previous player you observed.`,
		ObservedSamePerson: (player_observing) =>
			`You observed **${player_observing.name}** last night, but it was pretty obvious they were in the same faction as themselves.`,
		ReplacedByReplacer: () =>
			`Don't worry, you have been replaced by someone.`,
		ReplacedPlayer: (player_replacing) =>
			`You have succesfully replaced **${player_replacing.name}**'s role as **${player_replacing.role}**`,
		ReplaceFailed: (player_replacing) =>
			`You failed to replace **${player_replacing.name}**...`,
		KidnappedPlayer: (player_kindapped) =>
			`You kidnapped **${player_kindapped.name}**. They won't be able to speak or vote tonight and you attempted to roleblock them.`,
		AttackedByKidnappedPlayer: (player_kindapped) =>
			`You kidnapped **${player_kindapped.name}**. They won't be able to speak or vote tonight and you attempted to roleblock them, but they were stronger than you thought and attacked you.`,
		Kidnapped: `You were kidnapped. You may not speak or vote for the rest of the day.`,
		Unkidnapped: `You are no longer kidnapped. You may now speak and vote again.`,
		AttackedKidnapper: `You retaliated against your kidnapper and attacked them.`,
		RoleblockedByKidnapper: `Your kidnapper roleblocked you.`,
		RoleblockedByKidnapperButImmune: `Your kidnapper attempted to roleblock you, but you were immune.`,
	},

	RoleIdentifierKeywords: {
		Random: "Random",
		Any: "Any",
	},

	RoleIdentifierTypes: {
		SpecificRole: "role",
		RandomRoleInFaction: "faction",
		RandomRoleInFactionAlignment: "faction alignment",
		AnyRole: "any"
	},

	RoleIdentifierPriorities: {
		SpecificRole: 1,
		RandomRoleInFactionAlignment: 2,
		RandomRoleInFaction: 3,
		AnyRole: 4
	},

	AbilityNames: {
		Knife: "Knife",
		Murder: "Murder",
		Suicide: "Suicide",
		Smith: "Smith",
		Kidnap: "Kidnap",
		Track: "Track",
		Lookout: "Lookout",
	},

	RoleNames: {
		Mafioso: "Mafioso",
		Godfather: "Godfather",
		Executioner: "Executioner",
		Doctor: "Doctor",
		Witch: "Witch",
		Townie: "Townie",
		Sheriff: "Sheriff",
		Survivor: "Survivor",
		Fool: "Fool",
		Oracle: "Oracle",
		Stranger: "Stranger",
		Kidnapper: "Kidnapper",
		Vigilante: "Vigilante",
		Tracker: "Tracker",
		Lookout: "Lookout",
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