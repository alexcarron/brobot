const RoleManager = require("./role-manager.js");
const ids = require("../../bot-config/discord-ids.js");
const { Role, Faction, RoleName } = require("./role.js");
const Logger = require("./logger.js");
const { DiscordService, RDMDiscordRole } = require("./discord-service.js");
const { fetchRDMGuild, fetchRoleByName } = require("../../utilities/discord-fetch-utils.js");
const { addRoleToMember, removeRoleFromMember } = require("../../utilities/discord-action-utils.js");
const { ArgumentSubtype, AbilityArgName } = require("./arg.js");
const { Announcement, Feedback } = require("./constants/possible-messages.js");
const { AbilityName } = require("./ability.js");

const rdm_ids = require("../../bot-config/discord-ids.js").rapid_discord_mafia;

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

	/**
	 * @type {Logger}
	 */
	logger;

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
		role_log = "",
	},
		logger = new Logger()
	) {
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
		this.logger = logger;
		this.role_log = role_log;
		this.discord_service = new DiscordService({
			isMockService: isMockPlayer
		});
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

		await this.discord_service.removeSenderFromTownDiscussionChannel(this.id);
		await this.discord_service.removeSenderFromAnnouncementsChannel(this.id);

		this.logger.log(`Muted **${this.name}**.`);
	}

	async unmute() {
		this.isMuted = false;

		await this.discord_service.addSenderToAnnouncementsChannel(this.id);
		await this.discord_service.addSenderToTownDiscussionChannel(this.id);

		this.logger.log(`Unmuted **${this.name}**.`);
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

	async fetchGuildMember() {
		const rdm_guild = await fetchRDMGuild();
		const player_guild_member = await this.fetchGuildMember(rdm_guild, this.id);
		return player_guild_member;
	}

	async createChannel() {
		const channel_name =
				"👤｜" +
				this.name.toLowerCase()
					.replace(' ', '-')
					.replace(/[^a-zA-Z0-9 -]/g, "");

		// Create a private channel for the player
		const player_channel = await this.discord_service.createPrivateChannel({
			name: channel_name,
			category_id: rdm_ids.category.player_action,
			guild_member_id: this.id
		});

		if (player_channel) {
			this.channel_id = player_channel.id;

			this.discord_service.sendAndPinMessage({
				channel_id: this.channel_id,
				contents: Feedback.CREATED_PLAYER_ACTION_CHANNEL(this),
			});
		}
	}

	async sendFeedback(feedback, isPinned=false) {
		if (isPinned) {
			return await this.discord_service.sendAndPinMessage({
				channel_id: this.channel_id,
				contents: feedback,
			});
		}
		else {
			return await this.discord_service.sendMessage({
				channel_id: this.channel_id,
				contents: feedback,
			});
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

		if (role.faction == Faction.MAFIA && !this.isMockPlayer) {
			this.giveAccessToMafiaChat();
		}
	}

	async setExeTarget(player) {
		this.exe_target = player.name;
		await this.sendFeedback(Announcement.GIVE_EXE_TARGET(this.exe_target), true)
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
				let ghost_role = await fetchRoleByName((await fetchRDMGuild()), RDMDiscordRole.GHOSTS),
					living_role = await fetchRoleByName((await fetchRDMGuild()), RDMDiscordRole.LIVING),
					player_guild_member = await fetchGuildMember((await fetchRDMGuild()), this.id);


				await addRoleToMember(player_guild_member, ghost_role);
				await removeRoleFromMember(player_guild_member, living_role);

				const role = RoleManager.getListOfRoles().find(role => role.name === this.role);

				if (role.faction == Faction.MAFIA) {
					this.removeAccessFromMafiaChat();
				}
			}
		}
		catch {
			this.logger.log(`**${this.name}** user not found. Possibly left the game.`);
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
 * @param {Ability | undefined} ability_using
	 * @param {{[arg_name: string]: [arg_value: string]}} arg_values - An object map from the argument name to it's passed value. Empty object by default.
	 * @returns {string} confirmation feedback for using ability
	 */
	useAbility(ability_using, arg_values={}) {
		this.resetInactivity();

		if (ability_using === undefined) {
			this.doNothing();
			return `You will attempt to do **Nothing**`;
		}

		for (const arg of ability_using.args) {
			const arg_name = arg.name;
			const arg_value = arg_values[arg_name];

			if (arg.subtypes.includes(ArgumentSubtype.VISITING)) {
				this.setVisiting(arg_value);
			}
		}

		this.setAbilityDoing(ability_using.name, arg_values);

		return ability_using.feedback(...Object.values(arg_values), this.name);
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
		this.logger.log(`Giving ${this.name} ${defense_level} defense`);

		if (this.defense < defense_level) {
			this.logger.log(`Increased ${this.name}'s defense from ${this.defense} to ${defense_level}`);

			this.defense = defense_level
		}
		else {
			this.logger.log(`${this.name}'s was already at or above ${defense_level}`);
		}
	}

	async giveAccessToMafiaChat() {
		this.logger.log(`Let **${this.name}** see mafia chat.`);

		this.discord_service.addViewerToMafiaChannel(this.id);
		this.discord_service.sendToMafia(`**${this.name}** - ${this.role}`);
	}

	async removeAccessFromMafiaChat() {
		this.discord_service.removeSenderFromMafiaChannel(this.id);
		this.logger.log(`Let **${this.name}** not see mafia chat.`);
	}

	async whisper(player_whispering_to, whisper_contents) {
		await this.discord_service.sendToTownDiscussion(
			Announcement.WHISPER(this, player_whispering_to)
		);

		await this.discord_service.sendMessage({
			channel_id: player_whispering_to.channel_id,
			contents: Feedback.WHISPERED_TO(this, whisper_contents)
		});
	}

	/**
	 * Frames player as mafioso
	 */
	frame() {
		this.percieved.role = RoleName.MAFIOSO;
	}

	/**
	 * @returns {boolean} True if player is in town faction, false otherwise
	 */
	isTown() {
		if (this.role) {
			const role = RoleManager.roles[this.role]
			if (role && role.faction === Faction.TOWN) {
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

	updateDeathNote(death_note) {
		this.death_note = death_note;

		this.logger.log(`**${this.name}** updated their death note to be \n\`\`\`\n${this.death_note}\n\`\`\``);
	}

	updateLastWill(last_will) {
		this.last_will = last_will;

		this.logger.log(`**${player.name}** updated their last will to be \n\`\`\`\n${player.last_will}\n\`\`\``);
	}
}

module.exports = Player;