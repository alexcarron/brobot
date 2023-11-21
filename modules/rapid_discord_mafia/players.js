const { setNickname } = require("../functions");
const Player = require("./player");
const roles = require("./roles");

class Players {
	constructor(players = {}) {
		this.players = players;
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
		const player = new Player(player_obj);
		await this.addPlayer(player);
		return player;
	}

	get(name) {
		return this.players[name];
	}

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
		return this.getPlayerList().filter( player => global.Roles[player.role].faction === "Town" );
	}

	getAlivePlayers() {
		return this.getPlayerList().filter( player => player.isAlive );
	}

	getPlayersInFaction(faction) {
		return this.getPlayerList().filter( player => roles[player.role].faction === faction );
	}

	getAlivePlayersInFaction(faction) {
		return this.getAlivePlayers().filter( player => roles[player.role].faction === faction );
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

		this.players[new_name].name = new_name;

		const player_guild_member = await this.players[new_name].getGuildMember();
		await setNickname(player_guild_member, new_name);
	}

	isFactionAlive(faction) {
		return this.getAlivePlayers().some(player =>
			roles[player.role].faction === faction
		)
	}

	isRoleAlive(role) {
		return this.getAlivePlayers().some(player =>
			player.role === role
		)
	}
}

module.exports = Players;