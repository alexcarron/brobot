const Discord = require('discord.js');

function createLeaderboardEmbed(sorted_viewers_for_page, current_page, NUM_PAGES, VIEWERS_PER_PAGE) {
	// Create the leaderboard embed
	const leaderboard_embed = new Discord.EmbedBuilder()
		.setColor(0x1cc347)
		.setTitle(`LL Point Leaderboard (Page ${current_page}/${NUM_PAGES})`)
		.setDescription('Here are the top users based on their LL points:')
		.setTimestamp();

	// Add each viewer to the leaderboard embed
	let emebed_description = "";
	for (let index in sorted_viewers_for_page) {
		let viewer = sorted_viewers_for_page[index];
		const rank = parseInt(index) + (current_page-1)*VIEWERS_PER_PAGE + 1;
		const username = viewer.name;
		const ll_points = viewer.ll_points;

		emebed_description += `\`#${rank}\` **${username}**: ${ll_points}` + "\n"
	}

	leaderboard_embed.setDescription(emebed_description);

	return leaderboard_embed;
}

module.exports = {
    name: 'leaderboard',
	aliases: ['llleaderboard', 'llpointleaderboard'],
	description: "See a leaderboard of everybody with LL Points.",
	args: false,
	// eslint-disable-next-line no-unused-vars
	async execute(message, args) {

		let viewers = Object.fromEntries(global.LLPointManager.viewers);
		const VIEWERS_PER_PAGE = 25;
		const NUM_PAGES = Math.ceil(Object.keys(viewers).length / VIEWERS_PER_PAGE);
		let current_page = 0;
		const viewers_in_pages = [];

		// Sort LL Point Manager based on LL points
		const sorted_viewers =
			Object.values(viewers)
				.sort(
					(a, b) => b.ll_points - a.ll_points
				);

		for (let page_index = 0; page_index < NUM_PAGES; page_index++) {
			const start_index = page_index * VIEWERS_PER_PAGE;
			const end_index = start_index + VIEWERS_PER_PAGE;
			const viewers_in_page = sorted_viewers.slice(start_index, end_index);
			viewers_in_pages.push(viewers_in_page);
		}

		const leaderboard_embed = createLeaderboardEmbed(viewers_in_pages[current_page], current_page + 1, NUM_PAGES, VIEWERS_PER_PAGE);
		message.channel.send({ embeds: [leaderboard_embed] })
			.then(
				async (message_sent) => {
					await message_sent.react('⬅️');
					await message_sent.react('➡️');

					const filter = (reaction, user) => {
						const isLeftArrow = reaction.emoji.name === '⬅️';
						const isRightArrow = reaction.emoji.name === '➡️';
						// Prevents others from messing with leaderboard
						const isReactionFromAuthor = user.id === message.author.id;
						return (isLeftArrow || isRightArrow) && isReactionFromAuthor;
					};

					const collector = message_sent.createReactionCollector( {
						filter,
						time: 75000,
						dispose: true,
					} );

					const changePageFromReaction = async (reaction) => {
						console.log(`Collected a new ${reaction.emoji.name} reaction`);
						if (reaction.emoji.name === '⬅️' && current_page > 0) {
							current_page--;
						}
						else if (reaction.emoji.name === '➡️' && current_page < NUM_PAGES - 1) {
							current_page++;
						}

						const new_leaderboard_embed = createLeaderboardEmbed(viewers_in_pages[current_page], current_page + 1, NUM_PAGES, VIEWERS_PER_PAGE);
						console.log({current_page, NUM_PAGES, new_leaderboard_embed});
						await message_sent.edit( { embeds: [new_leaderboard_embed] } );

					}

					collector.on('collect', async (reaction) => {
						changePageFromReaction(reaction);
					});

					collector.on('remove', async (reaction) => {
						changePageFromReaction(reaction);
					});

					collector.on('end', (collected) => {
						console.log(`We're done collecting reactions. Collected ${collected.size} items`);
						message_sent.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
					});
				});
	},
};