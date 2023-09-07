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
const Vote = require('./modules/sandbox/Vote.js');
const Sandbox = require('./modules/sandbox/sandbox');
global.paths = paths;

// ! Store a list of command cooldowns
client.cooldowns = new Collection();


// ! Store commands to client
global.client.commands = new Discord.Collection();
global.client.slash_commands = new Discord.Collection();

const public_slash_commands = [];
const private_slash_commands = {};
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

			if (command instanceof SlashCommand) {
				console.log(`Slash command ${file} found.`)
				command = await command.getCommand();
			}

			if ("execute" in command) {
				if ("data" in command) {
					if (command.required_servers) {
						for (const required_server of command.required_servers) {
							if (!private_slash_commands[required_server])
								private_slash_commands[required_server] = [command.data.toJSON()];
							else
								private_slash_commands[required_server].push(command.data.toJSON());
						}
					}
					else {
						public_slash_commands.push(command.data.toJSON());
					}
					global.client.commands.set(command.data.name, command);
				} else
					global.client.commands.set(command.name, command);
			}
			else {
				console.log(`[WARNING] The command ${file} is missing a required "execute" property.`);
			}
		}
	}

	// ! Deploy slash commands
	// Construct and prepare an instance of the REST module
	const rest = new REST().setToken(discord_token);

	try {
		console.log(`Started refreshing application (/) commands.`);

		console.log(public_slash_commands.map(command => command.name));
		Object.values(private_slash_commands).forEach(commands => {
			console.log(commands.map(cmd => cmd.name))
		})

		// The put method is used to fully refresh all commands in the guild with the current set
		for (const required_server_id in private_slash_commands) {
			const slash_commands = private_slash_commands[required_server_id];

			await rest.put(
				Routes.applicationGuildCommands(ids.client, required_server_id),
				{ body: slash_commands },
			);
		}
		await rest.put(
			Routes.applicationCommands(ids.client),
			{ body: public_slash_commands },
		);


		console.log(`Successfully reloaded some application (/) commands.`);

		// ! Delete Guild Command
		// rest.delete(Routes.applicationGuildCommand(ids.client, ids.servers.rapid_discord_mafia, "1146264673470136350"))
		// .then(() => console.log('Successfully deleted guild command'))
		// .catch(console.error);

		// ! Delete Every Guild Command
		// rest.put(Routes.applicationGuildCommands(ids.client, ids.servers.rapid_discord_mafia), { body: [] })
		// .then(() => console.log('Successfully deleted all guild commands.'))
		// .catch(console.error);

		// ! Delete Global Commands
		// rest.delete(Routes.applicationCommand(ids.client, 'COMMAND ID'))
		// .then(() => console.log('Successfully deleted application command'))
		// .catch(console.error);

		//! Delete Every Guild Command
		// rest.put(Routes.applicationCommands(ids.client), { body: [] })
		// .then(() => console.log('Successfully deleted all application commands.'))
		// .catch(console.error);

	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

// when the client is ready, run this code
// this event will only trigger one time after logging in
// ! Set up Brobot
global.client.once(Events.ClientReady, async () => {
	const
		Game = require("./modules/rapid_discord_mafia/game.js"),
		Players = require("./modules/rapid_discord_mafia/players.js"),
		LLPointManager = require("./modules/llpointmanager.js"),
		Sandbox = require("./modules/sandbox/sandbox"),
		config = require('./utilities/config.json');

	config.isOn = true;
	console.log("I'm turned on");
	fs.writeFileSync("./utilities/config.json", JSON.stringify(config));

	global.Roles = require("./modules/rapid_discord_mafia/roles");
	global.Game = new Game( new Players() );
	global.LLPointManager = new LLPointManager();
	console.log("RDM Modules Built");

	await global.LLPointManager.updateViewersFromDatabase();
	console.log("Viewers Updated From Database");

	global.Sandbox = new Sandbox({});
	console.log("Sandbox Modules Built");

	await global.Sandbox.loadGameDataFromDatabase();
	console.log("Sandbox Data Updated From Database");

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
		'00 00 11 */1 * *',
		() => {
			console.log("Philosophy Message Sending...");
			sendmessage_cmd.execute(null, ["philosophy"]);
		},
		null,
		true,
		"America/New_York"
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
		if (command.required_channels && !command.required_channels.includes(interaction.channel.id)) {
			console.log({command});
			console.log(interaction.channel.id);
			return interaction.reply({
				content: `\`You aren't allowed to use this command in this channel.\``,
				ephemeral: true
			});
		}

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
		if (Object.values(Vote.Votes).some(vote => interaction.customId.startsWith(vote))) {
			(async () => {

				if (global.Sandbox.phase === Sandbox.Phases.Proposing) {
					return await interaction.reply({ content: `Sorry, we're in the proposing phase. You can't vote.`, components: [], ephemeral: true });
				}

				const host = await global.Sandbox.getHostByID(interaction.user.id);

				console.log("Proposed Rule Clicked on by")
				console.log({host})
				console.log("Clicked on: ");
				console.log(interaction.customId);

				if (host === undefined) {
					await interaction.reply({ content: `You are not allowed to vote on proposed rules if you're not a host!`, components: [], ephemeral: true });
					return
				}

				let proposed_rule;
				let vote;

				if (interaction.customId.startsWith(Vote.Votes.Approve)) {
					vote = Vote.Votes.Approve
				}
				else if (interaction.customId.startsWith(Vote.Votes.Disapprove)) {
					vote = Vote.Votes.Disapprove
				}
				else if (interaction.customId.startsWith(Vote.Votes.NoOpinion)) {
					vote = Vote.Votes.NoOpinion
				}

				if (vote === Vote.Votes.Approve) {
					const proposed_rule_num = parseInt(interaction.customId.replace(Vote.Votes.Approve, ""));
					console.log({proposed_rule_num});

					proposed_rule = await global.Sandbox.getProposedRuleFromNum(proposed_rule_num);
					console.log({proposed_rule});

					if (!proposed_rule) {
						return await interaction.reply({ content: `Something went wrong...`, components: [], ephemeral: true });
					};

					await interaction.reply({ content: `👍 You voted to approve proposal \`#${proposed_rule.number}\``, components: [], ephemeral: true });
				}
				else if (vote === Vote.Votes.Disapprove) {
					const proposed_rule_num = parseInt(interaction.customId.replace(Vote.Votes.Disapprove, ""));
					console.log({proposed_rule_num});

					proposed_rule = await global.Sandbox.getProposedRuleFromNum(proposed_rule_num);
					console.log({proposed_rule});


					if (!proposed_rule) {
						return await interaction.reply({ content: `Something went wrong...`, components: [], ephemeral: true });
					};

					await interaction.reply({ content: `👎 You voted to disapprove proposal \`#${proposed_rule.number}\``, components: [], ephemeral: true });
				}
				else  if (vote === Vote.Votes.NoOpinion) {
					const proposed_rule_num = parseInt(interaction.customId.replace(Vote.Votes.NoOpinion, ""));
					console.log({proposed_rule_num});

					proposed_rule = await global.Sandbox.getProposedRuleFromNum(proposed_rule_num);
					console.log({proposed_rule});


					if (!proposed_rule) {
						return await interaction.reply({ content: `Something went wrong...`, components: [], ephemeral: true });
					};

					await interaction.reply({ content: `You voted no opinion on proposal \`#${proposed_rule.number}\``, components: [], ephemeral: true });
				}

				proposed_rule.message = interaction.message.id;
				proposed_rule.addVote(vote, host.id);
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