const { SlashCommand } = require("../services/command-creation/slash-command");
const { deferInteraction, editReplyToInteraction } = require("../utilities/discord-action-utils");
// Re-import SlashCommand, deferInteraction, and editReplyToInteraction

module.exports = new SlashCommand({
	name: "NAME-HERE",
	description: "DESCRIPTION OF COMMAND HERE",
	// List ids of servers this command is available in
	required_servers: [],

	// List ids of roles users must have to run this command
	required_roles: [],

	// List ids of channels users must be in to run this command
	required_channels: [],

	// Indicate that this command is in development
	isInDevelopment: true,

	// Add other properties to the command if needed

	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		// Implement what happens when the command is run
		await editReplyToInteraction(interaction,
			`CONFIRMATION MESSAGE HERE`
		)
	}
});

// Uncomment the line below to export the command
// module.exports = command;