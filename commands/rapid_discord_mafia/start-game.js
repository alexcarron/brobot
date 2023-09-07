const Parameter = require("../../modules/commands/Paramater");
const SlashCommand = require("../../modules/commands/SlashCommand");

/* eslint-disable no-unused-vars */
const
	{ PermissionFlagsBits } = require("discord.js"),
	{ faction_names, max_ratios, wait_times } = require("../../databases/rapid_discord_mafia/constants"),
	{ Phases, GameStates, Subphases, Factions, AbilityUses } = require("../../modules/enums"),
	{
		getChannel,
		shuffleArray,
		getRandArrayItem,
		getGuildMember,
		getCategoryChildren,
		getRole,
		logColor,
		wait,
		getUnixTimestamp
	} = require("../../modules/functions"),
	{
		town_discussion_channel_id: day_chat_chnl_id,
		living_role_id,
		pre_game_category_id,
		channels: channel_ids
	} = require("../../databases/ids.json").rapid_discord_mafia,
	rdm_ids = require("../../databases/ids.json").rapid_discord_mafia,
	ids = require("../../databases/ids.json");


const command = new SlashCommand({
	name: "start-game",
	description: "Start an RDM game. Required: Players in players.json, player text channels",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_permissions = [PermissionFlagsBits.Administrator];
command.parameters = [
	new Parameter({
		type: "string",
		name: "role-identifiers",
		description: "A comma-seperated list of the role identifiers that will be in this game's role list",
	})
];
command.execute = async function execute(interaction, role_indentifiers_str) {
	console.log(interaction);
	if (interaction) {
		try {
			await interaction.reply({content: "Starting Game...", ephemeral: true});
		}
		catch {
			console.log("Failed Defer: Reply Already Exists");
			await interaction.editReply({ content: "Sending Command...", ephemeral: true});
		}
	}

	const staff_chnl = await global.Game.getStaffChnl();

	const announceLivingPlayers = async function(announce_chnl) {
		let alive_player_name_msgs =
			global.Game.Players.getAlivePlayerNames()
				.map(name => `\`${name}\`\n`);

		let alive_players_msg =
			`\`\`\`Living Players\`\`\`\n` +
			alive_player_name_msgs.join("") +
			`_ _`;

		announce_chnl.send(alive_players_msg);

		await wait(...wait_times["message_delay"]);
	}
	const announceRoleList = async function(announce_chnl) {
		let role_list = original_role_identifiers;
		let role_list_chnl = await getChannel((await global.Game.getGuild()), channel_ids.role_list);

		let role_list_txt =
			`\`\`\`Role List\`\`\`\n` +
			role_list.map(r => `**${r}**\n`).join("") +
			`_ _`;

		await interaction.channel.messages
			.fetchPinned()
			.then((pinned_msgs) => {
				pinned_msgs.each((msg) => msg.unpin().catch(console.error));
			})
			.catch(console.error);

		await role_list_chnl.messages
			.fetchPinned()
			.then((pinned_msgs) => {
				pinned_msgs.each((msg) => msg.edit(role_list_txt).catch(console.error));
			})
			.catch(console.error);

		const role_list_msg = await announce_chnl.send(role_list_txt);
		role_list_msg.pin();

		await wait(...wait_times["message_delay"]);
	}
	const openDayChat = async function() {
		let living_role = await getRole((await global.Game.getGuild()), "Living"),
			day_chat_chnl = await getChannel((await global.Game.getGuild()), day_chat_chnl_id),
			game_announce_chnl = await getChannel((await global.Game.getGuild()), channel_ids.game_announce);

		game_announce_chnl.send(
			`You may now discuss in <#${day_chat_chnl_id}>\n` +
			`_ _`
		);

		await day_chat_chnl.permissionOverwrites.create(living_role, { SendMessages: true })
		console.log("Opened Day Chat");
	}
	const areArgsValid = function(role_indetifiers) {
		role_indetifiers = role_indetifiers.split(', ');
		let player_count = global.Game.Players.getPlayerCount();

		// Check if players exist
		if (player_count <= 0) {
			interaction.editReply(`There's no players. Try running \`<startsignups\``);
			return false;
		}
		// Check if player count equal role amount
		else if (player_count != role_indetifiers.length) {
			interaction.editReply(`You included ${role_indetifiers.length} roles, but there's ${player_count} players.`)
			return false;
		}

		return true;
	}
	const shuffleRoleList = function() {
		global.Game.role_list = shuffleArray(global.Game.role_list);

		logColor("\nShuffled Role List", "cyan");
		console.log(global.Game.role_identifiers.join("\n"));
	}
	const createRoleList = async function() {
		const isRoleInMissingFaction = function(role) {
			return missing_factions.some((missing_faction) => {
				return global.Game.isRoleInFaction(role, missing_faction);
			});
		}
		const isIdentifierInMissingFaction = function(identifier) {
			return missing_factions.some((missing_faction) => {
				if (identifier.faction == "Any")
					return true;
				else if (faction_names.includes(missing_faction))
					return identifier.faction === missing_faction;
				else
					return identifier.faction === "Neutral" && ["Killing", "Random"].includes(identifier.alignment);
			});
		}

		let faction_counts = {},
			existing_factions = [],
			missing_factions = global.Game.possible_factions;

		const getRandomRoleFromIdentifier = function(identifier, curr_role_list=[]) {
			let possible_role_names,
				chosen_role,
				needOpposingFactions = existing_factions.length <= 1;

			console.log(`Getting Random Role From:`);
			console.log({identifier});
			console.log({curr_role_list, existing_factions, missing_factions, faction_counts, needOpposingFactions});

			// Filter the list of all roles to only include those that meet the specified criteria
			console.log("Going Through Possible Roles.")
			let possible_roles = Object.values(global.Roles).filter( (role_checking) => {

				// If Random Faction Identifier
				if (identifier.faction != "Any") {
					if (
						identifier.alignment == "Random" &&
						(role_checking.faction != identifier.faction || role_checking.alignment == "Crowd")
					) {
						return false
					}
					// If Specified Alignment Identifier
					else if (
						identifier.alignment != "Random" &&
						(role_checking.faction != identifier.faction || role_checking.alignment != identifier.alignment)
					) {
						return false
					}
				}
				// Don't go over max ratios
				else {
					if (
						faction_counts["Mafia"] != null &&
						faction_counts["Town"] != null
					) {
						if (
							(role_checking.faction == "Mafia") &&
							((faction_counts["Mafia"] + 1) / faction_counts["Town"] >= max_ratios["mafia_town"])
						) {
							return false;
						}

						if (
							(role_checking.faction == "Town") &&
							(faction_counts["Town"] + 1) / faction_counts["Mafia"] >= max_ratios["town_mafia"]
						) {
							return false;
						}
					}
				}


				// If there's no Mafioso in the role list, do not include a non-mafioso mafia role in the role list
				if (
					!curr_role_list.includes("Mafioso") &&
					role_checking.faction === "Mafia" &&
					role_checking.name !== "Mafioso"
				) {
					return false
				}

				// Exclude unique roles that have already been chosen or are reserved for future use
				if (
					role_checking.isUnique &&
					(curr_role_list.includes(role_checking.name) ||
					global.Game.role_identifiers.includes(role_checking.name))
				) {
					return false;
				}

				if (needOpposingFactions && isIdentifierInMissingFaction(identifier)) {
					return isRoleInMissingFaction(role_checking);
				}
				else {
					return true
				}
			});

			// Randomize Role
			possible_role_names = possible_roles.map(r => r.name);
			chosen_role = getRandArrayItem(possible_roles);
			console.log({possible_role_names, chosen_role});

			// Add faction to list of existing factions
			global.Game.possible_factions.forEach( (faction) => {
				if (global.Game.isRoleInFaction(chosen_role, faction) && !existing_factions.includes(faction)) {
					existing_factions.push(faction);

					console.log({missing_factions});

					missing_factions = missing_factions.filter(missing_faction => missing_faction !== faction);
				}
			});

			if (chosen_role.faction !== "Neutral") {
				if (faction_counts[chosen_role.faction] == null)
					faction_counts[chosen_role.faction] = 0;

				faction_counts[chosen_role.faction] += 1;
			}
			else if (chosen_role.alignment == "Killing") {
				if (faction_counts[chosen_role.name] == null)
					faction_counts[chosen_role.name] = 0;

				faction_counts[chosen_role.name] += 1;
			}

			return chosen_role.name;
		}
		const getRoleNameFromIdentifier = async function(role_identifier) {
			let [faction, alignment] = role_identifier.split(" "),
				identifier = {
					"faction": faction,
					"alignment": alignment,
				},
				role_names = Object.values(global.Roles).map(role => role.name),
				role_name;

			if (identifier.faction == "Random") {
				identifier = {
					"faction": alignment,
					"alignment": faction,
				}
			}
			else if (identifier.faction == "Any") {
				identifier.alignment = "Random";
			}
			console.log(identifier);

			if (role_names.includes(role_identifier)) {
				role_name = role_identifier;
			}
			else if (faction_names.includes(identifier.faction) || identifier.faction == "Any") {
				role_name = getRandomRoleFromIdentifier(identifier, global.Game.role_list);
			}
			else {
				console.log(`${role_identifier} is not a valid role identifier.`);
				await interaction.editReply(`${role_identifier} is not a valid role identifier.`);
				return;
			}

			console.log(`${role_identifier}: ${role_name}`);
			return role_name;
		}
		const getIdentifierType = function(role_identifier) {
			let role_names = Object.values(global.Roles).map(role => role.name);

			console.log(`Finding Indentifier Type for ${role_identifier}`)

			if (role_names.includes(role_identifier)) {
				return "role"
			}

			let [faction, alignment] = role_identifier.split(" ");

			if (faction == "Random")
				[faction, alignment] = [alignment, faction];

			if (faction_names.includes(faction)) {
				if (alignment == "Random")
					return "faction"
				else
					return "faction alignment"
			}
			else if ( faction == "Any" ) {
				return "any"
			}
			else {
				console.log(`${role_identifier} is not a valid role identifier. getIdentfierType()`);
				interaction.editReply(`${role_identifier} is not a valid role identifier.`);
				return null;
			}
		}
		const sortRoleIdentifiers = function(role_identifiers) {
			return role_identifiers.sort(
				(role_identifier1, role_identifier2) => {
					let indentifiers = [
						{name: role_identifier1},
						{name: role_identifier2}
					];

					indentifiers = indentifiers.map(
						( { name } ) => {
							const
								priorities = {
									"role": 1,
									"faction": 2,
									"faction alignment": 3,
									"any": 4
								},
								type = getIdentifierType(name),
								priority = priorities[type];

							console.log(`Type found: ${type}\n`);

							return { name, type, priority };
						}
					);

					return indentifiers[0].priority - indentifiers[1].priority;
				}
			)
		}

		const sorted_role_identifiers = sortRoleIdentifiers([ ...global.Game.role_identifiers]);
		console.log({sorted_role_identifiers});

		for (let role_identifier of sorted_role_identifiers) {
			let role_name = await getRoleNameFromIdentifier(role_identifier);
			await global.Game.role_list.push(role_name);
		}
	}
	const assignRolesToPlayers = async function() {
		const createAbilityMsg = function(ability) {
			let ability_msg = "",
				use_count_msg = "",
				ability_arg_names = ability.args ? ability.args.map(arg => `, ${arg.name.toUpperCase()}`) : [], // Optional
				command_example_msg = `\`<do ${ability.name}${ability_arg_names.join("")}\` ${ability_arg_names.length > 0 ? "(Don't forget the commas)" : ""}`;

			// Set ability use count text
			switch (true) {
				case ability.uses == AbilityUses.Unlimited:
					use_count_msg = `Unlimited Uses`;
					break;

				case ability.uses == AbilityUses.None:
					command_example_msg = ""
					use_count_msg = "Can't be used voluntarily";
					break;

				case ability.uses == AbilityUses.Amount(1):
					use_count_msg = "1 Use";
					break;

				case ability.uses > 1:
					use_count_msg = `${ability.uses} Uses`;
					break;
			}

			ability_msg =
				`**${ability.name.toUpperCase()}** - \`${use_count_msg}\`` + "\n" +
				command_example_msg + "\n" +
				ability.description + "\n" +
				`\n`;

			return ability_msg;
		}
		const createRoleInfoMsg = function(role) {
			let role_info_msg = "",
				abilities_msg = "", // Optional
				special_notes_msg = role.notes ? `\n__Notes__\n${role.notes}\n` : ""; // Optional

			// Create abilities message
			if (role.abilities) {
				abilities_msg = `\n__Abilities__\n`;

				// Build ability message
				for (let ability of role.abilities) {
					console.log({ability});
					abilities_msg += createAbilityMsg(ability);
				}
			}

			// Create message
			role_info_msg  =
				`Your role is **${role.name}**\n` +
				`\n` +
				`**Alignment**: ${role.faction} ${role.alignment}\n` +
				`**Attack Level**: ${role.attack}\n` +
				`**Defense Level**: ${role.defense}\n` +
				abilities_msg +
				special_notes_msg +
				`\n` +
				`**Goal**: ${role.goal}`;

			return role_info_msg;
		}
		const giveAccessToMafiaChat = async function(player) {
			let mafia_channel = await getChannel((await global.Game.getGuild()), channel_ids.mafia_chat),
				player_guild_member = await getGuildMember((await global.Game.getGuild()), player.id);

			mafia_channel.permissionOverwrites.edit(player_guild_member.user, {ViewChannel: true});

			mafia_channel.send(`**${player.name}** - ${player.role}`);

			console.log(`Let **${player.name}** see mafia chat.`);
		}

		logColor("\nAssigning Roles To Players", "cyan");
		for (let [role_index, role_name] of global.Game.role_list.entries()) {

			// Get Role Name From Identifier
			let role = global.Roles[role_name],
				player = global.Game.Players.getPlayerList()[role_index],
				player_name =  global.Game.Players.getPlayerNames()[role_index],
				player_channel = await getChannel((await global.Game.getGuild()), player.channel_id);

			// Add role to player object
			global.Game.Players.get(player_name).setRole(role.name);

			// Send & Pin Role Info Message
			console.log({role});
			let role_info_msg  = createRoleInfoMsg(role);
			await player_channel.send(role_info_msg).then( msg => msg.pin() );
			console.log(`Sent role info message, ${role.name}, to ${player_name}.`);
			await staff_chnl.send(`**${player_name}**: ${role.name} (*${role_name}*)`)

			if (role.faction == "Mafia") {
				await giveAccessToMafiaChat(global.Game.Players.get(player_name));
			}
		}




	}
	const giveExesTargets = async function() {
		let executioners = global.Game.Players.getExecutioners();

		for (let executioner of executioners) {
			let town_player_names =
				global.Game.Players.getTownspeople()
					.map(player => player.name)

			let random_town_name = shuffleArray(town_player_names)[0];
			global.Game.Players.get(executioner.name).exe_target = random_town_name;

			let exe_chnl = await getChannel((await global.Game.getGuild()), global.Game.Players.get(executioner.name).channel_id);
			exe_chnl.send(`<@${global.Game.Players.get(executioner.name).id}> Your target is **${random_town_name}**. Make sure they are lynched by any means necessary.`)
		}



	}
	const closePreGameChats = async function() {
		let living_role = await getRole((await global.Game.getGuild()), "Living"),
			ghosts_role = await getRole((await global.Game.getGuild()), "Ghosts"),
			pre_game_channels = await getCategoryChildren((await global.Game.getGuild()), pre_game_category_id);

		pre_game_channels.forEach(
			async (channel) => {
				await channel.permissionOverwrites.set([
					{
						id: living_role,
						deny: [PermissionFlagsBits.ViewChannel],
					},
					{
						id: ghosts_role,
						deny: [PermissionFlagsBits.ViewChannel],
					},
				]);
			}
		);
		console.log("Closed Pre-game Channels.");
	}
	const openGhostChat = async function() {
		let ghost_chat_chnl = await getChannel((await global.Game.getGuild()), rdm_ids.channels.ghost_chat);
		ghost_chat_chnl.permissionOverwrites.edit((await global.Game.getGuild()).roles.everyone, {SendMessages: true});
		console.log("Opened Ghost Chat");
	}
	const announceDay1 = async function() {
		console.log("Announcing Day 1.");

		let game_announce_chnl = await getChannel((await global.Game.getGuild()), channel_ids.game_announce),
			announce_msgs = [];

		game_announce_chnl.permissionOverwrites.set([
			{
				id: (await global.Game.getGuild()).id,
				// ! TESTING MODE - OFF
				// allow: [PermissionFlagsBits.ViewChannel],
				// deny: [PermissionFlagsBits.SendMessages],
				// * TESTING MODE - ON
				deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
			},
		]);
		await announceRoleList(game_announce_chnl);
		await announceLivingPlayers(game_announce_chnl);

		await wait(...wait_times["message_delay"]);

		global.Game.announceMessages(
			`<@&${living_role_id}> Good morning! The game will now begin!`,
			`_ _\n__Helpful Reminders__`,
			`> — The role list is in <#${channel_ids.role_list}>`,
			`> — You can use \`<help\` to get a list of all the commands you can use.`,
			`> — You can use \`<lastwill LAST WILL\` to create a will that's shown when you die`,
			`> — You can use \`<deathnote DEATH NOTE\` to create a note to show on your victim's death.`,
			`> — You can avoid typing out a player's entire name by only typing the first few letters. BroBot will try to autocomplete the name for you.`,
		);

		global.Game.announceMessages(
			`**Day 1 will end <t:${getUnixTimestamp() + wait_times.day1[0]*60}:R>.**`
		);
	}

	role_indentifiers_str = interaction.options.getString(command.parameters[0].name);

	if (!areArgsValid(role_indentifiers_str)) return

	if (global.Game.state !== GameStates.ReadyToBegin && interaction.user.id !== ids.ll_user_id) {
		return await interaction.editReply(`The game isn't ready to begin. It's in the phase ${global.Game.state}`);
	}

	const
		role_identifiers = role_indentifiers_str.split(', '),
		original_role_identifiers = role_indentifiers_str.split(', '),
		curr_days_passed = 0.5;

	global.Game.start( shuffleArray(role_identifiers) );

	await createRoleList();
	shuffleRoleList();
	await assignRolesToPlayers();
	await giveExesTargets();

	logColor(`\nDay ${global.Game.getDayNum()} Begins`, "cyan");
	staff_chnl.send(`Day ${global.Game.getDayNum()} Begins`);

	await openGhostChat();
	await announceDay1();
	await openDayChat();
	await closePreGameChats();


	await wait(...wait_times["day1"]);


	console.log("Starting night...");
	global.Game.startNight(curr_days_passed, interaction);
}

module.exports = command;
