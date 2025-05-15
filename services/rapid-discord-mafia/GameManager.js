const { MessageDelays, RDMRoles, RoleNames, PhaseWaitTimes, RoleIdentifierTypes, CoinRewards, } = require("../../modules/enums.js");
const ids = require("../../bot-config/discord-ids.js");
const { PermissionFlagsBits, Role, Interaction } = require("discord.js");
const Death = require("./Death.js");
const PlayerManager = require("./PlayerManager.js");
const Player = require("./Player.js");
const {Arg, AbilityArgType, ArgumentSubtype} = require("./Arg.js");
const EffectManager = require("./EffectManager.js");
const AbilityManager = require("./AbilityManager.js");
const RoleManager = require("./RoleManager.js");
const {GameStateManager, Subphase, GameState} = require("./GameStateManager.js");
const GameDataManager = require("./GameDataManager.js");
const DiscordService = require("./DiscordService.js");
const { VoteManager, TrialVote, VotingOutcome, TrialOutcome } = require("./VoteManager.js");
const { toTitleCase } = require("../../utilities/text-formatting-utils.js");
const { getShuffledArray, getRandomElement } = require("../../utilities/data-structure-utils.js");
const { fetchChannel, fetchChannelsInCategory, fetchRDMGuild, fetchGuildMember, fetchRoleByName } = require("../../utilities/discord-fetch-utils.js");
const { addRoleToMember, removeRoleFromMember } = require("../../utilities/discord-action-utils.js");
const { wait } = require("../../utilities/realtime-utils.js");
const { Goal, Faction } = require("./Role.js");
// const Logger = require("./Logger.js");
const { Phase } = require("./GameStateManager.js");
const { Announcement, Feedback } = require("./constants/possible-messages.js");

class GameManager {
	/**
	 * The current phase the game is in
	 * @type {Phase}
	 */
	phase;

	/**
	 * The current subphase the game is in
	 * @type {Subphase}
	 */
	subphase;

	/**
	 * The current state the game is in
	 * @type {GameState}
	 */
	state;

	/**
	 * The number of FULL days that have passed (day and night phase). During night, half of a full day has passed
	 * @type {number}
	 */
	days_passed;

	/**
	 * An object map of players to the ability they performed
	 * @ type {{[player_name: string]: {by: PlayerName, name: AbilityName, args: {[ability_arg_name: string]: [ability_arg_value: string]}}}}
	*/
	abilities_performed;

	/**
	 * Whether this is a mock game used for testing or not
	 */
	isMockGame;

	/**
	 * @type {EffectManager}
	 */
	effect_manager;

	/**
	 * @type {AbilityManager}
	 */
	ability_manager;

	/**
	 * A player manager service to keep track of players in the game
	 * @type {PlayerManager}
	 */
	player_manager;

	/**
	 * A role manager service to manage roles and get role information
	 * @type {RoleManager}
	 */
	role_manager;

	/**
	 * A manager service to handles the logic of the game state and phase
	 * @type {GameStateManager}
	 */
	state_manager;

	/**
	 * A service to handle saving and loading the game
	 * @type {GameDataManager}
	 */
	data_manager;

	/**
	 * A service to handle sending and modifying discord messages
	 * @type {DiscordService}
	 */
	discord_service;

	/**
	 * A manager service to handle voting
	 * @type {VoteManager}
	 */
	vote_manager;

	/**
	 * A logger to log messages
	 * @type {Logger}
	 */
	logger;

	/**
	 * A list of all the next deaths to execute
	 * @type {Death[]}
	 */
	next_deaths;

	/**
	 * @param {Object} players
	 * @param {Logger} logger - An instance of a logger
	 * @param {boolean} isMockGame
	 */
	constructor(players, logger, isMockGame=false) {
		this.player_manager = new PlayerManager(players, this, logger, isMockGame);
		this.logger = logger;
		this.effect_manager = new EffectManager(this);
		this.ability_manager = new AbilityManager(this);
		this.role_manager = new RoleManager();
		this.data_manager = new GameDataManager(this);
		this.state_manager = new GameStateManager(this);
		this.vote_manager = new VoteManager(this);
		this.state_manager.initializeState();

		this.discord_service = new DiscordService({
			isMockService: isMockGame
		});

		this.timeout_counter = 0;
		this.votes = {};
		this.trial_votes = {};
		this.verdict = ""
		this.on_trial = ""
		/**
		 * {
				"victim": Player.name,
				"kills": {
						killer_name: Player.name,
						flavor_text: string
					}[]
				}
		 */
		this.next_deaths = [];
		this.winning_factions = [];
		this.winning_players = [];
		this.unshuffled_role_identifiers = [];
		this.role_identifiers = [];
		this.role_list = [];
		this.action_log = {};
		this.abilities_performed = {}
		this.isMockGame = isMockGame;
	}

	static IS_TESTING = true;
	static MAX_TIMEOUT_COUNTER = 3;
	static MIN_PLAYER_COUNT = 4;
	static MAX_MAFIA_TO_TOWN_RATIO = 2/3;
	static MAX_TOWN_TO_MAFIA_RATIO = 5;
	static POSSIBLE_FACTIONS = [
		"Mafia",
		"Town",
		...RoleManager.getListOfRoles()
			.filter((role) => `${role.faction} ${role.alignment}` === "Neutral Killing")
			.map((role) => role.name)
	];

	/**
	 * Looks at all the player's abilities performed fields and adds them to the current abilities performed
	 */
	async updateCurrentAbilitiesPerformed() {
		this.abilities_performed = await this.player_manager.getPlayerList()
		.filter(player =>  !player.isDoingNothing())
		.map(
			player => {
				return {
					by: player.name,
					...player.ability_doing // name & args
				}
			}
		)
		.reduce(
			(previous_abilties_done, ability_done) => {
				return {
					...previous_abilties_done,
					[ability_done.by]: ability_done,
				}
			},
			{}
		);
		this.sortAbilitiesPerformed();
	}

	/**
	 * Sorts all abilities performed in the game in order of priority
	 */
	async sortAbilitiesPerformed() {
		this.abilities_performed = Object.values(this.abilities_performed)
		.sort(
			(ability_done1, ability_done2) => {
				const ability1 = this.ability_manager.getAbility(ability_done1.name);
				const ability2 = this.ability_manager.getAbility(ability_done2.name);

				let ability1_priority = ability1.priority,
					ability2_priority = ability2.priority;

				return ability1_priority - ability2_priority;
			}
		)
		.reduce(
			(previous_abilties_done, ability_done) => {
				return {
					...previous_abilties_done,
					[ability_done.by]: ability_done,
				}
			},
			{}
		);
	}

	/**
	 * Starts the game
	 * @requires this.Players defined
	 * @param {RoleIdentifier[]} role_identifiers The unshuffled role identifier strings for the game
	 */
	async start(role_identifiers) {
		const
			unshuffled_role_identifiers = [...role_identifiers],
			shuffled_role_identifiers = getShuffledArray(role_identifiers),
			days_passed_at_sign_ups = 0;

		this.state_manager.changeToStarted();
		this.unshuffled_role_identifiers = unshuffled_role_identifiers;
		this.role_identifiers = shuffled_role_identifiers;
		this.timeout_counter = 0;
		this.votes = {};
		this.trial_votes = {};
		this.verdict = ""
		this.on_trial = ""
		this.next_deaths = [];
		this.winning_factions = [];
		this.winning_players = [];
		this.role_list = [];
		this.abilities_performed = {};
		this.player_manager.reset();

		await this.createRoleList();
		this.role_list = getShuffledArray(this.role_list);
		await this.assignRolesToPlayers();

		if (!this.isMockGame) {
			await GameManager.openGhostChannel();
			await this.announceRoleList(unshuffled_role_identifiers);
		}

		await this.announceMessages(
			Announcement.SHOW_LIVING_PLAYERS(this.player_manager.getAlivePlayerNames())
		);

		this.player_manager.getPlayerList().forEach(player => {
			player.role_log = player.role;
		})

		await this.startDay1(days_passed_at_sign_ups);
	}

