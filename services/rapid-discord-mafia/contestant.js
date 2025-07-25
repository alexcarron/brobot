
/**
 * Represents a contestant in the game
 */
class Contestant {
	constructor({
		coins = 0,
	}) {
		this.coins = coins;
	}

	giveCoins(coins) {
		this.coins += coins;
	}
}

module.exports = Contestant;