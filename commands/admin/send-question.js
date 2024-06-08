const { PermissionFlagsBits } = require('discord.js');
const
	{ ll_game_shows: llgs, } = require('../../data/ids.json'),
	ids = require("../../data/ids.json");
const Parameter = require('../../modules/commands/Paramater');
const SlashCommand = require('../../modules/commands/SlashCommand');
const { deferInteraction } = require('../../modules/functions');

const Parameters = {
	Channel: new Parameter({
		type: "string",
		name: "channel",
		description: "The channel/type of question to send",
		autocomplete: {
			"Controversial": "controversial_talk",
			"Philosophy": "philosophy",
			"Conversation Starter": "general",
			"AAA": "AAA",
		},
	}),
}

const command = new SlashCommand({
	name: "send-question",
	description: "Send a contraversial or philosophical question",
});
command.required_permissions = [PermissionFlagsBits.Administrator]
command.parameters = [
	Parameters.Channel
]
command.execute = async function(interaction) {
	await deferInteraction(interaction);
}

module.exports = command