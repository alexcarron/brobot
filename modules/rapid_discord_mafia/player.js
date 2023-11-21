const { RDMRoles, Announcements, MessageDelays, Feedback, Factions, RoleNames, AbilityTypes } = require("../enums");
const roles = require("./roles");
const ids = require("../../databases/ids.json");
const { Abilities } = require("./ability");

const
	{ getGuildMember, getRole, addRole, removeRole, getChannel, wait, getRandArrayItem, getRDMGuild } = require("../functions"),
	{ PermissionFlagsBits } = require('discord.js'),
	rdm_ids = require("../../databases/ids.json").rapid_discord_mafia;

class Player {
	/** {name: AbilityNameStr, args: {[arg_name: ArgNameStr]: ArgValueStr}} */
	ability_doing;

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
		this.num_phases_inactive = 0;
		this.last_player_observed_name = undefined;
		this.isUnidentifiable = false;
	}

	static MAX_INACTIVE_PHASES = 6;
	static MIN_INACTIVE_PHASES_FOR_WARNING = 3;

	resetInactivity() {
		this.num_phases_inactive = 0;
	}

	async incrementInactvity() {
		this.num_phases_inactive += 1;
		const actual_phases_inactive = this.num_phases_inactive-1;

		if (actual_phases_inactive === Player.MAX_INACTIVE_PHASES) {
			await this.smite();
		}
		else if (
			actual_phases_inactive >= Player.MIN_INACTIVE_PHASES_FOR_WARNING &&
			actual_phases_inactive < Player.MAX_INACTIVE_PHASES
		) {
			const channel = await this.getPlayerChannel();

			const remaining_inactive_phases = Player.MAX_INACTIVE_PHASES-actual_phases_inactive;

			await channel.send(Feedback.InactivityWarning(this, actual_phases_inactive, remaining_inactive_phases));
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

	async setRole(role) {
		this.role = role.name;
		this.attack = role.attack;
		this.defense = role.defense;

		await this.sendRoleInfo();

		if (role.faction == Factions.Mafia) {
			this.giveAccessToMafiaChat();
		}
	}

	async setExeTarget(player) {
		this.exe_target = player.name;
		await this.sendExeTarget();
	}

	async sendExeTarget() {
		const player_channel = await this.getPlayerChannel();
		await player_channel.send(Announcements.ExeTarget(this.exe_target))
			.then( msg => msg.pin() );
	}

	setVisiting(player_name) {
		this.visiting = player_name;
	}

	addAlignment(alignment) {
		this.alignment = alignment;
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

		if (death.isLynch()) {
			if (this.role == RoleNames.Fool) {
				let fool_chnl = await getChannel((await getRDMGuild()), this.channel_id);

				await global.Game.announceMessages("You feel like you've made a terrible mistake...\n _ _");
				await fool_chnl.send("You win! Your powers have awakened. You can use any of your curses for only this night.");

				this.isInLimbo = true;
				this.hasWon = true;

				global.Game.winning_factions.push("Fool");
				global.Game.winning_players.push(this.name);
			}

			let executioners = global.Game.Players.getExecutioners();

			console.log("Checking for exe wins");
			for (let exe of executioners) {
				console.log({exe, victim_name: this.name});

				if ( exe.exe_target == this.name ) {
					console.log("Announcing win and giving player win.");

					const exe_player = global.Game.Players.get(exe.name)

					let exe_chnl = await getChannel((await getRDMGuild()), exe_player.channel_id);
					await exe_chnl.send("You win! You have successfully gotten your target lynched. Do whatever you want now. You'll still win if you die.");
					exe_player.hasWon = true;

					global.Game.winning_factions.push("Executioner");
					global.Game.winning_players.push(exe.name);
				}
			}
		}

		try {
			let ghost_role = await getRole((await getRDMGuild()), RDMRoles.Ghosts),
				living_role = await getRole((await getRDMGuild()), RDMRoles.Living),
				player_guild_member = await getGuildMember((await getRDMGuild()), this.id);


			await addRole(player_guild_member, ghost_role);
			await removeRole(player_guild_member, living_role);

			const role = Object.values(roles).find(role => role.name === this.role);

			if (role.faction == Factions.Mafia) {
				this.removeAccessFromMafiaChat();
			}
		}
		catch {
			Game.log(`**${this.name}** user not found. Possibly left the game.`);
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
	 * Sets what ability th eplayer is doing in the current phase
	 *
	 * @param {string} name Name of the ability
	 * @param {{[arg_name: string]: string}} arg_values An obect with an entry for each argument with the key being the name and the value being the value of the arg
	 */
	setAbilityDoing(ability_name, arg_values) {
		this.ability_doing = {
			name: ability_name,
			args: arg_values,
	};

		if (global.Game.Players.getAlivePlayers().every(player => player.ability_doing && player.ability_doing.name)) {
			global.Game.startDay(global.Game.days_passed);
		}
	}

	async leaveGame() {
		global.Game.log(`**${this.name}** left the game.`);
		global.Game.addDeath(this, this, Announcements.PlayerSuicide);
	}

	async leaveGameSignUps() {
		global.Game.log(`**${this.name}** left the game`);

		global.Game.announceMessages(
			`**${this.name}** left the game`
		);

		const rdm_guild = await getRDMGuild();
		const player_member = await getGuildMember(rdm_guild, this.id);
		const spectator_role = await getRole(rdm_guild, RDMRoles.Spectator);
		const living_role = await getRole(rdm_guild, RDMRoles.Living);

		await player_member.roles.remove(living_role).catch(console.error());
		await player_member.roles.add(spectator_role).catch(console.error());

		const player_channel = await this.getPlayerChannel();
		await player_channel.delete();

		global.Game.Players.removePlayer(this.name);
	}

	async smite() {
		const channel = await this.getPlayerChannel();
		channel.send(Feedback.Smitten(this));
		global.Game.addDeath(this, this, Announcements.PlayerSmitten);
	}

	async getPlayerChannel() {
		const rdm_guild = await getRDMGuild();
		return await getChannel(rdm_guild, this.channel_id);
	}

	async sendRoleInfo() {
		const player_channel = await this.getPlayerChannel();

		const role = roles[this.role];
		const role_info_msg  = role.toString();
		await player_channel.send(role_info_msg)
			.then( msg => msg.pin() );
	}

	async convertToRole(role_name) {
		const current_role_name = this.role;
		const role = Object.values(roles).find(role => role.name ===  role_name);
		this.setRole(role);

		global.Game.role_log[this.name] += " -> " + role_name;

		const channel = await this.getPlayerChannel();

		await channel.send(`<@${this.id}>\n# You've been converted from ${current_role_name} to ${role_name}`)
		await channel.send(role.toString()).then( msg => msg.pin() );
	}

	async giveAccessToMafiaChat() {
		const
			mafia_channel = await getChannel((await getRDMGuild()), ids.rapid_discord_mafia.channels.mafia_chat),
			player_guild_member = await getGuildMember((await getRDMGuild()), this.id);

		mafia_channel.permissionOverwrites.edit(player_guild_member.user, {ViewChannel: true});

		mafia_channel.send(`**${this.name}** - ${this.role}`);

		console.log(`Let **${this.name}** see mafia chat.`);
	}

	async removeAccessFromMafiaChat() {
		const
			mafia_channel = await getChannel((await getRDMGuild()), ids.rapid_discord_mafia.channels.mafia_chat),
			player_guild_member = await getGuildMember((await getRDMGuild()), this.id);

		mafia_channel.permissionOverwrites.edit(player_guild_member.user, {SendMessages: false});

		console.log(`Let **${this.name}** not see mafia chat.`);
	}

	async removeAffects() {
		for (const [affect_num, affect] of this.affected_by.entries()) {
			// console.log("Removing Affects From Player " + this.name);
			// console.log("Affect Before:");
			// console.log({affect});

			const ability = Object.values(Abilities).find(ability =>
				ability.name === affect.name
			);

			// Don't remove if affect lasts forever
			if (ability && ability.duration === -1)
				continue;

			const phase_affect_ends = affect.during_phase + ability.duration;

			// console.log(`Current Phase: ${global.Game.days_passed}`);
			// console.log({ability});
			// console.log({phase_affect_ends});

			// Delete phase affect ends is current phase or has passed
			if (phase_affect_ends <= global.Game.days_passed) {
				// console.log("Deleting Affect");

				switch (ability.type) {
					case AbilityTypes.Protection: {
						const old_defense = roles[this.role].defense;
						this.defense = old_defense;
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
						global.Game.addDeath(this, this, Announcements.VigilanteSuicide);

						let player_chnl = await this.getPlayerChannel();
						player_chnl.send(Feedback.ComittingSuicide);

						this.addFeedback(Feedback.ComittedSuicide);
						break;
					}
				}

				this.affected_by.splice(affect_num, 1);
			}
		}
	}

	removeManipulationAffects() {
		if (this.affected_by) {
			for (let [index, affect] of this.affected_by.entries()) {
				console.log({affect});

				const ability_affected_by = Object.values(Abilities).find(ability => ability.name === affect.name);

				if (ability_affected_by.type === AbilityTypes.Manipulation) {
					console.log("Found manipulation affect. Removing affect and reseting percieved.");

					this.affected_by.splice(index, 1);
					this.resetPercieved();
				}
			}
		}
	}

	async whisper(player_whispering_to, whisper_contents) {
		const rdm_guild = await getRDMGuild();
		const town_discussion_chnl = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.town_discussion);

		await town_discussion_chnl.send(Announcements.Whisper(
			this, player_whispering_to
		));

		global.Game.log(
			Announcements.WhisperLog(this, player_whispering_to, whisper_contents)
		);

		const player_whispering_to_chnl = await player_whispering_to.getPlayerChannel();
		player_whispering_to_chnl.send(Feedback.WhisperedTo(this, whisper_contents));
	}
}

module.exports = Player;