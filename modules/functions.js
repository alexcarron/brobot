const { github_token } =  require("../token.json");
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, Guild, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle  } = require('discord.js');

const functions = {

	logColor(message, color) {
		let reset = "\x1b[0m",
			color_start;

		switch (color.toLowerCase()) {
			case "cyan":
				color_start = "\x1b[36m"
				break;

			case "red":
				color_start = "\x1b[31m"
				break;
		}

		console.log(color_start + message + reset);
	},

	async saveObjectToGitHubJSON(object, json_name) {
		const
			axios = require('axios'),
			owner = "alexcarron",
			repo = "brobot-database",
			path = `${json_name}.json`,
			json_object_string = JSON.stringify(object);


		try {
			// Get the current file data to obtain sha
			const {data: current_file} =
				await axios.get(
					`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
					{
						headers: {
							'Authorization': `Token ${github_token}`
						}
					}
				);

			// Update the file content
			await axios.put(
				`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
				{
					message: `Update ${json_name}`,
					content: new Buffer.from(json_object_string).toString(`base64`),
					sha: current_file.sha
				},
				{
					headers: {
						'Authorization': `Token ${github_token}`
					}
				}
			);
		}
		catch (error) {
			console.error(error);
		}
	},

	async getObjectFromGitHubJSON(json_name) {
		const
			axios = require('axios'),
			owner = "alexcarron",
			repo = "brobot-database",
			path = `${json_name}.json`;


		// Get the current file data
		const {data: file} =
			await axios.get(
				`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
				{
					headers: {
						'Authorization': `Token ${github_token}`
					}
				}
			)
			.catch(err => {
				console.error(err);
			});


		let object_string = Buffer.from(file.content, 'base64').toString();
		let object = JSON.parse(object_string);

		return object;
	},
}

module.exports = functions;