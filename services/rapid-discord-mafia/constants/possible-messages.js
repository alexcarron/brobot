const ids = require("../../../bot-config/discord-ids.js");
const { createListFromWords } = require("../../../utilities/text-formatting-utils.js");
const { createNowUnixTimestamp } = require("../../../utilities/date-time-utils.js");
const { RoleName } = require("../role.js");
const { PhaseLength } = require("../game-state-manager.js");

const COMMAND_EXPLANATIONS = [
	`\`/commands\` See a list of all commands and what they do`,
	`\`/use\` Use an ability your role has`,
	`\`/vote\` Vote for a player to put on a trial or vote for a trial outcome`,
	`\`/whisper\` Privately talk to another player at anytime. When you whisper, it will be announced who you're whispering to but not its contents`,
	`\`/whisper\` Privately talk to another player at anytime. When you whisper, it will be announced who you're whispering to but not its contents`,
	`\`/last-will\` Create and edit a will that's shown to everyone when you die`,
	`\`/death-note\` Create and edit an anonymous note that's shown to everyone when you kill someone`,
	`\`/leave-game\` Commit suicide in-game. (For when you have to leave. ONLY use if absolutely necessary)`,
	`\`/report\` Report bugs and errors you come across, give feedback, and suggest ideas`,
	`\`/roles\` See every role in Rapid Discord Mafia with their faction and alignment`,
	`\`/role-info\` See all information about a specific role`,
	`\`/role-list\` See the role list for the current game`,
	`\`/rename\` Change your name during sign-ups`,
	`\`/get-role-color\` Get a custom role color for your name to have while games aren't happening`,
]

/**
 * Enum of possible announcements sent to the public by the game
 */