	/**
	 * Sends a message with all the role identifiers for the game to the announcements and role list channel
	 * @param {RoleIdentifier[]} role_identifiers The unshuffled role identifiers for the game
	 */
	async announceRoleList(role_identifiers) {
		const rdm_guild = await fetchRDMGuild();
		const role_list_chnl = await fetchChannel(rdm_guild, ids.rapid_discord_mafia.channels.role_list);
		const announce_chnl = await fetchChannel(rdm_guild, ids.rapid_discord_mafia.channels.game_announce);
		const role_list_txt =
			`_ _` + "\n" +
			Announcement.SHOW_ROLE_LIST(role_identifiers)

		await announce_chnl.messages
			.fetchPinned()
			.then((pinned_msgs) => {
				pinned_msgs.each((msg) => msg.unpin().catch(console.error));
			})
			.catch(console.error);

		await role_list_chnl.messages
			.fetchPinned()
			.then((pinned_msgs) => {
				pinned_msgs.each((msg) => msg.edit(role_list_txt).catch(console.error));
			})
			.catch(console.error);

		const role_list_msg = await this.discord_service.announce(role_list_txt);
		role_list_msg.pin();
	}

	/**
	 * Uses the role list field to set the role of every player randomly
	 */
	async assignRolesToPlayers() {
		this.logger.logHeading("Assigning Roles To Players");

		for (let [role_index, role_name] of this.role_list.entries()) {
			const
				role = this.role_manager.getRole(role_name),
				players = this.player_manager.getPlayerList(),
				player = players[role_index];

			await player.setRole(role);
			this.logger.log(`Sent role info message, ${role.name}, to ${player.name}.`);
		}

		await this.giveAllExesTargets();
	}

	/**
	 * Sets and sends a target for all executioner players
	 */
	async giveAllExesTargets() {
		for (const player of this.player_manager.getPlayerList()) {

			if (player.role === RoleNames.Executioner) {
				const rand_town_player = getRandomElement(this.player_manager.getTownPlayers());

				if (rand_town_player)
					player.setExeTarget(rand_town_player);
				else {
					const fool_role = this.role_manager.getRole(RoleNames.Fool);
					this.player_manager.convertPlayerToRole(player, fool_role);
				}
			}
		}
	}

	/**
	 * Gets a list of possible roles a role identifier could be
	 * @param {RoleIdentifier} role_identifier
	 * @param {{[faction_name: String]: Number}} num_roles_in_faction A dictionary which keeps track of the number of roles that exist for each faction
	 * @returns {Role[]} An array of all possible roles a role identifier could roll as
	 */
	getPossibleRolesFromIdentifier(role_identifier, num_roles_in_faction) {
		const
			existing_factions = Object.keys(num_roles_in_faction),
			needOpposingFactions = existing_factions.length <= 1;

		let possible_roles = role_identifier.getPossibleRoles();

		if (role_identifier.type === RoleIdentifierTypes.AnyRole) {

			// ! Filter out existing factions if we need an opposing faction
			if (needOpposingFactions) {
				possible_roles = possible_roles.filter(role =>
					existing_factions.every(existing_faction =>
						!GameManager.isRoleInFaction(role, existing_faction)
					) &&
					GameManager.POSSIBLE_FACTIONS.some(faction =>
						GameManager.isRoleInFaction(role, faction)
					)
				)
			}

			// ! Filter out Mafia/Town if adding them exceed max Mafia/Town ratio
			if (
				existing_factions.includes(Faction.MAFIA) &&
				existing_factions.includes(Faction.TOWN)
			) {
				const mafia_to_town_ratio = num_roles_in_faction[Faction.MAFIA] / num_roles_in_faction[Faction.TOWN];
				const town_to_mafia_ratio = num_roles_in_faction[Faction.TOWN] / num_roles_in_faction[Faction.MAFIA];

				if (mafia_to_town_ratio >= GameManager.MAX_MAFIA_TO_TOWN_RATIO) {
					possible_roles = possible_roles.filter(role => role.faction !== Faction.MAFIA)
				}
				if (town_to_mafia_ratio >= GameManager.MAX_TOWN_TO_MAFIA_RATIO) {
					possible_roles = possible_roles.filter(role => role.faction !== Faction.TOWN)
				}
			}

			// ! Filter out Non-Mafioso Mafia if Mafioso doesn't exist yet
			if (!this.role_list.includes(RoleNames.Mafioso)) {
				possible_roles = possible_roles.filter(role =>
					role.faction !== Faction.MAFIA ||
					role.name === RoleNames.Mafioso
				)
			}

			// ! Filter out unique roles if they exist already
			possible_roles = possible_roles.filter( role =>
				!(
					role.isUnique &&
					(this.role_list.includes(role.name) ||
					this.role_identifiers.some(identifier => identifier.name === role.name))
				)
			);
		}
		else if ([RoleIdentifierTypes.RandomRoleInFaction, RoleIdentifierTypes.RandomRoleInFactionAlignment].includes(role_identifier.type)) {
			// ! Filter out existing factions if we need an opposing faction
			const old_possible_roles = possible_roles;
			if (needOpposingFactions) {
				possible_roles = possible_roles.filter(role =>
					existing_factions.every(existing_faction =>
						!GameManager.isRoleInFaction(role, existing_faction)
					) &&
					GameManager.POSSIBLE_FACTIONS.some(faction =>
						GameManager.isRoleInFaction(role, faction)
					)
				)
			}
			if (possible_roles.length <= 0) possible_roles = old_possible_roles;

			// ! Filter out Non-Mafioso Mafia if Mafioso doesn't exist yet
			if (!this.role_list.includes(RoleNames.Mafioso)) {
				possible_roles = possible_roles.filter(role =>
					role.faction !== Faction.MAFIA ||
					role.name === RoleNames.Mafioso
				)
			}

			// ! Filter out unique roles if they exist already
			possible_roles = possible_roles.filter( role =>
				!(
					role.isUnique &&
					(this.role_list.includes(role.name) ||
					this.role_identifiers.some(identifier => identifier.name === role.name))
				)
			);
		}

		return possible_roles;
	}

	/**
	 * Gets a random role from a role identifier
	 * @param {RoleIdentifier} role_identifier
	 * @param {{[faction_name: String]: Number}} num_roles_in_faction A dictionary which keeps track of the number of roles that exist for each faction
	 * @returns {Role} The random role the role identifier rolled
	 */
	getRoleFromRoleIdentifier(role_identifier, num_roles_in_faction) {
		const possible_roles = this.getPossibleRolesFromIdentifier(role_identifier, num_roles_in_faction);
		const chosen_role = getRandomElement(possible_roles);

		// Add faction to list of existing factions
		const chosen_role_faction = GameManager.POSSIBLE_FACTIONS.find(faction =>
			GameManager.isRoleInFaction(chosen_role, faction)
		)

		if (chosen_role_faction) {
			if (num_roles_in_faction[chosen_role_faction])
				num_roles_in_faction[chosen_role_faction] += 1;
			else
				num_roles_in_faction[chosen_role_faction] = 1;
		}

		return chosen_role
	}

	/**
	 * Creates and sets the role list based off the current role identifiers
	 * @requires this.role_identifiers defined
	 */
	async createRoleList() {
		let num_roles_in_faction = {}

		const sorted_role_identifiers =
			this.role_identifiers.sort(
				(role_identifier1, role_identifier2) => {
					return role_identifier1.priority - role_identifier2.priority;
				}
			);

		for (const role_identifier of sorted_role_identifiers) {
			const chosen_role = this.getRoleFromRoleIdentifier(role_identifier, num_roles_in_faction)

			this.role_list.push(chosen_role.name);
		}
	}

	/**
	 * Switches the current phase to the next one
	 */
	async setPhaseToNextPhase() {
		this.state_manager.changeToNextSubphase();
	}

	async killDeadPlayers() {
		await this.announceAllDeaths();
		await this.announceMessages(
			Announcement.SHOW_LIVING_PLAYERS(this.player_manager.getAlivePlayerNames())
		);

		/**
		 * {
				"victim": Player.name,
				"kills": {
						killer_name: Player.name,
						flavor_text: string
					}[]
				}
		 */
		for (let death of this.next_deaths) {
			const victim_player = this.player_manager.get(death.victim);
			await victim_player.kill(death);
		}


		if (this.getWhichFactionWon()) {
			await this.endGame();
			return "all";
		}

		await this.updateTimeoutCounter();
		this.resetDeaths();
	}

