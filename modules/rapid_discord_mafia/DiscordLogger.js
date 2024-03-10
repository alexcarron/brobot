const { TextChannel } = require("discord.js");
const Logger = require("./Logger");

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
		this.channel = text_channel;
	}

	log(message) {
		super.log(message);

		this.channel.send(message);
	}

	logSubheading(message) {
		super.logSubheading(message);

		this.channel.send("\n## " + message);
	}

	logHeading(message) {
		super.logHeading(message);

		this.channel.send("\n# " + message);
	}
}

module.exports = DiscordLogger;