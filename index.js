console.log(`discord.js version: ${require('discord.js').version}`);

const
	{ DatabaseURLs } = require("./modules/enums.js");
	ids = require('./databases/ids.json');
	fs = require("fs"), // Used to interact with file system
	cron = require("cron"), // Used to have scheduled functions execute
	Discord = require('discord.js'),
	{ REST, Routes, Events, GatewayIntentBits, Partials } = require('discord.js'),
	{ discord_token } = require("./modules/token.js"),
	{ prefix, blocked_users } = require('./utilities/config.json');


global.client = new Discord.Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessageReactions
	],
	partials: [
		Partials.Channel,
		Partials.Message,
		Partials.Reaction
	]
});

// ! Create global paths object to store directories
const paths = require("./utilities/path.js");
const { addRole, getRole, getGuild } = require('./modules/functions.js');
const { Collection } = require('discord.js');
const SlashCommand = require('./modules/commands/SlashCommand.js');
global.paths = paths;

// ! Store a list of command cooldowns
client.cooldowns = new Collection();


// ! Store commands to client
global.client.commands = new Discord.Collection();
global.client.slash_commands = new Discord.Collection();

const slash_commands = [];
const command_folders_path = `./commands`;
const command_folders = fs.readdirSync(command_folders_path);

(async () => {
	for (const command_folder of command_folders) {
		const commands_path = `${command_folders_path}/${command_folder}`;
		const command_files =
			fs.readdirSync(commands_path).filter(
				file => file.endsWith('.js')
			);

		for (const file of command_files) {
			let command = await require(`${commands_path}/${file}`);

			console.log(command instanceof SlashCommand)
			if (command instanceof SlashCommand) {
				console.log("Found Slash Command");
				command = await command.getCommand();
			}

			if ("execute" in command) {
				if ("data" in command) {
					slash_commands.push(command.data.toJSON());
					global.client.commands.set(command.data.name, command);
				} else
					global.client.commands.set(command.name, command);

			}
			else {
				console.log(`[WARNING] The command ${file} is missing a required "execute" property.`);
			}
		}
	}
})();

// ! Deploy slash commands
{
	// Construct and prepare an instance of the REST module
	const rest = new REST().setToken(discord_token);

	(async () => {
		try {
			console.log(`Started refreshing ${slash_commands.length} application (/) commands.`);

			// The put method is used to fully refresh all commands in the guild with the current set
			const data = await rest.put(
				Routes.applicationGuildCommands(ids.client, ids.servers.sandbox),
				{ body: slash_commands },
			);

			console.log(`Successfully reloaded ${data.length} application (/) commands.`);

			// ! Delete Guild Command
			// rest.delete(Routes.applicationGuildCommand(ids.client, ids.servers.sandbox, 'COMMAND ID'))
			// .then(() => console.log('Successfully deleted guild command'))
			// .catch(console.error);

			// Delete Every Guild Command
			// rest.put(Routes.applicationGuildCommands(ids.client, ids.servers.sandbox), { body: [] })
			// .then(() => console.log('Successfully deleted all guild commands.'))
			// .catch(console.error);

			// ! Delete Global Commands
			// rest.delete(Routes.applicationCommand(ids.client, 'COMMAND ID'))
			// .then(() => console.log('Successfully deleted application command'))
			// .catch(console.error);

			// Delete Every Guild Command
			// rest.put(Routes.applicationCommands(ids.client), { body: [] })
			// .then(() => console.log('Successfully deleted all application commands.'))
			// .catch(console.error);

		} catch (error) {
			// And of course, make sure you catch and log any errors!
			console.error(error);
		}
	})();
}

