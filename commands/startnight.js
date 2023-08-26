const { Feedback } = require("../modules/enums");

const
	{ wait_times } = require("../databases/rapid_discord_mafia/constants"),
	roles = require("../modules/roles"),
	{
		getChannel,
		getCategoryChildren,
		getRole,
		logColor,
		wait,
		getUnixTimestamp,
	} = require("../modules/functions"),
	{
		rdm_server_id,
		town_discussion_channel_id: day_chat_chnl_id,
		living_role_id,
		night_chat_category_id,
		channels: channel_ids
	} = require("../databases/ids.json").rapid_discord_mafia;

module.exports = {
	name: 'startnight',
    description: 'Start the night phase in RDM.',
	isSeverOnly: true,
	isRestrictedToMe: true,
    required_permission: 'ADMINISTRATOR',
	required_servers: [rdm_server_id],
	// eslint-disable-next-line no-unused-vars
	async execute(message, args, isTest=false) {

		let all_abilities = Object.values(roles).reduce(
				(accum_abilities, role) => {
					if (role.abilities) {
						for (let ability of role.abilities) {
							accum_abilities = {
								...accum_abilities,
								[ability.name]: ability,
							}
						}
						return accum_abilities;
					}
					else
						return accum_abilities;
				},
				{}
			),

			// players = JSON.parse(fs.readFileSync("./databases/rapid_discord_mafia/players.json")),

			// phase = JSON.parse(fs.readFileSync("./databases/rapid_discord_mafia/phase.json")),
			staff_chnl = await getChannel(message.guild, channel_ids.staff);

		const closeDayChat = async function() {
			let living_role = await getRole(message.guild, "Living"),
				day_chat_chnl = await getChannel(message.guild, day_chat_chnl_id);

			await day_chat_chnl.permissionOverwrites.edit(living_role, { SendMessages: false });
			console.log("Closed Day Chat");
		}
		const announceNight = async function() {
			let game_announce_chnl = await getChannel(message.guild, channel_ids.game_announce),
				phase_num = global.Game.getDayNum(),
				announce_msgs = [
					`_ _\n<@&${living_role_id}> Night ${phase_num} has begun.\n`,
					`**The night phase will end <t:${getUnixTimestamp() + wait_times.night[0]*60 + wait_times.message_delay[0]*4}:R>**`,
					`Do your night actions in your player action channel with the \`<do ABILITY, ARGUMENTS\` command.`,
					`If your not doing anything use the command \`<do nothing\` to speed up the night.`,
					`Don't forget to use commas in your command!\n_ _`
				];

			for (let msg of announce_msgs) {
				game_announce_chnl.send(msg);
				await wait(...wait_times["message_delay"]);
			}

			for (let player_name of global.Game.Players.getPlayerNames()) {
				let channel_id = global.Game.Players.get(player_name).channel_id,
					player_chnl = await getChannel(message.guild, channel_id);

				if (global.Game.Players.get(player_name).isAlive)
					player_chnl.send("_ _\nIt's night time. Use `<do ABILITY, ARGUMENTS` to perform an ability or `<do nothing`. (Don't forget the commas)");
			}

			console.log(`Announced Night ${phase_num}.`);
		}
		const openNightChats = async function() {
			let night_channels = await getCategoryChildren(message.guild, night_chat_category_id);

			night_channels.forEach(
				async (channel) =>  {
					await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
					await channel.permissionOverwrites.edit(message.guild.roles.everyone, { ViewChannel: false });
				}
			);
			console.log("Night Chats Opened.");
		}
		const resetPlayersNightInfo = async function() {
			const removeAffectsFromPlayer = async function(player) {
				for (let [affect_num, affect] of player.affected_by.entries()) {
					console.log("Removing Affects From Player");
					console.log("Affect Before:");
					console.log({affect});

					// Don't remove if affect lasts forever
					if (all_abilities[affect.name].duration === -1)
						continue;

					let ability = all_abilities[affect.name],
						phase_effect_ends = affect.during_phase + ability.duration;

					console.log(`Current Phase: ${global.Game.days_passed}`);
					console.log({phase_effect_ends});
					console.log({ability});

					// Delete phase affect ends is current phase or has passed
					if (phase_effect_ends <= global.Game.days_passed) {
						console.log("Deleting affect");

						switch (ability.type) {
							case "protection": {
								let old_defense = roles[player.role].defense;
								global.Game.Players.get(player.name).defense = old_defense;
								break;
							}

							case "manipulation": {
								global.Game.Players.get(player.name).resetPrecieved();
								break;
							}

							case "roleblock": {
								global.Game.Players.get(player.name).isRoleblocked = false;
								break;
							}

							case "modifier": {
								break;
							}

							case "suicide": {
								let death_index = global.Game.next_deaths.findIndex(death => death.victim == player.name);

								if (death_index == -1) {
									global.Game.next_deaths.push(
										{
											"victim": player.name,
											"killers": [player.name],
											"flavor_text": "They committed suicide over the guilt of shooting a town member.",
										}
									);
								}
								else {
									global.Game.next_deaths[death_index].killers.push(player.name);
								}

								let player_chnl = await getChannel(message.guild, global.Game.Players.get(player.name).channel_id);
								player_chnl.send("The guilt over shooting a town member brings you to suicide.");

								global.Game.Players.get(player.name).addFeedback(Feedback.VigilanteComittedSuicide);
								break;
							}
						}

						global.Game.Players.get(player.name).affected_by.splice(affect_num, 1);
					}
				}
			}

			logColor("\nReseting Feedback, Visiting, Silent Curse, Doing Ability, & Affected By", "cyan");
			global.Game.logGame();
			for (let player_name of global.Game.Players.getPlayerNames()) {
				console.log(player_name);
				let player = global.Game.Players.get(player_name);

				global.Game.Players.get(player_name).resetVisiting();
				global.Game.Players.get(player_name).resetAbilityDoing();
				global.Game.Players.get(player_name).resetFeedback();

				if (player.affected_by) {
					await removeAffectsFromPlayer(player);
				}

				{
					console.log("After:")
					console.log(global.Game.Players.get(player_name));
				}
			}

			global.Game.isSilentCursed = false;
		}

		await global.Game.setPhaseToNight();
		const curr_days_passed = global.Game.days_passed;

		logColor(`\nNight ${global.Game.getDayNum()} Begins`, "cyan");
		staff_chnl.send(`Night ${global.Game.getDayNum()} Begins`);
		console.log({curr_days_passed});

		await closeDayChat();
		await openNightChats();
		await resetPlayersNightInfo();
		await announceNight();
		await wait(...wait_times["night"]);

		global.Game.startDay(curr_days_passed, message);
    }
};