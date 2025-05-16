const Discord = require('discord.js');
const { deferInteraction } = require('../../utilities/discord-action-utils');
const SlashCommand = require('../../services/command-creation/slash-command');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder  } = require('discord.js');
const { logInfo } = require('../../utilities/logging-utils');

const command = new SlashCommand({
	name: "leaderboard",
	description: "See a leaderboard of everybody with LL Points",
});
command.allowsDMs = true;
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	let viewers = Object.fromEntries(global.LLPointManager.viewers);
	const VIEWERS_PER_PAGE = 25;
	const NUM_PAGES = Math.ceil(Object.keys(viewers).length / VIEWERS_PER_PAGE);
	let current_page = 1;
	const PAGES = [];

	// Sort LL Point Manager based on LL points
	const sorted_viewers =
		Object.values(viewers)
			.sort(
				(a, b) => b.ll_points - a.ll_points
			);

	for (let page_index = 0; page_index < NUM_PAGES; page_index++) {
		const start_index = page_index * VIEWERS_PER_PAGE;
		const end_index = start_index + VIEWERS_PER_PAGE;
		const page_of_viewers = sorted_viewers.slice(start_index, end_index);
		PAGES.push(page_of_viewers);
	};

	const createLeaderboardEmbed = async function(current_page) {
		logInfo(`Create Embed #${current_page}`);

		// Create the leaderboard embed
		const leaderboard_embed = new Discord.EmbedBuilder()
			.setColor(0x1cc347)
			.setTitle(`LL Point Leaderboard (Page ${current_page}/${NUM_PAGES})`)
			.setDescription('Here are the top users based on their LL points:')
			.setTimestamp();

		const page = PAGES[current_page-1];

		// Add each viewer to the leaderboard embed
		let embed_description = "";
		for (let index in page) {
			let viewer = page[index];
			const rank = parseInt(index) + (current_page-1)*VIEWERS_PER_PAGE + 1;
			const username = viewer.name;
			const ll_points = viewer.ll_points;

			embed_description += `\`#${rank}\` **${username}**: ${ll_points}` + "\n"
		}

		leaderboard_embed.setDescription(embed_description);

		return leaderboard_embed;
	}

	const createLeaderboardMessage = async function(current_page) {
		const leaderboard_embed = await createLeaderboardEmbed(current_page);
		const left_button = new ButtonBuilder()
			.setCustomId('left')
			.setLabel("👈")
			.setStyle(ButtonStyle.Secondary);

		const right_button = new ButtonBuilder()
			.setCustomId('right')
			.setLabel("👉")
			.setStyle(ButtonStyle.Secondary);

		const action_row = new ActionRowBuilder()
			.addComponents(left_button, right_button)

		return {
			embeds: [leaderboard_embed],
			components: [action_row],
		};
	}

	const message_options = await createLeaderboardMessage(current_page);

	const leaderboard_msg = await interaction.editReply(message_options);

	const readButtonInteractions = async function(message, current_page) {
		const collectorFilter = function(button_interaction) {
			return button_interaction.user.id === interaction.user.id;
		};

		let button_interaction;

		try {
			button_interaction = await message.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

			if (button_interaction.customId === 'left') {
				logInfo("User clicked Left on LL Point Leaderboard");
				if (current_page > 1) {
					current_page--;
				}

				const message_options = await createLeaderboardMessage(current_page);
				await button_interaction.update(message_options);
				await readButtonInteractions(message, current_page);
			}
			else if (button_interaction.customId === 'right') {
				logInfo("User clicked Right on LL Point Leaderboard");
				if (current_page < NUM_PAGES - 1) {
					current_page++;
				}

				const message_options = await createLeaderboardMessage(current_page);
				await button_interaction.update(message_options);
				await readButtonInteractions(message, current_page);
			}
			else {
				const new_leaderboard_embed = createLeaderboardEmbed(current_page);
				await button_interaction.update({ embeds: [new_leaderboard_embed], components: [] });
			}
		}
		catch {
			logInfo("User waited too long to click on LL Point Leaderboard. Cancelling...");
		}
	}

	readButtonInteractions(leaderboard_msg, current_page);
}

module.exports = command;