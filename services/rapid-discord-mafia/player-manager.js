const { getRandomElement } = require("../../utilities/data-structure-utils");
const Logger = require("./logger");
const Player = require("./player");
const { Faction, RoleName, Role } = require("./role");
const { AbilityType, AbilityName } = require("./ability");
const { Feedback, Announcement } = require("./constants/possible-messages");

/**
 * Handles the creation and storage of players
 */
class PlayerManager {
	/**
	 * A map of player names to their player object
	 * @type {{[player_name: string]: Player}}
	 */
	players;

	/**
	 * @type {Logger}
	 */
	logger;

	/**
	 * Whether or not this is a mock player manager used for testing
	 * @type {boolean}
	 */
	isMockPlayerManager;

	constructor(players = {}, game_manager, logger=new Logger(), isMockPlayerManager=false) {
		this.game_manager = game_manager;
		this.players = players;
		this.logger = logger;
		this.isMockPlayerManager = isMockPlayerManager;
	}

	reset() {
		for (const player_name of this.getPlayerNames()) {
			this.get(player_name).reset();
		}
	}

	getPlayers() {
		return this.players;
	}

	getPlayerFromId(id) {
		return this.getPlayerList().find(player => player.id === id);
	}

	getPlayerFromName(name) {
		return this.getPlayerList().find(player => player.name === name);
	}

	/**
	 * @param {Player} player - The player to add
	 */
	addPlayer(player) {
		this.players[player.name] = player;
	}

	async addPlayerFromObj(player_obj) {
		const player = new Player(player_obj, this.logger);
		await this.addPlayer(player);
		return player;
	}

	/**
	 *
	 * @param {string} name The name of the player getting
	 * @returns {Player} player gettings
	 */
	get(name) {
		return this.players[name];
	}

	/**
	 * @returns {Player[]} An array of all players
	 */
	getPlayerList() {
		return Object.values(this.players);
	}

	getPlayerCount() {
		return this.getPlayerList().length;
	}

	getPlayerNames() {
		return Object.keys(this.players);
	}

	getExecutioners() {
		return this.getPlayerList().filter( player => player.role === "Executioner" );
	}

	getPlayersWithRole(role_name) {
		return this.getPlayerList().filter( player => player.role === role_name );
	}

	getPlayersInLimbo() {
		return this.getPlayerList().filter( player => player.isInLimbo);
	}

	getPlayerWithRole(role_name) {
		return this.getPlayerList().find( player => player.role === role_name );
	}

	getTownPlayers() {
		return this.getPlayerList().filter( player => player.isTown() );
	}

	getAlivePlayers() {
		return this.getPlayerList().filter( player => player.isAlive );
	}

	getPlayersInFaction(faction) {
		return this.getPlayerList().filter(
			player => {
				const role = player.getRole();

				return (
					role !== undefined &&
					role.faction === faction
				);
			}
		);
	}

	getAlivePlayersInFaction(faction) {
		return this.getAlivePlayers().filter(
			player => {
				const role = player.getRole();

				return (
					role !== undefined &&
					role.faction === faction
				);
			}
		);

	}

	getAlivePlayerNames() {
		const alive_players = [];
		for (const [name, player] of Object.entries(this.players)) {
			if (player.isAlive) {
				alive_players.push(name);
			}
		}
		return alive_players;
	}

	removePlayer(player_name) {
		delete this.players[player_name];
	}

	async renamePlayer(old_name, new_name) {
		this.players[new_name] = this.players[old_name];
		delete this.players[old_name];
		const player = this.players[new_name];

		this.players[new_name].name = new_name;

		if (!this.isMockPlayerManager) {
			const player_guild_member = await this.players[new_name].fetchGuildMember()
			player_guild_member.setNickname(new_name);

			const new_channel_name =
				"👤｜" +
				player.name.toLowerCase()
					.replace(' ', '-')
					.replace(/[^a-zA-Z0-9 -]/g, "");

			const player_channel = await this.game_manager.discord_service.fetchPlayerChannel(player);
			player_channel.setName(new_channel_name);
		}
	}

	isFactionAlive(faction) {
		return this.getAlivePlayers().some(
			player => {
				const role = player.getRole();

				return (
					role !== undefined &&
					role.faction === faction
				)
			}
		)
	}

	isRoleAlive(role) {
		return this.getAlivePlayers().some(player =>
			player.role === role
		)
	}

	/**
	 * Smites a player, killing them and removing them from the game
	 * @param {Player} player - The player to smite
	 */
	async smitePlayer(player) {
		await player.sendFeedback(Feedback.SMITTEN(player));
		this.game_manager.addDeath(player, player, Announcement.PLAYER_SMITTEN);
	}

	async incrementInactvity() {
		for (const player of this.getAlivePlayers()) {
			player.num_phases_inactive += 1;
			const actual_phases_inactive = player.num_phases_inactive-1;

			if (actual_phases_inactive === Player.MAX_INACTIVE_PHASES) {
				await this.smitePlayer(player);
			}
			else if (
				actual_phases_inactive >= Player.MIN_INACTIVE_PHASES_FOR_WARNING &&
				actual_phases_inactive < Player.MAX_INACTIVE_PHASES
			) {
				const remaining_inactive_phases = Player.MAX_INACTIVE_PHASES-actual_phases_inactive;
				await player.sendFeedback(Feedback.INACTIVITY_WARNING(this, actual_phases_inactive, remaining_inactive_phases));
			}
		}
	}

