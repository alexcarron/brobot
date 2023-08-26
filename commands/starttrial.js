const
	{ wait_times } = require("../databases/rapid_discord_mafia/constants"),
	{
		getChannel,
		getGuildMember,
		getRole,
		logColor,
		wait,
		addRole,
		getUnixTimestamp,
	} = require("../modules/functions"),
	{
		rdm_server_id,
		roles: role_ids,
		channels: channel_ids,
	} = require("../databases/ids.json").rapid_discord_mafia;

module.exports = {
	name: 'starttrial',
    description: 'Start the trial phase in RDM.',
	isSeverOnly: true,
	isRestrictedToMe: true,
    required_permission: 'ADMINISTRATOR',
	required_servers: [rdm_server_id],
	// eslint-disable-next-line no-unused-vars
	async execute(message, args, isTest=false) {


		// let players = JSON.parse(fs.readFileSync("./databases/rapid_discord_mafia/players.json")),

		// phase = JSON.parse(fs.readFileSync("./databases/rapid_discord_mafia/phase.json")),
		let staff_chnl = await getChannel(message.guild, channel_ids.staff);

		const sendVotingHeader = async function() {
			let voting_booth_chnl = await getChannel(message.guild, channel_ids.voting_booth);
			voting_booth_chnl.send(`_ _\n\n\`\`\`Day ${global.Game.getDayNum()} Trial Vote\`\`\``);
		}
		const announceTrialPhase = async function() {
			let game_announce_chnl = await getChannel(message.guild, channel_ids.game_announce);

			game_announce_chnl.send(`The trial part of the day phase will now begin and **end <t:${getUnixTimestamp() + wait_times.trial[0]*60}:R>**.`);

			await wait(...wait_times["message_delay"]);

			game_announce_chnl.send(`Make sure to vote guilty or innocent in your player actions channel using the \`<trialvote Innocent/Guilty/Abstain\` command. Your votes will only be anonymous before the day ends.\n_ _`);

			await wait(...wait_times["message_delay"]);
		}
		const announcePlayerOnTrial = async function() {
			console.log(`Announcing ${global.Game.on_trial} On Trial.`);

			let player_on_trial = global.Game.on_trial;

			let game_announce_chnl = await getChannel(message.guild, channel_ids.game_announce);

			game_announce_chnl.send(`<@&${role_ids.living}> Voting is closed. Let's see who is put on trial...`);

			await wait(...wait_times["message_delay"]);

			if (player_on_trial == "nobody") {
				game_announce_chnl.send(`The town decided to lynch nobody, so we will be skipping the trial phase.\n_ _`);
				await wait(...wait_times["message_delay"]);
				return "startDay";
			}
			else if (player_on_trial == "tie") {
				game_announce_chnl.send(`It was a tie. The town couldn't agree on who to lynch, so we will be skipping the trial phase.\n_ _`);
				await wait(...wait_times["message_delay"]);
				return "startDay";
			}
			else if (player_on_trial == "none") {
				game_announce_chnl.send(`Nobody voted, so we will be skipping the trial phase.\n_ _`);
				await wait(...wait_times["message_delay"]);
				return "startDay";
			}

			game_announce_chnl.send(`The town puts **${player_on_trial}** on trial.\n_ _`);
			await wait(...wait_times["message_delay"]);
		}
		const putPlayerOnTrial = async function(player_name) {
			console.log("Giving Player On Trial, On Trial Role.");
			console.log({player_name});

			let player_info = global.Game.Players.get(player_name);

			let on_trial_role = await getRole(message.guild, "On Trial"),
				player_guild_member = await getGuildMember(message.guild, player_info.id);

			await addRole(player_guild_member, on_trial_role);
		}
		const openDefenseStand = async function() {
			let on_trial_role = await getRole(message.guild, "On Trial"),
				defense_stand_chnl = await getChannel(message.guild, channel_ids.defense_stand),
				game_announce_chnl = await getChannel(message.guild, channel_ids.game_announce);

			game_announce_chnl.send(`<@&${role_ids.on_trial}> You can now give your defense on the <#${channel_ids.defense_stand}>.`);

			await defense_stand_chnl.permissionOverwrites.create(on_trial_role, { SendMessages: true });

			await wait(...wait_times["message_delay"]);

			console.log("Opened Defense Stand");
		}
		const remindPlayersToVote = async function() {
			for (let player_name of global.Game.Players.getPlayerNames()) {
				let channel_id = global.Game.Players.get(player_name).channel_id,
					player_chnl = await getChannel(message.guild, channel_id);

				if (global.Game.Players.get(player_name).isAlive)
					player_chnl.send("_ _\nIt's trial time. Use `<trialvote Innocent/Guilty/Abstain` to vote innocent or guilty.");
			}
		}

		await global.Game.setPhaseToTrial();
		const curr_days_passed = global.Game.days_passed;

		await announcePlayerOnTrial();

		if (["nobody", "tie", "none"].includes(global.Game.on_trial)) {
			return global.Game.startNight(curr_days_passed, message);
		}

		await sendVotingHeader();

		console.log("About to put player on trial");

		await putPlayerOnTrial(global.Game.on_trial);
		await openDefenseStand();
		await announceTrialPhase();
		await remindPlayersToVote();

		logColor(`\nTrial Begins`, "cyan");
		staff_chnl.send(`Trial Begins`);

		await wait(...wait_times["trial"]);

		global.Game.startTrialResults(curr_days_passed, message);
    }
};