	async remindPlayersTo(reminder, votersOnly=false) {
		for (const player_name of this.player_manager.getAlivePlayerNames()) {
			const player = this.player_manager.get(player_name);

			if (votersOnly) {
				if (!player.canVote)
					continue;
			}

			await player.sendFeedback(`> ${reminder}`);
		}
	}

	async updateTimeoutCounter() {
		if (this.next_deaths.length <= 0) {
			if (this.state_manager.isInAnnouncementsPhase()) {
				this.timeout_counter += 1;

				if (this.timeout_counter >= GameManager.MAX_TIMEOUT_COUNTER) {
					await this.announceMessages(
						Announcement.DRAW_GAME_FROM_TIMEOUT(this.timeout_counter) + "\n_ _"
					);
					await this.endGame();
				}
				else {
					await this.announceMessages(
						Announcement.TIMEOUT_WARNING(GameManager.MAX_TIMEOUT_COUNTER, this.timeout_counter) + `\n`
					);
				}
			}
		}
		else {
			this.resetTimeout();
		}
	}

	async resetPlayerOnTrial() {
		const player_on_trial = this.player_manager.get(this.on_trial);

		if (!this.isMockGame) {
			const rdm_guild = await fetchRDMGuild();
			const on_trial_role = await fetchRoleByName(rdm_guild, RDMRoles.OnTrial);
			const player_guild_member = await fetchGuildMember(rdm_guild, player_on_trial.id);

			await removeRoleFromMember(player_guild_member, on_trial_role);
		}

		this.on_trial = "";
	}

	async lynchPlayerOnTrial() {
		const player_on_trial = this.player_manager.get(this.on_trial);

		const death = new Death({
			victim: player_on_trial.name
		});
		death.setToLynch();

		await player_on_trial.kill(death);

		if (player_on_trial.role === RoleNames.Fool) {
			await player_on_trial.sendFeedback(Feedback.WON_AS_FOOL);

			await this.announceMessages("_ _\n" + Announcement.LYNCHED_FOOL);

			const players_voting_guilty =
				Object.entries(this.trial_votes)
					.filter(entry => entry[1] === TrialVote.GUILTY)
					.map(entry => entry[0]);

			player_on_trial.players_can_use_on = players_voting_guilty;
			player_on_trial.isInLimbo = true;
			player_on_trial.hasWon = true;

			this.winning_factions.push("Fool");
			this.winning_players.push(this.name);

		}


		let executioners = this.player_manager.getExecutioners();

		for (let exe of executioners) {

			if ( exe.exe_target === player_on_trial.name ) {
				const exe_player = this.player_manager.get(exe.name);
				await exe_player.sendFeedback(Feedback.WON_AS_EXECUTIONER);
				this.makePlayerAWinner(exe_player);
			}
		}

		const death_messages = this.getDeathMessages(death, "lynch");
		await this.announceMessages(...death_messages);

		this.resetTimeout();
	}

	async announceRevealedVotes() {
		let messages = [
			`_ _\n## Revealed Votes`
		];

		for (const voter in this.trial_votes) {
			const vote = this.trial_votes[voter];
			messages.push(`**${voter}** voted **${toTitleCase(vote)}**.`)
		}

		this.announceMessages(messages.join("\n"));
	}

	async announceTrialVerdict() {
		let trial_outcome_message = ""
		const player_on_trial = this.player_manager.get(this.on_trial);

		if (this.verdict === TrialOutcome.TIE) {
			trial_outcome_message = Announcement.TRIAL_OUTCOME_TIE(player_on_trial);
		}
		else if (this.verdict === TrialOutcome.NO_VOTES) {
			trial_outcome_message = Announcement.TRIAL_OUTCOME_NO_VOTES(player_on_trial);
		}
		else if (this.verdict === TrialOutcome.INNOCENT) {
			trial_outcome_message = Announcement.TRIAL_OUTCOME_INNOCENT(player_on_trial);
		}
		else if (this.verdict === TrialOutcome.GUILTY) {
			trial_outcome_message = Announcement.TRIAL_OUTCOME_GUILTY(player_on_trial);
		}

		await this.announceMessages(
			Announcement.TRIAL_OVER(ids.rapid_discord_mafia.roles.living),
			trial_outcome_message,
		);
	}

	async givePlayerOnTrialRole(player_on_trial) {
		if (!this.isMockGame) {
			const rdm_guild = await fetchRDMGuild();
			const on_trial_role = await fetchRoleByName(rdm_guild, RDMRoles.OnTrial);
			const player_guild_member = await fetchGuildMember(rdm_guild, player_on_trial.id);

			await addRoleToMember(player_guild_member, on_trial_role);
		}
	}

	async announceVotingResults() {
		this.logger.log(`Announcing ${this.on_trial} On Trial.`);

		const voting_outcome = this.on_trial;

		await this.announceMessages(
			Announcement.VOTING_OVER(ids.rapid_discord_mafia.roles.living)
		);

		let voting_outcome_message = ""

		if (voting_outcome === VotingOutcome.NOBODY) {
			voting_outcome_message = Announcement.VOTING_OUTCOME_NOBODY;
		}
		else if (voting_outcome == VotingOutcome.TIE) {
			voting_outcome_message = Announcement.VOTING_OUTCOME_TIE;
		}
		else if (voting_outcome == VotingOutcome.NO_VOTES) {
			voting_outcome_message = Announcement.VOTING_OUTCOME_NO_VOTES;
		}
		else {
			voting_outcome_message = Announcement.VOTING_OUTCOME_PLAYER(voting_outcome);
		}

		await this.announceMessages(
			voting_outcome_message
		);
	}

	async performCurrentNightAbilities() {
		this.logger.logSubheading("Performing Night Abilities");

		await this.updateCurrentAbilitiesPerformed();
		this.logger.logDebug("Abilities To Perform:")
		this.logger.logDebug(this.abilities_performed);

		this.action_log[this.state_manager.day_num-1] = [];

		for (let i = 0; i < Object.keys(this.abilities_performed).length; i++) {
			let player_name = Object.keys(this.abilities_performed)[i],
				player = this.player_manager.get(player_name),
				ability_performed = this.abilities_performed[player_name],
				ability = this.ability_manager.getAbility(ability_performed.name);

			let arg_values_txt = "";
			if (Object.values(ability_performed.args) > 0) {

				arg_values_txt =
					" with the arguments " +
					Object.entries(arg_values).map((entry) => {
						let name = entry[0];
						let value = entry[1];

						return `**${name}**: **${value}**`
					}).join(", ");
			}

			this.logger.log(
				ability.feedback(
					...Object.values(ability_performed.args),
					player.name,
					false
				)
			);

			this.action_log[this.state_manager.day_num-1].push(
				ability.feedback(
					...Object.values(ability_performed.args),
					player.name,
					false
				)
			);

			if (this.player_manager.get(player_name).isRoleblocked) {
				this.logger.log(`${player_name} is roleblocked, so they can't do ${ability_performed.name}`);
				continue;
			}

			if (ability.effects) {
				const player_using_ability_name = ability_performed.by;
				const player_using_ability = this.player_manager.get(player_using_ability_name);

				const ability_name = ability_performed.name;
				const ability_using = this.ability_manager.getAbility(ability_name);

				const arg_values = ability_performed.args ?? {};

				for (let effect_name of ability.effects) {
					await this.effect_manager.useEffect({
						effect_name: effect_name,
						player_using_ability: player_using_ability,
						ability: ability_using,
						arg_values: arg_values,
					});
				}

				console.table(this.abilities_performed);
			}
		}
	}

	async announceAllDeaths() {
		for (let death of this.next_deaths) {
			this.logger.log(`Killing ${death.victim}`);
			this.player_manager.get(death.victim).isAlive = false;

			const death_messages = this.getDeathMessages(death);
			await this.announceMessages(...death_messages);
		}
	}

	async announceDay() {
		const phase_num = this.state_manager.day_num;

		await this.announceMessages(
			...Announcement.START_DAY(ids.rapid_discord_mafia.roles.living, phase_num)
		);

		this.logger.log(`Announced Day ${phase_num}.`);
	}


