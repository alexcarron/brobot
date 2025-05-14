const { getRandomElement } = require("../../utilities/data-structure-utils");
const { Feedback, Announcements, RoleNames, Factions, AbilityTypes, AbilityName } = require("../enums");
const { setNickname } = require("../functions");
const Logger = require("./Logger");
const Player = require("./Player");

class PlayerManager {
	/**
	 * A map of player names to their player object
	 * @type {[player_name: string]: Player}
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
	 * @param {Player} Player object
	 */
	async addPlayer(player) {
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
			player =>
				player.getRole() &&
				player.getRole().faction === faction
		);
	}

	getAlivePlayersInFaction(faction) {
		return this.getAlivePlayers().filter(
			player =>
				player.getRole() &&
				player.getRole().faction === faction
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

	async removePlayer(player_name) {
		delete this.players[player_name];
	}

	async renamePlayer(old_name, new_name) {
		this.players[new_name] = this.players[old_name];
		delete this.players[old_name];
		const player = this.players[new_name];

		this.players[new_name].name = new_name;

		if (!this.isMockPlayerManager) {
			const player_guild_member = await this.players[new_name].fetchGuildMember();
			await setNickname(player_guild_member, new_name);

			const new_channel_name =
				"👤｜" +
				player.name.toLowerCase()
					.replace(' ', '-')
					.replace(/[^a-zA-Z0-9 -]/g, "");

			const player_channel = await player.getPlayerChannel();
			player_channel.setName(new_channel_name);
		}
	}

	isFactionAlive(faction) {
		return this.getAlivePlayers().some(
			player =>
				player.getRole() &&
				player.getRole().faction === faction
		)
	}

	isRoleAlive(role) {
		return this.getAlivePlayers().some(player =>
			player.role === role
		)
	}

	/**
	 * Smites a player, killing them and removing them from the game
	 * @param {Player} player
	 */
	async smitePlayer(player) {
		await player.sendFeedback(Feedback.Smitten(player));
		this.game_manager.addDeath(player, player, Announcements.PlayerSmitten);
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
				await player.sendFeedback(Feedback.InactivityWarning(this, actual_phases_inactive, remaining_inactive_phases));
			}
		}
	}

	/**
	 * Makes a player attack another player
	 * @param {Object} parameters
	 * @param {Player} parameters.attacker_player - The player attacking the other player.
	 * @param {Player} parameters.target_player - The player being attacked by the other player
	 */
	async attackPlayer({attacker_player, target_player}) {
		target_player.logger.log(`${attacker_player.name} attacks ${target_player.name} with ${attacker_player.attack} attack level against ${target_player.defense} defense level.`);

		// Attack Success
		if (target_player.defense < attacker_player.attack) {
			this.game_manager.addDeath(target_player, attacker_player);

			target_player.addFeedback(Feedback.KilledByAttack);
			attacker_player.addFeedback(Feedback.KilledPlayer(target_player.name));

			const target_role = this.game_manager.role_manager.getRole(target_player.role);
			if (
				attacker_player.role === RoleNames.Vigilante &&
				target_role.faction === Factions.Town
			) {
				attacker_player.addAbilityAffectedBy(attacker_player, AbilityName.Suicide, this.game_manager.days_passed - 0.5);
			}
		}
		// Attack Failed
		else {
			const protection_affects_on_target = target_player.affected_by.filter(
				affect => {
					const ability_name = affect.name;

					const ability = this.game_manager.ability_manager.getAbility(ability_name);
					return ability.type == AbilityTypes.Protection;
				}
			);

			if ( protection_affects_on_target.length > 0 ) {
				for (let protection_affect of protection_affects_on_target) {
					const protecter_player = this.get(protection_affect.by);
					protecter_player.addFeedback(Feedback.ProtectedAnAttackedPlayer);

					this.logger.log(`${protecter_player.name} has protected the victim ${target_player.name}`);

					if (protection_affect.name === AbilityName.Smith) {
						this.logger.log(`${protecter_player.name} successfully smithed a vest and achieved their win condition.`);

						protecter_player.addFeedback(Feedback.DidSuccessfulSmith);
						this.game_manager.makePlayerAWinner(protecter_player);
					}
				}
			}

			target_player.addFeedback(Feedback.AttackedButSurvived);
			attacker_player.addFeedback(Feedback.AttackFailed(target_player.name));
		}
	}

	/**
	 * Makes a player leave the game
	 * @param {Player} player
	 */
	havePlayerLeave(player) {
		this.logger.log(`**${player.name}** left the game.`);
		this.game_manager.announceMessages(`**${player.name}** left the game.`);
		this.game_manager.addDeath(player, player, Announcements.PlayerSuicide);
	}

	/**
	 * Makes a player leave the game during sign ups
	 * @param {Player} player
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
	 * @param {Player} player
	 * @param {Role} role
	 */
	async convertPlayerToRole(player, role) {
		const current_role_name = player.role;
		player.setRole(role);
		player.role_log += " -> " + role.name;

		await player.sendFeedback(
			Feedback.ConvertedToRole(player, current_role_name, role.name)
		);
		await player.sendFeedback(role.toString(), true);

		if (role.name === RoleNames.Executioner) {
			const alive_town_players = this.getTownPlayers().filter(player => player.isAlive);
			const rand_town_player = getRandomElement(alive_town_players);

			if (rand_town_player)
				player.setExeTarget(rand_town_player);
			else {
				const fool_role = this.game_manager.role_manager.getRole(RoleNames.Fool);
				this.convertToRole(player, fool_role);
			}
		}

	}

	/**
	 * Removes effects and abilities used on player
	 * @param {Player} player
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
					case AbilityTypes.Protection: {
						player.restoreOldDefense();
						break;
					}

					case AbilityTypes.Manipulation: {
						player.resetPercieved();
						break;
					}

					case AbilityTypes.Roleblock: {
						player.isRoleblocked = false;
						break;
					}

					case AbilityTypes.Modifier: {
						break;
					}

					case AbilityTypes.Suicide: {
						this.game_manager.addDeath(player, player, Announcements.VigilanteSuicide);

						await player.sendFeedback(Feedback.ComittingSuicide);
						player.addFeedback(Feedback.ComittedSuicide);
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
	 * @param {Player} player
	 */
	removeManipulationEffectsFromPlayer(player) {
		if (player.affected_by) {
			for (let [index, affect] of player.affected_by.entries()) {
				const ability_affected_by = this.game_manager.ability_manager.getAbility(affect.name);

				if (ability_affected_by.type === AbilityTypes.Manipulation) {
					player.affected_by.splice(index, 1);
					player.resetPercieved();
				}
			}
		}
	}
}

module.exports = PlayerManager;