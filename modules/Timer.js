const { getGuild, getChannel, getUser, saveObjectToGitHubJSON } = require("./functions");
const Viewer = require("./viewer");
const ids = require("../bot-config/discord-ids.json");
const { GuildScheduledEventManager, Message, GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType, TextChannel } = require("discord.js");
const cron = require("cron");

/**
 * Represents a timer set by Brobot.
 * @class
 */
class Timer {
  /**
   * Create an event.
   */
  constructor({
		_reason,
		_days,
		_hours,
		_minutes,
		_seconds,
		_end_time,
		_channel_id,
		_guild_id,
		_user_id,
	}) {
		this.reason = _reason;
		this.days = _days;
		this.hours = _hours;
		this.minutes = _minutes;
		this.seconds = _seconds;
		this.end_time = _end_time;
		this.channel_id = _channel_id;
		this.guild_id = _guild_id;
		this.user_id = _user_id;
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
	 * @returns {Promise<TextChannel>}
	 */
	async getChannel() {
		const guild = await getGuild(this._guild_id);
		const channel = await getChannel(guild, this._channel_id);
		return channel;
	}

	async deleteTimer() {
		console.log(global.timers);
		global.timers = global.timers.filter((timer) => timer !== this);
		await saveObjectToGitHubJSON({timers: global.timers}, "timers");
		console.log(global.timers);

	}

	async endTimer() {
		const channel = await this.getChannel();
		await channel.send(
			`# ❗ <@${this._user_id}> Time's Up!` + "\n" +
			`>>> ${this._reason}`
		);
		await this.deleteTimer();
	}

	async startTimer() {
		await this.startCronJob();
		const channel = await this.getChannel();
		await channel.send(
			`# <@${this._user_id}> started a timer` + "\n" +
			`Timer ends <t:${this._end_time/1000}:R>` + "\n" +
			`>>> ${this._reason}`
		);
		global.timers.push(this);
		await saveObjectToGitHubJSON({timers: global.timers}, "timers");

		const now = new Date();
		const end_date = new Date(this._end_time);

		if (now >= end_date) {
			this.endTimer();
		};
	}

	/**
	 * Starts the cron job so that the timer ends when it's supposed to
	 */
	async startCronJob() {
		const now = new Date();
		const end_date = new Date(this._end_time);
		console.log({end_date});
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