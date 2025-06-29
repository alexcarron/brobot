const { Message } = require("discord.js");
const { logInfo } = require("../utilities/logging-utils");

/**
 * Handles when a message is deleted
 * @param {Message} message - the deleted message
 */
const onMessageDeleted = async (message) => {
	logInfo(`Message deleted by ${message.author.username}: ${message.content}`);
}

module.exports = {onMessageDeleted};