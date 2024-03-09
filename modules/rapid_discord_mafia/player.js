const { RDMRoles, Announcements, MessageDelays, Feedback, Factions, RoleNames, AbilityTypes, TrialVotes, AbilityName: AbilityName, AbilityArgName, ArgumentSubtypes, Subphases, Votes, Phases } = require("../enums");
const RoleManager = require("./RoleManager");
const ids = require("../../data/ids.json");
const Role = require("./Role");

const
	{ getGuildMember, getRole, addRole, removeRole, getChannel, wait, getRandArrayItem, getRDMGuild, toTitleCase } = require("../functions"),
	{ PermissionFlagsBits, PermissionOverwriteManager, PermissionOverwrites } = require('discord.js'),
	rdm_ids = require("../../data/ids.json").rapid_discord_mafia;

class Player {
	/**
	 * The name of the player.
	 * @type {string}
	 */
	name;

	/**
	 * The defense level of the player.
	 * @type {Number}
	 */
	defense;

	/**
	 * The attack level of the player.
	 * @type {Number}
	 */
	attack;

	/**
	 * @type {{name: AbilityName, args: {[arg_name: AbilityArgName]: string}}}
	*/
	ability_doing;

	/**
	 * @type {{name: AbilityName, by: string, during_phase: Number}[]}
	 */
	affected_by;

	/**
	 * Player name of executioner player's target.
	 * @type {String}
	 */
	exe_target;

	/**
	 * @type {boolean}
	 */
	isMuted;

	/**
	 * @type {boolean}
	 */
	canVote;

	/**
	 * @type {{role: string, visiting: string}}
	 */
	percieved;

	/**
	 * An array of all feedback messages to be sent to the player
	 * @type {string[]}
	 */
	feedback;

	constructor({
		id = ids.users.LL,
		name,
		channel_id = "",
		isAlive = true,
		isInLimbo = false,
		hasWon = false,
		isRoleblocked = false,
		isDoused = false,
		role = "",
		visiting = "",
		last_will = "",
		death_note = "",
		exe_target = "",
		num_phases_inactive = 0,
		feedback = [],
		ability_doing = {},
		used = {},
		percieved = {},
		affected_by = [],
		attack = 0,
		defense = 0,
		last_player_observed_name = undefined,
		isUnidentifiable = false,
		players_can_use_on = [],
		isMuted = false,
		canVote = true,
		isMockPlayer = false,
	}) {
		this.id = id;
		this.name = name;
		this.channel_id = channel_id;
		this.isAlive = isAlive;
		this.isInLimbo = isInLimbo;
		this.hasWon = hasWon;
		this.isRoleblocked = isRoleblocked;
		this.isDoused = isDoused;
		this.role = role;
		this.visiting = visiting;
		this.last_will = last_will;
		this.death_note = death_note;
		this.exe_target = exe_target;
		this.feedback = feedback;
		this.ability_doing = ability_doing;
		this.used = used;
		this.percieved = percieved;
		this.affected_by = affected_by;
		this.attack = attack;
		this.defense = defense;
		this.num_phases_inactive = num_phases_inactive;
		this.last_player_observed_name = last_player_observed_name;
		this.isUnidentifiable = isUnidentifiable;
		this.players_can_use_on = players_can_use_on;
		this.isMuted = isMuted;
		this.canVote = canVote;
		this.isMockPlayer = isMockPlayer;
	}

	static MAX_INACTIVE_PHASES = 6;
	static MIN_INACTIVE_PHASES_FOR_WARNING = 3;
	static MAJORITY_VOTE_RATIO = 2/3;

	reset() {
		this.isAlive=true;
		this.isInLimbo = false;
		this.hasWon = false;
		this.isRoleblocked = false;
		this.isDoused = false;
		this.role = "";
		this.visiting = "";
		this.last_will = "";
		this.death_note = "";
		this.exe_target = "";
		this.feedback = [];
		this.ability_doing = {};
		this.used = {};
		this.percieved = {};
		this.affected_by = [];
		this.attack = 0;
		this.defense = 0;
		this.num_phases_inactive = 0;
		this.last_player_observed_name = undefined;
		this.isUnidentifiable = false;
		this.players_can_use_on = [];
		this.isMuted = false;
		this.canVote = true;
	}