	async announceNight() {
		const night_num = this.state_manager.day_num;

		await this.remindPlayersTo(Announcement.USE_NIGHT_ABILITY_REMINDER);

		await this.announceMessages(
			...Announcement.START_NIGHT(ids.rapid_discord_mafia.roles.living, night_num),
		);

		this.logger.log(`Announced Night ${night_num}.`);
	}

	isRoleInMissingFaction(role, missing_factions) {
		return missing_factions.some((missing_faction) => {
			return GameManager.isRoleInFaction(role, missing_faction);
		});
	}

	isIdentifierInMissingFaction(identifier, missing_factions) {
		return missing_factions.some((missing_faction) => {
			if (identifier.faction == "Any")
				return true;
			else if (Object.values(Faction).includes(missing_faction))
				return identifier.faction === missing_faction;
			else
				return identifier.faction === "Neutral" && ["Killing", "Random"].includes(identifier.alignment);
		});
	}

	addDeath(player, killer, flavor_text) {
		this.logger.log(this.next_deaths)
		const death_index = this.next_deaths.findIndex(
			death => death.victim == player.name
		);

		if (death_index == -1) {
			const death = new Death({
				victim: player.name,
			});
			death.addKill(killer, flavor_text);
			this.next_deaths.push(death);
		}
		else {
			this.next_deaths[death_index].addKill(killer, flavor_text);
		}

	}

	makePlayerDoAbility({player, ability_name, ability_arguments}) {
		this.abilities_performed[player.name] =
			{
				"name": ability_name,
				"by": player.name,
				"args": ability_arguments
			}
		this.sortAbilitiesPerformed();
	}

	getMajorityVote(votes) {
		let majority_vote = VotingOutcome.NO_VOTES,
			vote_counts = {},
			max_vote_count = 0;

		for (let voter in votes) {
			let vote = votes[voter];

			if (vote.toLowerCase() == TrialVote.ABSTAIN)
				continue;

			if (!vote_counts[vote])
				vote_counts[vote] = 1;
			else
				vote_counts[vote] += 1;

			if (vote_counts[vote] > max_vote_count) {
				max_vote_count = vote_counts[vote];
				majority_vote = vote;
			}
			else if (vote_counts[vote] == max_vote_count) {
				majority_vote = VotingOutcome.TIE;
			}
		}

		return majority_vote;
	}

	static isRoleInFaction(role, faction) {
		if (Object.values(Faction).includes(faction)) {
			return role.faction === faction;
		} else {
			return role.name === faction;
		}
	}

	static isRoleInPossibleFaction(role) {
		return GameManager.POSSIBLE_FACTIONS.some(faction =>
			GameManager.isRoleInFaction(role, faction)
		)
	}

	async sendFeedbackToPlayers() {

		for (let player_name of this.player_manager.getPlayerNames()) {
			const
				player = this.player_manager.get(player_name),
				player_feedback = player.feedback,
				player_id = player.id;

			if (player_feedback.length <= 0)
				continue;

			await player.sendFeedback(
				`<@${player_id}> ` +
				player_feedback.join("\n")
			)
		}
	}

	setRoleIdentfiers(role_identifiers) {
		this.role_identifiers = role_identifiers;
	}

	resetVotes() {
		this.votes = {};
	}

	resetVerdict() {
		this.verdict = "";
	}

	resetTrialVotes() {
		this.trial_votes = {};
	}

	resetTimeout() {
		this.timeout_counter = 0;
	}

	resetDeaths() {
		this.next_deaths = [];
	}

	async resetAllPlayersNightInfo() {
		this.logger.log("Reseting Every Player's Night Info");

		for (const player_name of this.player_manager.getPlayerNames()) {
			const player = this.player_manager.get(player_name);

			player.resetVisiting();
			player.resetAbilityDoing();
			player.resetFeedback();

			if (player.affected_by) {
				await this.player_manager.removeAffectsFromPlayer(player);
			}
		}
	}

	async announceMessages(...messages) {
		for (let message of messages) {
			await this.discord_service.announce(message);

			if (!this.isMockGame && !GameManager.IS_TESTING)
				await wait({seconds: MessageDelays.Normal});
		}
	}

	async startDay1(days_passed_at_sign_ups) {
		if (!this.state_manager.canStartFirstDay()) {
			return false;
		}

		this.state_manager.setToFirstDay();
		const day_first_day_ended = this.days_passed;
		await this.data_manager.saveToGithub();

		this.logger.log("Incrementing Inactvity")
		if (!GameManager.IS_TESTING) this.player_manager.incrementInactvity();

		if (!this.isMockGame)
			await GameManager.closePreGameChannels();

		await this.announceMessages(
			...Announcement.GAME_STARTED(ids.rapid_discord_mafia.roles.living, ids.rapid_discord_mafia.channels.role_list)
		)

		this.announceMessages(
			...Announcement.DAY_ONE_STARTED
		)

		if (!this.isMockGame) {
			await GameManager.openDayChat();
			await this.discord_service.announce(Announcement.OPEN_DAY_CHAT(ids.rapid_discord_mafia.channels.town_discussion));
		}

		this.logger.log("Waiting For Day 1 to End");

		if (!this.isMockGame) {
			await wait({minutes: PhaseWaitTimes.FirstDay});
			await this.startNight(day_first_day_ended);
		}
	}

	async startDay(days_passed_last_night) {
		if (!this.state_manager.canStartDay(days_passed_last_night)) {
			return
		}

		this.state_manager.setToDay();
		const days_passed_last_day = this.days_passed;
		await this.data_manager.saveToGithub();

		this.logger.log("Incrementing Inactvity")
		if (!GameManager.IS_TESTING) this.player_manager.incrementInactvity();

		for (const player of this.player_manager.getPlayersInLimbo()) {
			player.isInLimbo = false;
		}

		if (!this.isMockGame)
			await GameManager.closeNightChannels();

		await this.performCurrentNightAbilities();
		await this.sendFeedbackToPlayers();
		await this.announceDay();

		if (await this.killDeadPlayers() === "all")
			return;

		if (!this.isMockGame) {
			await GameManager.openDayChat();
			await this.discord_service.announce(Announcement.OPEN_DAY_CHAT(day_chat_chnl.id));
		}

		await this.startVoting(days_passed_last_day);
	}

	async startVoting(days_passed_last_day) {
		if (!this.state_manager.canStartVoting(days_passed_last_day)) {
			return
		}

		this.state_manager.setToVoting();
		const days_passed_last_voting = this.days_passed;

		this.resetVotes();
		this.remindPlayersTo(Announcement.VOTING_REMINDER, true);
		this.announceMessages(
			...Announcement.START_VOTING
		);

		this.logger.log("Waiting for Voting to End");

		if (!this.isMockGame) {
			await wait({minutes: PhaseWaitTimes.Voting*4/5});

			if (!this.state_manager.canStartTrial(days_passed_last_voting)) {
				this.announceMessages(
					Announcement.PHASE_ALMOST_OVER_WARNING(PhaseWaitTimes.Voting*1/5)
				)
			}

			await wait({minutes: PhaseWaitTimes.Voting*1/5});

			this.startTrial(days_passed_last_voting);
		}
	}

