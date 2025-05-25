const { Parameter } = require("../../services/command-creation/parameter");
const ids = require("../../bot-config/discord-ids.js");
const SlashCommand = require("../../services/command-creation/slash-command");
const { deferInteraction, getInputFromCreatedTextModal } = require("../../utilities/discord-action-utils.js");

const Parameters = {
	Edit: new Parameter({
		type: "subcommand",
		name: "edit",
		description: "Edit your last will",
	}),
	Remove: new Parameter({
		type: "subcommand",
		name: "remove",
		description: "Remove your existing last will",
	}),
}

const command = new SlashCommand({
	name: "last-will",
	description: "Edit your last will in Rapid Discord Mafia",
});
command.parameters = [
	Parameters.Edit,
	Parameters.Remove,
];

command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_roles = [ids.rapid_discord_mafia.roles.living];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const player = global.game_manager.player_manager.getPlayerFromId(interaction.user.id);

	if (!player) {
		return await interaction.editReply("Non-players can't write last wills");
	}

	if (!player.isAlive) {
		return await interaction.editReply("Dead people can't write last wills");
	}

	if (interaction.options.getSubcommand() === Parameters.Edit.name) {
		const contents = await getInputFromCreatedTextModal({
			channelToSendIn: interaction.channel,
			modalTitle: "Last Will",
			initialMessageText: "Click the button to edit your last will",
			showModalButtonText: "Edit Last Will",
			placeholder: player.last_will,
		});

		if (contents.includes("`")) {
			return await interaction.editReply(`Your last will includes a backtick (\`) which is illegal.`)
		}

		player.updateLastWill(contents);
	}
	else if (interaction.options.getSubcommand() === Parameters.Remove.name) {
		player.updateLastWill("");
	}

	return await interaction.editReply(`Your last will is now: \n\`\`\`\n${player.last_will}\n\`\`\``);
};
module.exports = command;