const { GameStates, Phases, Subphases, MessageDelays, Factions, RDMRoles, WinConditions, Feedback, Announcements, RoleNames, PhaseWaitTimes, VotingOutcomes, TrialOutcomes, TrialVotes, RoleIdentifierTypes, ArgumentSubtypes, CoinRewards } = require("../enums.js");
const { getChannel, getGuild, wait, getRandArrayItem, getGuildMember, getRole, removeRole, getCategoryChildren, logColor, getUnixTimestamp, shuffleArray, getRDMGuild, addRole, toTitleCase, saveObjectToGitHubJSON } = require("../functions.js");
const ids = require("../../databases/ids.json");
const validator = require('../../utilities/validator.js');
const { github_token } =  require("../token.js");
const { Abilities } = require("./ability.js");
const { PermissionFlagsBits } = require("discord.js");
const Death = require("./death.js");
const roles = require("./roles.js");
const Players = require("../rapid_discord_mafia/players.js");

class Game {
	constructor({players = {}}) {
		this.state = GameStates.Ended;
		this.Players = new Players(players);
		this.phase = null;
		this.subphase = null;
		this.days_passed = 0;
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
		this.role_log = {};

		/**
		 * {
		 *   by: Player.name
		 *   name: Ability.name
		 *   args: {
		 *     [Ability.Arg.name]: Ability.Arg.value
		 *   }
		 * }
		 */
		this.abilities_performed = {}
	}

	static IS_TESTING = true;
	static MAX_TIMEOUT_COUNTER = 3;
	static MIN_PLAYER_COUNT = 4;
	static MAX_MAFIA_TO_TOWN_RATIO = 2/3;
	static MAX_TOWN_TO_MAFIA_RATIO = 5;
	static MAJORITY_VOTE_RATIO = 7/8;
	static POSSIBLE_FACTIONS = [
		"Mafia",
		"Town",
		...Object.values(roles)
			.filter((role) => `${role.faction} ${role.alignment}` === "Neutral Killing")
			.map((role) => role.name)
	];

	logGame() {
		let simple_game_obj = JSON.parse(JSON.stringify(this));
		delete simple_game_obj.all_abilities;
		console.log(`\x1b[36m Logging Game: \x1b[0m`);
		console.log(JSON.stringify(simple_game_obj, null, 2));
	}

	logPlayers() {
		console.log(JSON.stringify(this.Players, null, 2));
	}