	resetInactivity() {
		this.num_phases_inactive = 0;
	}

	async mute() {
		this.isMuted = true;

		if (!this.isMockPlayer) {
			const
				rdm_guild = await getRDMGuild(),
				town_discussion_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.town_discussion),
				game_announce_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.game_announce),
				player_guild_member = await getGuildMember(rdm_guild, this.id);

			await town_discussion_chnl.permissionOverwrites.edit(
				player_guild_member.user,
				{
					SendMessages: false,
					AddReactions: false
				}
			);

			await game_announce_chnl.permissionOverwrites.edit(
				player_guild_member.user,
				{
					SendMessages: false,
					AddReactions: false
				}
			);
		}

		console.log(`Muted **${this.name}**.`);
	}

	async unmute() {
		this.isMuted = false;

		if (!this.isMockPlayer) {
			const
				rdm_guild = await getRDMGuild(),
				town_discussion_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.town_discussion),
				game_announce_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.game_announce),
				player_guild_member = await getGuildMember(rdm_guild, this.id);

			await town_discussion_chnl.permissionOverwrites.edit(
				player_guild_member.user,
				{
					SendMessages: null,
					AddReactions: null,
				}
			);

			await game_announce_chnl.permissionOverwrites.edit(
				player_guild_member.user,
				{
					SendMessages: null,
					AddReactions: null,
				}
			);
		}

		console.log(`Unmuted **${this.name}**.`);
	}

	async removeVotingAbility() {
		this.canVote = false;
	}

	async regainVotingAbility() {
		this.canVote = true;
	}

	/**
	 * Douses player in gasoline.
	 */
	douse() {
		this.isDoused = true;
	}

	async incrementInactvity(game) {
		this.num_phases_inactive += 1;
		const actual_phases_inactive = this.num_phases_inactive-1;

		if (actual_phases_inactive === Player.MAX_INACTIVE_PHASES) {
			await this.smite(game);
		}
		else if (
			actual_phases_inactive >= Player.MIN_INACTIVE_PHASES_FOR_WARNING &&
			actual_phases_inactive < Player.MAX_INACTIVE_PHASES
		) {
			const remaining_inactive_phases = Player.MAX_INACTIVE_PHASES-actual_phases_inactive;
			await this.sendFeedback(Feedback.InactivityWarning(this, actual_phases_inactive, remaining_inactive_phases));
		}
	}

	async getGuildMember() {
		const rdm_guild = await getRDMGuild();
		const player_guild_member = await getGuildMember(rdm_guild, this.id);
		return player_guild_member;
	}

	async createChannel() {
		const rdm_guild = await getRDMGuild();
		const channel_name =
				"👤｜" +
				this.name.toLowerCase()
					.replace(' ', '-')
					.replace(/[^a-zA-Z0-9 -]/g, "");

		const player_guild_member = await this.getGuildMember();

		// Create a private channel for the player
		const player_channel = await rdm_guild.channels.create(
			{
				name: channel_name,
				parent: rdm_ids.category.player_action,
				permissionOverwrites: [
					{
						id: rdm_guild.roles.everyone,
						deny: [PermissionFlagsBits.ViewChannel],
					},
					{
						id: player_guild_member,
						allow: [PermissionFlagsBits.ViewChannel],
					}
				],
			}
		);

		// Send a message to the player confirming that they have joined the game
		await player_channel.send(Feedback.CreatedPlayerActionChannel(this))
			.then(msg => msg.pin());

		this.channel_id = player_channel.id;
	}

	async sendFeedback(feedback, isPinned=false) {
		if (!this.isMockPlayer) {
			const channel = await this.getPlayerChannel();
			const message_sent = await channel.send(feedback);

			if (isPinned)
				message_sent.pin();
		}
		else {
			// console.log(`{${this.name}: ${feedback}}`);
		}
	}

	addFeedback(feedback) {
		this.feedback.push(feedback);
	}

	isDoingNothing() {
		return (
			Object.keys(this.ability_doing).length === 0 ||
			!this.ability_doing.name ||
			this.ability_doing.name.toLowerCase() === "nothing"
		);
	}

	resetFeedback() {
		this.feedback = [];
	}

	resetAbilityDoing() {
		this.ability_doing = {};
	}

	resetVisiting() {
		this.visiting = "";
	}

	resetPercieved() {
		this.percieved = {};
	}

	/**
	 * Set a player's role
	 * @param {Role} role role object you want the player to be set to
	 */
	async setRole(role) {
		this.role = role.name;
		this.attack = role.attack;
		this.defense = role.defense;

		await this.sendRoleInfo();

		if (role.faction == Factions.Mafia && !this.isMockPlayer) {
			this.giveAccessToMafiaChat();
		}
	}

	async setExeTarget(player) {
		this.exe_target = player.name;
		await this.sendFeedback(Announcements.ExeTarget(this.exe_target), true)
	}

	setVisiting(player_name) {
		this.visiting = player_name;
	}

	addAlignment(alignment) {
		this.alignment = alignment;
	}

	/**
	 * @param {AbilityName} ability_name
	 */
	addAbilityUse(ability_name) {
		if (!this.used[ability_name]) {
			this.used[ability_name] = 0;
		}

		this.used[ability_name] += 1;
	}

	/**
	 * Adds an ability used on a player to their affected_by array
	 * @param {Player} player_using_ability
	 * @param {AbilityName} ability_name
	 * @param {number} The day number the ability was used
	 */
	addAbilityAffectedBy(player_using_ability, ability_name, day_used) {
		console.log({player_using_ability, ability_name});
		player_using_ability.addAbilityUse(ability_name);

		this.affected_by.push(
			{
				name: ability_name,
				by: player_using_ability.name,
				during_phase: day_used,
			}
		)
	}

	/**
	 * @param {Player} attacker_player The player who is attacking this player
	 * @param {Game} game The passed game instance
	 */
	receiveAttackFrom(attacker_player, game) {
		console.log(`${attacker_player.name} attacks ${this.name} with ${attacker_player.attack} attack level against ${this.defense} defense level.`);

		// Attack Success
		if (this.defense < attacker_player.attack) {
			console.log("Attack Success");

			game.addDeath(this, attacker_player);

			this.addFeedback(Feedback.KilledByAttack);
			attacker_player.addFeedback(Feedback.KilledPlayer(this.name));

			const target_role = RoleManager.roles[this.role];
			if (
				attacker_player.role === RoleNames.Vigilante &&
				target_role.faction === Factions.Town
			) {
				console.log("Vigilante Suicide Confirmed");

				attacker_player.addAbilityAffectedBy(attacker_player, AbilityName.Suicide, game.days_passed - 0.5);
			}
		}
		// Attack Failed
		else {
			console.log("Attack Failed");

			const protection_affects_on_target = this.affected_by.filter(
				affect => {
					const ability_name = affect.name;

					const ability = game.ability_manager.getAbility(ability_name);
					return ability.type == AbilityTypes.Protection;
				}
			);

			if ( protection_affects_on_target.length > 0 ) {
				console.log("Victim has heal affects");

				for (let protection_affect of protection_affects_on_target) {
					const protecter_player = game.player_manager.get(protection_affect.by);
					protecter_player.addFeedback(Feedback.ProtectedAnAttackedPlayer);

					console.log(`${protecter_player.name} has protected the victim ${this.name}`);

					if (protection_affect.name === AbilityName.Smith) {
						console.log(`${protecter_player.name} successfully smithed a vest and achieved their win condition.`);

						protecter_player.addFeedback(Feedback.DidSuccessfulSmith);
						protecter_player.makeAWinner(this);
					}
				}
			}

			this.addFeedback(Feedback.AttackedButSurvived);
			attacker_player.addFeedback(Feedback.AttackFailed(this.name));
		}
	}

	/**
		 * {
				"victim": Player.name,
				"kills": {
						killer_name: Player.name,
						flavor_text: string
					}[]
				}
		 */
	async kill(death) {
		this.isAlive = false;

		try {
			if (!this.isMockPlayer) {
				let ghost_role = await getRole((await getRDMGuild()), RDMRoles.Ghosts),
					living_role = await getRole((await getRDMGuild()), RDMRoles.Living),
					player_guild_member = await getGuildMember((await getRDMGuild()), this.id);


				await addRole(player_guild_member, ghost_role);
				await removeRole(player_guild_member, living_role);

				const role = RoleManager.getListOfRoles().find(role => role.name === this.role);

				if (role.faction == Factions.Mafia) {
					this.removeAccessFromMafiaChat();
				}
			}
		}
		catch {
			console.log(`**${this.name}** user not found. Possibly left the game.`);
		}
	}

	revive() {
		this.isAlive = true;
	}

	toggleProtection() {
		this.isProtected = !this.isProtected;
	}

	getPercievedRole() {
		if (this.percieved && this.percieved.role)
			return this.percieved.role
		else
			return this.role
	}

	getPercievedVisit() {
		if (this.percieved && this.percieved.visiting)
			return this.percieved.visiting
		else
			return this.visiting
	}

	resetPercieved() {
		this.percieved = {};
	}

	/**
	 * Sets what ability th p layer is doing in the current phase
	 * @param {string} name Name of the ability
	 * @param {{[arg_name: string]: [arg_value: string]}} arg_values An obect with an entry for each argument with the key being the name and the value being the value of the arg
	 */
	setAbilityDoing(ability_name, arg_values) {
		this.ability_doing = {
			name: ability_name,
			args: arg_values,
		};
	}

	/**
	 * Players does no action for the current phase
	 */
	doNothing() {
		this.setAbilityDoing("nothing", {});
	}

	/**
	 * Determines if a certain ability a player uses with specific arguments can be used by that player
	 * @param {Ability} Ability using
	 * @param {{[arg_name: string]: [arg_value: string]}} arg_values
	 * @returns {true | String} true if you can use the ability. Otherwise, feedback for why you can't use the ability
	 */
	async canUseAbility(ability, arg_values, game) {
		const player_role = RoleManager.roles[this.role]

		// Check if role has ability
		if (player_role.abilities.every(ability => ability.name !== ability.name)) {
			return `${ability.name} is not an ability you can use`;
		}

		// Check if player is dead and can't use ability while dead
		if (!this.isAlive) {
			if (!(
				ability.phases_can_use.includes(Phases.Limbo) &&
				this.isInLimbo
			)) {
				return `You can't use the ability, **${ability.name}**, while you're not alive`;
			}
		}

		// Check if ability can be used during current phase
		if (!ability.phases_can_use.includes(game.phase)) {

			// Check if ability can be used in limbo and player in limbo
			if (
				!(
					ability.phases_can_use.includes(Phases.Limbo) &&
					this.isInLimbo
				)
			) {
				return `You can't use this ability during the **${game.phase}** phase`;
			}
		}

		// Check if valid arguments
		for (const ability_arg of ability.args) {
			const arg_name = ability_arg.name;
			let arg_param_value = arg_values[arg_name];

			const isValidArg = game.isValidArgValue(this, ability_arg, arg_param_value);

			console.log({isValidArg});

			if (isValidArg !== true) {
				return isValidArg;
			}
		}

		return true;
	}

	/**
 * @param {string} ability_name - Name of the ability using.
	 * @param {{[arg_name: string]: [arg_value: string]}} arg_values - An object map from the argument name to it's passed value. Empty object by default.
	 * @returns {string} confirmation feedback for using ability
	 */
	useAbility(ability_name, arg_values={}, game) {
		this.resetInactivity();

		if (ability_name === AbilityName.Nothing) {
			this.doNothing();
			return `You will attempt to do **Nothing**`;
		}

		const player_role = RoleManager.roles[this.role];
		const ability_using = game.ability_manager.getAbility(ability_name);

		console.log({ability_name, ability_using, player_role});

		for (const arg of ability_using.args) {
			const arg_name = arg.name;
			const arg_value = arg_values[arg_name];

			console.log({arg, arg_values, arg_value});

			if (arg.subtypes.includes(ArgumentSubtypes.Visiting)) {
				this.setVisiting(arg_value);
			}
		}

		this.setAbilityDoing(ability_name, arg_values);

		console.log(this);

		return ability_using.feedback(...Object.values(arg_values), this.name);
	}

	async leaveGame(game) {
		await game.log(`**${this.name}** left the game.`);
		game.addDeath(this, this, Announcements.PlayerSuicide);
	}

	async leaveGameSignUps(game) {
		await game.log(`**${this.name}** left the game`);

		await game.announceMessages(
			`**${this.name}** left the game`
		);

		if (!this.isMockPlayer) {
			const rdm_guild = await getRDMGuild();
			const player_member = await getGuildMember(rdm_guild, this.id);
			const spectator_role = await getRole(rdm_guild, RDMRoles.Spectator);
			const living_role = await getRole(rdm_guild, RDMRoles.Living);

			await player_member.roles.remove(living_role).catch(console.error());
			await player_member.roles.add(spectator_role).catch(console.error());

			const player_channel = await this.getPlayerChannel();
			await player_channel.delete();
		}

		game.player_manager.removePlayer(this.name);
	}

	async smite(game) {
		await this.sendFeedback(Feedback.Smitten(this));
		game.addDeath(this, this, Announcements.PlayerSmitten);
	}

	async getPlayerChannel() {
		const rdm_guild = await getRDMGuild();
		return await getChannel(rdm_guild, this.channel_id);
	}

	async sendRoleInfo() {
		const role = RoleManager.roles[this.role];
		const role_info_msg  = role.toString();
		await this.sendFeedback(role_info_msg, true);
	}

	restoreOldDefense() {
		const old_defense = RoleManager.roles[this.role].defense;
		this.defense = old_defense;
	}

	/**
	 * @param {number} defense_level the level of defense giving to player
	 */
	giveDefenseLevel(defense_level) {
		console.log(`Giving ${this.name} ${defense_level} defense`);

		if (this.defense < defense_level) {
			console.log(`Increased ${this.name}'s defense from ${this.defense} to ${defense_level}`);

			this.defense = defense_level
		}
		else {
			console.log(`${this.name}'s was already at or above ${defense_level}`);
		}
	}

	async convertToRole(role_name, game) {
		const current_role_name = this.role;
		const role = RoleManager.getListOfRoles().find(role => role.name ===  role_name);
		this.setRole(role);

		game.role_log[this.name] += " -> " + role_name;

		await this.sendFeedback(Feedback.ConvertedToRole(this, current_role_name, role_name));
		await this.sendFeedback(role.toString(), true);

		if (role_name === RoleNames.Executioner) {
			const alive_town_players = game.player_manager.getTownPlayers().filter(player => player.isAlive);
			const rand_town_player = getRandArrayItem(alive_town_players);

			if (rand_town_player)
				this.setExeTarget(rand_town_player);
			else
				this.convertToRole(RoleNames.Fool, game);
		}
	}

	async giveAccessToMafiaChat() {
		console.log(`Let **${this.name}** see mafia chat.`);

		if (!this.isMockPlayer) {
			const
				mafia_channel = await getChannel((await getRDMGuild()), ids.rapid_discord_mafia.channels.mafia_chat),
				player_guild_member = await getGuildMember((await getRDMGuild()), this.id);

			mafia_channel.permissionOverwrites.edit(player_guild_member.user, {ViewChannel: true});

			mafia_channel.send(`**${this.name}** - ${this.role}`);
		}
	}

	async removeAccessFromMafiaChat() {
		const
			mafia_channel = await getChannel((await getRDMGuild()), ids.rapid_discord_mafia.channels.mafia_chat),
			player_guild_member = await getGuildMember((await getRDMGuild()), this.id);

		mafia_channel.permissionOverwrites.edit(player_guild_member.user, {SendMessages: false});

		console.log(`Let **${this.name}** not see mafia chat.`);
	}

	async removeAffects(game) {
		for (const [affect_num, affect] of this.affected_by.entries()) {
			console.log("Removing Affects From Player " + this.name);
			console.log("Affect Before:");
			console.log({affect});

			const ability = game.ability_manager.getAbility(affect.name);

			console.log({ability});

			// Don't remove if affect lasts forever
			if (ability && ability.duration === -1)
				continue;

			const phase_affect_ends = affect.during_phase + ability.duration;

			console.log(`Days Passed: ${game.days_passed}`);
			console.log({phase_affect_ends});

			// Delete phase affect ends is current phase or has passed
			if (phase_affect_ends <= game.days_passed) {
				// console.log("Deleting Affect");

				switch (ability.type) {
					case AbilityTypes.Protection: {
						this.restoreOldDefense();
						break;
					}

					case AbilityTypes.Manipulation: {
						this.resetPercieved();
						break;
					}

					case AbilityTypes.Roleblock: {
						this.isRoleblocked = false;
						break;
					}

					case AbilityTypes.Modifier: {
						break;
					}

					case AbilityTypes.Suicide: {
						game.addDeath(this, this, Announcements.VigilanteSuicide);

						await this.sendFeedback(Feedback.ComittingSuicide);
						this.addFeedback(Feedback.ComittedSuicide);
						break;
					}
				}

				if (ability.name === AbilityName.Kidnap) {
					await this.unmute();
					await this.regainVotingAbility();
					this.isRoleblocked = false;
					this.restoreOldDefense();
					this.sendFeedback(Feedback.Unkidnapped);
				}

				this.affected_by.splice(affect_num, 1);
			}
		}
	}

	removeManipulationAffects(game) {
		if (this.affected_by) {
			for (let [index, affect] of this.affected_by.entries()) {
				console.log({affect});

				const ability_affected_by = game.ability_manager.getAbility(affect.name);

				if (ability_affected_by.type === AbilityTypes.Manipulation) {
					console.log("Found manipulation affect. Removing affect and reseting percieved.");

					this.affected_by.splice(index, 1);
					this.resetPercieved();
				}
			}
		}
	}

	async whisper(player_whispering_to, whisper_contents) {
		if (!this.isMockPlayer) {
			const rdm_guild = await getRDMGuild();
			const town_discussion_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.town_discussion);

			await town_discussion_chnl.send(Announcements.Whisper(
				this, player_whispering_to
			));

			const player_whispering_to_chnl = await player_whispering_to.getPlayerChannel();
			player_whispering_to_chnl.send(Feedback.WhisperedTo(this, whisper_contents));
		}
	}

	makeAWinner(game) {
		this.hasWon = true;

		const player_role = RoleManager.roles[this.role];
		const player_faction = player_role.getFaction();

		if (!game.winning_factions.includes(player_faction))
		game.winning_factions.push(player_faction);

		if (!game.winning_players.includes(this.name))
			game.winning_players.push(this.name);
	}

	/**
	 * Determines if a player can vote a certain player
	 * @param {String} player_voting_for name of the player voting for
	 * @returns {true | String} true if you can vote that player. Otherwise, feedback for why you can't
	 */
	canVotePlayer(player_voting_for, game) {
		if (game.subphase !== Subphases.Voting) {
			return `We're not in the voting phase yet.`;
		}

		if (this.name === player_voting_for) {
			return `You can't vote for yourself!`;
		}

		if (!this.canVote) {
			return `Sorry, you have been prevented from voting.`;
		}

		return true;
	}

	/**
	 * Votes for a player to put up on trial, updating votes, announing it, and returning feedback
	 * @param {String} player_voting_for name of the player voting for
	 * @returns {String} feedback for vote
	 */
	votePlayer(player_voting_for, game) {
		let curr_votes = game.votes;
		let max_voters_count = game.player_manager.getAlivePlayers().filter(player => player.canVote === true).length;
		let feedback;

		this.resetInactivity();

		if (curr_votes[this.name]) {
			game.log(`**${this.name}** changed their vote to **${player_voting_for}**`);

			game.announceMessages(`**${this.name}** changed their vote to **${player_voting_for}**`);

			feedback = `You are replacing your previous vote, **${curr_votes[this.name]}**, with **${player_voting_for}**`;
		}
		else {
			game.log(`**${this.name}** voted **${player_voting_for}**.`);

			game.announceMessages(`**${this.name}** voted **${player_voting_for}**.`);

			feedback = `You voted **${player_voting_for}**.`;
		}

		curr_votes[this.name] = player_voting_for;
		game.votes = curr_votes;

		if (!this.isMockPlayer) {
			const isMajorityVote = Player.isMajorityVote(curr_votes, max_voters_count);
			const num_votes = Object.values(curr_votes).length;

			console.log({isMajorityVote, num_votes, max_voters_count})

			if (isMajorityVote || num_votes >= max_voters_count) {
				game.startTrial(game.days_passed);
			}
		}

		return feedback;
	}

	/**
	 * Determines if a player can vote for a certain trial outcome
	 * @param {String} trial_outcome trial outcome voting for
	 * @returns {true | String} true if you can vote. Otherwise, feedback for why you can't
	 */
	canVoteForTrialOutcome(trial_outcome, game) {
		if (game.subphase !== Subphases.Trial) {
			return `We're not in the trial phase yet.`;
		}

		if (game.on_trial === this.name) {
			return `You can't vote for your own trial.`;
		}

		if (!this.canVote) {
			return `Sorry, you have been prevented from voting.`;
		}

		return true;
	}

	/**
	 * Votes for a trial outcome for the current trial, updating votes, announcing it, and returning feedback
	 * @param {TrialVotes} trial_outcome trial outcome voting for
	 * @returns {String} feedback for vote
	 */
	voteForTrialOutcome(trial_outcome, game) {
		let curr_votes = game.trial_votes;
		let max_voters_count = game.player_manager.getAlivePlayers().filter(
			player => player.name !== game.on_trial && player.canVote === true
		).length;
		let feedback;

		this.resetInactivity();

		if (curr_votes[this.name]) {
			game.log(`**${this.name}** changed their vote to **${toTitleCase(trial_outcome)}**`);

			game.announceMessages(`**${this.name}** changed their vote.`);

			feedback = `You are replacing your previous vote, **${toTitleCase(curr_votes[this.name])}**, with **${toTitleCase(trial_outcome)}**`;
		}
		else {
			game.log(`**${this.name}** voted **${toTitleCase(trial_outcome)}**.`);

			game.announceMessages(`**${this.name}** voted.`);

			feedback = `You voted **${toTitleCase(trial_outcome)}**.`;
		}

		curr_votes[this.name] = trial_outcome;
		game.trial_votes = curr_votes;

		if (!this.isMockPlayer) {
			const isMajorityVote = Player.isMajorityVote(curr_votes, max_voters_count);
			const num_votes = Object.values(curr_votes).length;

			if (isMajorityVote || num_votes >= max_voters_count) {
				game.startTrialResults(game.days_passed);
			}
		}

		return feedback;
	}



	/**
	 * Determines if a majority vote has been reached for a specific vote
	 * @param {{[player_name: string]: [vote: string]}} player_votes an object which maps a player name to their vote
	 * @param {Number} num_max_voters the maximum number of possible voters
	 */
	static isMajorityVote(player_votes, num_max_voters) {
		let isMajorityVote = false;

		const total_vote_count = Object.keys(player_votes).length;
		const majority_player_count = Math.ceil(
			(num_max_voters) * Player.MAJORITY_VOTE_RATIO
		);

		if (total_vote_count >= majority_player_count) {
			let vote_counts = {};

			for (let voter in player_votes) {
				let vote = player_votes[voter];

				if (
					vote.toLowerCase() == TrialVotes.Abstain.toLowerCase() ||
					vote.toLowerCase() == Votes.Abstain.toLowerCase()
				)
					continue;

				if (!vote_counts[vote])
					vote_counts[vote] = 1;
				else
					vote_counts[vote] += 1;

				if (vote_counts[vote] >= majority_player_count) {
					isMajorityVote = true;
					break
				}
			}
		}

		return isMajorityVote;
	}

	/**
	 * Frames player as mafioso
	 */
	frame() {
		this.percieved.role = RoleNames.Mafioso;
	}

	/**
	 * @returns {boolean} True if player is in town faction, false otherwise
	 */
	isTown() {
		if (this.role) {
			const role = RoleManager.roles[this.role]
			if (role && role.faction === Factions.Town) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Gets the players role as a Role instance
	 * @returns {Role | undefined} Returns role if player has valid role, otherwise undefined
	 */
	getRole() {
		if (this.role) {
			const role = RoleManager.roles[this.role]
			if (role) {
				return role;
			}
		}

		return undefined;
	}

	/**
	 * Checks if player has attempted to use any ability or nothing
	 * @returns {boolean}
	 */
	hasDoneAbility() {
		return (
			this.ability_doing &&
			this.ability_doing.name
		)
	}
}

module.exports = Player;