	async startTrial(days_passed_last_voting) {
		if (!this.state_manager.canStartTrial(days_passed_last_voting)) {
			return
		}

		this.state_manager.setToTrial();
		const days_passed_last_trial = this.days_passed;
		await this.data_manager.saveToGithub();

		this.resetTrialVotes();
		this.resetVerdict();
		this.on_trial = this.getMajorityVote(this.votes);

		this.logger.log("Incrementing Inactvity")
		if (!GameManager.IS_TESTING) this.player_manager.incrementInactvity();

		if (await this.killDeadPlayers() === "all")
			return;

		await this.announceVotingResults();

		const alive_player_names = this.player_manager.getAlivePlayerNames();

		// If non-player voting outcome, skip to night
		if (!alive_player_names.includes(this.on_trial)) {
			await this.startNight(days_passed_last_trial);
			return;
		}

		const player_on_trial = this.player_manager.get(this.on_trial);

		await this.announceMessages(...Announcement.START_TRIAL(player_on_trial));
		await this.givePlayerOnTrialRole(player_on_trial);
		await this.announceMessages(
			Announcement.ON_TRIAL_PLAYER_GIVE_DEFENSE(ids.rapid_discord_mafia.roles.on_trial),
		);
		this.remindPlayersTo(Announcement.TRIAL_VOTING_REMINDER(player_on_trial), true);

		this.logger.log("Waiting for Trial Voting to End");

		if (!this.isMockGame) {
			await wait({minutes: PhaseWaitTimes.Trial*4/5});

			if (!this.state_manager.canStartTrialResults(days_passed_last_trial)) {
				this.announceMessages(
					Announcement.PHASE_ALMOST_OVER_WARNING(PhaseWaitTimes.Trial*1/5)
				)
			}

			await wait({minutes: PhaseWaitTimes.Trial*1/5});

			await this.startTrialResults(days_passed_last_trial);
		}
	}

	async startTrialResults(days_passed_last_trial) {
		if (!this.state_manager.canStartTrialResults(days_passed_last_trial)) {
			return
		}

		this.state_manager.setToTrialResults();
		const days_passed_last_trial_results = this.days_passed;

		this.verdict = this.getMajorityVote(this.trial_votes);

		await this.announceTrialVerdict();
		await this.announceRevealedVotes();

		if (this.verdict === TrialOutcome.GUILTY) {
			await this.lynchPlayerOnTrial();
		}

		await this.resetPlayerOnTrial();

		if (await this.killDeadPlayers() === "all")
			return;

		const winning_factions = this.getWhichFactionWon();

		if (winning_factions) {
			return await this.endGame();
		}
		else {
			await this.startNight(days_passed_last_trial_results);
		}
	}

	async startNight(days_passed_last_day) {
		if (!this.state_manager.canStartNight(days_passed_last_day)) {
			return
		}

		this.state_manager.setToNight();
		const days_passed_last_night = this.days_passed;
		await this.data_manager.saveToGithub();
		this.logger.logDebug("saved");

		if (!this.isMockGame) {
			await GameManager.closeDayChat();
			await GameManager.openNightChannels();
		}
		this.logger.logDebug("channels");

		await this.resetAllPlayersNightInfo();
		await this.promoteMafia();

		await this.announceNight();

		this.logger.log("Waiting for Night to End");

		if (!this.isMockGame) {
			await wait({minutes: PhaseWaitTimes.Night * 4/5});

			if (!this.state_manager.canStartDay(days_passed_last_night)) {
				this.announceMessages(
					Announcement.PHASE_ALMOST_OVER_WARNING(PhaseWaitTimes.Night*1/5)
				)
			}

			await wait({minutes: PhaseWaitTimes.Night * 1/5});

			await this.startDay(days_passed_last_night);
		}
	}

	static async getAlivePlayersAutocomplete(interaction) {
		let autocomplete_values;
		const focused_param = await interaction.options.getFocused(true);
		if (!focused_param) return;
		const entered_value = focused_param.value;

		autocomplete_values = global.game_manager.player_manager.getAlivePlayers()
			.map((player) => {return {name: player.name, value: player.name}})
			.filter(autocomplete_entry => autocomplete_entry.value.toLowerCase().startsWith(entered_value.toLowerCase()));

		if (Object.values(autocomplete_values).length <= 0) {
			autocomplete_values = [{name: "Sorry, there are no alive players to choose from", value: "N/A"}];
		}
		else if (Object.values(autocomplete_values).length > 25) {
			autocomplete_values.splice(25);
		}

		await interaction.respond(
			autocomplete_values
		);
	}

	/**
	 * Adds a player to the game, giving them roles and their own channel
	 * @param {string} player_name Unique name for player
	 * @param {string} player_id Discord id of player
	 * @param {Interaction} interaction Interaction to reply on invalid name
	 * @param {boolean} isMockUser Whether this is a mock player
	 */
	async addPlayerToGame(player_name, player_id, interaction, isMockUser=false) {
		let player_member;

		if ( this.player_manager && this.player_manager.get(player_name) ) {
			if (!this.isMockGame)
				await interaction.editReply(`The name, **${player_name}**, already exists.`);
			return new Player({}, this.logger);
		}

		const validateName = (name) => {
			const nameRegex = /^[a-zA-Z0-9 ]+$/;

			if ( name.length > 32 ) {
				return `Your name must be under 32 characters. It's currently ${name.length} characters.`
			}

			// Checks if username has letters or numbers
			if ( !nameRegex.test(name) ) {
				return `Your name must only have letters and numbers in it.`;
			}

			return true;
		};

		const validator_result = validateName(player_name);
		if (validator_result !== true) {
			if (!this.isMockGame)
				await interaction.editReply(validator_result);
			return new Player({}, this.logger);
		}

		if (!isMockUser && !this.isMockGame) {
			const rdm_guild = await fetchRDMGuild();

			player_member = await fetchGuildMember(rdm_guild, player_id);
			const
				spectator_role = await fetchRoleByName(rdm_guild, RDMRoles.Spectator),
				living_role = await fetchRoleByName(rdm_guild, RDMRoles.Living);

			// Adds & Removes Roles and Sets Nickname to name
			await player_member.roles.add(living_role).catch(console.error());
			await player_member.roles.remove(spectator_role).catch(console.error());
			await player_member.setNickname(player_name).catch(console.error());
		}

		let player_obj = {id: player_id, name: player_name};

		if (this.isMockGame)
			player_obj.isMockPlayer = true;

		const player = await this.player_manager.addPlayerFromObj(player_obj);

		await player.createChannel();
		this.logger.log(`**${player_name}** added to the game.`);

		this.announceMessages(
			`**${player_name}** joined the game`
		);

		return player;
	}

	getWhichFactionWon() {
		let winning_faction = false,
			winning_players = [],
			living_factions = [], // Factions that just need the other factions eliminated to win
			living_lone_survival_roles = [], // Roles that need to survive while eliminating every other faction
			living_survival_roles = [], // Roles that only need to survive to the end
			living_survive_without_town_roles = [], // Roles that only need to survive to the end
			alive_players = this.player_manager.getAlivePlayers()

		for (let player_info of alive_players) {
			const player_role = this.role_manager.getRole(player_info.role);

			// Roles that need to survive while eliminating every other faction
			if (player_role.goal == Goal.SURVIVE_ELIMINATED_OTHER_FACTIONS) {
				if (!living_lone_survival_roles.includes(player_role.name))
					living_lone_survival_roles.push(player_role.name);
			}
			// Roles that only need to survive to the end
			else if (player_role.goal == Goal.SURVIVE) {
				if (!living_survival_roles.includes(player_role.name))
					living_survival_roles.push(player_role.name);
			}
			// Roles that need to survive while town loses
			else if (player_role.goal == Goal.SURVIVE_UNTIL_TOWN_LOSES) {
				if (!living_survive_without_town_roles.includes(player_role.faction))
				living_survive_without_town_roles.push(player_role.faction);

			}
			// Factions that just need the other factions eliminated to win
			else if (player_role.goal == Goal.ELIMINATE_OTHER_FACTIONS) {
				if (!living_factions.includes(player_role.faction))
					living_factions.push(player_role.faction);
			}
		}

		if (alive_players.length <= 0)
			winning_faction = "Nobody";

		for (let faction_checking of living_factions) {
			if (winning_faction) break;
			let hasFactionWon = true;

			for (let player of alive_players) {
				let player_role = this.role_manager.getRole(player.role),
					player_faction = player_role.faction,
					player_role_indentifier = `${player_faction} ${player_role.alignment}`;

				if (
					player_faction != faction_checking  &&
					!["Neutral Evil", "Neutral Chaos", "Neutral Benign"].includes(player_role_indentifier)
				) {
					hasFactionWon = false;
					break;
				}
			}

			if (hasFactionWon) {
				winning_faction = faction_checking;
				winning_players = [
					...winning_players,
					...this.player_manager.getPlayerList()
						.filter(p =>
							this.role_manager.getRole(p.role).faction == faction_checking && !winning_players.includes(p.name)
						)
						.map(p => p.name)
				];
				break;
			}

		}

		for (let role_checking of living_lone_survival_roles) {

			if (winning_faction) break;

			let hasFactionWon = true;

			for (let player of alive_players) {
				let player_role = this.role_manager.getRole(player.role),
					player_faction = player_role.faction,
					player_role_indentifier = `${player_faction} ${player_role.alignment}`;

				if (
					player_role.name != role_checking  &&
					!["Neutral Evil", "Neutral Chaos", "Neutral Benign"].includes(player_role_indentifier)
				) {
					hasFactionWon = false;
					break;
				}
			}

			if (hasFactionWon) {
				winning_faction = role_checking;
				winning_players = [
					...winning_players,
					...alive_players
						.filter(p =>
							p.role == role_checking && !winning_players.includes(p.name)
						)
						.map(p => p.name)
				];
				break;
			}

		}

		for (let role_checking of living_survival_roles) {
			winning_players = [
				...winning_players,
				...alive_players
					.filter(p => p.role == role_checking && !winning_players.includes(p.name))
					.map(p => p.name)
			];

			if (!winning_faction) {
				let hasFactionWon = !alive_players.some(player => this.role_manager.getRole(player.role).name != role_checking);

				if (hasFactionWon) {
					winning_faction = role_checking;
				}
			}
		}

		for (let role_checking of living_survival_roles) {
			if (winning_faction === Faction.TOWN) break;
			winning_players = [
				...winning_players,
				...alive_players
					.filter(p => p.role == role_checking && !winning_players.includes(p.name))
					.map(p => p.name)
			];

			if (!winning_faction) {
				let hasFactionWon = !alive_players.some(player => this.role_manager.getRole(player.role).name != role_checking);

				if (hasFactionWon) {
					winning_faction = role_checking;
				}
			}
		}

		if (winning_faction) {
			if (this.winning_factions.length <= 0) {
				this.winning_factions = [winning_faction];
				this.winning_players = winning_players;
			}
			else {
				this.winning_factions.push(winning_faction);
				this.winning_players = [
					...this.winning_players,
					...winning_players
				];
			}
		}

		return winning_faction
	}

