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
}

module.exports = { botStatus }