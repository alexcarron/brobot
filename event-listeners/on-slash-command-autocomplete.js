const { AutocompleteInteraction } = require("discord.js");

/**
 * Handles an interaction that is a slash command autocomplete request.
 * @param {AutocompleteInteraction} interaction - The interaction whose reply is being updated.
 * @returns {Promise<void>}
 */
const onSlashCommandAutocomplete = async function(interaction) {
	const command = global.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.autocomplete(interaction);
	} catch (error) {
		console.error(error);
	}
}

module.exports = { onSlashCommandAutocomplete };