// when the client is ready, run this code
// this event will only trigger one time after logging in
// ! Set up Brobot
global.client.once(Events.ClientReady, async () => {
	const
		Game = require("./modules/game.js"),
		Players = require("./modules/players.js"),
		LLPointManager = require("./modules/llpointmanager.js"),
		Sandbox = require("./modules/sandbox/Sandbox"),
		config = require('./utilities/config.json');

	config.isOn = true;
	console.log("I'm turned on");
	fs.writeFileSync("./utilities/config.json", JSON.stringify(config));

	global.Roles = require("./modules/roles");
	global.Game = new Game( new Players() );
	global.LLPointManager = new LLPointManager();
	console.log("RDM Modules Built");

	await global.LLPointManager.updateViewersFromDatabase();
	console.log("Viewers Updated From Database");

	global.Sandbox = new Sandbox({});
	console.log("Sandbox Modules Built");

	await global.Sandbox.loadGameDataFromDatabase();
	console.log("Sandbox Data Updated From Database");
	console.log("\nSANDBOX:");
	console.log(global.Sandbox.proposed_rules);

	global.client.user.setPresence({
		status: 'online',
		activity: {
			name: "LL Game Shows!",
			type: 'WATCHING',
			url: "https://www.youtube.com/LLGameShows"
		}
	});

	const { promisify } = require('util');
	const request = promisify(require("request"));
	const { github_token } =  require("./modules/token.js");

	const options = {
		url: DatabaseURLs.Messages,
		headers: {
			'Authorization': `Token ${github_token}`
		},
	};

	request(
		options,
		(error, response, body) => {
			if (!error && response.statusCode == 200) {
				let messages = JSON.parse(body);
				global.messages = messages;
			} else {
				console.error(error);
			}
		}
	)
	.catch(err => {
		console.error(err);
	});

	const sendmessage_cmd = require(`./commands/admin/sendmessage.js`);

	const daily_controversial_msg = new cron.CronJob(
		'00 30 14 */1 * *',
		() => {
			console.log("Controversial Message Sending...");
			sendmessage_cmd.execute(null, ["controversial_talk"]);
		},
		null,
		true,
		"America/Mexico_City"
	);

	const daily_philosophy_msg = new cron.CronJob(
		'00 00 10 */1 * *',
		() => {
			console.log("Philosophy Message Sending...");
			sendmessage_cmd.execute(null, ["philosophy"]);
		},
		null,
		true,
		"America/Mexico_City"
	);

	daily_philosophy_msg.start();
	daily_controversial_msg.start();

	console.log('Ready!');
});

