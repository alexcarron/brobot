const
	{ ll_game_shows: llgs, } = require('../../databases/ids.json');



module.exports = {
	name: 'sendmessage',
    aliases: ['sendm', 'sm'],
    description: 'Send a random question to a channel',
	args: 1,
	isRestrictedToMe: true,
	usages: ["<channel-name>"],
    required_permission: 'ADMINISTRATOR',
    required_roles: ["LL"],
	async execute(message, args) {

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


		const channel_name = args[0];

		switch (channel_name) {
			case "controversial_talk": {
				const
					controversial_channel = llgs_server.channels.cache.get(llgs.controversial_channel_id),
					controversial_question_index = Math.floor( Math.random() * global.messages.controversial_talk.length ),
					controversial_question = global.messages.controversial_talk[controversial_question_index];

				controversial_channel.send( controversial_question );

				global.messages.controversial_talk.splice(controversial_question_index, 1);
				updateMessagesDatabase();
				break;
			}


			case "philosophy": {
				const
					philosophy_channel = llgs_server.channels.cache.get(llgs.channels.philosophy),
					philosophy_question_index = Math.floor( Math.random() * global.messages.philosophy.length ),
					philosophy_question = global.messages.philosophy[philosophy_question_index];

				philosophy_channel.send( philosophy_question );

				global.messages.philosophy.splice(philosophy_question_index, 1);
				updateMessagesDatabase();
				break;
			}

			default:
				break;
		}

    }
};