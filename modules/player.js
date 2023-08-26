const
	{ getGuildMember } = require("./functions"),
	{ PermissionFlagsBits } = require('discord.js'),
	rdm_ids = require("../databases/ids.json").rapid_discord_mafia;

class Player {
	constructor({
		id,
		name,
		channel_id="",
		isAlive=true,
		isInLimbo = false,
		hasWon = false,
		isRoleblocked = false,
		isDoused = false,
		role = "",
		visiting = "",
		last_will = "",
		death_note = "",
		exe_target = "",
		feedback = [],
		ability_doing = {},
		used = {},
		percieved = {},
		affected_by = [],
		attack = 0,
		defense = 0,
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
	}

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
	}

	async createChannel() {
		const channel_name =
				"👤｜" +
				this.name.toLowerCase()
					.replace(' ', '-')
					.replace(/[^a-zA-Z0-9 -]/g, "");

		const rdm_guild = await global.Game.getGuild();
		const player_guild_member = await getGuildMember(rdm_guild, this.id);

		console.log(player_guild_member);

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
		await player_channel.send(`<@${this.id}> Welcome to your player action channel`)
			.then(msg => msg.pin());

		this.channel_id = player_channel.id;
	}

	isDoingAbility() {
		return Object.keys(this.ability_doing).length !== 0;
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

	resetPrecieved() {
		this.percieved = {};
	}

	setRole(role) {
		this.role = role;
		this.attack = global.Roles[role].attack;
		this.defense = global.Roles[role].defense;
	}

	addAlignment(alignment) {
		this.alignment = alignment;
	}

	kill() {
		this.isAlive = false;
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
}

module.exports = Player;