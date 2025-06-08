const Discord = require('discord.js');
const {GatewayIntentBits, Partials} = require("discord.js");
const { DISCORD_TOKEN } = require('./token.js');

/**
 * Sets up the Discord client with the necessary intents and partials.
 * Stores the client in the global scope.
 *
 * @returns {Promise<Discord.Client>} The client that was set up.
 */
const setupClient = async () => {
	const client = new Discord.Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.GuildPresences,
			GatewayIntentBits.MessageContent,
			GatewayIntentBits.DirectMessages,
			GatewayIntentBits.GuildMessageReactions,
			GatewayIntentBits.GuildVoiceStates,
		],
		partials: [
			Partials.Channel,
			Partials.Message,
			Partials.Reaction
		]
	});

	await client.login(DISCORD_TOKEN);

	client.cooldowns = new Discord.Collection();

	global.client = client;

	return client;
}

module.exports = {setupClient};