// ! Executed for every message sent
global.client.on(Events.MessageCreate, async(msg) => {

	// Log DMs
	if (!msg.guild) {
		let brobot_server = global.client.guilds.cache.get(ids.servers.brobot_testing),
			dm_channel = brobot_server.channels.cache.get(ids.brobot_test_server.channels.dm_log),
			recipient_message;

		// From BroBot
		if (msg.author.id === ids.users.Brobot) {
			recipient_message = `<@${ids.users.Brobot}> ➜ <@${msg.channel.recipient.id}>\n\`Brobot ➜ ${msg.channel.recipient.username}\``;
		}
		// To Brobot
		else {
			recipient_message = `<@${msg.channel.recipient.id}> ➜ <@${ids.users.Brobot}>\n\`${msg.channel.recipient.username} ➜ Brobot\``;
		}

		dm_channel.send(
			`${recipient_message}\n` +
			`DM Channel ID: \`${msg.channel.id}\`\n` +
			`Message ID: \`${msg.id}\`\n` +
			`\n` +
			`\`\`\`${msg.content}\`\`\``
		)
	}

	// Stop if not command
	if (
		!msg.content.startsWith(prefix) ||
		msg.author.bot ||
		blocked_users.includes(msg.author.id)
	) return; // Stop

	// Get array of args seperated by space
	const args = msg.content.slice(prefix.length).trim().split(/ +/);
	const command_name = args.shift().toLowerCase();

	// Get command file from name/alias
	const command = global.client.commands.get(command_name)
		|| global.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command_name));

	// Stop if command doesn't exist
	if (!command || (command.isRestrictedToMe && msg.author.id != ids.users.LL)) return;

	console.log("\nMESSAGE CONTENTS:");
	console.log(msg.content); // Log command

	// Check if turned off
	const config = require("./utilities/config.json");
	if (
		!config.isOn &&
		command_name != 'togglestatus' &&
		msg.author.id != ids.users.LL
	) {
		return msg.channel.send(`Someone's messing with my code. Hold on a moment.`)
	}

	// Server only command?
	if ( (command.isServerOnly || command.required_servers) && msg.channel.type === 'dm' )
		return msg.channel.send('I can\'t do that in DMs!');

	// Has the requried permissions?
	/* https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS */
	if (command.required_permission) {
		const author_perms = msg.channel.permissionsFor(msg.author);

		if (!author_perms || !author_perms.has(command.required_permission)) {
			return msg.channel.send('You don\'t have a permission required to do this.');
		}
	}

	// In The Required Server?
	if (command.required_servers && !command.required_servers.includes(msg.guild.id))
		return msg.channel.send("This command doesn't work on this server.");

	// In The Required Channel?
	if (command.required_channels && !command.required_channels.includes(msg.channel.id))
		return msg.channel.send("This command doesn't work in this channel");

	// In The Requried Category?
	if (command.required_categories && !command.required_categories.includes(msg.channel.parent.id))
		return msg.channel.send("This command doesn't work in this channel category");

	// Has The Required Role(s)?
	let user_roles = msg.member.roles.cache.map(r => r.name);
	if (
		command.required_roles &&
		!command.required_roles.every( role => user_roles.includes(role) )
	) {
		return msg.channel.send('You don\'t have the role(s) required to do this.');
	}

	// Do they need arguments?
	if (command.args) {
		if (args.length == 0) {
			let message = `You need to provide arguments.`;

			if (command.usages) {
				for (let usage of command.usages) {
					message += `\nYou gotta do this: \`${prefix}${command.name} ${usage}\``;
				}
			}

			return msg.channel.send(message);
		}

		if (command.arg_count && args.length != command.arg_count) {
			let message = `You have to give ${command.arg_count} arguments.`;

			if (command.usages) {
				for (let usage of command.usages) {
					message += `\nYou gotta do this: \`${prefix}${command.name} ${usage}\``;
				}
			}

			return msg.channel.send(message);
		}
	}

	if (command.hasCommaArgs) {
		if (args.length == 0) {
			let message = `You need to provide arguments.`;

			if (command.usages) {
				for (let usage of command.usages) {
					message += `\nYou gotta do this: \`${prefix}${command.name} ${usage}\``;
				}
			}

			return msg.channel.send(message);
		}

		let comma_args = args.join(' ').split(', ');

		if (command.comma_arg_count && comma_args.length != command.comma_arg_count) {
			let message = `You have to give ${command.comma_arg_count} arguments.`;

			if (command.usages) {
				for (let usage of command.usages) {
					message += `\nYou gotta do this: \`${prefix}${command.name} ${usage}\``;
				}
			}

			return msg.channel.send(message);
		}
	}

	// Executing Command
	try {
		command.execute(msg, args);
	}
	catch (error) {
		console.error(error);
		msg.channel.send(`Uh oh! <@${ids.users.LL}> Something broke...`);
	}
});

