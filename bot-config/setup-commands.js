const Discord = require('discord.js');
const { Routes } = require('discord.js');
const SlashCommand = require("../services/command-creation/slash-command");
const path = require('path');
const fs = require('fs');
const { logInfo, logSuccess, logWarning } = require('../utilities/logging-utils');
const ids = require('./discord-ids.js');

const COMMANDS_DIR_NAME = 'commands';
const COMMANDS_DIR_PATH = path.join(__dirname, '..', COMMANDS_DIR_NAME);
const { DISCORD_TOKEN } = require('./token.js');

/**
 * Recursively finds all .js files in the given directory and all its subdirectories.
 * @param {string} directoryPath - The path of the directory to search in.
 * @returns {string[]} An array of paths of all .js files found.
 */
const getAllJSFilesIn = (directoryPath) => {
	const jsFiles = [];

	function recurse(currentPath) {
		const fileEntries = fs.readdirSync(currentPath, { withFileTypes: true });

		for (const fileEntry of fileEntries) {
			const fullPath = path.join(currentPath, fileEntry.name);
			if (fileEntry.isDirectory()) {
				recurse(fullPath);
			}
			else if (fileEntry.isFile() && fileEntry.name.endsWith('.js')) {
				jsFiles.push(fullPath);
			}
		}
	}

	recurse(directoryPath);
	return jsFiles;
}

/**
 * Collects all commands from the commands directory and returns them as an array of objects.
 * @returns {ApplicationCommandData[]} An array of all the commands.
 * @warns If a command is missing a required property, it will not be registered.
 */
const getCommands = () => {
	let commands = [];

	const commandFilePaths = getAllJSFilesIn(COMMANDS_DIR_PATH);

	for (const commandFilePath of commandFilePaths) {
		let command = require(commandFilePath);

		if (command instanceof SlashCommand) {
			command = command.getCommand();
		}

		if (!("execute" in command)) {
			logWarning(`The command ${commandFilePath} is missing a required "execute" property, so it won't be registered.`);
			continue;
		}

		if (!("data" in command)) {
			logWarning(`The command ${commandFilePath} is missing a required "data" property, so it won't be registered.`);
			continue;
		}

		commands.push(command);
	}

	return commands;
}

/**
 * Stores a slash command in memory on the client.
 * @param {Discord.Client} client The bot client.
 * @param {SlashCommand} command The slash command to store in memory.
 * @returns {void}
 */
const storeCommandInMemory = (client, command) => {
	client.commands.set(command.data.name, command);
}

/**
 * Stores all slash commands in memory on the client.
 * @param {Discord.Client} client The bot client.
 * @param {Array<SlashCommand>} commands The array of slash commands to store in memory.
 * @returns {void}
 */
const storeCommandsInMemory = (client, commands) => {
	client.commands = new Discord.Collection();
	commands.forEach(command =>
		storeCommandInMemory(client, command)
	);
}

const getGlobalCommands = (commands) => {
	return commands.filter(command => !command.required_servers);
}

/**
 * Maps an array of slash commands to the guild IDs they are restricted to.
 * @param {Array<SlashCommand>} commands The array of slash commands to map.
 * @returns {Map<string, Array<SlashCommand>>} A map of guild IDs to arrays of slash commands that are restricted to that guild.
 */
const mapGuildCommandsToGuildID = (commands) => {
	const guildIDtoCommands = new Map();


	for (const command of commands) {
		if (command.required_servers === undefined)
			continue;

		for (const required_server of command.required_servers) {
			if (!guildIDtoCommands.has(required_server))
				guildIDtoCommands.set(required_server, []);

			guildIDtoCommands.get(required_server).push(command);
		}
	}

	return guildIDtoCommands;
}

/**
 * Deploys all slash commands for the bot. This function is called by the {@link setupCommands} function.
 * @param {{globalCommands: SlashCommand[], guildIDtoGuildCommands: Map<string, SlashCommand[]>}} parameters
 * @param {SlashCommand[]} parameters.globalCommands - An array of all global slash commands that should be deployed.
 * @param {Map<string, SlashCommand[]>} parameters.guildIDtoGuildCommands - An object mapping each guild ID to an array of private slash commands that should be deployed in that guild.
 * @returns {Promise<void>}
 */
const deployCommands = async ({globalCommands, guildIDtoGuildCommands}) => {
	// Construct and prepare an instance of the REST module
	const rest = new Discord.REST().setToken(DISCORD_TOKEN);

	logInfo(`Started deploying slash commands...`);

	// The put method is used to fully refresh all commands in the guild with the current set
	for (const requiredServerID of guildIDtoGuildCommands.keys()) {
		const slashCommands = guildIDtoGuildCommands.get(requiredServerID);

		logInfo(`Deploying ${slashCommands.length} private slash commands from guild ${requiredServerID}...`);

		await rest.put(
			Routes.applicationGuildCommands(ids.client, requiredServerID),
			{ body:
				slashCommands.map(command => command.data.toJSON())
			},
		);

		logSuccess(`Deployed ${slashCommands.length} private slash commands from guild ${requiredServerID}.`);
	}

	logInfo(`Deploying ${globalCommands.length} global slash commands...`);
	await rest.put(
		Routes.applicationCommands(ids.client),
		{ body: globalCommands.map(command => command.data.toJSON()) },
	);
	logSuccess(`Deployed ${globalCommands.length} public slash commands`);

	logSuccess(`Successfully deployed all slash commands.`);

	// ! Delete Guild Command
	// rest.delete(Routes.applicationGuildCommand(
	// 	ids.client,
	// 	ids.sandSeason3.guild,
	// 	"1376029058634354872"
	// ))
	// .then(() => logSuccess('Successfully deleted guild command'))
	// .catch(console.error);

	// ! Delete Every Guild Command
	// rest.put(Routes.applicationGuildCommands(ids.client, ids.servers.ll_game_show_center), { body: [] })
	// .then(() => logSuccess('Successfully deleted all guild commands.'))
	// .catch(console.error);

	// ! Delete Global Commands
	// rest.delete(Routes.applicationCommand(ids.client, 'COMMAND ID'))
	// .then(() => logSuccess('Successfully deleted application command'))
	// .catch(console.error);

	//! Delete Every Global Command
	// rest.put(Routes.applicationCommands(ids.client), { body: [] })
	// .then(() => logSuccess('Successfully deleted all application commands.'))
	// .catch(console.error);
}

/**
 * Sets up all slash commands for the bot by reading all .js files in the 'commands' directory
 * and its subdirectories, and registering them with Discord.
 * @param {Discord.Client} client The bot client.
 * @returns {Promise<void>}
 */
const setupCommands = async (client) => {
	const commands = getCommands();
	storeCommandsInMemory(client, commands);

	const globalCommands = getGlobalCommands(commands);
	const guildIDtoGuildCommands = mapGuildCommandsToGuildID(commands);

	await deployCommands({
		globalCommands,
		guildIDtoGuildCommands,
	});
}

module.exports = {setupCommands};