	/**
	 * Makes a player attack another player
	 * @param {object} parameters - The parameters for the attack
	 * @param {Player} parameters.attacker_player - The player attacking the other player.
	 * @param {Player} parameters.target_player - The player being attacked by the other player
	 */
	attackPlayer({attacker_player, target_player}) {
		target_player.logger.log(`${attacker_player.name} attacks ${target_player.name} with ${attacker_player.attack} attack level against ${target_player.defense} defense level.`);

		// Attack Success
		if (target_player.defense < attacker_player.attack) {
			this.game_manager.addDeath(target_player, attacker_player);

			target_player.addFeedback(Feedback.KILLED_BY_ATTACK);
			attacker_player.addFeedback(Feedback.KILLED_PLAYER(target_player.name));

			const target_role = this.game_manager.role_manager.getRole(target_player.role);
			if (
				attacker_player.role === RoleName.VIGILANTE &&
				target_role.faction === Faction.TOWN
			) {
				attacker_player.addAbilityAffectedBy(attacker_player, AbilityName.SUICIDE, this.game_manager.days_passed - 0.5);
			}
		}
		// Attack Failed
		else {
			const protection_affects_on_target = target_player.affected_by.filter(
				affect => {
					const ability_name = affect.name;

					const ability = this.game_manager.ability_manager.getAbility(ability_name);
					return ability.type == AbilityType.PROTECTION;
				}
			);

			if ( protection_affects_on_target.length > 0 ) {
				for (let protection_affect of protection_affects_on_target) {
					const protecter_player = this.get(protection_affect.by);
					protecter_player.addFeedback(Feedback.PROTECTED_AN_ATTACKED_PLAYER);

					this.logger.log(`${protecter_player.name} has protected the victim ${target_player.name}`);

					if (protection_affect.name === AbilityName.SMITH) {
						this.logger.log(`${protecter_player.name} successfully smithed a vest and achieved their win condition.`);

						protecter_player.addFeedback(Feedback.DID_SUCCESSFUL_SMITH);
						this.game_manager.makePlayerAWinner(protecter_player);
					}
				}
			}

			target_player.addFeedback(Feedback.ATTACKED_BUT_SURVIVED);
			attacker_player.addFeedback(Feedback.ATTACK_FAILED(target_player.name));
		}
	}

	/**
	 * Makes a player leave the game
	 * @param {Player} player - The player leaving
	 */
	havePlayerLeave(player) {
		this.logger.log(`**${player.name}** left the game.`);
		this.game_manager.announceMessages(`**${player.name}** left the game.`);
		this.game_manager.addDeath(player, player, Announcement.PLAYER_SUICIDE);
	}

	/**
	 * Makes a player leave the game during sign ups
	 * @param {Player} player - The player leaving
	 */
	havePlayerLeaveSignUps(player) {
		this.logger.log(`**${player.name}** left the game.`);
		this.game_manager.announceMessages(`**${player.name}** left the game.`);

		this.game_manager.discord_service.removeLivingRoleFromMember(player.id);
		this.game_manager.discord_service.giveMemberSpectatorRole(player.id);
		this.game_manager.discord_service.deleteChannel(player.channel_id);

		this.removePlayer(player.name);
	}

	/**
	 * Converts a player to a different role
	 * @param {Player} player - The player to convert
	 * @param {Role} role - The role to convert the player to
	 */
	async convertPlayerToRole(player, role) {
		const current_role_name = player.role;
		player.setRole(role);
		player.role_log += " -> " + role.name;

		await player.sendFeedback(
			Feedback.CONVERTED_TO_ROLE(player, current_role_name, role.name)
		);
		await player.sendFeedback(role.toString(), true);

		if (role.name === RoleName.EXECUTIONER) {
			const alive_town_players = this.getTownPlayers().filter(player => player.isAlive);
			const rand_town_player = getRandomElement(alive_town_players);

			if (rand_town_player)
				player.setExeTarget(rand_town_player);
			else {
				const fool_role = this.game_manager.role_manager.getRole(RoleName.FOOL);
				this.convertPlayerToRole(player, fool_role);
			}
		}

	}

	/**
	 * Removes effects and abilities used on player
	 * @param {Player} player - The player to remove affects from
	 */
	async removeAffectsFromPlayer(player) {
		for (const [affect_num, affect] of player.affected_by.entries()) {
			const ability = this.game_manager.ability_manager.getAbility(affect.name);

			// Don't remove if affect lasts forever
			if (ability && ability.duration === -1)
				continue;

			const phase_affect_ends = affect.during_phase + ability.duration;

			// Delete phase affect ends is current phase or has passed
			if (phase_affect_ends <= this.game_manager.days_passed) {

				switch (ability.type) {
					case AbilityType.PROTECTION: {
						player.restoreOldDefense();
						break;
					}

					case AbilityType.MANIPULATION: {
						player.resetPercieved();
						break;
					}

					case AbilityType.ROLEBLOCK: {
						player.isRoleblocked = false;
						break;
					}

					case AbilityType.MODIFIER: {
						break;
					}

					case AbilityType.SUICIDE: {
						this.game_manager.addDeath(player, player, Announcement.VIGILANTE_SUICIDE);

						await player.sendFeedback(Feedback.COMITTING_SUICIDE);
						player.addFeedback(Feedback.COMITTED_SUICIDE);
						break;
					}
				}

				await ability.reverseEffects(player, this.game_manager);

				player.affected_by.splice(affect_num, 1);
			}
		}
	}

	/**
	 * Removes manipulation effects from player
	 * @param {Player} player - The player to remove affects from
	 */
	removeManipulationEffectsFromPlayer(player) {
		if (player.affected_by) {
			for (let [index, affect] of player.affected_by.entries()) {
				const ability_affected_by = this.game_manager.ability_manager.getAbility(affect.name);

				if (ability_affected_by.type === AbilityType.MANIPULATION) {
					player.affected_by.splice(index, 1);
					player.resetPercieved();
				}
			}
		}
	}
}

module.exports = PlayerManager;