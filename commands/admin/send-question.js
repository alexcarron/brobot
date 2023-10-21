const { PermissionFlagsBits } = require('discord.js');
const
	{ ll_game_shows: llgs, } = require('../../databases/ids.json'),
	ids = require("../../databases/ids.json");
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

	async function updateMessagesDatabase() {
		const
			axios = require('axios'),
			messages_str = JSON.stringify(global.messages),
			owner = "alexcarron",
			repo = "brobot-database",
			path = "messages.json";


		try {
			// Get the current file data
			const {data: file} =
				await axios.get(
					`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
					{
						headers: {
							'Authorization': `Token ${github_token}`
						}
					}
				);

			// Update the file content

			const {data: updated_file} =
				await axios.put(
					`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
					{
						message: 'Update file',
						content: new Buffer.from(messages_str).toString(`base64`),
						sha: file.sha
					},
					{
						headers: {
							'Authorization': `Token ${github_token}`
						}
					}
				);
		} catch (error) {
			console.error(error);
		}
	}

	const llgs_server = global.client.guilds.cache.get(llgs.server_id);
	const { github_token } =  require("../../modules/token.js");
	const channel_name = interaction.options.getString(Parameters.Channel.name)

	switch (channel_name) {
		case "controversial_talk": {
			const
				controversial_channel = llgs_server.channels.cache.get(llgs.controversial_channel_id),
				controversial_question_index = Math.floor( Math.random() * global.messages.controversial_talk.length ),
				controversial_question = global.messages.controversial_talk[controversial_question_index];

			console.log(global.messages.controversial_talk);

			try {
				await controversial_channel.send( controversial_question );
			}
			catch {
				return await controversial_channel.send(`<@${ids.users.LL}> WARNING: We have run out of controversial questions! Blow up the server!`);
			}

			global.messages.controversial_talk.splice(controversial_question_index, 1);
			updateMessagesDatabase();
			break;
		}


		case "philosophy": {
			const
				philosophy_channel = llgs_server.channels.cache.get(llgs.channels.philosophy),
				philosophy_question_index = Math.floor( Math.random() * global.messages.philosophy.length ),
				philosophy_question = global.messages.philosophy[philosophy_question_index];

			try {
				await philosophy_channel.send( philosophy_question );
			}
			catch {
				return await philosophy_channel.send(`<@${ids.users.LL}> WARNING: We have run out of philosophy questions! Blow up the server!`);
			}

			global.messages.philosophy.splice(philosophy_question_index, 1);
			updateMessagesDatabase();
			break;
		}


		case "general": {
			const
				general_question_index = Math.floor( Math.random() * global.messages.general.length ),
				general_question = global.messages.general[general_question_index];

			try {
				await interaction.channel.send( general_question );
			}
			catch {
				return await interaction.channel.send(`<@${ids.users.LL}> WARNING: We have run out of general questions! Blow up the server!`);
			}

			global.messages.general.splice(general_question_index, 1);
			updateMessagesDatabase();
			break;
		}


		case "AAA": {
			const
				aaa_question_index = Math.floor( Math.random() * global.questions.length ),
				aaa_question = global.questions[aaa_question_index],
				participant_index = Math.floor( Math.random() * global.participants.length ),
				participant = global.participants[participant_index];

			try {
				await interaction.channel.send( `Question for **${participant}**: ${aaa_question}` );
			}
			catch {
				return await interaction.channel.send(`<@${ids.users.LL}> WARNING: We have run out of AAA questions! Blow up the server!`);
			}

			global.questions.splice(aaa_question_index, 1);
			console.log(global.questions);
			break;
		}

		default:
			break;
	}

}

module.exports = command