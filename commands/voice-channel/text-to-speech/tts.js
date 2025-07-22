const { SlashCommand } = require('../../../services/command-creation/slash-command');
const { Parameter } = require('../../../services/command-creation/parameter');
const { joinVoiceChannel } = require('@discordjs/voice');
const { PermissionsBitField } = require('discord.js');
const { deferInteraction } = require('../../../utilities/discord-action-utils.js');

const Subparameters = {
	Message: new Parameter({
		type: "string",
		name: "message",
		description: "What you want to say",
		isRequired: false,
	}),
	Name: new Parameter({
		type: "string",
		name: "name",
		description: "Announces your name to avoid confusion on who said what",
		isRequired: false,
	}),
	RequiredName: new Parameter({
		type: "string",
		name: "name",
		description: "Announces your name to avoid confusion on who said what",
		isRequired: true,
	}),
	ReadAllMessages: new Parameter({
		type: "boolean",
		name: "read-all-messages",
		description: "When true, will read every single message you send until toggled off",
		isRequired: false,
	})
}
const Parameters = {
	Say: new Parameter({
		type: "subcommand",
		name: "say",
		description: "Have Brobot speak a text message for you once",
		subparameters: [
			Subparameters.Message,
			Subparameters.Name,
		]
	}),
	ReadMyMessages: new Parameter({
		type: "subcommand",
		name: "read-my-messages",
		description: "Have Brobot read every message you send in this channel",
		subparameters: [
			Subparameters.Name,
		],
	}),
	DontReadMyMessages: new Parameter({
		type: "subcommand",
		name: "dont-read-my-messages",
		description: "Have Brobot stop reading every message you send in this channel",
	}),
	SetName: new Parameter({
		type: "subcommand",
		name: "set-name",
		description: "Set the name Brobot announces is speaking",
		subparameters: [
			Subparameters.RequiredName,
		]
	}),
}
module.exports = new SlashCommand({
	name: "tts",
	description: "Say something in VC using text",
	parameters: [
		Parameters.Say,
		Parameters.ReadMyMessages,
		Parameters.DontReadMyMessages,
		Parameters.SetName,
	],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		let message = "Nothing";
		let name = undefined;
		let speaker_name = "Someone";

		const voice_channel = interaction.member.voice.channel;
		if (!voice_channel) {
			return await interaction.editReply("You need to be in a VC!");
		}

		const brobot_perms = voice_channel.permissionsFor(interaction.client.user);

		if (
			!brobot_perms.has(PermissionsBitField.Flags.Connect) ||
			!brobot_perms.has(PermissionsBitField.Flags.Speak)
		) {
			return await interaction.editReply("I can't connect or speak in that VC!");
		}

		const subcommand_name = interaction.options.getSubcommand();

		console.log({subcommand_name});
		if (subcommand_name === Parameters.Say.name) {
			message = interaction.options.getString(Subparameters.Message.name);
			name = interaction.options.getString(Subparameters.Name.name);

			if (name)
				message = `${name} says ${message}`;

			const voice_connection = joinVoiceChannel({
				channelId: voice_channel.id,
				guildId: interaction.guild.id,
				adapterCreator: interaction.guild.voiceAdapterCreator
			});

			speaker_name = name;
			if (!speaker_name)
				speaker_name = interaction.member.nickname;

			if (speaker_name == null)
				speaker_name = interaction.user.globalName;

			if (speaker_name == null)
				speaker_name = interaction.user.username;

			if (message === null)
				message = "Nothing";

			global.tts.addMessage(
				voice_connection,
				message,
				interaction.user.id,
				speaker_name
			);

			await interaction.editReply("Text to speech sent");
		}

		else if (subcommand_name === Parameters.ReadMyMessages.name) {
			name = interaction.options.getString(Subparameters.Name.name);

			global.tts.removeToggledUser(interaction.user.id);

			global.tts.addToggledUser(
				interaction.user.id,
				interaction.channel.id,
				name
			);

			return await interaction.editReply("I will now read all of your messages");
		}

		else if (subcommand_name === Parameters.DontReadMyMessages.name) {
			global.tts.removeToggledUser(interaction.user.id);

			return await interaction.editReply("I will no longer read all your messages");
		}

		else if (subcommand_name === Parameters.SetName.name) {
			name = interaction.options.getString(Subparameters.Name.name);

			if (!name) {
				name = "";
			}

			global.tts.updateToggledUserName(interaction.user.id, name);

			return await interaction.editReply("Your name has been set to **" + name + "**");
		}
	}
});