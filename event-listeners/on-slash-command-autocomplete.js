const { AutocompleteInteraction } = require("discord.js");
const { logError } = require("../utilities/logging-utils");

/**
 * Handles an interaction that is a slash command autocomplete request.
 * @param {AutocompleteInteraction} interaction - The interaction whose reply is being updated.
 * @returns {Promise<void>}
 */
const onSlashCommandAutocomplete = async function(interaction) {
	const command = global.commands.get(interaction.commandName);

	if (!command) {
		logError(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.handleAutocomplete(interaction);
	}
	catch (error) {
		logError(`Failed to handle autocomplete for ${interaction.commandName}.`, error instanceof Error ? error : undefined);
	}
}

module.exports = { onSlashCommandAutocomplete };
