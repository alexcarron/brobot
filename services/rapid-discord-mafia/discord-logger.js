const { TextChannel } = require("discord.js");
const Logger = require("./logger");

/**
 * A logger which logs messages in a specific discord text channel
 */
class DiscordLogger extends Logger {
	/**
	 * The Discord text channel to send the messages in
	 * @type {TextChannel}
	 */
	channel;

	/**
	 * @param {TextChannel} text_channel The Discord text channel to send the messages in
	 */
	constructor(text_channel) {
		super();
		this.channel = text_channel;
	}

	/**
	 * Logs a message as an info message.
	 * @param {string} message The message to log.
	 * The message is logged as an info message, and is also sent in the
	 * Discord text channel associated with the logger.
	 */
	log(message) {
		super.log(message);

		this.channel.send(message);
	}

	/**
	 * Logs a message as a subheading.
	 * A subheading is a cyan-colored message that is logged with a newline before and after the message.
	 * The message is logged as a subheading, and is also sent in the
	 * Discord text channel associated with the logger.
	 * @param {string} message The message to log as a subheading.
	 */
	logSubheading(message) {
		super.logSubheading(message);

		this.channel.send("\n## " + message);
	}

	/**
	 * Logs a message as a heading.
	 * A heading is a red-colored message that is logged with two newlines before and after the message.
	 * The message is logged as a heading, and is also sent in the
	 * Discord text channel associated with the logger.
	 * @param {string} message The message to log as a heading.
	 */
	logHeading(message) {
		super.logHeading(message);

		this.channel.send("\n# " + message);
	}
}

module.exports = DiscordLogger;