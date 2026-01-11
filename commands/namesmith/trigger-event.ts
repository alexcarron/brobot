import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { NamesmithEvents } from "../../services/namesmith/event-listeners/namesmith-events";

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
		}
	})
});

export const command = new SlashCommand({
	name: 'trigger-event',
	description: 'Triggers a Namesmith event',
	parameters: [
		Parameters.EVENT,
	],
	isInDevelopment: true,
	execute: function (interaction, {event: eventKey}) {
		if (eventKey in NamesmithEvents === false)
			return `You provided an invalid event key: \`${eventKey}\``;

		const NamesmithEvent = NamesmithEvents[eventKey as 'PickAPerk' | 'DayStart' | 'StartVoting' | 'EndVoting'];

		if (NamesmithEvent === undefined)
			return `You provided an invalid event key: \`${eventKey}\``;

		NamesmithEvent.triggerEvent({});
		return `Successfully triggered the \`${eventKey}\` Namesmith event!`;
	}
})