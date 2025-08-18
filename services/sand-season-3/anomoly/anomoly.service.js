const { CronJob } = require("cron");
const { ids } = require("../../../bot-config/discord-ids");
const { fetchGuild, fetchTextChannel } = require("../../../utilities/discord-fetch-utils");
const { logError, logInfo } = require("../../../utilities/logging-utils");
const path = require("path");
const { shuffleCategoryChannels } = require("../../../utilities/discord-action-utils");
const { TextChannel } = require("discord.js");

const GAME_DURATION_IN_HOURS = 24;
const ANOMOLY_INTERVAL_IN_HOURS = 1;

const projectRoot = path.dirname(require.main ? require.main.filename : __filename);
const ASSET_DIR_PATH = path.join(projectRoot, "assets", "anomoly");

/**
 * An enum of all the possible rooms for the anomoly challenge
 */
const RoomIdentifier = Object.freeze({
	STORAGE_ROOM: "storageRoom",
	KITCHEN: "kitchen",
	HALLWAY: "hallway",
	BATHROOM: "bathroom",
	CRYOSTATIS_CHAMBER: "cryostasisChamber"
});

/**
 * A service class for the anomoly challenge
 */
class AnomolyService {

	/**
	 * Sets up the AnomolyService with a given start time and begins scheduling messages to be sent for the anomoly challenge.
	 */
	startChallenge() {
		const nowCT = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
		const yesterdayAt7PM = new Date(nowCT);		// Set to 7 PM (19:00)
		yesterdayAt7PM.setDate(yesterdayAt7PM.getDate() - 1);
		yesterdayAt7PM.setHours(22, 8, 0, 0); // 7:00:00 PM CT
		this.startCronJobs(yesterdayAt7PM);
		this.startTime = yesterdayAt7PM;
	}

	/**
	 * Fetches all the channels in the Sand Season 3 server.
	 * @returns {Promise<Record<string, TextChannel[]>>} A Promise that resolves with an object where the keys are strings that represent the type of channel ("storageRoom", "kitchen", "hallway", "bathroom", "cyrostasisChamber"), and the values are arrays of GuildChannel objects that are of the corresponding type.
	 */
	async fetchChannels() {
		const sandS3Guild = await fetchGuild(ids.servers.sandSeason3);

		return {
			[RoomIdentifier.STORAGE_ROOM]: [
				await fetchTextChannel(sandS3Guild, ids.sandSeason3.channels.team1.storageRoom),
				await fetchTextChannel(sandS3Guild, ids.sandSeason3.channels.team2.storageRoom),
			],
			[RoomIdentifier.KITCHEN]: [
				await fetchTextChannel(sandS3Guild, ids.sandSeason3.channels.team1.kitchen),
				await fetchTextChannel(sandS3Guild, ids.sandSeason3.channels.team2.kitchen),
			],
			[RoomIdentifier.HALLWAY]: [
				await fetchTextChannel(sandS3Guild, ids.sandSeason3.channels.team1.hallway),
				await fetchTextChannel(sandS3Guild, ids.sandSeason3.channels.team2.hallway),
			],
			[RoomIdentifier.BATHROOM]: [
				await fetchTextChannel(sandS3Guild, ids.sandSeason3.channels.team1.bathroom),
				await fetchTextChannel(sandS3Guild, ids.sandSeason3.channels.team2.bathroom),
			],
			[RoomIdentifier.CRYOSTATIS_CHAMBER]: [
				await fetchTextChannel(sandS3Guild, ids.sandSeason3.channels.team1.cyrostasisChamber),
				await fetchTextChannel(sandS3Guild, ids.sandSeason3.channels.team2.cyrostasisChamber),
			]
		}
	}

	/**
	 * Posts an image in all the channels given.
	 * @param {TextChannel[]} channels The channels to post the image in.
	 * @param {string} imageFilePath The path to the image to post.
	 * @returns {Promise<void>} A Promise that resolves when the image has been posted in all the channels.
	 */
	async sendImageInChannels(channels, imageFilePath) {
		for (const channel of channels) {
			try {
				await channel.send({ files: [imageFilePath] });
			}
			catch (error) {
				logError(
					`Error sending image in channel ${channel.name}`,
					error
				);
			}
		}
	}

	/**
	 * Sends images to all channels for a specific hour.
	 * Constructs the file path for images based on the room identifier and hour,
	 * then posts the images in corresponding channels.
	 * @param {number} numHour - The hour for which the images are to be sent.
	 * @returns {Promise<void>} A Promise that resolves when the images have been sent.
	 */

	async sendImagesForHour(numHour) {
		const channels = await this.fetchChannels();
		const kitchenChannels = channels[RoomIdentifier.KITCHEN];
		const firstChannelCategory = kitchenChannels[0].parent;
		const secondChannelCategory = kitchenChannels[1].parent;

		if (!firstChannelCategory || !secondChannelCategory)
			throw new Error("Could not find channel parent categories for kitchen");

		await shuffleCategoryChannels(
			firstChannelCategory.guild,
			firstChannelCategory
		);
		await shuffleCategoryChannels(
			secondChannelCategory.guild,
			secondChannelCategory
		);

		for (const roomIdentifier of Object.values(RoomIdentifier)) {
			const fileName = `${roomIdentifier}${numHour}.png`;
			const imageFilePath = path.join(ASSET_DIR_PATH, fileName);
			await this.sendImageInChannels(
				channels[roomIdentifier],
				imageFilePath
			);
		}
	}

	/**
	 * Starts a cron job to send images for a specific hour.
	 * The job is scheduled to run at a calculated time based on the start time and the given hour.
	 * @param {number} numHour - The hour for which the cron job will send images.
	 * @param {Date} startTime - The start time of the game.
	 */
	startCronJobForHour(numHour, startTime) {
		const now = new Date();
		const cronStartTime = new Date(startTime.getTime());
		cronStartTime.setHours(cronStartTime.getHours() +
			numHour * ANOMOLY_INTERVAL_IN_HOURS
		);
		const randomMinutes = Math.floor(Math.random() * 31) - 15; // -15 to 15 inclusive
    cronStartTime.setMinutes(cronStartTime.getMinutes() + randomMinutes);

		console.log(
			`Starting cron job for hour ${numHour} at ${cronStartTime.toISOString()} (UTC)`);

		const anomolyService = this;
		const sendImagesCronJob = new CronJob(
			cronStartTime,
			async function() {
				logInfo(`Sending images for hour ${numHour}`);
				await anomolyService.sendImagesForHour(numHour);
			},
		);

		if (now < cronStartTime)
			sendImagesCronJob.start();
	}

	/**
	 * Starts a cron job to send images for each hour of the game.
	 * The jobs are scheduled to run at a calculated time based on the start time and the given hour.
	 * @param {Date} startTime - The start time of the game.
	 */
	startCronJobs(startTime) {
		for (let numHour = 1; numHour <= GAME_DURATION_IN_HOURS; numHour++) {
			logInfo(`Starting cron job for hour ${numHour}`);
			this.startCronJobForHour(numHour, startTime);
		}
		logInfo(`All cron jobs have been started`);
	}
}

module.exports = AnomolyService;