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
	 * The reason for the timer.
	 * @type {string}
	 */
  get reason() {
    return this._reason;
  }
  set reason(reason) {
    this._reason = reason;
  }

	/**
	 * The amount of days before the timer ends.
	 * @type {number}
	 */
  get days() {
    return this._days;
  }
  set days(days) {
    this._days = days;
	}

	/**
	 * The amount of hours before the timer ends.
	 * @type {number}
	 */
  get hours() {
    return this._hours;
  }
  set hours(hours) {
    this._hours = hours;
	}

	/**
	 * The amount of minutes before the timer ends.
	 * @type {number}
	 */
  get minutes() {
    return this._minutes;
  }
  set minutes(minutes) {
    this._minutes = minutes;
	}

	/**
	 * The amount of seconds before the timer ends.
	 * @type {number}
	 */
  get seconds() {
    return this._seconds;
  }
  set seconds(seconds) {
    this._seconds = seconds;
	}

	/**
	 * The date and time the timer ends as the number of milliseconds since epoch.
	 * @type {number}
	 */
  get end_time() {
    return this._end_time;
  }
  set end_time(end_time) {
    this._end_time = end_time;
	}

	/**
	 * The channel id that Brobot will announce the timer.
	 * @type {string}
	 */
  get channel_id() {
    return this._channel_id;
  }
  set channel_id(channel_id) {
    this._channel_id = channel_id;
	}

	/**
	 * The guild id that Brobot will announce the timer.
	 * @type {string}
	 */
  get guild_id() {
    return this._guild_id;
  }
  set guild_id(guild_id) {
    this._guild_id = guild_id;
	}

	/**
	 * The id of the user who made the timer.
	 * @type {string}
	 */
  get user_id() {
    return this._user_id;
  }
  set user_id(user_id) {
    this._user_id = user_id;
	}

	/**
	 * Gets the channel that Brobot will announce the timer.
	 * @returns {Promise<TextChannel>} The channel that Brobot will announce the timer.
	 */
	async fetchChannel() {
		const guild = await fetchGuild(this._guild_id);
		const channel = await fetchTextChannel(guild, this._channel_id);
		return channel;
	}

	async deleteTimer() {
		global.timers = global.timers.filter((timer) => timer !== this);
		await saveObjectToJsonInGitHub({timers: global.timers}, "timers");
	}

	async endTimer() {
		const channel = await this.fetchChannel();
		await channel.send(
			`# ❗ <@${this._user_id}> Time's Up!` + "\n" +
			`>>> ${this._reason}`
		);
		await this.deleteTimer();
	}

	async startTimer() {
		const channel = await this.fetchChannel();
		await channel.send(
			`# <@${this._user_id}> started a timer` + "\n" +
			`Timer ends <t:${this._end_time/1000}:R>` + "\n" +
			`>>> ${this._reason}`
		);
		global.timers.push(this);
		await saveObjectToJsonInGitHub({timers: global.timers}, "timers");

		const now = new Date();
		const end_date = new Date(this._end_time);

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
		const end_date = new Date(this._end_time);
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