	/**
	 * {
	 * 	by: {Player.name}
	 *  name: {Ability.name}
	 * 	args: [ ...{Arg} ]
	 * }
	 */
	async updateCurrentAbilitiesPerformed() {
		/**
		 * {
		 *   by: Player.name
		 *   name: Ability.name
		 *   args: {
		 *     [Ability.Arg.name]: Ability.Arg.value
		 *   }
		 * }
		 */
		this.abilities_performed = await this.Players.getPlayerList()
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

	async sortAbilitiesPerformed() {
		this.abilities_performed = Object.values(this.abilities_performed)
		.sort(
			(ability_done1, ability_done2) => {
				console.log({ability_done1, ability_done2});
				const ability1 = Object.values(Abilities).find(ability => ability.name === ability_done1.name);
				const ability2 = Object.values(Abilities).find(ability => ability.name === ability_done2.name);

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
	 * @return {Discord.TextChannel} Rapid Discord Mafia Staff Channel
	 */
	static async getStaffChnl() {
		return await getChannel(
			await getRDMGuild(),
			ids.rapid_discord_mafia.channels.staff
		);
	}

	async setGame(game) {
		for (const property in game) {
			if (property === "next_deaths") {
				this.next_deaths = [];
				const deaths = game[property];
				for (const death of deaths) {
					this.next_deaths.push(new Death(death));
				}
			}
			else if (property !== "Players") {
				this[property] = game[property];
			}

		}

		this.Players = new Players();

		for (const player_obj of Object.values(game.Players.players)) {
			await this.Players.addPlayerFromObj(player_obj);
		}
	}

	async start(role_identifiers) {
		const
			unshuffled_role_identifiers = [...role_identifiers],
			shuffled_role_identifiers = shuffleArray(role_identifiers),
			days_passed_at_sign_ups = 0;

		this.state = GameStates.InProgress;
		this.unshuffled_role_identifiers = unshuffled_role_identifiers;
		this.role_identifiers = shuffled_role_identifiers;
		this.phase = null;
		this.subphase = null;
		this.days_passed = 0;
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
		this.Players.reset();

		await this.createRoleList();
		this.role_list = shuffleArray(this.role_list);
		await this.assignRolesToPlayers();
		await Game.openGhostChannel();
		await this.announceRoleList(unshuffled_role_identifiers);
		await this.announceMessages(
			Announcements.LivingPlayers(this.Players.getAlivePlayerNames())
		);

		this.Players.getPlayerList().forEach(player => {
			this.role_log[player.name] = player.role;
		})

		await this.startDay1(days_passed_at_sign_ups);
	}

	async announceRoleList(role_identifiers) {
		const rdm_guild = await getRDMGuild();
		const role_list_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.role_list);
		const announce_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.game_announce);
		const role_list_txt =
			`_ _` + "\n" +
			Announcements.RoleList(role_identifiers)

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

		const role_list_msg = await announce_chnl.send(role_list_txt);
		role_list_msg.pin();
	}

	async assignRolesToPlayers() {
		await Game.log("Assigning Roles To Players", 2);

		for (let [role_index, role_name] of this.role_list.entries()) {
			const
				role = roles[role_name],
				player = this.Players.getPlayerList()[role_index];

			await player.setRole(role);
			await Game.log(`Sent role info message, ${role.name}, to ${player.name}.`);
		}

		await this.giveAllExesTargets();
	}

	async giveAllExesTargets() {
		for (const player of this.Players.getPlayerList()) {
			if (player.role === RoleNames.Executioner) {
				console.log(this.Players);
				const rand_town_player = getRandArrayItem(this.Players.getTownPlayers());
				if (rand_town_player)
					player.setExeTarget(rand_town_player);
				else
					player.convertToRole(RoleNames.Fool);
			}
		}
	}

	getPossibleRolesFromIdentifier(role_identifier, num_roles_in_faction) {
		const
			existing_factions = Object.keys(num_roles_in_faction),
			needOpposingFactions = existing_factions.length <= 1;

		let possible_roles = role_identifier.getPossibleRoles();

		// console.log({role_identifier, existing_factions, num_roles_in_faction,needOpposingFactions});
		// console.log("POSSIBLE ROLES " + possible_roles.map(r => r.name));

		if (role_identifier.type === RoleIdentifierTypes.AnyRole) {

			// ! Filter out existing factions if we need an opposing faction
			if (needOpposingFactions) {
				possible_roles = possible_roles.filter(role =>
					existing_factions.every(existing_faction =>
						!Game.isRoleInFaction(role, existing_faction)
					) &&
					Game.POSSIBLE_FACTIONS.some(faction =>
						Game.isRoleInFaction(role, faction)
					)
				)
			}

			// ! Filter out Mafia/Town if adding them exceed max Mafia/Town ratio
			if (
				existing_factions.includes(Factions.Mafia) &&
				existing_factions.includes(Factions.Town)
			) {
				const mafia_to_town_ratio = num_roles_in_faction[Factions.Mafia] / num_roles_in_faction[Factions.Town];
				const town_to_mafia_ratio = num_roles_in_faction[Factions.Town] / num_roles_in_faction[Factions.Mafia];

				if (mafia_to_town_ratio >= Game.MAX_MAFIA_TO_TOWN_RATIO) {
					possible_roles = possible_roles.filter(role => role.faction !== Factions.Mafia)
				}
				if (town_to_mafia_ratio >= Game.MAX_TOWN_TO_MAFIA_RATIO) {
					possible_roles = possible_roles.filter(role => role.faction !== Factions.Town)
				}
			}

			// ! Filter out Non-Mafioso Mafia if Mafioso doesn't exist yet
			if (!this.role_list.includes(RoleNames.Mafioso)) {
				possible_roles = possible_roles.filter(role =>
					role.faction !== Factions.Mafia ||
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
						!Game.isRoleInFaction(role, existing_faction)
					) &&
					Game.POSSIBLE_FACTIONS.some(faction =>
						Game.isRoleInFaction(role, faction)
					)
				)
			}
			if (possible_roles.length <= 0) possible_roles = old_possible_roles;

			// ! Filter out Non-Mafioso Mafia if Mafioso doesn't exist yet
			if (!this.role_list.includes(RoleNames.Mafioso)) {
				possible_roles = possible_roles.filter(role =>
					role.faction !== Factions.Mafia ||
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

		// console.log("POSSIBLE ROLES " + possible_roles.map(r => r.name));

		return possible_roles;
	}

	getRoleFromRoleIdentifier(role_identifier, num_roles_in_faction) {
		const possible_roles = this.getPossibleRolesFromIdentifier(role_identifier, num_roles_in_faction);
		const chosen_role = getRandArrayItem(possible_roles);

		console.log({chosen_role});

		// Add faction to list of existing factions
		const chosen_role_faction = Game.POSSIBLE_FACTIONS.find(faction =>
			Game.isRoleInFaction(chosen_role, faction)
		)

		if (chosen_role_faction) {
			if (num_roles_in_faction[chosen_role_faction])
				num_roles_in_faction[chosen_role_faction] += 1;
			else
				num_roles_in_faction[chosen_role_faction] = 1;
		}

		// console.log({num_roles_in_faction});

		return chosen_role
	}

	/**
	 * Prereqs: this.role_identifiers
	 */
	async createRoleList() {
		let num_roles_in_faction = {}

		const sorted_role_identifiers =
			this.role_identifiers.sort(
				(role_identifier1, role_identifier2) => {
					return role_identifier1.priority - role_identifier2.priority;
				}
			);
		console.log({sorted_role_identifiers});

		for (const role_identifier of sorted_role_identifiers) {
			const chosen_role = this.getRoleFromRoleIdentifier(role_identifier, num_roles_in_faction)

			this.role_list.push(chosen_role.name);
			console.log("ROLE LIST:")
			console.log(this.role_list)
		}
	}

	async setPhaseToNextPhase() {
		switch (this.phase) {
			case Phases.Day:
				switch (this.subphase) {
					case Subphases.Announcements:
						await this.setPhaseToVoting();
						break;

					case Subphases.Voting:
						await this.setPhaseToTrial();
						break;

					case Subphases.Trial:
						await this.setPhaseToTrialResults();
						break;

					case Subphases.TrialResults:
					default:
						await this.setPhaseToNight();
						break;
				}
				break;

			case Phases.Night:
				await this.setPhaseToDay();
				break;

			default:
				await this.setPhaseToDay1();
				break;
		}
	}

	async setPhaseToNight() {
		await this.saveGameDataToDatabase();

		await Game.log(`Night ${this.getDayNum()} Begins`, 2);

		this.phase = Phases.Night;
		this.subphase = Subphases.None;
		this.days_passed += 0.5;
	}

	static async log(message, heading_level=0) {
		const staff_chnl = await Game.getStaffChnl();

		if (heading_level == 2) {
			logColor("\n\n" + message, "red");
			await staff_chnl.send("# " + message);
		}
		else if (heading_level == 1) {
			logColor("\n" + message, "cyan");
			await staff_chnl.send("## " + message);
		}
		else {
			console.log(message);
			await staff_chnl.send(message);
		}
	}

	async log(message, heading_level=0) {
		await Game.log(message, heading_level);
	}

	async killDeadPlayers() {
		await this.announceAllDeaths();
		await this.announceMessages(
			Announcements.LivingPlayers(this.Players.getAlivePlayerNames())
		);

		console.log(this.next_deaths);

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
			const victim_player = this.Players.get(death.victim);
			await victim_player.kill(death);
		}


		if (this.getWhichFactionWon()) {
			await this.endGame();
			return "all";
		}

		await this.updateTimeoutCounter();
		this.resetDeaths();
	}

	async remindPlayersTo(reminder) {
		const rdm_guild = await getRDMGuild();

		for (const player_name of this.Players.getAlivePlayerNames()) {
			const player = this.Players.get(player_name);
			const player_chnl = await getChannel(rdm_guild, player.channel_id);

			await player_chnl.send(`> ${reminder}`);
		}
	}

	async updateTimeoutCounter() {
		if (this.next_deaths.length <= 0) {
			if (this.subphase === Subphases.Announcements) {
				this.timeout_counter += 1;

				if (this.timeout_counter >= Game.MAX_TIMEOUT_COUNTER) {
					await this.announceMessages(`There have been no deaths for the past **${this.timeout_counter} day(s)**, so it's a draw!\n_ _`);
					await this.endGame();
				}
				else {
					await this.announceMessages(`Nobody has died in the past **${this.timeout_counter} day(s)**. **${Game.MAX_TIMEOUT_COUNTER - this.timeout_counter}** more days without bloodshed and the game ends in a draw.\n`);
				}
			}
		}
		else {
			this.resetTimeout();
		}
	}

	async setPhaseToDay1() {
		await this.saveGameDataToDatabase();

		await Game.log(`Day ${this.getDayNum()} Begins`, 2);

		this.phase = Phases.Day;
		this.subphase = Subphases.None;
		this.days_passed += 0.5;

		await Game.log("Incrementing Inactvity")
		this.Players.getAlivePlayers().forEach(player => {
				if (!Game.IS_TESTING) player.incrementInactvity();
		});
	}

	async setPhaseToDay() {
		await this.saveGameDataToDatabase();

		await Game.log(`Day ${this.getDayNum()} Begins`, 2);

		this.phase = Phases.Day;
		this.subphase = Subphases.Announcements;
		this.days_passed += 0.5;

		await Game.log("Incrementing Inactvity")
		this.Players.getAlivePlayers().forEach(player => {
			if (!Game.IS_TESTING) player.incrementInactvity();
		});
	}

	async setPhaseToVoting() {
		await Game.log(`Voting Begins`, 2);

		this.subphase = Subphases.Voting;
	}

	async setPhaseToTrial() {
		await this.saveGameDataToDatabase();

		await Game.log(`Day ${this.getDayNum()} Trial Begins`, 2);

		this.resetTrialVotes();
		this.resetVerdict();
		this.subphase = Subphases.Trial;
		this.on_trial = this.getMajorityVote(this.votes);

		await Game.log("Incrementing Inactvity")
		this.Players.getAlivePlayers().forEach(player => {
			if (!Game.IS_TESTING) player.incrementInactvity();
		});
	}

	async setPhaseToTrialResults() {
		await this.saveGameDataToDatabase();

		await Game.log(`Day ${this.getDayNum()} Trial Results Begins`, 2);

		this.subphase = Subphases.TrialResults;

		if (this.Players.getAlivePlayerNames().includes(this.on_trial)) {
			await Game.log("Incrementing Inactvity")
			this.Players.getAlivePlayers().forEach(player => {
				if (player.name !== this.on_trial) {
					if (!Game.IS_TESTING) player.incrementInactvity();
				}
			});
		}

	}

	async resetPlayerOnTrial() {
		const player_on_trial = this.Players.get(this.on_trial);
		const rdm_guild = await getRDMGuild();
		const on_trial_role = await getRole(rdm_guild, RDMRoles.OnTrial);
		const player_guild_member = await getGuildMember(rdm_guild, player_on_trial.id);

		await removeRole(player_guild_member, on_trial_role);

		this.on_trial = "";
	}

	async lynchPlayerOnTrial() {
		const player_on_trial = this.Players.get(this.on_trial);

		const death = new Death({
			victim: player_on_trial.name
		});
		death.setToLynch();

		await player_on_trial.kill(death);
		await this.sendDeathMsg(death, "lynch");
		this.resetTimeout()
	}

	async announceRevealedVotes() {
		const rdm_guild = await getRDMGuild();
		const announce_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.game_announce);

		announce_chnl.send(`_ _\n## Revealed Votes`);

		for (const voter in this.trial_votes) {
			const vote = this.trial_votes[voter];

			await announce_chnl.send(`**${voter}** voted **${toTitleCase(vote)}**.`)
		}
	}

	async announceTrialVerdict() {
		let trial_outcome_message = ""
		const player_on_trial = this.Players.get(this.on_trial);

		if (this.verdict === TrialOutcomes.Tie) {
			trial_outcome_message = Announcements.TrialOutcomeTie(player_on_trial);
		}
		else if (this.verdict === TrialOutcomes.NoVotes) {
			trial_outcome_message = Announcements.TrialOutcomeNoVotes(player_on_trial);
		}
		else if (this.verdict === TrialOutcomes.Innocent) {
			trial_outcome_message = Announcements.TrialOutcomeInnocent(player_on_trial);
		}
		else if (this.verdict === TrialOutcomes.Guilty) {
			trial_outcome_message = Announcements.TrialOutcomeGuilty(player_on_trial);
		}

		await this.announceMessages(
			Announcements.TrialOver(ids.rapid_discord_mafia.roles.living),
			trial_outcome_message,
		);
	}

	async givePlayerOnTrialRole(player_on_trial) {
		const rdm_guild = await getRDMGuild();
		const on_trial_role = await getRole(rdm_guild, RDMRoles.OnTrial);
		const player_guild_member = await getGuildMember(rdm_guild, player_on_trial.id);

		await addRole(player_guild_member, on_trial_role);
	}

	async sendVotingHeader(header) {
		const rdm_guild = await getRDMGuild()
		const announce_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.game_announce);

		announce_chnl.send(`${header}`);
	}

	async announceVotingResults() {
		await Game.log(`Announcing ${this.on_trial} On Trial.`);

		const voting_outcome = this.on_trial;

		await this.announceMessages(
			Announcements.VotingOver(ids.rapid_discord_mafia.roles.living)
		);

		let voting_outcome_message = ""

		if (voting_outcome === VotingOutcomes.Nobody) {
			voting_outcome_message = Announcements.VotingOutcomeNobody;
		}
		else if (voting_outcome == VotingOutcomes.Tie) {
			voting_outcome_message = Announcements.VotingOutcomeTie;
		}
		else if (voting_outcome == VotingOutcomes.NoVotes) {
			voting_outcome_message = Announcements.VotingOutcomeNoVotes;
		}
		else {
			voting_outcome_message = Announcements.VotingOutcomePlayer(voting_outcome);
		}

		await this.announceMessages(
			voting_outcome_message
		);
	}

	async loadGameDataFromDatabase() {
		const
			axios = require('axios'),
			owner = "alexcarron",
			repo = "brobot-database",
			path = "rdm-game.json";


		// Get the current file data
		const {data: file} =
			await axios.get(
				`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
				{
					headers: {
						'Authorization': `Token ${github_token}`
					}
				}
			)
			.catch(err => {
				console.error(err);
			});


		let rdm_game_str = Buffer.from(file.content, 'base64').toString();
		let rdm_game = JSON.parse(rdm_game_str);

		this.setGame(rdm_game);
	}

	async saveGameDataToDatabase() {
		const
			axios = require('axios'),
			owner = "alexcarron",
			repo = "brobot-database",
			path = "rdm-game.json",
			rdm_game = this,
			rdm_game_str = JSON.stringify(rdm_game);


		try {
			// Get the current file data
			const {data: file} =
				await axios.get(
					`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
					{
						headers: {
							'Authorization': `Token ${github_token}`
						}
					}
				);

			// Update the file content
			await axios.put(
				`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
				{
					message: 'Update file',
					content: new Buffer.from(rdm_game_str).toString(`base64`),
					sha: file.sha
				},
				{
					headers: {
						'Authorization': `Token ${github_token}`
					}
				}
			);
		} catch (error) {
			console.error(error);
		}

	}

	async performCurrentNightAbilities() {
		await this.updateCurrentAbilitiesPerformed();
		console.log("Abilities To Perform:")
		console.log(this.abilities_performed);

		await Game.log("Performing Every Ability", 1);

		this.action_log[this.getDayNum()-1] = [];

		for (let i = 0; i < Object.keys(this.abilities_performed).length; i++) {
			console.log(Object.keys(this.abilities_performed));
			let player_name = Object.keys(this.abilities_performed)[i],
				player = this.Players.get(player_name),
				ability_performed = this.abilities_performed[player_name],
				ability = Object.values(Abilities).find(ability => ability.name === ability_performed.name);

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


			await Game.log(ability.feedback(...Object.values(ability_performed.args), player.name, false));
			this.action_log[this.getDayNum()-1].push(
				ability.feedback(...Object.values(ability_performed.args), player.name, false)
			);

			if (this.Players.get(player_name).isRoleblocked) {
				await Game.log(`${player_name} is roleblocked, so they can't do ${ability_performed.name}`);
				continue;
			}

			console.log(ability);
			console.log(ability.effects);

			if (ability.effects) {
				console.log({ability_performed});
				ability.effects.forEach( async (effect) => {
					await effect(ability_performed);
				})
				console.table(this.abilities_performed);
			}

			console.log("Performed an ability");
		}
	}

