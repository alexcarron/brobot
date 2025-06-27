const { EmbedBuilder } = require("@discordjs/builders");
const ids = require("../bot-config/discord-ids");
const { Message } = require("discord.js");
const { logError } = require("../utilities/logging-utils");

/**
 * Handles when a message is deleted
 * @param {Message} message - the deleted message
 */
const onMessageDeleted = async (message) => {
	if (message.partial) {
		try {
			message = await message.fetch();
		}
		catch (error) {
			logError('Something went wrong when fetching the message:', error);
			return;
		}
	}

	if (message.guild && message.guild.id !== ids.servers.sandSeason3)
		return;

	if (message.system)
		return;

	if (message.author && message.author.id === ids.users.Brobot)
		return;

	let sender = message.member || message.author;

  const embed = new EmbedBuilder()
    .setTitle('🗑️ Message Deleted')
    .addFields(
      { name: 'Author', value: `${sender}`, inline: true },
      { name: 'Original Message', value: message.content || '*[No content]*' }
    )
    .setTimestamp(message.createdAt)
    .setFooter({ text: 'Originally sent at' });

  await message.channel.send({ embeds: [embed] });
}

module.exports = {onMessageDeleted};