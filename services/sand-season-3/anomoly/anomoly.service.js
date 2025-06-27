const { CronJob } = require("cron");
const ids = require("../../../bot-config/discord-ids");
const { fetchChannel, fetchGuild } = require("../../../utilities/discord-fetch-utils");
const { logError, logInfo } = require("../../../utilities/logging-utils");
const path = require("path");

const GAME_DURATION_IN_HOURS = 24;
const ANOMOLY_INTERVAL_IN_HOURS = 1;

const projectRoot = path.dirname(require.main.filename);
const ASSET_DIR_PATH = path.join(projectRoot, "assets", "anomoly");

/**
 * An enum of all the possible rooms for the anomoly challenge
 */
const RoomIdentifier = Object.freeze({
	STORAGE_ROOM: "storageRoom",
	KITCHEN: "kitchen",
	HALLWAY: "hallway",
	BATHROOM: "bathroom",
	CRYOSTATIS_CHAMBER: "cyrostasisChamber"
});

/**
 * A service class for the anomoly challenge
 */
class AnomolyService {

	/**
	 * Sets up the AnomolyService with a given start time and begins scheduling messages to be sent for the anomoly challenge.
	 * @param {Date} startTime - The time at which the anomoly challenge should start.
	 */
	startChallenge(startTime) {
		this.startTime = startTime;
		this.startCronJobs();
		this.sendImageInChannels(0);
	}

	/**
	 * Fetches all the channels in the Sand Season 3 server.
	 * @returns {Promise<Object.<string, GuildChannel[]>>} A Promise that resolves with an object where the keys are strings that represent the type of channel ("storageRoom", "kitchen", "hallway", "bathroom", "cyrostasisChamber"), and the values are arrays of GuildChannel objects that are of the corresponding type.
	 */
	async fetchChannels() {
		const sandS3Guild = await fetchGuild(ids.servers.sandSeason3);

		return {
			[RoomIdentifier.STORAGE_ROOM]: [
				await fetchChannel(sandS3Guild, ids.sandSeason3.channels.team1.storageRoom),
				await fetchChannel(sandS3Guild, ids.sandSeason3.channels.team2.storageRoom),
			],
			[RoomIdentifier.KITCHEN]: [
				await fetchChannel(sandS3Guild, ids.sandSeason3.channels.team1.kitchen),
				await fetchChannel(sandS3Guild, ids.sandSeason3.channels.team2.kitchen),
			],
			[RoomIdentifier.HALLWAY]: [
				await fetchChannel(sandS3Guild, ids.sandSeason3.channels.team1.hallway),
				await fetchChannel(sandS3Guild, ids.sandSeason3.channels.team2.hallway),
			],
			[RoomIdentifier.BATHROOM]: [
				await fetchChannel(sandS3Guild, ids.sandSeason3.channels.team1.bathroom),
				await fetchChannel(sandS3Guild, ids.sandSeason3.channels.team2.bathroom),
			],
			[RoomIdentifier.CRYOSTATIS_CHAMBER]: [
				await fetchChannel(sandS3Guild, ids.sandSeason3.channels.team1.cyrostasisChamber),
				await fetchChannel(sandS3Guild, ids.sandSeason3.channels.team2.cyrostasisChamber),
			]
		}
	}

	/**
	 * Posts an image in all the channels given.
	 * @param {GuildChannel[]} channels The channels to post the image in.
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
	 *
	 * @param {number} numHour - The hour for which the images are to be sent.
	 * @param {string} [ASSET_DIR_PATH='/assets/'] - The base path where images are stored.
	 * @returns {Promise<void>} A Promise that resolves when the images have been sent.
	 */

	async sendImagesForHour(numHour) {
		for (const roomIdentifier of Object.values(RoomIdentifier)) {
			const fileName = `${roomIdentifier}${numHour}.png`;
			const imageFilePath = path.join(ASSET_DIR_PATH, fileName);
			const channels = await this.fetchChannels();
			await this.sendImageInChannels(
				channels[roomIdentifier],
				imageFilePath
			);
		}
	}

	/**
	 * Starts a cron job to send images for a specific hour.
	 * The job is scheduled to run at a calculated time based on the start time and the given hour.
	 *
	 * @param {number} numHour - The hour for which the cron job will send images.
	 */
	startCronJobForHour(numHour) {
		const now = new Date();
		const cronStartTime = this.startTime;
		cronStartTime.setSeconds(cronStartTime.getSeconds() +
			numHour * 6 * ANOMOLY_INTERVAL_IN_HOURS
		);

		const anomolyService = this;

		const sendImagesCronJob = new CronJob(
			cronStartTime,
			async function() {
				await anomolyService.sendImagesForHour(numHour);
			},
		);

		if (now < cronStartTime)
			sendImagesCronJob.start();
	}

	/**
	 * Starts a cron job to send images for each hour of the game.
	 * The jobs are scheduled to run at a calculated time based on the start time and the given hour.
	 */
	startCronJobs() {
		for (let numHour = 1; numHour <= GAME_DURATION_IN_HOURS; numHour++) {
			logInfo(`Starting cron job for hour ${numHour}`);
			this.startCronJobForHour(numHour);
		}
		logInfo(`All cron jobs have been started`);
	}
}

module.exports = AnomolyService;