const Announcement = Object.freeze({
	START_SIGN_UPS: (sign_up_ping_id, join_chat_id, unix_timestamp) =>
		`<@&${sign_up_ping_id}> @everyone A Rapid Discord Mafia game is starting <t:${unix_timestamp}:R>.` + "\n" +
		`To join the game, go to <#${join_chat_id}> and use the command \`/join\`.\n` +
		`While you wait, read <#${ids.rapid_discord_mafia.channels.how_to_play}> and <#${ids.rapid_discord_mafia.channels.rules}>!`,

	SIGN_UPS_REMINDER: (join_chat_id, unix_timestamp) =>
		`@here A Rapid Discord Mafia game will begin <t:${unix_timestamp}:R>!` + "\n" +
		`To join the game, go to <#${join_chat_id}> and use the command \`/join\`.\n` +
		`While you wait, read <#${ids.rapid_discord_mafia.channels.how_to_play}> and <#${ids.rapid_discord_mafia.channels.rules}>!`,

	SIGN_UPS_FINAL_REMINDER: (join_chat_id, unix_timestamp) =>
		`@here Final call to sign up for the Rapid Discord Mafia game!` + "\n" +
		`Sign-ups will close and the game will begin <t:${unix_timestamp}:R>.` + "\n" +
		`To join the game, go to <#${join_chat_id}> and use the command \`/join\`.`,

	SIGN_UPS_CLOSED: (ll_user_id, living_role_id, player_count) =>
		`<@${ll_user_id}> <@&${living_role_id}> Sign-ups are now closed and the game will now begin with \`${player_count}\` players!` + "\n" +
		`While you wait, read <#${ids.rapid_discord_mafia.channels.how_to_play}> and <#${ids.rapid_discord_mafia.channels.rules}>\n` +
		`Standby for role assignments in your player action channel...`,

	NOT_ENOUGH_SIGN_UPS: (player_count, min_player_count) =>
		`Unfortunately we didn't get enough players. We needed \`${min_player_count}\` but we got \`${player_count}\`. Game cancelled :(`,

	GIVE_EXE_TARGET: (target_name) =>
		`Your target is **${target_name}**! Make sure they are lynched by any means necessary.`,

	SHOW_LIVING_PLAYERS: (living_player_names) =>
		"_ _\n" +
		`# Living Players` + "\n" +
		">>> " + living_player_names.map(name => `**${name}**\n`).join(""),

	SHOW_ROLE_LIST: (role_identifiers) =>
		`# Role List` + "\n" +
		">>> " + role_identifiers.map(identifier => `**${identifier.name}**\n`).join(""),

	GAME_STARTED: (living_role_id, role_list_chnl_id) => [
		`<@&${living_role_id}> Good morning! The game will now begin!`,
		`_ _\n## Helpful Reminders`,
		`- Type a \`/\` to get a list of all the commands you can use.`,
		...(COMMAND_EXPLANATIONS.map(string => `- ${string}`))
	],

	DAY_ONE_STARTED: [
		`_ _\n# Day 1`,
		`Look over your role information, come up with a plan, and discuss with your fellow town members your game plan.\n` +
		`**The day phase will end <t:${createNowUnixTimestamp() + PhaseLength.FIRST_DAY*60}:R>**`,
	],

	START_DAY: (living_role_id, day_num) => [
		`_ _\n# Day ${day_num}`,
		`<@&${living_role_id}> Good morning! It is now day.`,
		`Let's see what happened last night...\n`
	],

	START_VOTING: [
		`_ _\n## Voting Subphase`,
		`The voting part of the day phase will now begin. **It ends in <t:${createNowUnixTimestamp() + PhaseLength.VOTING*60}:R>** `,
		"Use `/vote for-player` in your player action channel to vote for a player to put on trial. Your votes are not anonymous.",
	],

	VOTING_REMINDER: `Use the command \`/vote for-player\` in this channel to vote for a player you want to put on trial, abstain, or vote nobody.`,

	USE_NIGHT_ABILITY_REMINDER: "It's night time. Use the command `/use ABILITY-NAME-HERE` to perform an ability or `/use nothing`.",

	VOTING_OVER: (living_role_id) =>
		`_ _\n<@&${living_role_id}> Voting is closed. Let's see who is put on trial...`,

	VOTING_OUTCOME_NOBODY: `The town decided to lynch nobody, so we will be skipping the trial.`,

	VOTING_OUTCOME_TIE: `It was a tie. The town couldn't agree on who to lynch, so we will be skipping the trial.`,

	VOTING_OUTCOME_NO_VOTES: `Nobody voted, so we will be skipping the trial.`,

	VOTING_OUTCOME_PLAYER: (player_name_on_trial) => `The town puts **${player_name_on_trial}** on trial.`,

	TRIAL_VOTES_HEADER: (num_day) => `## Trial Vote (Day ${num_day})`,

	ON_TRIAL_PLAYER_GIVE_DEFENSE: (on_trial_role_id) =>
		`<@&${on_trial_role_id}> You can now give your defense here:`,

	START_TRIAL: (player_on_trial) => [
		`_ _\n## Trial Phase`,
		`The trial part of the day will now begin and **end <t:${createNowUnixTimestamp() + PhaseLength.TRIAL*60}:R>**.`,
		`Use \`/vote for-trial-outcome\` in your player action channel to vote whether or not **${player_on_trial.name}** should be hung. (Or abstain)\nYour votes will be anonymous until day starts.`
	],

	TRIAL_VOTING_REMINDER: (player_on_trial) =>
		`Use the command \`/vote for-trial-outcome\` in this channel to vote whether or not **${player_on_trial.name}** should be hung.`,

	TRIAL_OVER: (living_role_id) =>
		`_ _\n<@&${living_role_id}> Trial voting is closed. Let's see the verdict...`,

	TRIAL_OUTCOME_TIE: (player_on_trial) =>
		`It was a tie. The town couldn't agree whether or not to lynch **${player_on_trial.name}**, so they live.`,

	TRIAL_OUTCOME_NO_VOTES: (player_on_trial) =>
		`Nobody voted, so **${player_on_trial.name}** lives.`,

	TRIAL_OUTCOME_INNOCENT: (player_on_trial) =>
		`**${player_on_trial.name}** was deemed innocent by the town. They get to live another day.`,

	TRIAL_OUTCOME_GUILTY: (player_on_trial) =>
		`**${player_on_trial.name}** was deemed guilty by the town. They will be hung to death this instant.`,

	START_NIGHT: (living_role_id, night_num) => [
		`_ _\n# Night ${night_num}`,
		`<@&${living_role_id}> Goodnight! It is now nightime.`,
		`**The night phase will end <t:${createNowUnixTimestamp() + PhaseLength.NIGHT*60}:R>**`,
		`Time to do your night abilities in your player action channels with the command \`/use ABILITY-NAME-HERE\``,
		`If you're not using an ability, do \`/use nothing\` to speed up the night`,
	],

	PHASE_ALMOST_OVER_WARNING: (min_left) =>
		`**WARNING: Phase ends <t:${createNowUnixTimestamp() + min_left*60}:R>**`,

	PLAYER_SUICIDE: `They left the game, committing suicide.`,

	PLAYER_SMITTEN: `They were smitten by the host for inactivity.`,

	VIGILANTE_SUICIDE: "They comitted suicide over the guilt of killing a town member.",

	ROLE_REVEAL: (player) =>
		`**${player.name}**'s role was revealed to be **${player.role}**.`,

	ROLE_IS_UNIDENTIFIABLE: (player) =>
		`**${player.name}**'s role could not be determined.`,

	LYNCH_VOTE_HEADER: (num_day) =>
		`# Day ${num_day} Lynch Vote`,

	OPEN_DAY_CHAT: (day_chat_chnl_id) =>
		`_ _\nYou may now discuss in <#${day_chat_chnl_id}>`,

	PLAYER_FOUND_DEAD: (player) =>
		`:skull: **${player.name}** was found dead.`,

	LAST_WILL_UNIDENTIFIABLE:
		`The contents of their last will could not be determined.`,

	LAST_WILL_NOT_FOUND:
		`No last will could be found.`,
	LAST_WILL_FOUND: (last_will) =>
		`They left behind a last will: \`\`\`\n${last_will}\n\`\`\``,

	CONGRATULATE_WINNERS: (winning_factions, winning_player_names) => {
		const bolded_winning_player_names = winning_player_names.map(
			name => `**${name}**`
		);
		const winning_players_sentence = createListFromWords(bolded_winning_player_names);
		const bolded_winning_factions = winning_factions.map(
			name => `**${name}**`
		);
		const winning_factions_sentence = createListFromWords(bolded_winning_factions);

		return [
			`_ _\n${winning_factions_sentence} won!`,
			`Congratulations ${winning_players_sentence}!`
		]
	},

	WHISPER: (player_whispering, player_whispering_to) =>
		`> **${player_whispering.name}** whispers to **${player_whispering_to.name}**`,

	WHISPER_LOG: (player_whispering, player_whispering_to, whisper_contents) =>
		`\`[${player_whispering.role}]\` **${player_whispering.name}** whispers to \`[${player_whispering_to.role}]\` **${player_whispering_to.name}**\n>>> ${whisper_contents}`,

	REWARD_COINS_TO_PLAYER: (player_name, coins) =>
		`**${player_name}** is rewarded with \`${coins}\` coins!`,

	REWARD_COINS_TO_PLAYERS: (player_names, coins) =>
		`🪙 **${player_names.join(", ")}** is rewarded with \`${coins}\` coins!`,

	DRAW_GAME_FROM_TIMEOUT: (num_days_since_deaths) =>
		`There have been no deaths for the past **${num_days_since_deaths} day(s)**, so it's a draw!`,

	TIMEOUT_WARNING: (max_days_since_death, num_days_since_deaths) =>
		`Nobody has died in the past **${num_days_since_deaths} day(s)**. **${max_days_since_death - num_days_since_deaths}** more days without bloodshed and the game ends in a draw.`,
	LYNCHED_FOOL: `You feel like you've made a terrible mistake...`,
});

