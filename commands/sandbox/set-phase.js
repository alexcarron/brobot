const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder  } = require('discord.js');
const Host = require('../../modules/sandbox/Host');
const { confirmAction } = require('../../modules/functions');
const ids = require(`../../databases/ids.json`);
const Parameter = require('../../modules/commands/Paramater');
const Sandbox = require('../../modules/sandbox/sandbox');
const SlashCommand = require('../../modules/commands/SlashCommand');

const Parameters = {
	Phase: new Parameter({
		type: "string",
		name: "phase",
		description: "The phase you are setting Sandbox to",
		autocomplete: Sandbox.Phases,
	}),
}



const command = new SlashCommand({
	name: "set-phase",
	description: "Set the phase on Sandbox",
});
command.required_permissions = [PermissionFlagsBits.Administrator]
command.required_servers = [ids.servers.sandbox];
command.parameters = [
	Parameters.Phase,
]
command.execute = async function(interaction) {
	if (interaction) {
		try {
			await interaction.reply({content: "Setting Phase...", ephemeral: true});
		}
		catch {
			console.log("Failed Defer: Reply Already Exists");
			await interaction.editReply({ content: "Sending Command...", ephemeral: true});
		}
	}

	let phase = interaction.options.getString(Parameters.Phase.name);
	await global.Sandbox.setPhase(phase);
};

module.exports = command;