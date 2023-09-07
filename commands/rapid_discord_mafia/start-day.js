const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { Abilities } = require("../../modules/rapid_discord_mafia/ability");

const
	// {  } = require("../modules/enums.js"),
	{ factions, wait_times, max_timeout } = require("../../databases/rapid_discord_mafia/constants"),
	{
		getChannel,
		getGuildMember,
		getRole,
		logColor,
		wait,
		addRole,
		removeRole,
		getUnixTimestamp,
	} = require("../../modules/functions"),
	{
		rdm_server_id,
		living_role_id,
		town_discussion_channel_id: day_chat_chnl_id,
		channels: channel_ids,
	} = require("../../databases/ids.json").rapid_discord_mafia;

const command = new SlashCommand({
	name: "start-day",
	description: "Start the day phase in RDM.",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_permissions = [PermissionFlagsBits.Administrator];
command.execute = async function execute(interaction, args, isTest=false) {
	if (interaction) {
		try {
			await interaction.reply({content: "Starting Day...", ephemeral: true});
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
const closeMafiaChat = async function() {
		let mafia_channel = await getChannel((await global.Game.getGuild()), channel_ids.mafia_chat);

		mafia_channel.permissionOverwrites.edit(
			(await global.Game.getGuild()).roles.everyone,
			{
				ViewChannel: false,
				SendMessages: false,
			}
		);

		mafia_channel.send(`Closed.`);

		console.log(`Closed Mafia Chat`);
	}


	const performEveryAbility = async function() {
		await global.Game.updateAbilitiesPerformed();
		const perform = require("../../modules/rapid_discord_mafia/perform.js");
		logColor("\nPerforming Every Ability", "cyan");

		for (let i = 0; i < Object.keys(global.Game.abilities_performed).length; i++) {
			let player_name = Object.keys(global.Game.abilities_performed)[i],
				ability_performed = global.Game.abilities_performed[player_name],
				ability = Object.values(Abilities).find(ability => ability.name === ability_performed.name);

			let arg_values_txt = "";
			if (Object.entries(ability_performed.args) > 0) {

				arg_values_txt =
					" with the arguments " +
					Object.entries(arg_values).map((entry) => {
						let name = entry[0];
						let value = entry[1];

						return `**${name}**: **${value}**`
					}).join(", ");
			}

			staff_chnl.send(
				`\`[${global.Game.Players.get(player_name).role}]\` **${player_name}** did **${ability.name}**${arg_values_txt}`
			);

			if (global.Game.Players.get(player_name).isRoleblocked) {
				console.log(`${player_name} is roleblocked, so they can't do ${ability_performed.name}`);
				continue
			}

			console.log(ability);
			console.log(ability.effects);
			if (ability.effects) {
				console.log({ability_performed});
				ability.effects.forEach( async (effect) => {
					await effect(ability_performed);
				})
				console.table(global.Game.Players.getPlayerList());
				console.table(global.Game.abilities_performed);
			}
		}



	}
	const announceDay = async function() {
		const doDeaths = async function(announce_chnl) {
			for (let death of global.Game.next_deaths) {
				console.log(`Killing ${death.victim} from ${death.killer}`);
				global.Game.Players.get(death.victim).isAlive = false;

				await global.Game.sendDeathMsg(announce_chnl, death);
			}
		}

		let game_announce_chnl = await getChannel((await global.Game.getGuild()), channel_ids.game_announce),
			phase_num = Math.ceil(global.Game.days_passed),
			announce_msgs = [
				`<@&${living_role_id}> Good morning!`,
				`**Day ${phase_num}** has begun.`,
				`Let's see what happened last night...\n_ _`
			]

		for (let msg of announce_msgs) {
			game_announce_chnl.send(msg);
			await wait(...wait_times["message_delay"]);
		}

		await doDeaths(game_announce_chnl);

		await announceLivingPlayers(game_announce_chnl);

		console.log(`Announced Day ${phase_num}.`);
	}
	const killDeadPlayers = async function() {
		let victim_player_names = global.Game.next_deaths.map(death => death.victim),
			victim_players =
				global.Game.Players.getPlayerList()
					.filter(player => victim_player_names.includes(player.name));

		for (let player_info of victim_players) {
			let ghost_role = await getRole((await global.Game.getGuild()), "Ghosts"),
				living_role = await getRole((await global.Game.getGuild()), "Living"),
				player_guild_member = await getGuildMember((await global.Game.getGuild()), player_info.id);

			await addRole(player_guild_member, ghost_role);
			await removeRole(player_guild_member, living_role);
		}


		for (let player_name of global.Game.players_in_limbo) {
			global.Game.Players.get(player_name).isInLimbo = false;
		}

	}
	const announceSilenceCurse = async function() {
		let game_announce_chnl = await getChannel((await global.Game.getGuild()), channel_ids.game_announce);

		game_announce_chnl.send(`A fool has cursed this town with silence! This day phase will be skipped.`);

		await wait(...wait_times["message_delay"]);

		console.log(`Announced Silence Curse`);
	}
	const startVoting = async function() {
		const remindPlayersToVote = async function() {
			for (let player_name of global.Game.Players.getPlayerNames()) {
				let channel_id = global.Game.Players.get(player_name).channel_id,
					player_chnl = await getChannel((await global.Game.getGuild()), channel_id);

				if (global.Game.Players.get(player_name).isAlive)
					player_chnl.send("_ _\nIt's voting time. Use `<vote PLAYER/Nobody/Abstain` to vote for a player to put on trial.");
			}
		}
		const sendVotingHeader = async function() {
			let voting_booth_chnl = await getChannel((await global.Game.getGuild()), channel_ids.voting_booth);
			voting_booth_chnl.send(`_ _\n\n\`\`\`Day ${Math.ceil(global.Game.days_passed)} Lynch Vote\`\`\``);
		}
		const announceVotingPhase = async function() {
			let game_announce_chnl = await getChannel((await global.Game.getGuild()), channel_ids.game_announce);

			game_announce_chnl.send(`The voting part of the day phase will now begin. **It ends in <t:${getUnixTimestamp() + wait_times.voting[0]*60}:R>** `);

			await wait(...wait_times["message_delay"]);

			game_announce_chnl.send(`Make sure to vote for you want to lynch in your player actions channel using the \`<vote PLAYER/Nobody/Abstain\` command. Your votes are not anonymous.\n_ _`);

			await wait(...wait_times["message_delay"]);
		}

		logColor(`\nVoting Begins`, "cyan");
		staff_chnl.send(`Voting Begins`);

		await sendVotingHeader();

		global.Game.setPhaseToVoting();

		await openDayChat();

		await announceVotingPhase();

		await remindPlayersToVote();

		await wait(...wait_times["voting"]);
	}

	await global.Game.setPhaseToDay();

	logColor(`\nDay ${global.Game.getDayNum()} Begins`, "cyan");
	staff_chnl.send(`Day ${global.Game.getDayNum()} Begins`);

	await closeMafiaChat();

	await performEveryAbility();

	global.Game.logPlayers();

	await global.Game.sendFeedbackToPlayers();

	await announceDay();

	if (await global.Game.getWhichFactionWon(factions)) {
		let game_announce_chnl = await getChannel((await global.Game.getGuild()), channel_ids.game_announce);

		await global.Game.endGame(game_announce_chnl, interaction, global.Game.Players.getPlayers());
		return "all"
	}

	await killDeadPlayers()

	if (global.Game.next_deaths.length <= 0) {
		global.Game.timeout_counter += 1;

		const game_announce_chnl = await getChannel((await global.Game.getGuild()), channel_ids.game_announce);

		if (global.Game.timeout_counter >= max_timeout) {
			game_announce_chnl.send(`There have been no deaths for the past **${global.Game.timeout_counter} day(s)**, so it's a draw!\n_ _`);
			await wait(...wait_times["message_delay"]);
			return;
		}
		else {
			game_announce_chnl.send(`Nobody has died in the past **${global.Game.timeout_counter} day(s)**. **${max_timeout - global.Game.timeout_counter}** more days without bloodshed and the game ends in a draw.\n`);
			await wait(...wait_times["message_delay"]);
		}
	}
	else {
		global.Game.resetTimeout();
	}

	global.Game.resetDeaths();

	const curr_days_passed = global.Game.days_passed;

	if (!global.Game.isSilentCursed) {
		await startVoting();

		global.Game.startTrial(curr_days_passed, interaction);
	}
	else {
		await announceSilenceCurse();

		global.Game.startNight(interaction, curr_days_passed);
	}

}
module.exports = command;