/**
 * Enum of possible feedback sent privately to a player
 */
const Feedback = Object.freeze({
	CREATED_PLAYER_ACTION_CHANNEL: (player) =>
		`<@${player.id}> Welcome to your player action channel!` + "\n" +
		`If your new to Rapid Discord Mafia learn <#${ids.rapid_discord_mafia.channels.how_to_play}> and read <#${ids.rapid_discord_mafia.channels.rules}>\n` +
		`Here's a list of commands that are good to know:\n` +
		COMMAND_EXPLANATIONS.map(string => `> - ${string}`).join("\n"),

	SMITHED_VEST_FOR_PLAYER: (player_smithed_for) =>
		`You smited a vest for **${player_smithed_for.name}** last night.`,

	DID_SUCCESSFUL_SMITH: "You have accomplished your goal and saved someone from death.",

	DID_SILENCE_CURSE: "You cursed the town with silence.",

	DID_CAUTIOUS: "You were cautious last night and didn't attack any roleblockers.",

	ROLEBLOCKED_PLAYER: (roleblocked_player) =>
		`You attempted to roleblock **${roleblocked_player.name}** last night.`,

	WAS_ROLEBLOCKED: "You were roleblocked.",

	WAS_ROLEBLOCKED_BUT_IMMUNE: "Someone attempted to roleblock you, but you were immune.",

	ATTACKED_ROLEBLOCKER: "You attacked the player who attempted to roleblock you instead of your original target.",

	KILLED_BY_ATTACK: "You were attacked by someone and they successfully killed you.",

	PROTECTED_AN_ATTACKED_PLAYER: "The player you protected was attacked!",

	ATTACKED_BUT_SURVIVED: "You were attacked by someone, but your defense was strong enough to survive their attack.",

	COMITTING_SUICIDE: "You will comitt suicide over the guilt of killing a town member tonight.",

	COMITTED_SUICIDE: "You comitted suicide over the guilt of killing a town member.",

	ANNOUNCE_MURDER_BY_FACTION: (faction) =>  `They were killed by the **${faction}**.`,

	ANNOUNCE_ANOTHER_MURDER_BY_FACTION: (faction) =>  `They were also killed by the **${faction}**.`,

	ANNOUNCE_MURDER_BY_ROLE: (role) => {
		switch (role) {
			case RoleName.IMPERSONATOR:
				return `They were replaced by a **${RoleName.IMPERSONATOR}**.`;

			default:
				return `They were killed by a(n) **${role}**.`;
		}
	},

	ANNOUNCE_ANOTHER_MURDER_BY_ROLE: (role) =>  `They were also killed by a(n) **${role}**.`,

	CONTROLLED: "You were controlled.",

	INVESTIGATED_PLAYERS_ROLE: (player_evaluating, player_role) => {return `**${player_evaluating}** seemed to be the role, **${player_role}**.`},

	GOT_UNCLEAR_EVALUATION: (player_evaluating) => {return `The results on **${player_evaluating}** were unclear.`},

	GOT_SUSPICIOUS_EVALUATION: (player_evaluating_name) => {return `**${player_evaluating_name}** seemed to be suspicious.`},

	GOT_INNOCENT_EVALUATION: (player_evaluating) => {return `**${player_evaluating}** seemed to be innocent.`},

	LOOKOUT_SEES_NO_VISITS: (target_player) =>
		`It seems like nobody visited **${target_player.name}** last night.`,

	LOOKOUT_SEES_VISITS: (target_player, player_seen_visiting) => {
		const player_names_visiting =
		player_seen_visiting.map(player => `**${player.name}**`);
		return `It seems like **${target_player.name}** was visited by ${createListFromWords(player_names_visiting)} last night.`;
	},

	TRACKER_SAW_PLAYER_VISIT: (player_tracked_name, visited_player_name) => {return `It looked like **${player_tracked_name}** visited **${visited_player_name}** last night.`},

	TRACKER_SAW_PLAYER_NOT_VISIT: (player_tracked_name) => {return `It looked like **${player_tracked_name}** didn't visit anyone last night.`},

	ATTACK_FAILED: (player_attacking) => {return `You tried to attack **${player_attacking}**, but their defense was too strong.`},

	KILLED_PLAYER: (player_attacking) => {return `You attacked and killed **${player_attacking}**.`},

	ORDERED_BY_GODFATHER: (player_attacking) => {return `The Godfather ordered you to attack **${player_attacking}**.`},

	KILL_FOR_MAFIOSO: (player_attacking) => {return `The mafioso wasn't able to attack **${player_attacking}**, so you did it for them.`},

	CONTROL_FAILED: (player_controlled) => {return `You tried to control **${player_controlled}**, but you were unable to.`},

	CONTROL_SUCCEEDED: (player_controlled, player_controlled_into) => {return `You controlled **${player_controlled}** into using their ability on **${player_controlled_into}**.`},

	INACTIVITY_WARNING: (player, num_subphases_inactive, num_subphases_inactive_left) =>
		`\n` +
		`<@${player.id}>` + `\n` +
		`You've been inactive for **${num_subphases_inactive}** subphases. If you are inactive for **${num_subphases_inactive_left}** more subphases, you will be kicked from the game.` + `\n` +
		`Try doing \`/use nothing\`, \`/vote for-player Abstain\`, and \`/vote for-trial-outcome Abstain\` to reduce inactivity.`,

	SMITTEN: (player) => `<@${player.id}> You have been smitten for inactivity.`,

	WHISPERED_TO: (player_whispering, whisper_contents) =>
		`**${player_whispering.name}** whispers to you:\n>>> ${whisper_contents}`,

	OBSERVED_WITH_NO_PREVIOUS_OBSERVE: (player_observing) =>
		`You observed **${player_observing.name}** last night. The next time you observe someone, you'll know if they and **${player_observing.name}** are working together.`,

	OBSERVED_WORKING_TOGETHER: (player_observing, previous_player_observed) =>
		`You observed **${player_observing.name}** last night and it seems like they're in the same faction as **${previous_player_observed.name}**, the previous player you observed.`,

	OBSERVED_NOT_WORKING_TOGETHER: (player_observing, previous_player_observed) =>
		`You observed **${player_observing.name}** last night and it seems like they're NOT in the same faction as **${previous_player_observed.name}**, the previous player you observed.`,

	OBSERVED_SAME_PERSON: (player_observing) =>
		`You observed **${player_observing.name}** last night, but it was pretty obvious they were in the same faction as themselves.`,

	REPLACED_BY_REPLACER:
		`Don't worry, you have been replaced by someone.`,

	REPLACED_PLAYER: (player_replacing) =>
		`You have successfully replaced **${player_replacing.name}**'s role as **${player_replacing.role}**`,

	REPLACE_FAILED: (player_replacing) =>
		`You failed to replace **${player_replacing.name}**...`,

	KIDNAPPED_PLAYER: (player_kindapped) =>
		`You kidnapped **${player_kindapped.name}**. They won't be able to speak or vote tonight and you attempted to roleblock them.`,

	ATTACK_BY_KIDNAPPED_PLAYER: (player_kindapped) =>
		`You kidnapped **${player_kindapped.name}**. They won't be able to speak or vote tonight and you attempted to roleblock them, but they were stronger than you thought and attacked you.`,

	KIDNAPPED: `You were kidnapped. You may not speak or vote for the rest of the day. In the meantime, edit your last will and strategize!`,

	UNKIDNAPPED: `You are no longer kidnapped. You may now speak and vote again.`,

	ATTACKED_KIDNAPPER: `You retaliated against your kidnapper and attacked them.`,

	ROLEBLOCKED_BY_KIDNAPPER: `Your kidnapper roleblocked you.`,

	ROLEBLOCKED_BY_KIDNAPPER_BUT_IMMUNE: `Your kidnapper attempted to roleblock you, but you were immune.`,

	WON_AS_FOOL: `You win! Your powers have awakened. You can use your death curse ability for only this night.`,

	WON_AS_EXECUTIONER: `You win! You have successfully gotten your target lynched. Do whatever you want now. You'll still win if you die.`,

	CONVERTED_TO_ROLE: (player_converting, last_role_name, new_role_name) =>
		`<@${player_converting.id}>\n# You've been converted from ${last_role_name} to ${new_role_name}`,

	KIDNAPPER_YELLS: (kidnapper_player, kidnapped_player, message) =>
		`_ _\n<@${kidnapper_player.id}> **${kidnapped_player.name}** screams at you:\n>>> ${message}`
});

module.exports = { COMMAND_EXPLANATIONS, Announcement, Feedback };