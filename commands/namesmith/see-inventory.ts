import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { resolveTargetPlayer } from "../../services/namesmith/utilities/interface.utility";
import { fetchPlayerAutocompleteChoices } from "../../services/namesmith/utilities/player.utility";
import { fetchUser } from "../../utilities/discord-fetch-utils";
import { escapeDiscordMarkdown, joinLines } from "../../utilities/string-manipulation-utils";

const Parameters = Object.freeze({
	PLAYER: new Parameter({
		type: ParameterTypes.STRING,
		name: "player",
		description: "The player to see the inventory of",
		isRequired: false,
		autocomplete: fetchPlayerAutocompleteChoices,
	}),
});

export const command = new SlashCommand({
	name: "see-inventory",
	description: "Sets the tokens of yourself or another player to the given amount",
	parameters: [
		Parameters.PLAYER,
	],
	required_servers: [ids.servers.NAMESMITH],
	execute: async (interaction, {player: playerID}) => {
		const { playerService } = getNamesmithServices();

		const maybePlayer = await resolveTargetPlayer({
			playerService,
			interaction,
			givenPlayerResolvable: playerID,
		});

		if (maybePlayer === null) {
			if (interaction.user.id === playerID || playerID === null) {
				return `You are not a player, so you do not have an inventory.`;
			}
			else {
				return `The given user is not a player, so they do not have an inventory.`;
			}
		}

		const player = maybePlayer;
		const user = await fetchUser(player.id);
		const inventory = playerService.getDisplayedInventory(player.id);

		let firstLine = `${user}'s inventory contains the following characters:`;
		if (interaction.user.id === player.id)
			firstLine = `Your inventory contains the following characters:`;

		return joinLines(
			firstLine,
			`> ${escapeDiscordMarkdown(inventory)}_ _`,
		);
	}
})