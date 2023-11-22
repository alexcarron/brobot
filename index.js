const { Player } = require('discord-player');
const ProposedRule = require('./modules/gameforge/ProposedRule.js');
const Host = require('./modules/gameforge/host.js');
const GameForge = require('./modules/gameforge/GameForge');
const RapidDiscordMafia = require('./modules/rapid_discord_mafia/RapidDiscordMafia.js');
{console.log(`discord.js version: ${require('discord.js').version}`);

const
	{ DatabaseURLs, XPRewards, XPTaskKeys, GameForgePhases, RDMRoles } = require("./modules/enums.js"),
	ids = require('./databases/ids.json'),
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

// ! Create global paths object to store directories
const paths = require("./utilities/path.js");
const { addRole, getRole, getGuild, getChannel, getObjectFromGitHubJSON, saveObjectToGitHubJSON } = require('./modules/functions.js');
const { Collection } = require('discord.js');
const SlashCommand = require('./modules/commands/SlashCommand.js');
const Vote = require('./modules/gameforge/Vote.js');
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
				console.log(`Slash command ${file} found.`);
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

			console.log("Reloading " + slash_commands.length + " private slash commands...");

			await rest.put(
				Routes.applicationGuildCommands(ids.client, required_server_id),
				{ body: slash_commands },
			);

			console.log("Reloaded");
		}
		console.log("Reloading " + public_slash_commands.length + " public slash commands...");
		await rest.put(
			Routes.applicationCommands(ids.client),
			{ body: public_slash_commands },
		);
		console.log("Reloaded");


		console.log(`Successfully reloaded application (/) commands.`);

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

		//! Delete Every Global Command
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
		config = require('./utilities/config.json');

	global.music_queues = new Map();
	global.client.player = new Player(global.client, {
		ytdlOptions: {
			quality: "highestaudio",
			highWaterMark: 1 << 25
		}
	});

	config.isOn = true;
	console.log("I'm turned on");
	fs.writeFileSync("./utilities/config.json", JSON.stringify(config));

	global.Roles = require("./modules/rapid_discord_mafia/roles");
	global.Game = new Game( new Players() );
	global.LLPointManager = new LLPointManager();
	global.rapid_discord_mafia = new RapidDiscordMafia();
	const rapid_discord_mafia_obj = await getObjectFromGitHubJSON("rapid_discord_mafia");
	global.rapid_discord_mafia.setTo(rapid_discord_mafia_obj);
	console.log("RDM Modules Built");


	await global.LLPointManager.updateViewersFromDatabase();
	console.log("Viewers Updated From Database");

	global.GameForge = new GameForge({});
	console.log("GameForge Modules Built");

	await global.GameForge.loadGameDataFromDatabase();
	console.log("GameForge Data Updated From Database");

	global.client.user.setPresence({
		status: 'online',
		activity: {
			name: "LL Game Shows!",
			type: 'WATCHING',
			url: "https://www.youtube.com/LLGameShows"
		}
	});

	// Get messages.json
	global.participants = [
		"LL",
	];
	global.questions = [
		"Do you fart?",
		"Why are you a furry?",
		"What wish do you make on the monkeys paw?",
		"What's you favorite animal?",
		"What tank would you want to have as your mobile home?",
		"What, in your opinion, makes a life worthwhile? What makes it something, in a hypothetical afterlife, that you can look back to and think 'yeah, that was a pretty good life'? Is it simple happiness? Doing good for others? A good childhood or, on the opposite, successfully recovering from a bad one? Accomplishing your life goal, even at a cost you may come to regret?",
		"What is the inspiration behind the profile picture you're currently using right now?",
		"If a cave has a cave-in, is it still called a cave?",
		"Do you are is are um do gay?",
		"Do you have callused feet?",
		"Have you ever woken up at 8 am but since your parents were asleep you had nobody to ask and tried to open the shutters on your own and accidentally broke them, causing the rain outside to drip inside and straight on your parents' computer, but because you were 7 you didn't get why water+computer=bad and got mad at the fact that it wasn't working and started calling your parents for help only to get punished?",
		"Can you describe the last dream that you had? How many details of it do you still remember?",
		"When was the last time you saw Ronald McDonald in a commercial?",
		"Can you name every song here? (If the answer is no, no LL Point for you 🥰) https://cdn.discordapp.com/attachments/1161477028441239562/1162527149115326496/53B04D6E-E756-4F6D-BCC2-08ADABD14AC6.mov?ex=653c42c7&is=6529cdc7&hm=81cf2284b2b432354c99d596a3ab328671559f031cfd041dabde9fe5d2908cd7&",
		"Who is your least favorite person out of the people participanting in this event?",
		"What is the daily routine of hte participant after you alphabetically?",
	]
	const { promisify } = require('util');
	const request = promisify(require("request"));
	const { github_token } =  require("./modules/token.js");
	const ll_game_show_center_guild = await getGuild(ids.servers.LLGameShowCenter);

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
				console.log(body);
				console.error(error);
			}
		}
	)
	.catch(err => {
		console.error(err);
	});



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

	const daily_controversial_msg = new cron.CronJob(
		'00 30 14 */1 * *',
		() => {
			console.log("Controversial Message Sending...");
			const
				controversial_channel = ll_game_show_center_guild.channels.cache.get(ids.ll_game_shows.channels.controversial),
				controversial_question_index = Math.floor( Math.random() * global.messages.controversial_talk.length ),
				controversial_question = global.messages.controversial_talk[controversial_question_index];

			if (controversial_question) {
				controversial_channel.send( controversial_question );

				global.messages.controversial_talk.splice(controversial_question_index, 1);
				updateMessagesDatabase();
			}
			else {
				controversial_channel.send(`<@${ids.users.LL}> WARNING: We have run out of controversial questions! Blow up the server!`);
			}

		},
		null,
		true,
		"America/Mexico_City"
	);

	const daily_philosophy_msg = new cron.CronJob(
		'00 00 11 */1 * *',
		() => {
			console.log("Philosophy Message Sending...");
			const
				philosophy_channel = ll_game_show_center_guild.channels.cache.get(ids.ll_game_shows.channels.philosophy),
				philosophy_question_index = Math.floor( Math.random() * global.messages.philosophy.length ),
				philosophy_question = global.messages.philosophy[philosophy_question_index];

			try {
				philosophy_channel.send( philosophy_question );
			}
			catch {
				return philosophy_channel.send(`<@${ids.users.LL}> WARNING: We have run out of philosophy questions! Blow up the server!`);
			}

			global.messages.philosophy.splice(philosophy_question_index, 1);
			updateMessagesDatabase();
		},
		null,
		true,
		"America/New_York"
	);

	console.log("STARTING CRON JOBS")
	daily_philosophy_msg.start();
	daily_controversial_msg.start();

	console.log('Ready!');
});

