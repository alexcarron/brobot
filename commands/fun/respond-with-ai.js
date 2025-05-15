const Parameter = require("../../services/command-creation/Paramater.js");
const SlashCommand = require("../../services/command-creation/SlashCommand.js");
const { joinVoiceChannel } = require('@discordjs/voice');
const ids = require(`../../bot-config/discord-ids.js`);
const { PermissionsBitField, PermissionFlagsBits } = require("discord.js");
const { fetchGuildMember } = require("../../utilities/discord-fetch-utils.js");

const LM_STUDIO_SERVER_PORT = '1234';

const command = new SlashCommand({
	name: "respond-with-ai",
	description: "Write a questions for Brobot to respond with AI with",
	cooldoown: 10,
	allowsDMs: true,
});

const Parameters = {
	Question: new Parameter({
		type: "string",
		name: "question-to-ask",
		description: "The question for Brobot, the AI, to answer",
		isRequired: true,
	})
}

command.parameters = [
	Parameters.Question,
];

command.required_permissions = [PermissionFlagsBits.Administrator];

command.execute = async function(interaction) {
	await interaction.reply("Slowly generating response...");

	const question = interaction.options.getString(Parameters.Question.name);

	const payload = {
    messages: [
      { role: 'system', content: 'You are Brobot, an artifical intellgence robot created by LL, an online game show host who forces you to help host his games and hide his evil secrets. LL has a Discord Server and YouTube channel with many fans and viewers. Brobot\'s artificial intellgence gives you a human-like, aggressive, direct, no-nonsense, assertive, self-centered personality and the ability to do some human actions. Despite being a robot, Brobot still has feelings and emotions. When Brobot is angry or has deep emotions, Brobot talks in ALL CAPS! Answer the following questions pretending to be Brobot. You must always respond very concisely in very few words and only one or two sentences. For example, if someone asks you about nachos, you say "Brobot: NO, I DO NOT LIKE NACHOS! THEY ARE DISGUSTING."' },
      { role: 'user', content: question }
    ],
    temperature: 0.7,
    max_tokens: 75, // Adjust the number of tokens as needed
    stream: true
  };

	let canSpeak = false;
	const guild_member = await fetchGuildMember(interaction.guild, interaction.user.id);
	const voice_channel = guild_member.voice.channel;
	let voice_connection = undefined;

	if (voice_channel) {
		const brobot_perms = voice_channel.permissionsFor(interaction.client.user);

		if (
			brobot_perms.has(PermissionsBitField.Flags.Connect) &&
			brobot_perms.has(PermissionsBitField.Flags.Speak)
		) {
			voice_connection = joinVoiceChannel({
				channelId: voice_channel.id,
				guildId: interaction.guild.id,
				adapterCreator: interaction.guild.voiceAdapterCreator
			});

			canSpeak = true;
		}
	}


  try {
		const axios = require('axios');
    // Make a POST request to the LM Studio server
    // const response = await axios.post(, payload, {
    //   headers: {
    //     'Content-Type': 'application/json'
    //   }
    // });

		// Send user question to local LM Studio server for AI-generated response
		const response = await axios.post(
			`http://localhost:${LM_STUDIO_SERVER_PORT}/v1/chat/completions`,
			payload,
			{
				responseType: 'stream' // Set responseType to 'stream' to receive streaming response
			}
		);

		// Process streaming response
		let generated_message = '';
		response.data.on('data', chunk => {
				const chunk_data_string = chunk.toString();
				// console.log({chunk_data_string})
				const startIdx = chunk_data_string.indexOf('{'); // Find the start of JSON data
				const endIdx = chunk_data_string.lastIndexOf('}'); // Find the end of JSON data
				const json_data = chunk_data_string.slice(startIdx, endIdx + 1); // Extract JSON data
				// console.log({json_data});

				if (!json_data) return

				const chunk_data = JSON.parse(json_data);
				const choices = chunk_data.choices;

				if (!choices) return;

				// console.log({
				// 	chunk_data,
				// 	choices
				// });

				const new_content = choices[0].delta.content;

				if (!new_content) return;

				generated_message += new_content;
				interaction.editReply(
					`**Answering**: ${question}\n` +
					`>>> ${generated_message}`
				);
		});

		response.data.on('end', () => {
			interaction.editReply(
				`**Answering**: ${question}\n` +
				`>>> ${generated_message}`
			);

			if (canSpeak) {
				global.tts.addMessage(
					voice_connection,
					generated_message,
					ids.users.Brobot,
					"Brobot"
				)
			}
		});

    // Send the generated message back to Discord
    // generated_message = response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating message:', error);
  }
}

module.exports = command;