/**
 * An object containing the initial status of the bot
 */
export const initialBotStatus: typeof global.botStatus = {
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

	/**
	 * An array of user IDs that are considered test users or developers of Brobot
	 */
	testUsersAndDevelopers: [
		"599383947016929293", // The Impartial Narrator,
		"529143263265816576", // Dead Spaghetti Luigi
		"1095682901942751252",
		"1123827315479167058",
	],
}