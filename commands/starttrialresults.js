const
	{ factions, wait_times } = require("../databases/rapid_discord_mafia/constants"),
	{
		getChannel,
		getGuildMember,
		getRole,
		logColor,
		wait,
		addRole,
		removeRole,
		toTitleCase,
	} = require("../modules/functions"),
	{
		rdm_server_id,
		channels: channel_ids,
	} = require("../databases/ids.json").rapid_discord_mafia;

module.exports = {
	name: 'starttrialresults',
    description: 'Start the trial results phase in RDM.',
	isSeverOnly: true,
	isRestrictedToMe: true,
    required_permission: 'ADMINISTRATOR',
	required_servers: [rdm_server_id],
	// eslint-disable-next-line no-unused-vars
	async execute(message, args, isTest=false) {

		let staff_chnl = await getChannel(message.guild, channel_ids.staff);

		logColor(`\nTrial Results Begin`, "cyan");
		staff_chnl.send(`Trial Results Begin`);

		const killPlayer = async function(victim_name, killer_name="Host", type="lynch") {
			let game_announce_chnl = await getChannel(message.guild, channel_ids.game_announce);

			global.Game.Players.get(victim_name).isAlive = false;

			if (type == "lynch") {
				if (global.Game.Players.get(victim_name).role == "Fool") {
					let fool_chnl = await getChannel(message.guild, global.Game.Players.get(victim_name).channel_id);

					game_announce_chnl.send("You feel like you've made a terrible mistake...\n _ _");
					fool_chnl.send("You win! Your powers have awakened. You can use any of your curses for only this night.");

					await wait(...wait_times["message_delay"]);

					global.Game.Players.get(victim_name).isInLimbo = true;
					global.Game.Players.get(victim_name).hasWon = true;

					global.Game.winning_factions.push("Fool");
					global.Game.winning_players.push(victim_name);
					global.Game.Players_in_limbo.push(victim_name);

				}

				let executioners = global.Game.Players.getExecutioners();

				console.log("Checking for exe wins")
				for (let exe of executioners) {
					console.log({exe, victim_name});
					if ( exe.exe_target == victim_name ) {
						console.log("Announcing win and giving player win.");

						let exe_chnl = await getChannel(message.guild, global.Game.Players.get(exe.name).channel_id);
						exe_chnl.send("You win! You have successfully gotten your target lynched.");
						global.Game.Players.get(exe.name).hasWon = true;

						global.Game.winning_factions.push("Executioner");
						global.Game.winning_players.push(exe.name);
					}
				}
			}



			let ghost_role = await getRole(message.guild, "Ghosts"),
				living_role = await getRole(message.guild, "Living"),
				player_guild_member = await getGuildMember(message.guild, global.Game.Players.get(victim_name).id);

			await addRole(player_guild_member, ghost_role);
			await removeRole(player_guild_member, living_role);

			let death = {
					"victim": victim_name,
					"killers": [killer_name]
				}
			await global.Game.sendDeathMsg(game_announce_chnl, death, type)
		}

		const revealVotes = async function(votes) {
			let voting_booth_chnl = await getChannel(message.guild, channel_ids.voting_booth);

			voting_booth_chnl.send(`_ _\n\`Revealed Votes\``);

			for (let voter in votes) {
				let vote = votes[voter];

				await voting_booth_chnl.send(`**${voter}** voted **${toTitleCase(vote)}**.`)
			}
		}
		const announceVerdict = async function(verdict) {
			let game_announce_chnl = await getChannel(message.guild, channel_ids.game_announce);

			game_announce_chnl.send(`Trial voting is closed. Let's see the verdict...`);

			await wait(...wait_times["message_delay"]);

			if (verdict == "tie") {
				game_announce_chnl.send(`It was a tie. The town couldn't agree whether or not to lynch **${global.Game.on_trial}**, so they live.\n_ _`);
			}
			else if (verdict == "none") {
				game_announce_chnl.send(`Nobody voted, so they live.\n_ _`);
			}
			else if (verdict == "innocent") {
				game_announce_chnl.send(`**${global.Game.on_trial}** was deemed ${verdict} by the town. They get to live another day.\n_ _`);
			}
			else {
				game_announce_chnl.send(`**${global.Game.on_trial}** was deemed ${verdict} by the town. They will be hung to death this instant.\n_ _`);
			}

			await wait(...wait_times["message_delay"]);
		}
		const removePlayerFromTrial = async function(player_name) {
			let player_info = global.Game.Players.get(player_name)

			let on_trial_role = await getRole(message.guild, "On Trial"),
				player_guild_member = await getGuildMember(message.guild, player_info.id);

			await removeRole(player_guild_member, on_trial_role);

			global.Game.on_trial = "";

		}

		global.Game.setPhaseToTrialResults();
		const curr_days_passed = global.Game.days_passed;

		await revealVotes(global.Game.trial_votes);

		await announceVerdict(global.Game.verdict);

		if (global.Game.verdict == "guilty") {
			await killPlayer(global.Game.on_trial);
			global.Game.timeout_counter = 0;

		}

		await removePlayerFromTrial(global.Game.on_trial);

		if (await global.Game.getWhichFactionWon(factions)) {
			let game_announce_chnl = await getChannel(message.guild, channel_ids.game_announce);

			await global.Game.endGame(game_announce_chnl, message);
			return "all"
		}

		global.Game.startNight(curr_days_passed, message);
    }
};