	/**
	 * Gets death messages to announce from a death
	 * @param {Death} death
	 * @param {string} type the type of death
	 * @returns {String[]} the death messages to announce
	 */
	getDeathMessages(death, type="attack") {
		let victim_name = death.victim,
			victim_player = this.player_manager.get(victim_name),
			death_announcement_msgs = [];

		// Make cause of death message
		if (type == "attack") {
			death_announcement_msgs.push(`_ _\n${Announcement.PLAYER_FOUND_DEAD(victim_player)}`);


			for (let [index, kill] of death.kills.entries()) {
				const killer = this.player_manager.get(kill.killer_name);

				if (kill.flavor_text) {
					death_announcement_msgs.push(kill.flavor_text);
				}
				else if (
					[RoleNames.Mafioso, RoleNames.Godfather].includes(kill.killer_role)
				) {
					if (index == 0)
						death_announcement_msgs.push(
							`\n` + Feedback.ANNOUNCE_MURDER_BY_FACTION(Faction.MAFIA)
						);
					else
						death_announcement_msgs.push(
							`\n` + Feedback.ANNOUNCE_ANOTHER_MURDER_BY_FACTION(Faction.MAFIA)
						);
				}
				else {
					if (index == 0)
						death_announcement_msgs.push(
							`\n` + Feedback.ANNOUNCE_MURDER_BY_ROLE(kill.killer_role)
						);
					else
					death_announcement_msgs.push(
						`\n` + Feedback.ANNOUNCE_ANOTHER_MURDER_BY_ROLE(kill.killer_role)
					);
				}

				if (killer && killer.death_note)
					death_announcement_msgs.push(`The killer left behind a death note: \`\`\`${killer.death_note}\`\`\``);

			}
		}
		else if (type == "lynch") {
			death_announcement_msgs.push(`_ _\n:skull: **${victim_player.name}** was **lynched** by the town.`);
		}


		// Make last will message
		if (victim_player.isUnidentifiable) {
			death_announcement_msgs.push(Announcement.LAST_WILL_UNIDENTIFIABLE)
		}
		else if (!victim_player.last_will) {
			death_announcement_msgs.push(Announcement.LAST_WILL_NOT_FOUND)
		}
		else {
			death_announcement_msgs.push(Announcement.LAST_WILL_FOUND(victim_player.last_will));
		}

		// Make role reveal message
		if (victim_player.isUnidentifiable) {
			death_announcement_msgs.push(Announcement.ROLE_IS_UNIDENTIFIABLE(victim_player));
		}
		else {
			death_announcement_msgs.push(Announcement.ROLE_REVEAL(victim_player));
		}

		return death_announcement_msgs;
	}

	async promoteMafia() {
		if (this.player_manager.isFactionAlive(Faction.MAFIA)) {
			if (
				!this.player_manager.isRoleAlive(RoleNames.Mafioso) &&
				!this.player_manager.isRoleAlive(RoleNames.Godfather)
			) {
				const mafia_players = this.player_manager.getAlivePlayersInFaction(Faction.MAFIA)

				const player_to_promote = getRandomElement(mafia_players);
				const mafioso_role = this.role_manager.getRole(RoleNames.Mafioso);
				this.player_manager.convertPlayerToRole(player_to_promote, mafioso_role);

				this.discord_service.sendToMafia(`**${player_to_promote.name}** has been promoted to **Mafioso**!`);
				this.logger.log(`**${player_to_promote.name}** has been promoted to **Mafioso**`);
			}
		}
	}

	async endGame(isDraw=false) {
		if (!isDraw) {
			await this.announceMessages(
				...Announcement.CONGRATULATE_WINNERS(this.winning_factions, this.winning_players)
			);
		}
		else {
			await this.announceMessages(
				"The game ends in a draw :/"
			);
		}

		this.player_manager.getPlayerList().forEach(async player => {
			const contestant = global.rapid_discord_mafia.getContestantFromPlayer(player);
			contestant.giveCoins(CoinRewards.Participation);
		});

		await global.game_manager.announceMessages(
			Announcement.REWARD_COINS_TO_PLAYERS(
				this.player_manager.getPlayerList().map(player => player.name),
				CoinRewards.Participation
			)
		);

		this.winning_players.forEach(async player_name => {
			const player = this.player_manager.get(player_name);
			const contestant = global.rapid_discord_mafia.getContestantFromPlayer(player);
			const coins_rewarded = CoinRewards.Winning;

			contestant.giveCoins(coins_rewarded);

			await global.game_manager.announceMessages(
				Announcement.REWARD_COINS_TO_PLAYER(player.name, coins_rewarded)
			);
		});
		await this.data_manager.saveToGithub();

		let revealed_roles_msg = "_ _\n# Everyone's Roles\n>>> "
		for (const player of this.player_manager.getPlayerList()) {
			const role_log = player.role_log;
			revealed_roles_msg += `**${player.name}**: ${role_log}\n`
		}

		await this.announceMessages(
			revealed_roles_msg
		);

		for (const day_num in this.action_log) {
			const actions = this.action_log[day_num];
			let action_message = "";

			if (actions && actions.length > 0)
				action_message = ">>> " + actions.join("\n");

			await this.announceMessages(
				`_ _\n## Night ${day_num} Actions\n` +
				action_message
			);
		}

		if (!this.isMockGame)
			await wait({seconds: "30"});

		await GameManager.reset();
	}

	static async convertAllToSpectator() {
		const rdm_guild = await fetchRDMGuild();
		const spectator_role = await fetchRoleByName(rdm_guild, RDMRoles.Spectator);

		for (let role_name of [RDMRoles.Ghosts, RDMRoles.Living]) {
			const role_to_remove = await fetchRoleByName(rdm_guild, role_name);

			role_to_remove.members.each(async member => {
				await removeRoleFromMember(member, role_to_remove);
				await addRoleToMember(member, spectator_role);
			});
		}
	}

