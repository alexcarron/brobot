import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { HOURS_BEFORE_VOTING_TO_SEND_REMINDER } from "../../services/namesmith/constants/game-state.constants";
import { NamesmithEvents } from "../../services/namesmith/event-listeners/namesmith-events";

type EventWithoutDataKey = 'PickAPerk' | 'DayStart' | 'StartVoting' | 'EndVoting' | 'WeekStart';

const VOTING_START_REMINDER_KEY = 'VotingStartReminder';
const REFILL_REMINDER_KEY = 'RefillReminder';

const Parameters = Object.freeze({
	EVENT: new Parameter({
		type: ParameterTypes.STRING,
		name: "event",
		description: "The Namesmith event to trigger",
		autocomplete: {
			"Pick A Perk": 'PickAPerk',
			"Day Start": 'DayStart',
			"Start Voting": 'StartVoting',
			"End Voting": 'EndVoting',
			"Week Start": 'WeekStart',
			"Voting Start Reminder": VOTING_START_REMINDER_KEY,
			"Refill Reminder": REFILL_REMINDER_KEY,
		}
	}),
	HOURS_UNTIL_VOTING_STARTS: new Parameter({
		type: ParameterTypes.INTEGER,
		name: "hours-until-voting-starts",
		description: "For Voting Start Reminder: which reminder to send, by how many hours before voting starts it is",
		isOptional: true,
	}),
	PLAYER: new Parameter({
		type: ParameterTypes.USER,
		name: "player",
		description: "For Refill Reminder: which player to send the reminder to",
		isOptional: true,
	}),
});

export const command = new SlashCommand({
	name: 'trigger-event',
	description: 'Triggers a Namesmith event',
	parameters: [
		Parameters.EVENT,
		Parameters.HOURS_UNTIL_VOTING_STARTS,
		Parameters.PLAYER,
	],
	required_servers: [ids.servers.NAMESMITH],
	isInDevelopment: true,
	execute: function (interaction, {event: eventKey, hoursUntilVotingStarts, player}) {
		if (eventKey in NamesmithEvents === false)
			return `You provided an invalid event key: \`${eventKey}\``;

		if (eventKey === VOTING_START_REMINDER_KEY) {
			const hours = hoursUntilVotingStarts ?? Math.max(...HOURS_BEFORE_VOTING_TO_SEND_REMINDER);
			NamesmithEvents.VotingStartReminder.triggerEvent({ hoursUntilVotingStarts: hours });
			return `Successfully triggered the \`${eventKey}\` Namesmith event for ${hours} hours before voting starts!`;
		}

		if (eventKey === REFILL_REMINDER_KEY) {
			const playerID = player?.id ?? interaction.user.id;
			NamesmithEvents.RefillReminder.triggerEvent({ playerID });
			return `Successfully triggered the \`${eventKey}\` Namesmith event for <@${playerID}>!`;
		}

		const NamesmithEvent = NamesmithEvents[eventKey as EventWithoutDataKey];

		if (NamesmithEvent === undefined)
			return `You provided an invalid event key: \`${eventKey}\``;

		NamesmithEvent.triggerEvent({});
		return `Successfully triggered the \`${eventKey}\` Namesmith event!`;
	}
})
