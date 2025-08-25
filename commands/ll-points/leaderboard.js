const Discord = require('discord.js');
const { deferInteraction } = require('../../utilities/discord-action-utils');
const { SlashCommand } = require('../../services/command-creation/slash-command');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder  } = require('discord.js');
const { logInfo } = require('../../utilities/logging-utils');
const Viewer = require('../../services/ll-points/viewer');

module.exports = new SlashCommand({
	name: "leaderboard",
	description: "See a leaderboard of everybody with LL Points",
	allowsDMs: true,
	execute: async function(interaction) {
		await deferInteraction(interaction);

		let viewers = Object.fromEntries(global.LLPointManager.viewers);
		const VIEWERS_PER_PAGE = 25;
		const NUM_PAGES = Math.ceil(Object.keys(viewers).length / VIEWERS_PER_PAGE);
		let current_page = 1;
		/**
		 * @type {Viewer[][]}
		 */
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
		}


		/**
		 * Creates an embed for the leaderboard command with the viewers' names and
		 * LL points, paginated by `VIEWERS_PER_PAGE`.
		 * @param {number} currentPageNumber - The page of the leaderboard to create the embed for
		 * @returns {Discord.EmbedBuilder} The leaderboard embed
		 */
		const createLeaderboardEmbed = function(currentPageNumber) {
			logInfo(`Create Embed #${currentPageNumber}`);

			// Create the leaderboard embed
			const leaderboard_embed = new Discord.EmbedBuilder()
				.setColor(0x1cc347)
				.setTitle(`LL Point Leaderboard (Page ${currentPageNumber}/${NUM_PAGES})`)
				.setDescription('Here are the top users based on their LL points:')
				.setTimestamp();

			const page = PAGES[currentPageNumber-1];

			// Add each viewer to the leaderboard embed
			let embed_description = "";
			for (let index in page) {
				let viewer = page[index];
				const rank = parseInt(index) + (currentPageNumber-1)*VIEWERS_PER_PAGE + 1;
				const username = viewer.name;
				const ll_points = viewer.ll_points;

				embed_description += `\`#${rank}\` **${username}**: ${ll_points}` + "\n"
			}

			leaderboard_embed.setDescription(embed_description);

			return leaderboard_embed;
		}


		/**
		 * Creates a message for the leaderboard command with a paginated leaderboard embed and
		 * two buttons to navigate to the previous and next pages of the leaderboard.
		 * @param {number} currentPageNumber - The page of the leaderboard to create the embed for
		 * @returns {Promise<import('discord.js').InteractionUpdateOptions>} The message options for the leaderboard command
		 */
		const createLeaderboardMessage = async function(currentPageNumber) {
			const leaderboard_embed = await createLeaderboardEmbed(currentPageNumber);

			const left_button = new ButtonBuilder()
				.setCustomId('left')
				.setLabel("👈")
				.setStyle(ButtonStyle.Secondary);

			const right_button = new ButtonBuilder()
				.setCustomId('right')
				.setLabel("👉")
				.setStyle(ButtonStyle.Secondary);

			/**
			 * @type {ActionRowBuilder<ButtonBuilder>}
			 */
			const action_row = new ActionRowBuilder()
			action_row.addComponents(left_button, right_button)

			return {
				embeds: [leaderboard_embed],
				components: [action_row],
			};
		}

		const message_options = await createLeaderboardMessage(current_page);

		// @ts-ignore
		const leaderboard_msg = await interaction.editReply(message_options);

	/**
	 * Waits for the user to interact with the buttons on the leaderboard message.
	 * When the user clicks on a button, it updates the leaderboard message with the new page and waits again.
	 * If the user waits too long, the function cancels and removes the buttons from the message.
	 * @param {Discord.Message} message - The message to wait for button interactions on
	 * @param {number} current_page - The current page of the leaderboard
	 */
		const readButtonInteractions = async function(message, current_page) {
			/**
			 * A filter function for the button interaction collector.
			 * This filter only allows button interactions from the user who originally interacted with the command.
			 * @param {Discord.Interaction} button_interaction - The button interaction to check
			 * @returns {boolean} `true` if the button interaction is from the correct user, `false` otherwise
			 */
			const collectorFilter = function(button_interaction) {
				return button_interaction.user.id === interaction.user.id;
			};

			let button_interaction;

			try {
				button_interaction = await message.awaitMessageComponent({
					filter: collectorFilter,
					time: 60_000
				});

				if (button_interaction.customId === 'left') {
					logInfo("User clicked Left on LL Point Leaderboard");
					if (current_page > 1) {
						current_page--;
					}
					else {
						current_page = NUM_PAGES;
					}

					const message_options = await createLeaderboardMessage(current_page);
					await button_interaction.update(message_options);
					await readButtonInteractions(message, current_page);
				}
				else if (button_interaction.customId === 'right') {
					logInfo("User clicked Right on LL Point Leaderboard");
					if (current_page < NUM_PAGES) {
						current_page++;
					}
					else {
						current_page = 1;
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
});