	static async deletePlayerChannels() {
		const
			rdm_guild = await fetchRDMGuild(),
			player_action_chnls = await fetchChannelsInCategory(rdm_guild, ids.rapid_discord_mafia.category.player_action),
			archive_category = await fetchChannel(rdm_guild, ids.rapid_discord_mafia.category.archive);

		await player_action_chnls.forEach(
			async (channel) => {
				// await channel.setParent(archive_category);
				await channel.delete();
			}
		);
	}

	static async privateNightChannels() {
		const rdm_guild = await fetchRDMGuild();
		const night_channels = await fetchChannelsInCategory(rdm_guild, ids.rapid_discord_mafia.category.night);
		const living_role = await fetchRoleByName(rdm_guild, RDMRoles.Living);

		await night_channels.forEach(
			async (night_chnl) => {
				night_chnl.permissionOverwrites.set([
					{
						id: living_role,
						deny: [PermissionFlagsBits.SendMessages]
					},
					{
						id: rdm_guild.id,
						deny: [
							PermissionFlagsBits.ViewChannel,
							PermissionFlagsBits.SendMessages,
						]
					}
				]);
			}
		);
	}

	static async openDayChat() {
		const
			rdm_guild = await fetchRDMGuild(),
			living_role = await fetchRoleByName(rdm_guild, RDMRoles.Living),
			day_chat_chnl = await fetchChannel(rdm_guild, ids.rapid_discord_mafia.channels.town_discussion);

		await day_chat_chnl.permissionOverwrites.create(
			living_role,
			{ SendMessages: true }
		);

		await day_chat_chnl.permissionOverwrites.edit(
			rdm_guild.roles.everyone,
			{ SendMessages: false, AddReactions: false }
		);

		if (GameManager.IS_TESTING) {
			await day_chat_chnl.permissionOverwrites.create(
				rdm_guild.roles.everyone,
				{ ViewChannel: false }
			);
		}

		day_chat_chnl.send("> Opened.");
	}

	static async closeDayChat() {
		const
			rdm_guild = await fetchRDMGuild(),
			living_role = await fetchRoleByName(rdm_guild, RDMRoles.Living),
			day_chat_chnl = await fetchChannel(rdm_guild, ids.rapid_discord_mafia.channels.town_discussion);

		await day_chat_chnl.permissionOverwrites.edit(living_role, { SendMessages: false });

		await day_chat_chnl.permissionOverwrites.edit(
			rdm_guild.roles.everyone,
			{ SendMessages: false, AddReactions: false }
		);

		if (GameManager.IS_TESTING) {
			await day_chat_chnl.permissionOverwrites.create(
				rdm_guild.roles.everyone,
				{ ViewChannel: false }
			);
		}

		await day_chat_chnl.send("> Closed.");
	}

	static async closeNightChannels() {
		const rdm_guild = await fetchRDMGuild();
		const night_channels = await fetchChannelsInCategory(rdm_guild, ids.rapid_discord_mafia.category.night);
		const living_role = await fetchRoleByName(rdm_guild, RDMRoles.Living);

		await night_channels.forEach(
			async (night_chnl) => {
				night_chnl.permissionOverwrites.edit(
					living_role,
					{
						SendMessages: false,
					}
				);

				night_chnl.send(`> Closed.`);
			}
		);
	}

	static async openNightChannels() {
		const rdm_guild = await fetchRDMGuild();
		const night_channels = await fetchChannelsInCategory(rdm_guild, ids.rapid_discord_mafia.category.night);
		const living_role = await fetchRoleByName(rdm_guild, RDMRoles.Living);

		await night_channels.forEach(
			async (night_chnl) => {

				night_chnl.permissionOverwrites.edit(
					living_role,
					{
						SendMessages: true,
					}
				);

				night_chnl.send(`> Opened.`);
			}
		);
	}

	static async closePreGameChannels() {
		const rdm_guild = await fetchRDMGuild();
		const pre_game_channels = await fetchChannelsInCategory(rdm_guild, ids.rapid_discord_mafia.category.pre_game);
		const living_role = await fetchRoleByName(rdm_guild, RDMRoles.Living);
		const ghost_role = await fetchRoleByName(rdm_guild, RDMRoles.Ghosts);

		await pre_game_channels.forEach(
			async (pre_game_chnl) => {
				pre_game_chnl.permissionOverwrites.set([
					{
						id: living_role,
						deny: [PermissionFlagsBits.ViewChannel],
					},
					{
						id: ghost_role,
						deny: [PermissionFlagsBits.ViewChannel],
					},
				]);
			}
		);
	}

	static async publicizePreGameChannels() {
		const
			rdm_guild = await fetchRDMGuild(),
			living_role = await fetchRoleByName(rdm_guild, RDMRoles.Living),
			ghosts_role = await fetchRoleByName(rdm_guild, RDMRoles.Ghosts),
			pre_game_channels = await fetchChannelsInCategory(rdm_guild, ids.rapid_discord_mafia.category.pre_game);

		await pre_game_channels.forEach(
			async (channel) => {
				await channel.permissionOverwrites.set([
					{
						id: living_role,
						allow: [PermissionFlagsBits.ViewChannel],
					},
					{
						id: ghosts_role,
						allow: [PermissionFlagsBits.ViewChannel],
					},
				]);
			}
		);
	}

	static async closeGhostChannel() {
		const
			rdm_guild = await fetchRDMGuild(),
			living_role = await fetchRoleByName(rdm_guild, RDMRoles.Living),
			ghosts_role = await fetchRoleByName(rdm_guild, RDMRoles.Ghosts),
			ghost_chat_chnl = await fetchChannel(rdm_guild, ids.rapid_discord_mafia.channels.ghost_chat);

		await ghost_chat_chnl.permissionOverwrites.set([
			{
				id: rdm_guild.id,
				deny: [PermissionFlagsBits.SendMessages],
			},
			{
				id: living_role,
				deny: [PermissionFlagsBits.ViewChannel],
			},
			{
				id: ghosts_role,
				allow: [PermissionFlagsBits.SendMessages],
			},
		]);
	}

	static async openGhostChannel() {
		const
			rdm_guild = await fetchRDMGuild(),
			living_role = await fetchRoleByName(rdm_guild, RDMRoles.Living),
			ghosts_role = await fetchRoleByName(rdm_guild, RDMRoles.Ghosts),
			ghost_chat_chnl = await fetchChannel(rdm_guild, ids.rapid_discord_mafia.channels.ghost_chat);

		await ghost_chat_chnl.permissionOverwrites.set([
			{
				id: rdm_guild.id,
				allow: [PermissionFlagsBits.SendMessages],
			},
			{
				id: living_role,
				deny: [PermissionFlagsBits.ViewChannel],
			},
			{
				id: ghosts_role,
				allow: [PermissionFlagsBits.SendMessages],
			},
		]);
	}

	static async closeTownDiscussionChannel() {
		const
			rdm_guild = await fetchRDMGuild(),
			living_role = await fetchRoleByName(rdm_guild, RDMRoles.Living),
			town_discussion_chnl = await fetchChannel(rdm_guild, ids.rapid_discord_mafia.channels.town_discussion);

		await town_discussion_chnl.permissionOverwrites.set([
			{
				id: rdm_guild.id,
				deny: [PermissionFlagsBits.SendMessages],
			},
			{
				id: living_role,
				deny: [PermissionFlagsBits.SendMessages],
			},
		]);

	}

	// static async setDefenseChannelPerms() {
	// 	const
	// 		rdm_guild = await fetchRDMGuild(),
	// 		on_trial_role = await fetchRoleByName(rdm_guild, RDMRoles.OnTrial),
	// 		defense_chnl = await fetchChannel(rdm_guild, ids.rapid_discord_mafia.channels.defense_stand);

	// 	await defense_chnl.permissionOverwrites.set([{
	// 		id: rdm_guild.id,
	// 		allow: [PermissionFlagsBits.ViewChannel],
	// 		deny: [PermissionFlagsBits.SendMessages],
	// 	}]);
	// 	await defense_chnl.permissionOverwrites.create(on_trial_role, { SendMessages: true });
	// }

	// static async closeVotingChannel() {
	// 	const
	// 		rdm_guild = await fetchRDMGuild(),
	// 		voting_booth_chnl = await fetchChannel(rdm_guild, ids.rapid_discord_mafia.channels.voting_booth);

