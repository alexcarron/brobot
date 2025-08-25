
/**
 * Represents a contestant in the game
 */
class Contestant {
	constructor({
		coins = 0,
	}) {
		this.coins = coins;
	}

	/**
	 * Gives the contestant a certain amount of coins
	 * @param {number} coins - The amount of coins to give
	 */
	giveCoins(coins) {
		this.coins += coins;
	}
}

module.exports = Contestant;