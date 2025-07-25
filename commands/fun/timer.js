const { SlashCommand } = require('../../services/command-creation/slash-command');
const { Parameter } = require('../../services/command-creation/parameter');
const { createNowUnixTimestamp } = require('../../utilities/date-time-utils.js');
const Timer = require('../../services/timers/timer.js');

const Parameters = {
	ReasonForTimer: new Parameter({
		type: "string",
		name: "reason-for-timer",
		description: "The reason you're making this timer and what Brobot will yell at you when it's over",
		isRequired: true,
	}),
	Days: new Parameter({
		type: "integer",
		name: "days",
		description: "The number of days your timer will last",
		min_value: 0,
		isRequired: false,
	}),
	Hours: new Parameter({
		type: "integer",
		name: "hours",
		description: "The number of hours your timer will last",
		min_value: 0,
		max_value: 59,
		isRequired: false,
	}),
	Minutes: new Parameter({
		type: "integer",
		name: "minutes",
		description: "The number of minutes your timer will last",
		min_value: 0,
		max_value: 59,
		isRequired: false,
	}),
	Seconds: new Parameter({
		type: "integer",
		name: "seconds",
		description: "The number of seconds your timer will last",
		min_value: 0,
		max_value: 59,
		isRequired: false,
	}),
}

module.exports = new SlashCommand({
	name: "timer",
	description: "Create a timer to for yourself",
	allowsDMs: true,
	parameters: [
		Parameters.ReasonForTimer,
		Parameters.Days,
		Parameters.Hours,
		Parameters.Minutes,
		Parameters.Seconds,
	],
	execute: async function(interaction) {
		await interaction.deferReply({ ephemeral: true });
		await interaction.editReply("Loading...");

		const reason_for_timer = interaction.options.getString(Parameters.ReasonForTimer.name);
		const days = interaction.options.getInteger(Parameters.Days.name);
		const hours = interaction.options.getInteger(Parameters.Hours.name);
		const minutes = interaction.options.getInteger(Parameters.Minutes.name);
		const seconds = interaction.options.getInteger(Parameters.Seconds.name);

		if (
			days === null &&
			hours === null &&
			minutes === null &&
			seconds === null
		) {
			await interaction.editReply("You must specify a duration for the timer.");
			return;
		}

		let now_unix_timestamp = createNowUnixTimestamp();

		if (days !== undefined && days !== null) {
			now_unix_timestamp += days*60*60*24;
		}
		else if (hours !== undefined && hours !== null) {
			now_unix_timestamp += hours*60*60;
		}
		else if (minutes !== undefined && minutes !== null) {
			now_unix_timestamp += minutes*60;
		}
		else if (seconds !== undefined && seconds !== null) {
			now_unix_timestamp += seconds;
		}

		const timer = new Timer({});
		timer.reason = reason_for_timer;
		timer.days = days ?? 0;
		timer.hours = hours ?? 0;
		timer.minutes = minutes ?? 0;
		timer.seconds = seconds ?? 0;
		timer.end_time = now_unix_timestamp*1000;
		timer.channel_id = interaction.channel.id;
		timer.guild_id = interaction.guild.id;
		timer.user_id = interaction.user.id;

		await timer.startTimer();

		await interaction.editReply("`Timer created.`");
	}
});