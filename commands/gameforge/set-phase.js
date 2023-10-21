const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder  } = require('discord.js');
const Host = require('../../modules/gameforge/Host');
const { confirmAction } = require('../../modules/functions');
const ids = require(`../../databases/ids.json`);
const Parameter = require('../../modules/commands/Paramater');
const GameForge = require('../../modules/gameforge/GameForge');
const SlashCommand = require('../../modules/commands/SlashCommand');
const { GameForgePhases } = require('../../modules/enums');

const Parameters = {
	Phase: new Parameter({
		type: "string",
		name: "phase",
		description: "The phase you are setting GameForge to",
		autocomplete: GameForgePhases,
	}),
}



const command = new SlashCommand({
	name: "set-phase",
	description: "Set the phase on GameForge",
});
command.required_permissions = [PermissionFlagsBits.Administrator]
command.required_servers = [ids.servers.gameforge];
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
	await global.GameForge.setPhase(phase);
};

module.exports = command;

// 1151658087720173638
// 1151658306562170921