// ! Executed for every slash command executed
global.client.on(Events.InteractionCreate, async (interaction) => {
	// Normal slash command
	if (interaction.isChatInputCommand()) {
		console.log("\nINTERACTION CONTENTS:");
		console.log(`/${interaction.commandName}`);

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		// Check if turned off in config
		const config = require("./utilities/config.json");
		if (
			!config.isOn &&
			interaction.commandName != 'togglestatus' &&
			interaction.author.id != ids.users.LL
		) {
			return interaction.reply({
				content: `\`I am currently turned off. Hold on a moment...\``,
				ephemeral: true
			})
		}

		// Server only command?
		if ( (command.isServerOnly || command.required_servers) && interaction.channel.type === 'dm' )
			return interaction.reply({
				content: `\`You aren't allowed to use this command in DMs.\``,
				ephemeral: true
			});

		// Has the requried permissions?
		/* https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS */
		if (command.required_permission) {
			const author_perms = interaction.channel.permissionsFor(interaction.author);

			if (!author_perms || !author_perms.has(command.required_permission)) {
				return interaction.reply({
					content: `\`You don't have the permissions required to use this command.\``,
					ephemeral: true
				});
			}
		}

		// In The Required Server?
		if (command.required_servers && !command.required_servers.includes(interaction.guild.id))
			return interaction.reply({
				content: `\`You aren't allowed to use this command in this server.\``,
				ephemeral: true
			});

		// In The Required Channel?
		if (command.required_channels && !command.required_channels.includes(interaction.channel.id))
			return interaction.reply({
				content: `\`You aren't allowed to use this command in this channel.\``,
				ephemeral: true
			});

		// In The Requried Category?
		if (command.required_categories && !command.required_categories.includes(interaction.channel.parent.id))
			return interaction.reply({
				content: `\`You aren't allowed to use this command in this channel category.\``,
				ephemeral: true
			});

		// Has The Required Role(s)?
		const user_roles = interaction.member.roles.cache.map(r => r.name);
		if (
			command.required_roles &&
			!command.required_roles.every( role => user_roles.includes(role) )
		) {
			return interaction.reply({
				content: `\`You don't have the roles required to use this command.\``,
				ephemeral: true
			});
		}

		// Check for cooldowns
		const { cooldowns } = client;
		if (!cooldowns.has(command.data.name)) {
			cooldowns.set(command.data.name, new Collection());
		}

		const now = Date.now();
		const timestamps = cooldowns.get(command.data.name);
		const default_cooldown_sec = 1;
		const cooldown_sec = (command.cooldown ?? default_cooldown_sec) * 1000;

		if (timestamps.has(interaction.user.id)) {
			const cooldown_expiration_time = timestamps.get(interaction.user.id) + cooldown_sec;

			if (now < cooldown_expiration_time) {
				const expired_timestamp = Math.round(cooldown_expiration_time / 1000);
				return interaction.reply({ content: `Please wait, you are on a cooldown for \`/${command.data.name}\`. You can use it again <t:${expired_timestamp}:R>.`, ephemeral: true });
			}
		}

		timestamps.set(interaction.user.id, now);
		setTimeout(() => timestamps.delete(interaction.user.id), cooldown_sec);

		// Execute command
		try {
			await command.execute(interaction);
		}
		catch (error) {
			console.error(error);

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: 'There was an error while executing this command!',
					ephemeral: true
				});
			}
			else {
				await interaction.reply({
					content: 'There was an error while executing this command!',
					ephemeral: true
				});
			}
		}
	}
	// Autocomplete Slash Command Reader
	else if (interaction.isAutocomplete()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			command.autocomplete(interaction);
		} catch (error) {
			console.error(error);
		}
	}
	// Button presses
	else if (interaction.type = Discord.InteractionType.MessageComponent) {
		if (interaction.customId.startsWith("Approve") || interaction.customId.startsWith("Disapprove")) {
			(async () => {

				const host = await global.Sandbox.getHostByID(interaction.user.id);

				console.log("Proposed Rule Clicked on by")
				console.log({host})

				if (host === undefined) {
					await interaction.reply({ content: `You are not allowed to vote on proposed rules if you're not a host!`, components: [], ephemeral: true });
					return
				}

				let proposed_rule;

				if (interaction.customId.startsWith('Approve')) {
					const proposed_rule_num = parseInt(interaction.customId.replace("Approve", ""));
					console.log({proposed_rule_num});
					proposed_rule = await global.Sandbox.getProposedRuleFromNum(proposed_rule_num);
					console.log({proposed_rule});
					await interaction.reply({ content: `👍 You voted to approve proposal \`#${proposed_rule.number}\``, components: [], ephemeral: true });
				}
				else {
					const proposed_rule_num = parseInt(interaction.customId.replace("Disapprove", ""));
					console.log({proposed_rule_num});
					proposed_rule = await global.Sandbox.getProposedRuleFromNum(proposed_rule_num);
					console.log({proposed_rule});
					await interaction.reply({ content: `👎 You voted to disapprove proposal \`#${proposed_rule.number}\``, components: [], ephemeral: true });
				}

				proposed_rule.message = interaction.message.id;
				proposed_rule.addVote(interaction.customId.startsWith('Approve'), host.id);
			})();
		}
	}

});

// User Join Server
client.on(Events.GuildMemberAdd, async (guild_member) => {
	if (guild_member.guild.id === ids.servers.sandbox) {
		const sandbox_guild = await getGuild(ids.servers.sandbox);
		const outsiders_role = await getRole(sandbox_guild, "Outsider");
		await addRole(guild_member, outsiders_role);
	}
});





// login to Discord with your app's token
global.client.login(discord_token);