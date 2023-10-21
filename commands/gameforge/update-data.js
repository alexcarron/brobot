const { PermissionFlagsBits, Attachment } = require("discord.js");
const Parameter = require("../../modules/commands/Paramater");
const SlashCommand = require("../../modules/commands/SlashCommand");
const ids = require(`../../databases/ids.json`)
const fs = require("node:fs/promises"); // Used to interact with file system


const Parameters = {
	Data: new Parameter({
		type: "attachment",
		name: "data-json",
		description: "JSON file of GameForge data"
	})
}

const command = new SlashCommand({
	name: "update-data",
	description:  "Update GameForge JSON Data File.",
});
command.required_servers = [ids.servers.gameforge];
command.required_permissions = [PermissionFlagsBits.Administrator];
command.parameters = [
	Parameters.Data
]
command.execute = async function(interaction) {
	await interaction.deferReply({ephemeral: true});

	let json_attachment = interaction.options.getAttachment(Parameters.Data.name)
	let json_obj

	console.log({json_attachment})

	const https = require('https'); // or 'https' if the URL is HTTPS
	const url = json_attachment.url; // Replace with the URL of the JSON data you want to fetch

	// Make an HTTP GET request
	https.get(url, async (response) => {
		let data = '';

		// Read the data as it comes in
		response.on('data', (chunk) => {
			data += chunk;
		});

		// When the response has ended, parse the JSON data
		response.on('end', async () => {
			try {
				json_obj = JSON.parse(data);
				console.log({json_obj});
				await global.GameForge.setGameForgeGame(json_obj);
				await global.GameForge.saveGameDataToDatabase();
				await interaction.editReply("Done");
			} catch (error) {
				console.error('Error parsing JSON:', error.message);
			}
		});
	}).on('error', (error) => {
		console.error('Error making HTTP request:', error.message);
	});
}

module.exports = command;