const { GameStates, Phases, Subphases } = require("../modules/enums");

const

	{
		toTitleCase,
		getChannel,
		autocomplete
	} = require("../modules/functions"),
	{
		rdm_server_id,
		player_actions_category_id,
		channels: channel_ids,
	}
		= require("../databases/ids.json").rapid_discord_mafia,

	rdm_ids = require("../databases/ids.json").rapid_discord_mafia,
	roles = require("../modules/roles");

module.exports = {
	name: 'do',
    aliases: ['doability', 'ability'],
    description: 'Preform one of your role\'s ability',
	usages: ["ABILITY, ARGUMENTS", "Nothing"],
	hasCommaArgs: true,
	required_servers: [rdm_server_id],
    required_categories: [player_actions_category_id, rdm_ids.category.night],
	async execute(message, args, isTest=false) {

		// let players = JSON.parse(fs.readFileSync("./databases/rapid_discord_mafia/players.json"));

		// let phase = JSON.parse(fs.readFileSync("./databases/rapid_discord_mafia/phase.json"));

		let player_name, ability_name, arg_values;

		if (!isTest) {
			let comma_args = args.join(' ').split(', ');
			player_name = global.Game.Players.getPlayerFromId(message.author.id).name;
			ability_name = toTitleCase(comma_args[0]);
			arg_values = comma_args.slice(1);
		}
		else {
			let comma_args = args;
			player_name = comma_args[0];
			ability_name = toTitleCase(comma_args[1]);
			arg_values = comma_args.slice(2);
		}

		console.log({player_name, ability_name, arg_values});

		const doesAbilityExist = async function(player_name, ability_name) {
			let doesAbilityExist = true,
				player_info = global.Game.Players.get(player_name),
				player_role = roles[player_info.role],
				all_ability_names = player_role.abilities.map(ability => ability.name);

			if ( !all_ability_names.includes( ability_name ) ) {
				let ability_msgs =
					all_ability_names.map( ability_name => `**${ability_name}**` );

				await message.channel.send(
					`**${ability_name}** is not an ability you have.\n` +
					`Your abilities are: ${ability_msgs.join(", ")}`
				);
				doesAbilityExist = false;
			}

			return doesAbilityExist;
		}
		const canUseAbility = async function(ability) {
			let canUseAbility = true;

			// Check if is dead and using non-limbo ability
			if (
				(!global.Game.Players.get(player_name).isAlive || global.Game.next_deaths.some((death) => death.victim == player_name)) &&
				!(global.Game.Players.get(player_name).isInLimbo && ability.isLimboOnly)
			) {
				await message.channel.send(`You can't use this ability while you're dead.`);
				canUseAbility = false;
			}

			// Check if alive and using limbo ability
			if (global.Game.Players.get(player_name).isAlive && ability.isLimboOnly) {
				await message.channel.send(`You can't use this ability while you're alive.`);
				canUseAbility = false;
			}

			// Can it be used?
			if (ability.uses === 0) {
				await message.channel.send(`**${ability.name}** is not an ability you can use on purpose.`);
				canUseAbility = false;
			}
			else if (ability.activation_phase) {
				switch (ability.activation_phase) {
					case Phases.Day:
					case Phases.Night: {
						if (global.Game.phase && global.Game.phase != ability.activation_phase) {
							await message.channel.send(`You need to wait until ${ability.activation_phase} to perform that ability.`);
							canUseAbility = false;
						}
						break;
					}

					case Subphases.Voting:
					case Subphases.Trial: {
						if (global.Game.subphase && global.Game.subphase != ability.activation_phase) {
							await message.channel.send(`You need to wait until ${ability.activation_phase} to perform that ability.`);
							canUseAbility = false;
						}
						break;
					}
				}
			}
			else if (global.Game.phase && global.Game.phase != Phases.Night) {
				await message.channel.send(`You need to wait until night to perform that ability.`);
				canUseAbility = false;
			}

			// Have they used up limited ability?
			if (
				global.Game.Players.get(player_name).used[ability.name] &&
				ability.uses != -1 &&
				global.Game.Players.get(player_name).used[ability.name] >= ability.uses
			) {
				await message.channel.send(`You've ran out of uses for your **${ability.name}** ability.`);
				canUseAbility = false;
			}

			return canUseAbility
		}
		const hasCorrectArgs = async function(ability, ability_arg_values) {
			let hasCorrectArgs = true;

			// Correct amount of arguments
			if (!ability.args && ability_arg_values.length > 0) {
				await message.channel.send(`This ability requires no arguments`);
				hasCorrectArgs = false;
			}
			else if (ability.args && ability_arg_values.length != ability.args.length) {
				let arg_names = ability.args.map(arg => arg.name);

				await message.channel.send(
					`This ability requires **${ability.args.length}** arguments, but you only gave **${ability_arg_values.length}**\n` +
					`Try this: \`<do ${ability.name}, <${arg_names.join(", ").toUpperCase()}>\` (Don't forget the commas)`
				)
				hasCorrectArgs = false;
			}

			return hasCorrectArgs;
		}
		const isValidPlayerArg = async function(player_name, ability_arg, arg_index) {
			let isValidArg = true;

			let target_player,
				alive_player_names = global.Game.Players.getAlivePlayerNames();

			// Does Player Exist And Alive
			if ( !alive_player_names.includes(ability_arg.value) ) {

				// Try To Autocomplete Player
				let target_player_name = autocomplete(ability_arg.value, alive_player_names);

				if (target_player_name) {
					await message.channel.send(`Assuming **${ability_arg.value}** was meant to be **${target_player_name}**`);
					ability_arg.value = target_player_name;
					arg_values[arg_index] = target_player_name;
				} else {
					let player_name_msgs = alive_player_names.map(name => `**${name}**`);

					await message.channel.send(
						`**${ability_arg.value}** is not a living player. (Case-sensitive)\n` +
						`The living players are: ${player_name_msgs.join(", ")}`
					);
					isValidArg = false;
					return isValidArg;

				}
			}

			target_player = global.Game.Players.get(ability_arg.value);

			// Is Player Not Yourself?
			if (
				ability_arg.subtypes.includes("another") &&
				ability_arg.value == player_name
			) {
				await message.channel.send(`You're not allowed to choose yourself for the \`${ability_arg.name}\` argument.`);
				isValidArg = false;
				return isValidArg;
			}

			// Is Player Not A Mafia Member?
			if (ability_arg.subtypes.includes("non-mafia")) {
				let target_player_role = roles[target_player.role];

				if (target_player_role.faction == "Mafia" ) {
					await message.channel.send(`You're not allowed to choose **${ability_arg.value}** (a mafia member) for the \`<${ability_arg.name}>\` argument.`);
					isValidArg = false;
					return isValidArg;
				}
			}

			return isValidArg;
		}
		const addAbilityDoneToDatabase = function(player_name, ability_name, arg_values) {
			// Add ability doing to database
			global.Game.Players.get(player_name).ability_doing = {"name": ability_name};

			if (arg_values.length > 0)
				global.Game.Players.get(player_name).ability_doing.args = arg_values;


		}
		const announceReplacingAbility = async function(ability_did) {
			console.log(ability_did);

			if (ability_did.args) {
				let arg_value_msgs = ability_did.args.map( arg_value => `**${arg_value}**` );

				await message.channel.send(`You are no longer using the ability, **${ability_did.name}**, with the arguments ${arg_value_msgs.join(", ")}`)
			}
			else
				await message.channel.send(`You are no longer using the ability, **${ability_did.name}**.`)
		}
		const sendCmdFeedback = async function(player_name, arg_values) {
			// Send feedback
			let arg_values_msg = "",
				limited_uses_msg = "",
				ability_name = global.Game.Players.get(player_name).ability_doing.name,
				ability =
					roles[ global.Game.Players.get(player_name).role ].abilities
						.find((ability) => ability.name === ability_name);

			if (arg_values.length > 0) {
				let arg_value_msgs = arg_values.map( arg_value => `**${arg_value}**` );
				arg_values_msg = `, with the arguments ${arg_value_msgs.join(", ")}`;
			}

			if (ability.uses != -1) {
				let remaining_uses

				if (global.Game.Players.get(player_name).used[ability_name])
					remaining_uses = ability.uses - global.Game.Players.get(player_name).used[ability_name] - 1;
				else
					remaining_uses = ability.uses - 1;

				limited_uses_msg = `\nYou have ${remaining_uses} uses left.`;
			}

			await message.channel.send(
				`You are now using the ability, **${ability_name}**` +
				arg_values_msg +
				limited_uses_msg
			)

			if (roles[ global.Game.Players.get(player_name).role ].faction === "Mafia") {
				let mafia_channel = await getChannel(message.guild, channel_ids.mafia_chat);

				mafia_channel.send(
					`**${player_name}** is using the ability, **${ability_name}**` +
					arg_values_msg
				)
			}
		}




		if (global.Game.state === GameStates.SignUp) {
			return await message.channel.send(`The game hasn't started yet.`)
		}

		if (ability_name.toLowerCase() == "nothing") {
			if ( global.Game.phase !== Phases.Night ) {
				return await message.channel.send(`You need to wait until night to do nothing.`);
			}

			await message.channel.send(`You are now doing nothing.`);

			if (roles[ global.Game.Players.get(player_name).role ].faction === "Mafia") {
				let mafia_channel = await getChannel(message.guild, channel_ids.mafia_chat);
				await mafia_channel.send(`**${player_name}** is doing nothing.`)
			}

			// Notify If Replacing Ability
			if ( global.Game.Players.get(player_name).isDoingAbility() ) {
				let ability_did = global.Game.Players.get(player_name).ability_doing;
				await announceReplacingAbility(ability_did);
			}

			addAbilityDoneToDatabase(player_name, "Nothing", []);
		}
		else {

			if (!await doesAbilityExist(player_name, ability_name)) {
				return
			}

			let ability =
				roles[ global.Game.Players.get(player_name).role ].abilities
					.find((ability) => ability.name === ability_name);

			if (
				!await canUseAbility(ability) ||
				!await hasCorrectArgs(ability, arg_values)
			) {
				return
			}

			if (ability.args) {
				for (let [arg_index, ability_arg] of ability.args.entries()) {
					ability_arg.value = arg_values[arg_index]

					// Player Argument Types
					if (ability_arg.type === "player") {
						if (!await isValidPlayerArg(player_name, ability_arg, arg_index)) {
							return
						}

						// If Visting Subtype, Set Visiting To Player
						if ( ability_arg.subtypes.includes("visiting") ) {
							global.Game.Players.get(player_name).visiting = ability_arg.value;

						}
					}
				}
			}

			// Notify If Replacing Ability
			if ( global.Game.Players.get(player_name).isDoingAbility()  ) {
				let ability_did = global.Game.Players.get(player_name).ability_doing;
				await announceReplacingAbility(ability_did);
			}

			addAbilityDoneToDatabase(player_name, ability_name, arg_values);

			sendCmdFeedback(player_name, arg_values);
		}

		if ( global.Game.Players.getAlivePlayers().every(p => p.isDoingAbility()) ) {
			if (global.Game.state == GameStates.InProgress && global.Game.phase == Phases.Night) {
				let start_day_cmd = require(`./startday.js`);
				await start_day_cmd.execute(message);
			}
			return

		}
    }
};