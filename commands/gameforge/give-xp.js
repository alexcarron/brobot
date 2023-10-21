
const fs = require('fs');
const { autocomplete, deferInteraction } = require("../../modules/functions.js");
const Parameter = require("../../modules/commands/Paramater.js");
const SlashCommand = require("../../modules/commands/SlashCommand.js");
const { PermissionFlagsBits } = require('discord.js');
const LLPointManager = require('../../modules/llpointmanager.js');
const GameForge = require('../../modules/gameforge/GameForge.js');

//
const Parameters = {
	HostName: new Parameter({
		type: "string",
		name: "host-name",
		description: "The name of the host your giving XP to",
		isAutocomplete: true,
	}),
	XPAmount: new Parameter({
		type: "number",
		name: "xp-amount",
		description: "The amount of XP your giving to the host",
	}),
}

const command = new SlashCommand({
	name: "give-xp",
	description: "Give a certain amount of XP to a host",
});
command.required_permissions = [PermissionFlagsBits.Administrator]
command.parameters = [
	Parameters.HostName,
	Parameters.XPAmount,
]
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const
		host_id_arg = interaction.options.getString(Parameters.HostName.name),
		added_xp = interaction.options.getNumber(Parameters.XPAmount.name);

	let host = await global.GameForge.getHostByID(host_id_arg);

	if (!host) {
		return interaction.editReply(`The host, **${host_id_arg}**, doesn't exist.`);
	}

	await host.giveXP(added_xp, false)

	let current_xp = await host.xp;

	await interaction.editReply(
		`Giving **${host.name}** \`${added_xp}\` xp...\n` +
		`They now have \`${current_xp}\` xp.`
	);

	await global.GameForge.saveGameDataToDatabase();
}
command.autocomplete = GameForge.getHostsAutocomplete

module.exports = command;