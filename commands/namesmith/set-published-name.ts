import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER } from "../../services/namesmith/constants/name-publishing.constants";
import { forcePlayerToPublishNameInSlot } from "../../services/namesmith/mocks/mock-data/mock-players";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { getInvalidPlayerMessageOrPlayer } from "../../services/namesmith/utilities/interface.utility";
import { toDisplayedName } from "../../services/namesmith/utilities/player-message.utility";
import { fetchPlayerAutocompleteChoices } from "../../services/namesmith/utilities/player.utility";
import { fetchUser } from "../../utilities/discord-fetch-utils";
import { joinLines, toNumericOrdinal } from "../../utilities/string-manipulation-utils";
import { isString } from "../../utilities/types/type-guards";

const Parameters = Object.freeze({
	CURRENT_NAME: new Parameter({
		type: ParameterTypes.STRING,
		name: "published-name",
		description: "The name to make the player publish"
	}),
	PLAYER: new Parameter({
		type: ParameterTypes.STRING,
		name: "player",
		description: "The player to set the published name of",
		isRequired: false,
		autocomplete: fetchPlayerAutocompleteChoices,
	}),
	SLOT: new Parameter({
		type: ParameterTypes.INTEGER,
		name: "slot",
		description: `Which published name slot to overwrite (1-${MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER}). Defaults to the player's next available slot.`,
		isRequired: false,
	}),
});

export const command = new SlashCommand({
	name: "set-published-name",
	description: "Sets one of the published names of yourself or another player to the given characters",
	parameters: [
		Parameters.CURRENT_NAME,
		Parameters.PLAYER,
		Parameters.SLOT,
	],
	required_servers: [ids.servers.NAMESMITH],
	isInDevelopment: true,
	execute: async (interaction, {publishedName, player: playerResolvable, slot}) => {
		const messageOrPlayer = await getInvalidPlayerMessageOrPlayer(interaction, playerResolvable, 'a published name');
		if (isString(messageOrPlayer)) return messageOrPlayer;

		const player = messageOrPlayer;
		const user = await fetchUser(player.id);

		let slotNumber = slot;
		if (slotNumber === null || slotNumber === undefined) {
			const { publishedNameService } = getNamesmithServices();
			const lowestAvailableSlotNumber = publishedNameService.getLowestAvailableSlotNumberOfPlayer(player.id);

			if (lowestAvailableSlotNumber === null) {
				return `${user} has no available published name slot. All ${MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER} of their published name slots are used. Specify a slot to overwrite one directly.`;
			}

			slotNumber = lowestAvailableSlotNumber;
		}
		else if (slotNumber < 1 || slotNumber > MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER) {
			return `Slot must be between 1 and ${MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER}.`;
		}

		forcePlayerToPublishNameInSlot(player.id, publishedName, slotNumber);

		let firstPart = `${user} has been forced to publish the following name in their ${toNumericOrdinal(slotNumber)} published name slot: `;

		if (interaction.user.id === player.id)
			firstPart = `You have been forced to publish the following name in your ${toNumericOrdinal(slotNumber)} published name slot: `;

		return joinLines(
			firstPart,
			`> ${toDisplayedName(publishedName)}`
		);
	}
})
