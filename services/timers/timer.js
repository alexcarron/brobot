const { TextChannel } = require("discord.js");
const cron = require("cron");
const { fetchGuild, fetchTextChannel } = require("../../utilities/discord-fetch-utils");
const { saveObjectToJsonInGitHub } = require("../../utilities/github-json-storage-utils");

/**
 * Represents a timer set by Brobot.
 * @class
 */
class Timer {
	/**
	 * Constructs a new Timer instance.
	 * @param {object} [options] - The options for the timer.
	 * @param {string} [options.reason] - The reason for setting the timer.
	 * @param {number} [options.days] - The number of days for the timer.
	 * @param {number} [options.hours] - The number of hours for the timer.
	 * @param {number} [options.minutes] - The number of minutes for the timer.
	 * @param {number} [options.seconds] - The number of seconds for the timer.
	 * @param {number} [options.end_time] - The end time of the timer in milliseconds since the epoch.
	 * @param {string} [options.channel_id] - The Discord channel ID where the timer will be announced.
	 * @param {string} [options.guild_id] - The Discord guild ID associated with the timer.
	 * @param {string} [options.user_id] - The Discord user ID of the person who set the timer.
	 */
  constructor({
		reason = "",
		days = 0,
		hours = 0,
		minutes = 0,
		seconds = 0,
		end_time = 0,
		channel_id = "",
		guild_id = "",
		user_id = "",
	} = {}) {
		this.reason = reason;
		this.days = days;
		this.hours = hours;
		this.minutes = minutes;
		this.seconds = seconds;
		this.end_time = end_time;
		this.channel_id = channel_id;
		this.guild_id = guild_id;
		this.user_id = user_id;
	}

	/**
	 * Gets the channel that Brobot will announce the timer.
	 * @returns {Promise<TextChannel>} The channel that Brobot will announce the timer.
	 */
	async fetchChannel() {
		const guild = await fetchGuild(this.guild_id);
		const channel = await fetchTextChannel(guild, this.channel_id);
		return channel;
	}

	async deleteTimer() {
		global.timers = global.timers.filter((timer) => timer !== this);
		await saveObjectToJsonInGitHub({timers: global.timers}, "timers");
	}

	async endTimer() {
		const channel = await this.fetchChannel();
		await channel.send(
			`# ❗ <@${this.user_id}> Time's Up!` + "\n" +
			`>>> ${this.reason}`
		);
		await this.deleteTimer();
	}

	async startTimer() {
		const channel = await this.fetchChannel();
		await channel.send(
			`# <@${this.user_id}> started a timer` + "\n" +
			`Timer ends <t:${this.end_time/1000}:R>` + "\n" +
			`>>> ${this.reason}`
		);
		global.timers.push(this);
		await saveObjectToJsonInGitHub({timers: global.timers}, "timers");

		const now = new Date();
		const end_date = new Date(this.end_time);

		if (now >= end_date) {
			this.endTimer();
		}
		else {
			await this.startCronJob();
		}
	}

	/**
	 * Starts the cron job so that the timer ends when it's supposed to
	 */
	startCronJob() {
		const now = new Date();
		const end_date = new Date(this.end_time);
		const timer = this;

		const timer_ends_cron_job = new cron.CronJob(
			end_date,
			async function() {
				await timer.endTimer();
			},
		);

		if (now < end_date)
			timer_ends_cron_job.start();
		else
			this.deleteTimer();
	}
}

module.exports = Timer;