const onSlashCommandAutoComplete = async function(interaction) {
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		command.autocomplete(interaction);
	} catch (error) {
		console.error(error);
	}
}

module.exports = { onSlashCommandAutoComplete };