	// 	if (Game.IS_TESTING) {
	// 		await voting_booth_chnl.permissionOverwrites.set([{
	// 			id: rdm_guild.id,
	// 			deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
	// 		}]);
	// 	}
	// 	else {
	// 		await voting_booth_chnl.permissionOverwrites.set([{
	// 			id: rdm_guild.id,
	// 			deny: [PermissionFlagsBits.SendMessages],
	// 		}]);
	// 	}
	// }

	static async setAnnounceChannelPerms() {
		const
			rdm_guild = await fetchRDMGuild(),
			game_announce_chnl = await fetchChannel(rdm_guild, ids.rapid_discord_mafia.channels.game_announce),
			on_trial_role = await fetchRoleByName(rdm_guild, RDMRoles.OnTrial);

		if (GameManager.IS_TESTING) {
			await game_announce_chnl.permissionOverwrites.set([
				{
					id: rdm_guild.id,
					deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
				},
				{
					id: on_trial_role.id,
					allow: [PermissionFlagsBits.SendMessages],
				},
			]);
		}
		else {
			await game_announce_chnl.permissionOverwrites.set([
				{
					id: rdm_guild.id,
					allow: [PermissionFlagsBits.ViewChannel],
					deny: [PermissionFlagsBits.SendMessages],
				},
				{
					id: on_trial_role.id,
					allow: [PermissionFlagsBits.SendMessages],
				},
			]);
		}
	}

	static async closeJoinChannel() {
		const
			rdm_guild = await fetchRDMGuild(),
			living_role = await fetchRoleByName(rdm_guild, RDMRoles.Living),
			join_chat_chnl = await fetchChannel(rdm_guild, ids.rapid_discord_mafia.channels.join_chat);

		await join_chat_chnl.permissionOverwrites.set([
			{
				id: rdm_guild.id,
				deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
			},
			{
				id: living_role,
				deny: [PermissionFlagsBits.ViewChannel],
			},
		]);
	}

	static async openJoinChannel() {
		const
			rdm_guild = await fetchRDMGuild(),
			living_role = await fetchRoleByName(rdm_guild, RDMRoles.Living),
			join_chat_chnl = await fetchChannel(rdm_guild, ids.rapid_discord_mafia.channels.join_chat);

		if (GameManager.IS_TESTING) {
			join_chat_chnl.permissionOverwrites.set([{
				id: rdm_guild.id,
				allow: [PermissionFlagsBits.SendMessages],
				deny: [PermissionFlagsBits.ViewChannel],
			},
			{
				id: living_role,
				deny: [PermissionFlagsBits.ViewChannel],
			}]);
		}
		else {
			join_chat_chnl.permissionOverwrites.set([{
				id: rdm_guild.id,
				allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
			},
			{
				id: living_role,
				deny: [PermissionFlagsBits.ViewChannel],
			}]);
		}
	}

	static async reset() {
		if (!this.isMockGame) {
			console.time("convertAllToSpectator");
			await GameManager.convertAllToSpectator();
			console.timeEnd("convertAllToSpectator");
			console.time("moveChannelsToArchives");
			await GameManager.deletePlayerChannels();
			console.timeEnd("moveChannelsToArchives");
			console.time("privateNightChannels");
			await GameManager.privateNightChannels();
			console.timeEnd("privateNightChannels");
			console.time("publicizePreGameChannels");
			await GameManager.publicizePreGameChannels();
			console.timeEnd("publicizePreGameChannels");
			console.time("closeGhostChannel");
			await GameManager.closeGhostChannel();
			console.timeEnd("closeGhostChannel");
			console.time("closeTownDiscussionChannel");
			await GameManager.closeTownDiscussionChannel();
			console.timeEnd("closeTownDiscussionChannel");
			// console.time("closeVotingChannel");
			// await Game.closeVotingChannel();
			// console.timeEnd("closeVotingChannel");
			console.time("setAnnounceChannelPerms");
			await GameManager.setAnnounceChannelPerms();
			console.timeEnd("setAnnounceChannelPerms");
			console.time("closeJoinChannel");
			await GameManager.closeJoinChannel();
			console.timeEnd("closeJoinChannel");
			// console.time("setDefenseChannelPerms");
			// await Game.setDefenseChannelPerms();
			// console.timeEnd("setDefenseChannelPerms");
		}

		global.game_manager = new GameManager({}, global.game_manager.logger, global.game_manager.isMockGame );
	}

	async startSignUps() {
		await GameManager.openJoinChannel();
		this.state_manager.changeToSignUps();
		const starting_unix_timestamp = createNowUnixTimestamp() + PhaseWaitTimes.SignUps*60;

		this.announceMessages(
			Announcement.START_SIGN_UPS(
				ids.rapid_discord_mafia.roles.sign_up_ping,
				ids.rapid_discord_mafia.channels.join_chat,
				starting_unix_timestamp
			)
		);

		if (!this.isMockGame) {

			await wait({minutes: PhaseWaitTimes.SignUps*(2/3)});

			if (!this.state_manager.isInSignUps()) return;

			this.announceMessages(
				Announcement.SIGN_UPS_REMINDER(
					ids.rapid_discord_mafia.channels.join_chat,
					starting_unix_timestamp
				)
			);

			await wait({minutes: PhaseWaitTimes.SignUps*(4/15)});

			if (!this.state_manager.isInSignUps()) return;

			this.announceMessages(
				Announcement.SIGN_UPS_FINAL_REMINDER(
					ids.rapid_discord_mafia.channels.join_chat,
					starting_unix_timestamp
				)
			);

			await wait({minutes: PhaseWaitTimes.SignUps*(1/15)});

			if (!this.state_manager.isInSignUps()) return;
		}

		const player_count = this.player_manager.getPlayerCount();

		if (player_count >= GameManager.MIN_PLAYER_COUNT) {
			await this.announceMessages(
				Announcement.SIGN_UPS_CLOSED(ids.users.LL, ids.rapid_discord_mafia.roles.living, player_count)
			);

			this.state_manager.changeToReadyToStart();
		}
		else {
			await this.announceMessages(
				Announcement.NOT_ENOUGH_SIGN_UPS(player_count, GameManager.MIN_PLAYER_COUNT)
			)
			await GameManager.reset();
		}

		await GameManager.closeJoinChannel();
	}

	/**
	 *
	 * @param {Player} player_using_ability
	 * @param {Arg} ability_arg argument validating
	 * @param {string} arg_value
	 * @returns {true | String} true if valid. Otherwise, string containing reason if invalid
	 */
	isValidArgValue(player_using_ability, ability_arg, arg_value) {
		if (ability_arg.type === AbilityArgType.PLAYER) {
			if (!this.player_manager.getPlayerNames().includes(arg_value)) {
				return `**${arg_value}** is not a valid player for the argument **${ability_arg.name}**`
			}
		}

		if (ability_arg.subtypes.includes(ArgumentSubtype.NOT_SELF)) {
			if (arg_value === player_using_ability.name) {
				return `You cannot target yourself`;
			}
		}

		if (ability_arg.subtypes.includes(ArgumentSubtype.NON_MAFIA)) {
			const player_targeting = this.player_manager.get(arg_value);
			const player_targeting_role = this.role_manager.getRole(player_targeting.role);
			if (player_targeting_role.faction === Faction.MAFIA) {
				return `You cannot target **${player_targeting.name}** as you may only target non-mafia`;
			}
		}

		return true;
	}

	/**
	 * Checks if every player has acted for the night and if so, starts the day
	 */
	startDayIfAllPlayersActed() {
		const alive_players = this.player_manager.getAlivePlayers();
		const didEveryPlayerDoAnAbility = alive_players.every(
			player => player.hasDoneAbility()
		)

		if (didEveryPlayerDoAnAbility) {
			this.startDay();
		}
	}

	/**
	 * Adds player to winners
	 * @param {Player} player
	 */
	makePlayerAWinner(player) {
		player.hasWon = true;

		const player_role = this.role_manager.getRole(player.role);
		const player_faction = player_role.getFaction();

		if (!this.winning_factions.includes(player_faction))
			this.winning_factions.push(player_faction);

		if (!this.winning_players.includes(player.name))
			this.winning_players.push(player.name);
	}
}

module.exports = GameManager;