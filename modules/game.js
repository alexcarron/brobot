const { GameStates, Phases, Subphases, MessageDelays, Factions, MaxFactionMembersRatios, RDMRoles, WinConditions } = require("./enums.js");
const { getChannel, getGuild, wait, getRandArrayItem, getGuildMember, getRole } = require("./functions.js");
const ids = require("../databases/ids.json");
const Players = require("./players.js");
const Player = require("./player.js");
const validator = require('../utilities/validator.js');
const { github_token } =  require("../modules/token.js");

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
		this.next_deaths = [];
		this.winning_factions = [];
		this.winning_players = [];
		this.role_identifiers = [];
		this.role_list = [];
		this.players_in_limbo = [];
		this.isSilentCursed = false;
		this.possible_factions = [
			"Mafia",
			"Town",
			...Object.values(global.Roles)
				.filter((role) => `${role.faction} ${role.alignment}` === "Neutral Killing")
				.map((role) => role.name)
		];
		this.all_abilities = this.getAllAbilities();
		this.abilities_performed = {}
	}

	logGame() {
		let simple_game_obj = JSON.parse(JSON.stringify(this));
		delete simple_game_obj.all_abilities;
		console.log(`\x1b[36m Logging Game: \x1b[0m`);
		console.log(JSON.stringify(simple_game_obj, null, 2));
	}

	logPlayers() {
		console.log(JSON.stringify(this.Players, null, 2));
	}

	getAllAbilities() {
		return Object.values(global.Roles).reduce(
			(accum_abilities, role) => {
				if (role.abilities) {
					for (let ability of role.abilities) {
						accum_abilities = {
							...accum_abilities,
							[ability.name]: ability,
						}
					}
					return accum_abilities;
				}
				else
					return accum_abilities;
			},
			{}
		);
	}

	/**
	 * {
	 * 	by: {Player.name}
	 *  name: {Ability.name}
	 * 	args: [ ...{Arg} ]
	 * }
	 */
	async updateAbilitiesPerformed() {
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
				let ability1_priority = this.all_abilities[ability_done1.name].priority,
					ability2_priority = this.all_abilities[ability_done2.name].priority;

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
	async getStaffChnl() {
		return await getChannel(
			await this.getGuild(),
			ids.rapid_discord_mafia.channels.staff
		);
	}

	/**
	 * @return {Discord.Guild} Rapid Discord Mafia Guild
	 */
	async getGuild() {
		return await getGuild(ids.rapid_discord_mafia.rdm_server_id);
	}

	setGame(game) {
		for (const property in game) {
			if (property !== "Players") {
				this[property] = game[property];
			}
		}

		this.Players = new Players();

		for (const player_obj of Object.values(game.Players.players)) {
			const player = new Player(player_obj);
			this.Players.addPlayer(player);
		}
	}

	start(role_identifiers) {
		this.state = GameStates.InProgress;
		this.role_identifiers = role_identifiers;
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
		this.players_in_limbo = [];
		this.isSilentCursed = false;
		this.abilities_performed = {};
		this.Players.reset();

		this.nextPhase();
	}

	nextPhase() {
		switch (this.phase) {
			case Phases.Day:
				switch (this.subphase) {
					case Subphases.Announcements:
						this.setPhaseToVoting();
						break;

					case Subphases.Voting:
						this.setPhaseToTrial();
						break;

					case Subphases.Trial:
						this.setPhaseToTrialResults();
						break;

					case Subphases.TrialResults:
					default:
						this.setPhaseToNight();
						break;
				}
				break;

			case Phases.Night:
			default:
				this.setPhaseToDay();
				break;
		}
	}

	async setPhaseToNight() {
		await this.saveGameDataToDatabase();
		this.phase = Phases.Night;
		this.subphase = "";
		this.days_passed += 0.5;
	}

	async setPhaseToDay() {
		await this.saveGameDataToDatabase();
		this.phase = Phases.Day;
		this.subphase = Subphases.Announcements;
		this.days_passed += 0.5;
	}

	async setPhaseToVoting() {
		await this.saveGameDataToDatabase();
		this.subphase = Subphases.Voting;
		this.resetVotes();
	}

	async setPhaseToTrial() {
		await this.saveGameDataToDatabase();
		this.subphase = Subphases.Trial;
		this.on_trial = this.getMajorityVote(this.votes);
		this.resetTrialVotes();
		this.resetVerdict();
	}

	async setPhaseToTrialResults() {
		await this.saveGameDataToDatabase();
		this.subphase = Subphases.TrialResults;
		this.verdict = this.getMajorityVote(this.trial_votes);
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

	isRoleInMissingFaction(role, missing_factions) {
		return missing_factions.some((missing_faction) => {
			return this.isRoleInFaction(role, missing_faction);
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

	// TO-DO: Revise
	async createRoleList() {
		const staff_chnl = await this.getStaffChnl();

		let faction_counts = {},
			existing_factions = [],
			missing_factions = this.possible_factions;

		const getRandomRoleFromIdentifier = function(identifier, curr_role_list=[]) {
			let possible_role_names,
				chosen_role,
				needOpposingFactions = existing_factions.length <= 1;

			console.log(`Getting Random Role From:`);
			console.log({identifier});
			console.log({curr_role_list, existing_factions, missing_factions, faction_counts, needOpposingFactions});

			// Filter the list of all roles to only include those that meet the specified criteria
			console.log("Going Through Possible Roles.")
			let possible_roles = Object.values(global.Roles).filter( (role_checking) => {

				// If Random Faction Identifier
				if (identifier.faction != "Any") {
					if (
						identifier.alignment == "Random" &&
						(role_checking.faction != identifier.faction || role_checking.alignment == "Crowd")
					) {
						return false
					}
					// If Specified Alignment Identifier
					else if (
						identifier.alignment != "Random" &&
						(role_checking.faction != identifier.faction || role_checking.alignment != identifier.alignment)
					) {
						return false
					}
				}
				// Don't go over max ratios
				else {
					if (
						faction_counts["Mafia"] != null &&
						faction_counts["Town"] != null
					) {
						if (
							(role_checking.faction == "Mafia") &&
							((faction_counts["Mafia"] + 1) / faction_counts["Town"] >= MaxFactionMembersRatios.MafiaToTown)
						) {
							return false;
						}

						if (
							(role_checking.faction == "Town") &&
							((faction_counts["Town"] + 1) / faction_counts["Mafia"] >= MaxFactionMembersRatios.TownToMafia)
						) {
							return false;
						}
					}
				}


				// If there's no Mafioso in the role list, do not include a non-mafioso mafia role in the role list
				if (
					!curr_role_list.includes("Mafioso") &&
					role_checking.faction === "Mafia" &&
					role_checking.name !== "Mafioso"
				) {
					return false
				}

				// Exclude unique roles that have already been chosen or are reserved for future use
				if (
					role_checking.isUnique &&
					(curr_role_list.includes(role_checking.name) ||
					this.role_identifiers.includes(role_checking.name))
				) {
					return false;
				}

				if (needOpposingFactions && this.isIdentifierInMissingFaction(identifier)) {
					return this.isRoleInMissingFaction(role_checking, missing_factions);
				}
				else {
					return true
				}
			});

			// Randomize Role
			possible_role_names = possible_roles.map(r => r.name);
			chosen_role = getRandArrayItem(possible_roles);
			console.log({possible_role_names, chosen_role});

			// Add faction to list of existing factions
			this.possible_factions.forEach( (faction) => {
				if (this.isRoleInFaction(chosen_role, faction) && !existing_factions.includes(faction)) {
					existing_factions.push(faction);

					console.log({missing_factions});

					missing_factions = missing_factions.filter(missing_faction => missing_faction !== faction);
				}
			});

			if (chosen_role.faction !== "Neutral") {
				if (faction_counts[chosen_role.faction] == null)
					faction_counts[chosen_role.faction] = 0;

				faction_counts[chosen_role.faction] += 1;
			}
			else if (chosen_role.alignment == "Killing") {
				if (faction_counts[chosen_role.name] == null)
					faction_counts[chosen_role.name] = 0;

				faction_counts[chosen_role.name] += 1;
			}

			return chosen_role.name;
		}
		const getRoleNameFromIdentifier = async function(role_identifier) {
			let [faction, alignment] = role_identifier.split(" "),
				identifier = {
					"faction": faction,
					"alignment": alignment,
				},
				role_names = Object.values(global.Roles).map(role => role.name),
				role_name;

			if (identifier.faction == "Random") {
				identifier = {
					"faction": alignment,
					"alignment": faction,
				}
			}
			else if (identifier.faction == "Any") {
				identifier.alignment = "Random";
			}
			console.log(identifier);

			if (role_names.includes(role_identifier)) {
				role_name = role_identifier;
			}
			else if (Object.keys(Factions).includes(identifier.faction) || identifier.faction == "Any") {
				role_name = getRandomRoleFromIdentifier(identifier, this.role_list);
			}
			else {
				console.log(`${role_identifier} is not a valid role identifier. getRoleNameFromIdentifier()`);
				await staff_chnl.send(`${role_identifier} is not a valid role identifier. getRoleNameFromIdentifier()`);
				return;
			}

			console.log(`${role_identifier}: ${role_name}`);
			return role_name;
		}
		const getIdentifierType = function(role_identifier) {
			let role_names = Object.values(global.Roles).map(role => role.name);

			console.log(`Finding Indentifier Type for ${role_identifier}`)

			if (role_names.includes(role_identifier)) {
				return "role"
			}

			let [faction, alignment] = role_identifier.split(" ");

			if (faction == "Random")
				[faction, alignment] = [alignment, faction];

			if (Object.keys(Factions).includes(faction)) {
				if (alignment == "Random")
					return "faction"
				else
					return "faction alignment"
			}
			else if ( faction == "Any" ) {
				return "any"
			}
			else {
				console.log(`${role_identifier} is not a valid role identifier. getIdentfierType()`);
				staff_chnl.send(`${role_identifier} is not a valid role identifier. getIdentfierType()`);
				return null;
			}
		}
		const sortRoleIdentifiers = function(role_identifiers) {
			return role_identifiers.sort(
				(role_identifier1, role_identifier2) => {
					let indentifiers = [
						{name: role_identifier1},
						{name: role_identifier2}
					];

					indentifiers = indentifiers.map(
						( { name } ) => {
							const
								priorities = {
									"role": 1,
									"faction": 2,
									"faction alignment": 3,
									"any": 4
								},
								type = getIdentifierType(name),
								priority = priorities[type];

							console.log(`Type found: ${type}\n`);

							return { name, type, priority };
						}
					);

					return indentifiers[0].priority - indentifiers[1].priority;
				}
			)
		}

		const sorted_role_identifiers = sortRoleIdentifiers([ ...this.role_identifiers]);
		console.log({sorted_role_identifiers});

		for (let role_identifier of sorted_role_identifiers) {
			let role_name = await getRoleNameFromIdentifier(role_identifier);
			await this.role_list.push(role_name);
		}
	}

	addVictimToNextDeaths(target_player, attacker_player) {
		let target_death_index = global.Game.next_deaths.findIndex(death => death.victim == target_player.name);

		if (target_death_index == -1) {
			this.next_deaths.push(
				{
					"victim": target_player.name,
					"killers": [attacker_player.name],
				}
			);
		}
		else {
			global.Game.next_deaths[target_death_index].killers.push(attacker_player.name);
		}
	}

	makePlayerDoAbility({player, ability_name, ability_arguments}) {
		global.Game.abilities_performed[player.name] =
			{
				"name": ability_name,
				"by": player.name,
				"args": ability_arguments
			}
		this.sortAbilitiesPerformed();
	}

	getMajorityVote(votes) {
		console.log("Got Majority Vote");

		let majority_vote = "none",
			vote_counts = {},
			max_vote_count = 0;

		for (let voter in votes) {
			let vote = votes[voter];

			if (vote.toLowerCase() == "abstain")
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
				majority_vote = "tie";
			}
		}

		return majority_vote;
	}

	isRoleInFaction(role, faction) {
		if (Object.values(Factions).includes(faction))
			return role.faction === faction;
		else
			return role.name === faction;
	}

	async sendFeedbackToPlayers() {
		console.log("Feedback");
		console.log(this.Players.getPlayers());

		for (let player_name of this.Players.getPlayerNames()) {
			const
				player_feedback = this.Players.get(player_name).feedback,
				player_id = this.Players.get(player_name).id,
				player_channel_id = this.Players.get(player_name).channel_id,
				player_chnl = await getChannel(await this.getGuild(), player_channel_id);

			console.log({player_name, player_feedback, player_id})

			if (player_feedback.length <= 0)
				continue;

			let feedback_msg =
				`_ _\n<@${player_id}>\n` +
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

	silentCurseTown() {
		this.isSilentCursed = true;
	}

	async announceMessages(...messages) {
		for (let message of messages) {
			const game_announce_chnl = await getChannel(await this.getGuild(), ids.rapid_discord_mafia.channels.game_announce);
			game_announce_chnl.send(message);
			console.log(message);
			await wait(MessageDelays.Normal, "s");
		}
	}

	startTrial(days_passed, message) {

		console.log({days_passed});

		if (
			this.state === GameStates.InProgress &&
			this.phase === Phases.Day &&
			this.subphase === Subphases.Voting &&
			this.days_passed <= days_passed
		) {
			const start_trial_cmd = require(`../commands/rapid_discord_mafia/starttrial.js`);
			start_trial_cmd.execute(message);
		}
	}

	startTrialResults(days_passed, message) {

		console.log({days_passed});

		if (

			this.state === GameStates.InProgress &&
			this.phase === Phases.Day &&
			this.subphase === Subphases.Trial &&
			this.days_passed <= days_passed
		) {
			const start_trial_results_cmd = require(`../commands/rapid_discord_mafia/starttrialresults.js`);
			start_trial_results_cmd.execute(message);
		}
	}

	startDay(days_passed, message) {

		console.log({days_passed});

		if (
			this.state === GameStates.InProgress &&
			this.phase === Phases.Night &&
			this.days_passed <= days_passed
		) {
			const start_day_cmd = require(`../commands/rapid_discord_mafia/startday.js`);
			start_day_cmd.execute(message);
		}
	}

	end() {
		this.state = GameStates.Ended;
	}

	startNight(days_passed, message) {

		console.log({days_passed});

		if (
			this.state === GameStates.InProgress &&
			this.phase === Phases.Day &&
			this.days_passed <= days_passed
		) {
			const start_night_cmd = require(`../commands/rapid_discord_mafia/startnight.js`);
			start_night_cmd.execute(message);
		}
	}


	async addPlayerToGame(player_name, player_id, interaction, isFakeUser=false) {
		let player_member;

		const rdm_guild = await this.getGuild();
		const join_chat = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.join_chat);

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

		const player = new Player({id: player_id, name: player_name});
		player.createChannel();
		this.Players.addPlayer(player);

		interaction.editReply(`**${player_name}** added to the game.`);
		console.log(this.Players.getPlayers());
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
				winning_players = alive_players.filter(p => global.Roles[p.role].faction == faction_checking).map(p => p.name);
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
				winning_players = alive_players.filter(p => p.role == role_checking).map(p => p.name);
				break;
			}

		}

		console.log("Going through roles that need to only survive.");
		for (let role_checking of living_survival_roles) {

			console.log({role_checking});
			winning_players.push(
				alive_players
					.filter(p => p.role == role_checking)
					.map(p => p.name)
			);

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
			winning_players.push(
				alive_players
					.filter(p => p.role == role_checking)
					.map(p => p.name)
			);

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
				this.winning_players.push(winning_players);
			}
		}

		return winning_faction
	}

	async sendDeathMsg(announce_chnl, death, type="attack") {
		let victim_name = death.victim,
			killer_names = death.killers,
			victim_player = global.Game.Players.get(victim_name),
			killer_players = global.Game.Players.getPlayerList().filter(p => killer_names.includes(p.name)),
			death_announcement_msgs = [];

		// Make cause of death message
		if (type == "attack") {
			death_announcement_msgs.push(`:skull: **${victim_player.name}** was found dead last night.`);

			for (let [index, killer_player] of killer_players.entries()) {
				if ( ["Mafioso", "Godfather"].includes(killer_player.role) ) {
					if (index == 0)
						death_announcement_msgs.push(`\nThey were killed by the **Mafia**.`);
					else
						death_announcement_msgs.push(`\nThey were also killed by the **Mafia**.`);
				}
				else {
					if (index == 0)
						death_announcement_msgs.push(`\nThey were killed by a(n) **${killer_player.role}**.`);
					else
						death_announcement_msgs.push(`\nThey were also killed by a(n) **${killer_player.role}**.`);
				}

				if (killer_player && killer_player.death_note)
					death_announcement_msgs.push(`The killer left behind a death note: \`\`\`${killer_player.death_note}\`\`\``);

			}
		}
		else if (type == "lynch") {
			death_announcement_msgs.push(`:skull: **${victim_player.name}** was **lynched** by the town.`);
		}

		if (death.flavor_text)
			death_announcement_msgs.push(death.flavor_text);

		// Make last will message
		if (victim_player.last_will)
			death_announcement_msgs.push(`They left behind a last will: \`\`\`\n${victim_player.last_will}\n\`\`\``);
		else
			death_announcement_msgs.push(`No last will could be found.`);

		death_announcement_msgs.push(`**${victim_name}**'s role was revealed to be **${ victim_player.role }**.\n_ _`);

		for (let msg of death_announcement_msgs) {
			announce_chnl.send(msg);

			let {wait_times} = require("../databases/rapid_discord_mafia/constants.json");
			await wait(...wait_times["message_delay"]);
		}
	}



	async endGame() {
		this.announceMessages(
			`**${global.Game.winning_factions.join(", ")}** won!`,
			`Congratulations ${global.Game.winning_players.map(p => `**${p}**`).join(", ")}!`
		);

		await wait("30", "s");

		let resetgame = require("../commands/rapid_discord_mafia/resetgame.js");
		await resetgame.execute();
	}
}

module.exports = Game;