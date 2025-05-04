const Parameter = require("../../modules/commands/Paramater");
const ids = require("../../bot-config/discord-ids.json");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { deferInteraction, getModalTextFieldInput } = require("../../modules/functions");
const { autocomplete } = require("./use");

const Parameters = {
	Edit: new Parameter({
		type: "subcommand",
		name: "edit",
		description: "Edit your death note",
	}),
	Remove: new Parameter({
		type: "subcommand",
		name: "remove",
		description: "Remove your existing death note"
	}),
}

const command = new SlashCommand({
	name: "death-note",
	description: "Edit your death note in Rapid Discord Mafia",
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
		return await interaction.editReply("Non-players can't write death notes");
	}

	if (!player.isAlive) {
		return await interaction.editReply("Dead people can't write death notes");
	}

	if (interaction.options.getSubcommand() === Parameters.Edit.name) {
		const contents = await getModalTextFieldInput({
			channel_sending_in: interaction.channel,
			title: "Death Note",
			button_text: "Edit Death Note",
			prompt: "Click the button to edit your death note",
			placeholder: player.death_note,
		});

		if (contents.includes("`")) {
			return await interaction.editReply(`Your death note includes a backtick (\`) which is illegal.`)
		}

		player.updateDeathNote(contents);
	}
	else if (interaction.options.getSubcommand() === Parameters.Remove.name) {
		player.updateDeathNote("");
	}

	return await interaction.editReply(`Your death note is now: \n\`\`\`\n${player.death_note}\n\`\`\``);
};
module.exports = command;