	async announceAllDeaths() {
		for (let death of this.next_deaths) {
			await Game.log(`Killing ${death.victim}`);
			this.Players.get(death.victim).isAlive = false;

			await this.sendDeathMsg(death);
		}
	}

	async announceDay() {
		const rdm_guild = await getRDMGuild();
		const announce_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.game_announce);
		const phase_num = Math.ceil(this.days_passed);

		await this.announceMessages(
			...Announcements.StartDay(ids.rapid_discord_mafia.roles.living, phase_num)
		);

		await Game.log(`Announced Day ${phase_num}.`);
	}


	async announceNight() {
		const night_num = this.getDayNum();

		await this.announceMessages(
			...Announcements.StartNight(ids.rapid_discord_mafia.roles.living, night_num),
		);

		await this.remindPlayersTo(Announcements.UseNightAbilityReminder);

		await Game.log(`Announced Night ${night_num}.`);
	}

	isRoleInMissingFaction(role, missing_factions) {
		return missing_factions.some((missing_faction) => {
			return Game.isRoleInFaction(role, missing_faction);
		});
	}

	isIdentifierInMissingFaction(identifier, missing_factions) {
		return missing_factions.some((missing_faction) => {
			if (identifier.faction == "Any")
				return true;
			else if (Object.values(Factions).includes(missing_faction))
				return identifier.faction === missing_faction;
			else
				return identifier.faction === "Neutral" && ["Killing", "Random"].includes(identifier.alignment);
		});
	}

	addDeath(player, killer, flavor_text) {
		console.log(this.next_deaths)
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
		console.log("Got Majority Vote");

		let majority_vote = VotingOutcomes.NoVotes,
			vote_counts = {},
			max_vote_count = 0;

		for (let voter in votes) {
			let vote = votes[voter];

			if (vote.toLowerCase() == TrialVotes.Abstain)
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
				majority_vote = VotingOutcomes.Tie;
			}
		}

		return majority_vote;
	}

	static isRoleInFaction(role, faction) {
		if (Object.values(Factions).includes(faction)) {
			return role.faction === faction;
		} else {
			return role.name === faction;
		}
	}

	static isRoleInPossibleFaction(role) {
		return Game.POSSIBLE_FACTIONS.some(faction =>
			Game.isRoleInFaction(role, faction)
		)
	}

	async sendFeedbackToPlayers() {
		console.log("Feedback");
		console.log(this.Players.getPlayers());

		for (let player_name of this.Players.getPlayerNames()) {
			const
				player_feedback = this.Players.get(player_name).feedback,
				player_id = this.Players.get(player_name).id,
				player_channel_id = this.Players.get(player_name).channel_id,
				player_chnl = await getChannel(await getRDMGuild(), player_channel_id);

			console.log({player_name, player_feedback, player_id})

			if (player_feedback.length <= 0)
				continue;

			let feedback_msg =
				`<@${player_id}> ` +
				player_feedback.join("\n");

			player_chnl.send(feedback_msg);
		}
	}

	setRoleIdentfiers(role_identifiers) {
		this.role_identifiers = role_identifiers;
	}

	resetPlayers() {
		this.Players = new Players();
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

	getDayNum() {
		return Math.ceil(this.days_passed)
	}

	resetDeaths() {
		this.next_deaths = [];
	}

	async resetAllPlayersNightInfo() {
		await Game.log("Reseting Every Player's Night Info");
		this.logGame();

		for (const player_name of this.Players.getPlayerNames()) {
			const player = this.Players.get(player_name);

			player.resetVisiting();
			player.resetAbilityDoing();
			player.resetFeedback();

			if (player.affected_by) {
				await player.removeAffects();
			}

			// console.log("After:")
			// console.log(player);
		}
	}

	async announceMessages(...messages) {
		const phase_before_announce = this.phase
		const subphase_before_announce = this.subphase
		const days_passed_before_announce = this.days_passed

		const game_announce_chnl = await getChannel(await getRDMGuild(), ids.rapid_discord_mafia.channels.game_announce);

		for (let message of messages) {
			if (
				phase_before_announce === this.phase &&
				subphase_before_announce === this.subphase &&
				days_passed_before_announce === this.days_passed
			) {
				await game_announce_chnl.send(message);
				console.log(message);
				await wait(MessageDelays.Normal, "s");
			}
		}
	}

	static async announceMessages(...messages) {
		const game_announce_chnl = await getChannel(await getRDMGuild(), ids.rapid_discord_mafia.channels.game_announce);

		for (let message of messages) {
			await game_announce_chnl.send(message);
			console.log(message);
			await wait(MessageDelays.Normal, "s");
		}
	}

	end() {
		this.state = GameStates.Ended;
	}

	async isDay(curr_day_num) {
		return !(
			curr_day_num !== undefined &&
			(this.state !== GameStates.InProgress ||
			this.phase !== Phases.Day ||
			this.days_passed > curr_day_num)
		)
	}

	async startDay1(days_passed_at_sign_ups) {
		console.log({days_passed_at_sign_ups});

		if (
			days_passed_at_sign_ups !== undefined &&
			(this.state !== GameStates.InProgress ||
			this.phase !== null ||
			this.days_passed > days_passed_at_sign_ups)
		) {
			return
		}

		await this.setPhaseToNextPhase();
		const curr_day_num = this.days_passed;

		await Game.closePreGameChannels();
		await Game.openDayChat();

		this.announceMessages(
			...Announcements.GameStarted(ids.rapid_discord_mafia.roles.living, ids.rapid_discord_mafia.channels.role_list),
			...Announcements.Day1Started(),
		)

		await Game.log("Waiting For Day 1 to End");

		await wait(PhaseWaitTimes.FirstDay, "min");
		await this.startNight(curr_day_num);
	}

	async startDay(days_passed_last_night) {
		console.log({days_passed_last_night});

		if (
			days_passed_last_night !== undefined &&
			(this.state !== GameStates.InProgress ||
			this.phase !== Phases.Night ||
			this.days_passed > days_passed_last_night)
		) {
			return
		}

		await this.setPhaseToNextPhase();
		const days_passed_last_day = this.days_passed;


		for (const player of this.Players.getPlayersInLimbo()) {
			console.log({player})
			player.isInLimbo = false;
		}
		await Game.closeNightChannels();
		console.log("Performing Night Abilities");
		await this.performCurrentNightAbilities();
		this.logPlayers();
		console.log("Sending Feedback");
		await this.sendFeedbackToPlayers();
		await this.announceDay();

		if (await this.killDeadPlayers() === "all")
			return;

		await Game.openDayChat();

		await this.startVoting(days_passed_last_day);
	}

	async startVoting(days_passed_last_day) {
		console.log({days_passed_last_day});

		if (
			days_passed_last_day !== undefined &&
			(this.state !== GameStates.InProgress ||
			this.phase !== Phases.Day ||
			this.subphase !== Subphases.Announcements ||
			this.days_passed >days_passed_last_day)
		) {
			return
		}

		await this.setPhaseToNextPhase();
		const days_passed_last_voting = this.days_passed;

		this.resetVotes();
		this.remindPlayersTo(Announcements.VotingReminder);
		this.announceMessages(
			...Announcements.StartVoting()
		);

		await Game.log("Waiting for Voting to End");

		await wait(PhaseWaitTimes.Voting*4/5, "min");

		if (
			this.state === GameStates.InProgress &&
			this.phase === Phases.Day &&
			this.subphase === Subphases.Voting &&
			this.days_passed <= days_passed_last_voting
		) {
			this.announceMessages(
				Announcements.PhaseAlmostOverWarning(PhaseWaitTimes.Voting*1/5)
			)
		}

		await wait(PhaseWaitTimes.Voting*1/5, "min");

		this.startTrial(days_passed_last_voting);
	}

	async startTrial(days_passed_last_voting) {
		console.log({days_passed_last_voting});

		if (
			days_passed_last_voting !== undefined &&
			(this.state !== GameStates.InProgress ||
			this.phase !== Phases.Day ||
			this.subphase !== Subphases.Voting ||
			this.days_passed >days_passed_last_voting)
		) {
			return
		}

		await this.setPhaseToNextPhase();
		const days_passed_last_trial = this.days_passed;

		if (await this.killDeadPlayers() === "all")
			return;

		await this.announceVotingResults();

		// If non-player voting outcome, skip to night
		if (!this.Players.getAlivePlayerNames().includes(this.on_trial)) {
			await this.setPhaseToNextPhase();
			await this.startNight(days_passed_last_trial);
		}

		const player_on_trial = this.Players.get(this.on_trial);

		await this.announceMessages(...Announcements.StartTrial(player_on_trial));
		await this.givePlayerOnTrialRole(player_on_trial);
		await this.announceMessages(
			Announcements.OnTrialPlayerGiveDefense(ids.rapid_discord_mafia.roles.on_trial),
		);
		this.remindPlayersTo(Announcements.TrialVotingReminder(player_on_trial));

		await Game.log("Waiting for Trial Voting to End");

		await wait(PhaseWaitTimes.Trial*4/5, "min");

		if (
			this.state === GameStates.InProgress &&
			this.phase === Phases.Day &&
			this.subphase === Subphases.Trial &&
			this.days_passed <= days_passed_last_trial
		) {
			this.announceMessages(
				Announcements.PhaseAlmostOverWarning(PhaseWaitTimes.Trial*1/5)
			)
		}

		await wait(PhaseWaitTimes.Trial*1/5, "min");

		await this.startTrialResults(days_passed_last_trial);
	}

	async startTrialResults(days_passed_last_trial) {
		console.log({days_passed_last_trial});

		if (
			days_passed_last_trial !== undefined &&
			(this.state !== GameStates.InProgress ||
			this.phase !== Phases.Day ||
			this.subphase !== Subphases.Trial ||
			this.days_passed > days_passed_last_trial)
		) {
			return
		}

		await this.setPhaseToNextPhase();
		const days_passed_last_trial_results = this.days_passed;

		this.verdict = this.getMajorityVote(this.trial_votes);

		await this.announceTrialVerdict();
		await this.announceRevealedVotes();

		if (this.verdict === TrialOutcomes.Guilty) {
			await this.lynchPlayerOnTrial();
		}

		await this.resetPlayerOnTrial();

		if (await this.killDeadPlayers() === "all")
			return;

		const winning_factions = this.getWhichFactionWon();
		console.log({winning_factions})
		if (winning_factions) {
			return await this.endGame();
		}
		else {
			await this.startNight(days_passed_last_trial_results);
		}
	}

	async startNight(days_passed_last_day) {
		console.log({days_passed_last_day});

		if (
			days_passed_last_day !== undefined &&
			(this.state !== GameStates.InProgress ||
			this.phase !== Phases.Day ||
			this.days_passed > days_passed_last_day)
		) {
			return
		}

		await this.setPhaseToNextPhase();
		const days_passed_last_night = this.days_passed;

		await Game.closeDayChat();
		await Game.openNightChannels();
		await this.resetAllPlayersNightInfo();
		await this.promoteMafia();

		await this.announceNight();

		await Game.log("Waiting for Night to End");

		await wait(PhaseWaitTimes.Night * 4/5, "min");

		if (
			this.state === GameStates.InProgress &&
			this.phase === Phases.Night &&
			this.days_passed <= days_passed_last_night
		) {
			this.announceMessages(
				Announcements.PhaseAlmostOverWarning(PhaseWaitTimes.Night*1/5)
			)
		}

		await wait(PhaseWaitTimes.Night * 1/5, "min");

		await this.startDay(days_passed_last_night);
	}

	static async getAlivePlayersAutocomplete(interaction) {
		let autocomplete_values;
		const focused_param = await interaction.options.getFocused(true);
		if (!focused_param) return;
		const entered_value = focused_param.value;

		autocomplete_values = global.Game.Players.getAlivePlayers()
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

	async addPlayerToGame(player_name, player_id, interaction, isFakeUser=false) {
		let player_member;

		const rdm_guild = await getRDMGuild();

		if ( this.Players && this.Players.get(player_name) ) {
			return await interaction.editReply(`The name, **${player_name}**, already exists.`)
		}

		const validator_result = validator.validateName(player_name);
		if (validator_result !== true)
			return await interaction.editReply(validator_result);

		if (!isFakeUser) {

			player_member = await getGuildMember(rdm_guild, player_id);
			const
				spectator_role = await getRole(rdm_guild, RDMRoles.Spectator),
				living_role = await getRole(rdm_guild, RDMRoles.Living);

			// Adds & Removes Roles and Sets Nickname to name
			await player_member.roles.add(living_role).catch(console.error());
			await player_member.roles.remove(spectator_role).catch(console.error());
			await player_member.setNickname(player_name).catch(console.error());
		}

		const player = await this.Players.addPlayerFromObj({id: player_id, name: player_name});
		await player.createChannel();

		const staff_chnl = await Game.getStaffChnl();
		staff_chnl.send(`**${player_name}** added to the game.`, {ephemeral: true});


		global.Game.announceMessages(
			`**${player_name}** joined the game`
		);
	}

	getWhichFactionWon() {
		console.log("Checking If Anybody Won");

		let winning_faction = false,
			winning_players = [],
			living_factions = [], // Factions that just need the other factions eliminated to win
			living_lone_survival_roles = [], // Roles that need to survive while eliminating every other faction
			living_survival_roles = [], // Roles that only need to survive to the end
			living_survive_without_town_roles = [], // Roles that only need to survive to the end
			alive_players = this.Players.getAlivePlayers()

		for (let player_info of alive_players) {
			const player_role = global.Roles[player_info.role];

			// Roles that need to survive while eliminating every other faction
			if (player_role.goal == WinConditions.SurviveEliminateOtherFactions) {
				if (!living_lone_survival_roles.includes(player_role.name))
					living_lone_survival_roles.push(player_role.name);
			}
			// Roles that only need to survive to the end
			else if (player_role.goal == WinConditions.Survive) {
				if (!living_survival_roles.includes(player_role.name))
					living_survival_roles.push(player_role.name);
			}
			// Roles that need to survive while town loses
			else if (player_role.goal == WinConditions.SurviveTownLose) {
				if (!living_survive_without_town_roles.includes(player_role.faction))
				living_survive_without_town_roles.push(player_role.faction);

			}
			// Factions that just need the other factions eliminated to win
			else if (player_role.goal == WinConditions.EliminateOtherFactions) {
				if (!living_factions.includes(player_role.faction))
					living_factions.push(player_role.faction);
			}
		}

		console.log({living_factions, living_lone_survival_roles, living_survival_roles, living_survive_without_town_roles});

		if (alive_players.length <= 0)
			winning_faction = "Nobody";

		console.log("Going through living factions");
		for (let faction_checking of living_factions) {

			console.log({faction_checking});

			if (winning_faction) break;
			let hasFactionWon = true;

			for (let player of alive_players) {
				let player_role = global.Roles[player.role],
					player_faction = player_role.faction,
					player_role_indentifier = `${player_faction} ${player_role.alignment}`;

				console.log({player_role_indentifier});

				if (
					player_faction != faction_checking  &&
					!["Neutral Evil", "Neutral Chaos", "Neutral Benign"].includes(player_role_indentifier)
				) {
					console.log("Didn't Win");
					hasFactionWon = false;
					break;
				}
			}

			if (hasFactionWon) {
				winning_faction = faction_checking;
				winning_players = [
					...winning_players,
					...this.Players.getPlayerList()
						.filter(p =>
							roles[p.role].faction == faction_checking && !winning_players.includes(p.name)
						)
						.map(p => p.name)
				];
				break;
			}

		}

		console.log("Going through roles that need to survive alone.");
		for (let role_checking of living_lone_survival_roles) {

			console.log({role_checking});

			if (winning_faction) break;

			let hasFactionWon = true;

			for (let player of alive_players) {
				let player_role = global.Roles[player.role],
					player_faction = player_role.faction,
					player_role_indentifier = `${player_faction} ${player_role.alignment}`;

				console.log({player_role_indentifier});

				if (
					player_role.name != role_checking  &&
					!["Neutral Evil", "Neutral Chaos", "Neutral Benign"].includes(player_role_indentifier)
				) {
					console.log("Didn't Win");
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

		console.log("Going through roles that need to only survive.");
		for (let role_checking of living_survival_roles) {

			console.log({role_checking});
			winning_players = [
				...winning_players,
				...alive_players
					.filter(p => p.role == role_checking && !winning_players.includes(p.name))
					.map(p => p.name)
			];

			if (!winning_faction) {
				let hasFactionWon = !alive_players.some(player => global.Roles[player.role].name != role_checking);

				if (hasFactionWon) {
					winning_faction = role_checking;
				}
				else {
					console.log("Didn't Win");
				}
			}
		}

		console.log("Going through roles that need to only survive while town loses.");
		for (let role_checking of living_survival_roles) {

			console.log({role_checking});

			if (winning_faction === Factions.Town) break;
			winning_players = [
				...winning_players,
				...alive_players
					.filter(p => p.role == role_checking && !winning_players.includes(p.name))
					.map(p => p.name)
			];

			if (!winning_faction) {
				let hasFactionWon = !alive_players.some(player => global.Roles[player.role].name != role_checking);

				if (hasFactionWon) {
					winning_faction = role_checking;
				}
				else {
					console.log("Didn't Win");
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

	async sendDeathMsg(death, type="attack") {
		let victim_name = death.victim,
			victim_player = this.Players.get(victim_name),
			death_announcement_msgs = [];

		// Make cause of death message
		if (type == "attack") {
			death_announcement_msgs.push(`_ _\n${Announcements.PlayerFoundDead(victim_player)}`);


			for (let [index, kill] of death.kills.entries()) {
				const killer = this.Players.get(kill.killer_name);

				if (kill.flavor_text) {
					death_announcement_msgs.push(kill.flavor_text);
				}
				else if (
					[RoleNames.Mafioso, RoleNames.Godfather].includes(kill.killer_role)
				) {
					if (index == 0)
						death_announcement_msgs.push(
							`\n` + Feedback.AnnounceMurderByFaction(Factions.Mafia)
						);
					else
						death_announcement_msgs.push(
							`\n` + Feedback.AnnounceAnotherMurderByFaction(Factions.Mafia)
						);
				}
				else {
					if (index == 0)
						death_announcement_msgs.push(
							`\n` + Feedback.AnnounceMurderByRole(kill.killer_role)
						);
					else
					death_announcement_msgs.push(
						`\n` + Feedback.AnnounceAnotherMurderByRole(kill.killer_role)
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
			death_announcement_msgs.push(Announcements.LastWillUnidentifiable())
		}
		else if (!victim_player.last_will) {
			death_announcement_msgs.push(Announcements.LastWillNotFound())
		}
		else {
			death_announcement_msgs.push(Announcements.LastWillFound(victim_player.last_will));
		}

		// Make role reveal message
		if (victim_player.isUnidentifiable) {
			death_announcement_msgs.push(Announcements.RoleIsUnidentifiable(victim_player));
		}
		else {
			death_announcement_msgs.push(Announcements.RoleReveal(victim_player));
		}

		await this.announceMessages(...death_announcement_msgs);
	}

	async promoteMafia() {
		if (this.Players.isFactionAlive(Factions.Mafia)) {
			if (
				!this.Players.isRoleAlive(RoleNames.Mafioso) &&
				!this.Players.isRoleAlive(RoleNames.Godfather)
			) {
				const mafia_players = this.Players.getAlivePlayersInFaction(Factions.Mafia)

				const player_to_promote = getRandArrayItem(mafia_players);
				player_to_promote.convertToRole(RoleNames.Mafioso);

				const rdm_guild = await getRDMGuild();
				const mafia_channel = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.mafia_chat);

				mafia_channel.send(
					`**${player_to_promote.name}** has been promoted to **Mafioso**!`
				);

			}
		}
	}

	async endGame(isDraw=false) {
		console.log(this.winning_factions);
		console.log(this.winning_players);

		if (!isDraw) {
			await this.announceMessages(
				...Announcements.CongratulateWinners(this.winning_factions, this.winning_players)
			);
		}
		else {
			await this.announceMessages(
				"The game ends in a draw :/"
			);
		}

		this.Players.getPlayerList().forEach(async player => {
			const contestant = global.rapid_discord_mafia.getContestantFromPlayer(player);
			contestant.giveCoins(CoinRewards.Participation);
		});

		await global.Game.announceMessages(
			Announcements.RewardCoinsToPlayers(
				this.Players.getPlayerList().map(player => player.name),
				CoinRewards.Participation
			)
		);

		this.winning_players.forEach(async player_name => {
			const player = this.Players.get(player_name);
			const contestant = global.rapid_discord_mafia.getContestantFromPlayer(player);
			const coins_rewarded = CoinRewards.Winning;

			contestant.giveCoins(coins_rewarded);

			await global.Game.announceMessages(
				Announcements.RewardCoinsToPlayer(player.name, coins_rewarded)
			);
		});

		await saveObjectToGitHubJSON(global.rapid_discord_mafia, "rapid_discord_mafia");

		let revealed_roles_msg = "_ _\n# Everyone's Roles\n>>> "
		for (const player in this.role_log) {
			const role = this.role_log[player];
			revealed_roles_msg += `**${player}**: ${role}\n`
		}

		await this.announceMessages(
			revealed_roles_msg
		);

		for (const day_num in this.action_log) {
			const actions = this.action_log[day_num];

			await this.announceMessages(
				`_ _\n## Night ${day_num} Actions\n>>> ` +
				actions.join("\n")
			);
		}

		await wait("30", "s");

		let resetgame = require("../../commands/rapid_discord_mafia/reset-game.js");
		await resetgame.execute();
	}

	static async convertAllToSpectator() {
		const rdm_guild = await getRDMGuild();
		const spectator_role = await getRole(rdm_guild, RDMRoles.Spectator);

		for (let role_name of [RDMRoles.Ghosts, RDMRoles.Living]) {
			const role_to_remove = await getRole(rdm_guild, role_name);

			role_to_remove.members.each(async member => {
				console.log({member})
				await removeRole(member, role_to_remove);
				await addRole(member, spectator_role);
			});
		}
	}

	static async moveChannelsToArchives() {
		const
			rdm_guild = await getRDMGuild(),
			player_action_chnls = await getCategoryChildren(rdm_guild, ids.rapid_discord_mafia.category.player_action),
			archive_category = await getChannel(rdm_guild, ids.rapid_discord_mafia.category.archive);

		await player_action_chnls.forEach(
			async (channel) => {
				await channel.setParent(archive_category);
				// await channel.delete();
			}
		);
	}

	static async privateNightChannels() {
		const rdm_guild = await getRDMGuild();
		const night_channels = await getCategoryChildren(rdm_guild, ids.rapid_discord_mafia.category.night);
		const living_role = await getRole(rdm_guild, RDMRoles.Living);

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
			rdm_guild = await getRDMGuild(),
			living_role = await getRole(rdm_guild, RDMRoles.Living),
			day_chat_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.town_discussion);

		await day_chat_chnl.permissionOverwrites.create(
			living_role,
			{ SendMessages: true }
		);

		if (Game.IS_TESTING) {
			await day_chat_chnl.permissionOverwrites.create(
				rdm_guild.roles.everyone,
				{ ViewChannel: false }
			);
		}

		day_chat_chnl.send("> Opened.");

		await Game.announceMessages(
			Announcements.OpenDayChat(day_chat_chnl.id)
		);
	}

	static async closeDayChat() {
		const
			rdm_guild = await getRDMGuild(),
			living_role = await getRole(rdm_guild, RDMRoles.Living),
			day_chat_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.town_discussion);

		await day_chat_chnl.permissionOverwrites.edit(living_role, { SendMessages: false });

		if (Game.IS_TESTING) {
			await day_chat_chnl.permissionOverwrites.create(
				rdm_guild.roles.everyone,
				{ ViewChannel: false }
			);
		}

		await day_chat_chnl.send("> Closed.");
	}

	static async closeNightChannels() {
		const rdm_guild = await getRDMGuild();
		const night_channels = await getCategoryChildren(rdm_guild, ids.rapid_discord_mafia.category.night);
		const living_role = await getRole(rdm_guild, RDMRoles.Living);

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
		const rdm_guild = await getRDMGuild();
		const night_channels = await getCategoryChildren(rdm_guild, ids.rapid_discord_mafia.category.night);
		const living_role = await getRole(rdm_guild, RDMRoles.Living);

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
		const rdm_guild = await getRDMGuild();
		const pre_game_channels = await getCategoryChildren(rdm_guild, ids.rapid_discord_mafia.category.pre_game);
		const living_role = await getRole(rdm_guild, RDMRoles.Living);
		const ghost_role = await getRole(rdm_guild, RDMRoles.Ghosts);

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
			rdm_guild = await getRDMGuild(),
			living_role = await getRole(rdm_guild, RDMRoles.Living),
			ghosts_role = await getRole(rdm_guild, RDMRoles.Ghosts),
			pre_game_channels = await getCategoryChildren(rdm_guild, ids.rapid_discord_mafia.category.pre_game);

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
			rdm_guild = await getRDMGuild(),
			living_role = await getRole(rdm_guild, RDMRoles.Living),
			ghosts_role = await getRole(rdm_guild, RDMRoles.Ghosts),
			ghost_chat_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.ghost_chat);

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
			rdm_guild = await getRDMGuild(),
			living_role = await getRole(rdm_guild, RDMRoles.Living),
			ghosts_role = await getRole(rdm_guild, RDMRoles.Ghosts),
			ghost_chat_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.ghost_chat);

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
			rdm_guild = await getRDMGuild(),
			living_role = await getRole(rdm_guild, RDMRoles.Living),
			town_discussion_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.town_discussion);

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
	// 		rdm_guild = await getRDMGuild(),
	// 		on_trial_role = await getRole(rdm_guild, RDMRoles.OnTrial),
	// 		defense_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.defense_stand);

	// 	await defense_chnl.permissionOverwrites.set([{
	// 		id: rdm_guild.id,
	// 		allow: [PermissionFlagsBits.ViewChannel],
	// 		deny: [PermissionFlagsBits.SendMessages],
	// 	}]);
	// 	await defense_chnl.permissionOverwrites.create(on_trial_role, { SendMessages: true });
	// }

	// static async closeVotingChannel() {
	// 	const
	// 		rdm_guild = await getRDMGuild(),
	// 		voting_booth_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.voting_booth);

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
			rdm_guild = await getRDMGuild(),
			game_announce_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.game_announce),
			on_trial_role = await getRole(rdm_guild, RDMRoles.OnTrial);

		if (Game.IS_TESTING) {
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
			rdm_guild = await getRDMGuild(),
			living_role = await getRole(rdm_guild, RDMRoles.Living),
			join_chat_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.join_chat);

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
			rdm_guild = await getRDMGuild(),
			living_role = await getRole(rdm_guild, RDMRoles.Living),
			join_chat_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.join_chat);

		if (Game.IS_TESTING) {
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
		console.time("convertAllToSpectator");
		await Game.convertAllToSpectator();
		console.timeEnd("convertAllToSpectator");
		console.time("moveChannelsToArchives");
		await Game.moveChannelsToArchives();
		console.timeEnd("moveChannelsToArchives");
		console.time("privateNightChannels");
		await Game.privateNightChannels();
		console.timeEnd("privateNightChannels");
		console.time("publicizePreGameChannels");
		await Game.publicizePreGameChannels();
		console.timeEnd("publicizePreGameChannels");
		console.time("closeGhostChannel");
		await Game.closeGhostChannel();
		console.timeEnd("closeGhostChannel");
		console.time("closeTownDiscussionChannel");
		await Game.closeTownDiscussionChannel();
		console.timeEnd("closeTownDiscussionChannel");
		// console.time("closeVotingChannel");
		// await Game.closeVotingChannel();
		// console.timeEnd("closeVotingChannel");
		console.time("setAnnounceChannelPerms");
		await Game.setAnnounceChannelPerms();
		console.timeEnd("setAnnounceChannelPerms");
		console.time("closeJoinChannel");
		await Game.closeJoinChannel();
		console.timeEnd("closeJoinChannel");
		// console.time("setDefenseChannelPerms");
		// await Game.setDefenseChannelPerms();
		// console.timeEnd("setDefenseChannelPerms");

		global.Game = new Game( new Players() );
	}

	static getEmptyGame() {
		return new Game( new Players() );
	}

	async startSignUps() {
		await Game.openJoinChannel();
		await this.setState(GameStates.SignUp);
		const starting_unix_timestamp = getUnixTimestamp() + PhaseWaitTimes.SignUps*60;

		this.announceMessages(
			Announcements.StartSignUps(
				ids.rapid_discord_mafia.roles.sign_up_ping,
				ids.rapid_discord_mafia.channels.join_chat,
				starting_unix_timestamp
			)
		);

		await wait(PhaseWaitTimes.SignUps*(2/3), "min");
		console.log(this.state);
		if (this.state !== GameStates.SignUp) return

		this.announceMessages(
			Announcements.SignUpsReminder(
				ids.rapid_discord_mafia.channels.join_chat,
				starting_unix_timestamp
			)
		);

		await wait(PhaseWaitTimes.SignUps*(4/15), "min");
		console.log(this.state);
		if (this.state !== GameStates.SignUp) return

		this.announceMessages(
			Announcements.SignUpsFinalReminder(
				ids.rapid_discord_mafia.channels.join_chat,
				starting_unix_timestamp
			)
		);

		await wait(PhaseWaitTimes.SignUps*(1/15), "min");
		console.log(this.state);
		if (this.state !== GameStates.SignUp) return

		const player_count = this.Players.getPlayerCount();

		if (player_count >= Game.MIN_PLAYER_COUNT) {
			await this.announceMessages(
				Announcements.SignUpsClosed(ids.users.LL, ids.rapid_discord_mafia.roles.living, player_count)
			);

			await this.setState(GameStates.ReadyToBegin);
		}
		else {
			await this.announceMessages(
				Announcements.NotEnoughSignUps(player_count, Game.MIN_PLAYER_COUNT)
			)
			await Game.reset();
		}

		await Game.closeJoinChannel();
	}

	async setState(state) {
		this.state = state;
		await Game.log(`Setting state to ${state}`, 2)
	}

	/**
	 *
	 * @param {Player} player_using_ability
	 * @param {string} arg_value
	 * @returns true if valid or string containing reason if invalid
	 */
	isValidArgValue(player_using_ability, ability_arg, arg_value) {
		if (ability_arg.subtypes.includes(ArgumentSubtypes.NotSelf)) {
			if (arg_value === player_using_ability.name) {
				return `You cannot target yourself`;
			}
		}

		if (ability_arg.subtypes.includes(ArgumentSubtypes.NonMafia)) {
			const player_targeting = this.Players.get(arg_value);
			const player_targeting_role = roles[player_targeting.role];
			if (player_targeting_role.faction === Factions.Mafia) {
				return `You cannot target **${player_targeting.name}** as you may only target non-mafia`;
			}
		}

		return true;
	}
}

module.exports = Game;