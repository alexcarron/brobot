/**
 * An object containing the current status of the bot
 */
const botStatus = {
	/**
	 * Whether Brobot is currently active
	 */
	isOn: false,

	/**
	 * If true, only admins can use Brobot (non-admins are restricted)
	 */
	isSleep: false,

	/**
	 * Whether the bot is in development mode (e.g., for testing purposes)
	 */
	isInDevelopmentMode: false,

	testUsers: [
		"599383947016929293", // The Impartial Narrator,
		"529143263265816576", // Dead Spaghetti Luigi
	],
}

module.exports = { botStatus }