// @ TODO Replace all user.send with this
global.dm = async function(user, message_contents) {
	await user.send(message_contents);

	// const brobot_server = await getGuild(ids.servers.brobot_testing);
	// const dm_log_chnl = await getChannel(brobot_server, ids.brobot_test_server.channels.dm_log);
	// let message_log =
	// 	`<@${ids.users.Brobot}> ➜ <@${user.id}>\n\`Brobot ➜ ${user.username}\`\n` +
	// 	`DM Channel ID: \`${message_dmed.channel.id}\`\n` +
	// 	`Message ID: \`${message_dmed.id}\`\n` +
	// 	`\n` +
	// 	`\`\`\`${message_contents}\`\`\``;

	// await dm_log_chnl.send(message_log);
}

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

	if (
		msg &&
		msg.guild &&
		msg.guild.id === ids.servers.gameforge &&
		msg.channel.type === Discord.ChannelType.PublicThread
	) {
		try {
			const proposed_rule_chnl = await ProposedRule.getProposedRuleChannel();
			const active_threads = await proposed_rule_chnl.threads.fetchActive()

			if (active_threads.threads.some(thread => thread.id === msg.channel.id)) {
				console.log(msg.channel.name);
				const host = await global.GameForge.getHostByID(msg.author.id);
				if (host && host instanceof Host) {
					host.rewardXPFor(XPTaskKeys.Discuss);
				}
			}
		}
		catch (error) {
			console.error(error);
		}
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
		!config.isSleep &&
		command_name != 'togglestatus' &&
		msg.author.id != ids.users.LL
	) {
		return msg.channel.send(`Someone's messing with my code. Hold on a moment.`)
	}

	if (command instanceof SlashCommand) {
		return msg.channel.send(`This is now a slash command.`)
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
	const user_role_names = interaction.member.roles.cache.map(r => r.name);
	const user_role_ids = interaction.member.roles.cache.map(r => r.id);
	if (
		command.required_roles &&
		!command.required_roles.every( role => user_role_names.includes(role) || user_role_ids.includes(role) )
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
			!config.isSleep &&
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

		if (command.required_roles) {
			// Has The Required Role(s)?
			const user_role_names = interaction.member.roles.cache.map(r => r.name);
			const user_role_ids = interaction.member.roles.cache.map(r => r.id);

			if (
				!command.required_roles.every( role => user_role_names.includes(role) || user_role_ids.includes(role) )
			) {
				return interaction.reply({
					content: `\`You don't have the roles required to use this command.\``,
					ephemeral: true
				});
			}
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

			const author_perms = interaction.channel.permissionsFor(interaction.user);

			if (now < cooldown_expiration_time && (!author_perms || !author_perms.has(Discord.PermissionFlagsBits.Administrator))) {
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
			console.log("There was an error while running that command")
			console.error(error);

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: 'There was an error while executing this command! Quick, tell LL!',
					ephemeral: true
				});
			}
			else {
				await interaction.channel.send({
					content: 'There was an error while executing this command! Quick, tell LL!',
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

				if (global.GameForge.phase === GameForgePhases.Proposing) {
					return await interaction.reply({ content: `Sorry, we're in the proposing phase. You can't vote.`, components: [], ephemeral: true });
				}

				const host = await global.GameForge.getHostByID(interaction.user.id);

				console.log("Proposed Rule Clicked on by")
				console.log((host && host.name) ?? "undefined")
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

					proposed_rule = await global.GameForge.getProposedRuleFromNum(proposed_rule_num);
					console.log({proposed_rule});

					if (!proposed_rule) {
						return await interaction.reply({ content: `Something went wrong...`, components: [], ephemeral: true });
					};
				}
				else if (vote === Vote.Votes.Disapprove) {
					const proposed_rule_num = parseInt(interaction.customId.replace(Vote.Votes.Disapprove, ""));
					console.log({proposed_rule_num});

					proposed_rule = await global.GameForge.getProposedRuleFromNum(proposed_rule_num);
					console.log({proposed_rule});


					if (!proposed_rule) {
						return await interaction.reply({ content: `Something went wrong...`, components: [], ephemeral: true });
					};
				}
				else if (vote === Vote.Votes.NoOpinion) {
					const proposed_rule_num = parseInt(interaction.customId.replace(Vote.Votes.NoOpinion, ""));
					console.log({proposed_rule_num});

					proposed_rule = await global.GameForge.getProposedRuleFromNum(proposed_rule_num);
					console.log({proposed_rule});


					if (!proposed_rule) {
						return await interaction.reply({ content: `Something went wrong...`, components: [], ephemeral: true });
					};
				}

				proposed_rule.message = interaction.message.id;
				proposed_rule.addVote(vote, host.id, interaction);
			})();
		}
	}

});

// ! Executed when a user joins the server
client.on(Events.GuildMemberAdd, async (guild_member) => {
	if (guild_member.guild.id === ids.servers.gameforge) {
		const gameforge_guild = await getGuild(ids.servers.gameforge);
		const outsiders_role = await getRole(gameforge_guild, "Outsider");
		await addRole(guild_member, outsiders_role);
	}
	else if (guild_member.guild.id === ids.servers.rapid_discord_mafia) {
		const rdm_guild = await getGuild(ids.servers.rapid_discord_mafia);
		const spectator_role = await getRole(rdm_guild, RDMRoles.Spectator);
		await addRole(guild_member, spectator_role);
	}
	else if (guild_member.guild.id === ids.servers.LLGameShowCenter) {
		const rdm_guild = await getGuild(ids.servers.LLGameShowCenter);
		const viewer_role = await getRole(rdm_guild, ids.ll_game_shows.roles.viewer);
		await addRole(guild_member, viewer_role);
	}
});





// login to Discord with your app's token
global.client.login(discord_token);}