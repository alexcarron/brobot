const { setNickname } = require("../functions");
const Logger = require("./Logger");
const Player = require("./player");

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

	constructor(players = {}, logger=new Logger(), isMockPlayerManager=false) {
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
			const player_guild_member = await this.players[new_name].getGuildMember();
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
}

module.exports = PlayerManager;