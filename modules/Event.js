const { getGuild, getChannel, getUser, saveObjectToGitHubJSON } = require("./functions");
const Viewer = require("./viewer");
const ids = require("../databases/ids.json");
const { GuildScheduledEventManager, Message, GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType } = require("discord.js");
const cron = require("cron");

/**
 * Represents a LL Game Show Discord event.
 * @class
 */
class Event {
  /**
   * Create an event.
   */
  constructor({
		_name,
		_host,
		_plan,
		_instructions,
		_summary,
		_time,
		_ping_role_ids
	}) {
		this.name = _name;
		this.setHost(_host);
		this.plan = _plan;
		this.instructions = _instructions;
		this.summary = _summary;
		this.time = _time;
		this.ping_role_ids = _ping_role_ids;
	}

	/**
	 * The name of the event.
	 * @type {string}
	 */
  get name() {
    return this._name;
  }
  set name(value) {
    this._name = value;
  }

	/**
	 * The viewer who is hosting the event.
	 * @type {Viewer}
	 */
  get host() {
    return this._host;
  }
  set host(host) {
    this._host = host;
  }
	async setHost(host) {
		console.log({host});
		if (!(host instanceof Viewer) && host) {
			host = await global.LLPointManager.getViewerById(host.user_id);
		}
    this._host = host;
	}

	/**
	 * A description of the host's plan for the event.
	 * @type {string}
	 */
  get plan() {
    return this._plan;
  }
  set plan(plan) {
    this._plan = plan;
  }

	/**
	 * The instructions for how to participate in the event.
	 * @type {string}
	 */
  get instructions() {
    return this._instructions;
  }
  set instructions(instructions) {
    this._instructions = instructions;
  }

	/**
	 * A concise, enticing summary of the event.
	 * @type {string}
	 */
  get summary() {
    return this._summary;
  }
  set summary(summary) {
    this._summary = summary;
  }

	/**
	 * The time the event will be held in unix timestamp format.
	 * @type {number}
	 */
  get time() {
    return this._time;
  }
  set time(time) {
    this._time = time;
  }

	/**
	 * The date the event will be held
	 * @type {Date}
	 */
	get date() {
		return new Date(this._time * 1000)
	}

	/**
	 * The ids of the ping roles to ping for the event
	 * @type {string[]}
	 */
  get ping_role_ids() {
    return this._ping_role_ids;
  }
  set ping_role_ids(ping_role_ids) {
    this._ping_role_ids = ping_role_ids;
  }

	/**
	 * Announces event for the first time in announcements channel to give time for it
	 * @return {Promise<Message>} Message sent
	 */
	async announceEvent() {
		const ll_game_shows_guild = await getGuild(ids.ll_game_shows.server_id);
		const announce_channel = await getChannel(ll_game_shows_guild, ids.ll_game_shows.channels.game_show_announcements);

		const event_manager = new GuildScheduledEventManager(ll_game_shows_guild)

		const guild_scheduled_event = await event_manager.create({
				name: this._name,
				scheduledStartTime: this.date,
				privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
				entityType: GuildScheduledEventEntityType.Voice,
				description: this._summary,
				channel: ids.ll_game_shows.channels.events_vc,
				image: null
		});

		const event_invite_url = await guild_scheduled_event.createInviteURL({
			maxAge: 0,
		});

		const message =
			`# ${this._name} (Coming Soon)` + "\n" +
			`> **What**: ${this._summary}` + "\n" +
			`> **When**: **<t:${this._time}:F>** <t:${this._time}:R>` + "\n" +
			`> **Where**: ${event_invite_url}` + "\n" +
			`<@&${ids.ll_game_shows.roles.all_discord_events}> <@&${ids.ll_game_shows.roles.self_hosted_games}>`;
			// "";

		return await announce_channel.send(message);
	}

	/**
	 * Announces event 10 minutes before it begins and warns the host
	 * @return {Promise<Message>} Message sent
	 */
	async announceEventWarning() {
		const ll_game_shows_guild = await getGuild(ids.ll_game_shows.server_id);
		const event_channel = await getChannel(ll_game_shows_guild, ids.ll_game_shows.channels.events_text_chat);

		const message =
			`# ${this._name} (Starting <t:${this._time + 60*5}:R>)` + "\n" +
			`<@&${ids.ll_game_shows.roles.all_discord_events}> <@&${ids.ll_game_shows.roles.self_hosted_games}>` + "\n" +
			`## To Participate` + "\n" +
			`>>> ${this._instructions}`;

		if (this._host) {
			const host_user = await getUser(this._host.user_id);
			host_user.send(
				`Your event is starting very soon! Make sure you're set up and ready. Here's the plan you left for yourself` + "\n" +
				`>>> ${this._plan}`
			);
		}

		return await event_channel.send(message);
	}

	/**
	 * Announces event when it starts
	 * @return {Promise<Message>} Message sent
	 */
	async announceEventStarting() {
		const ll_game_shows_guild = await getGuild(ids.ll_game_shows.server_id);
		const event_channel = await getChannel(ll_game_shows_guild, ids.ll_game_shows.channels.events_text_chat);

		const message =
			`# ❗ STARTING NOW: ${this._name}` + "\n" +
			`<@&${ids.ll_game_shows.roles.all_discord_events}> <@&${ids.ll_game_shows.roles.self_hosted_games}>` + "\n" +
			`## Last Minute Joiners` + "\n" +
			`>>> ${this._instructions}`;


		for (const property of Object.values(this)) {
			console.log(property)
		}

		if (this._host) {
			const host_user = await getUser(this._host.user_id);
			host_user.send(
				`Your event is starting RIGHT NOW!`
			);
		}

		global.events = global.events.filter((event) => event !== this);
		await saveObjectToGitHubJSON({events: global.events}, "events");

		return await event_channel.send(message);
	}

	async restartCronJobs() {
		const now = new Date();
		const warning_date = new Date((this._time - 60*10) * 1000);
		const start_date = new Date((this._time + 60*5) * 1000);
		const this_event = this;
		const event_warning_cron_job = new cron.CronJob(
			warning_date,
			async function() {
				await this_event.announceEventWarning();
			},
		);

		if (now < warning_date)
			event_warning_cron_job.start();

		const event_start_cron_job = new cron.CronJob(
			start_date,
			async function() {
				await this_event.announceEventStarting();
			},
		);

		if (now < start_date)
			event_start_cron_job.start();
	}
}

module.exports = Event;