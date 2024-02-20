const SlashCommand = require('../../modules/commands/SlashCommand.js');
const Parameter = require('../../modules/commands/Paramater.js');
const { joinVoiceChannel, createAudioResource, createAudioPlayer } = require('@discordjs/voice');
const { PermissionsBitField } = require('discord.js');

const Parameters = {
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
	ReadAllMessages: new Parameter({
		type: "boolean",
		name: "read-all-messages",
		description: "When true, will read every single message you send until toggled off",
		isRequired: false,
	})
}
const command = new SlashCommand({
	name: "tts",
	description: "Say something in VC using text",
});
command.parameters = [
	Parameters.Message,
	Parameters.Name,
	Parameters.ReadAllMessages,
]
command.execute = async function(interaction) {
	await interaction.deferReply({ ephemeral: true });

	let message = interaction.options.getString(Parameters.Message.name);
	const name = interaction.options.getString(Parameters.Name.name);
	const isToggled = interaction.options.getBoolean(Parameters.ReadAllMessages.name);

	if (!message)
		message = "nothing";

	if (name)
		message = `${name} said ${message}`;

	const voice_channel = interaction.member.voice.channel;

	if (!voice_channel) {
		return await interaction.editReply("You need to be in a VC!");
	}

	const brobot_perms = voice_channel.permissionsFor(interaction.client.user);

	if (
		!brobot_perms.has(PermissionsBitField.Flags.Connect) ||
		!brobot_perms.has(PermissionsBitField.Flags.Speak)
	) {
		return await interaction.editReply("I can't connect or speak!");
	}

	if (isToggled) {
		global.tts.addToggledUser(interaction.user.id, interaction.channel.id, name);
		return await interaction.editReply("Confirmed reading all messages");
	}
	else if (isToggled === false) {
		global.tts.removeToggledUser(interaction.user.id);
		return await interaction.editReply("Confirmed no longer reading all messages");
	}

	const voice_connection = joinVoiceChannel({
		channelId: voice_channel.id,
		guildId: interaction.guild.id,
		adapterCreator: interaction.guild.voiceAdapterCreator
	});

	let messages = []
	for (let i = 0; i < message.length; i += 200) {
		messages.push(message.substring(i, i + 200));
	}

	messages.forEach(message => {
		global.tts.addMessage(voice_connection, message);
	});

	await interaction.editReply("Text to speech sent");
}
module.exports = command;