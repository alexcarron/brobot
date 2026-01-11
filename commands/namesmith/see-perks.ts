import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { fetchPlayerAutocompleteChoices } from "../../services/namesmith/utilities/player.utility";
import { fetchUser } from "../../utilities/discord-fetch-utils";
import { joinLines } from "../../utilities/string-manipulation-utils";
import { resolveTargetPlayer } from "../../services/namesmith/utilities/interface.utility";
import { toPerkBulletPoint } from "../../services/namesmith/interfaces/pick-a-perk-message";

const Parameters = Object.freeze({
	PLAYER: new Parameter({
		type: ParameterTypes.STRING,
		name: "player",
		description: "The player to see the current perks of",
		isRequired: false,
		autocomplete: fetchPlayerAutocompleteChoices,
	}),
});

export const command = new SlashCommand({
	name: "see-perks",
	description: "Shows you the current perks of yourself or another player",
	parameters: [
		Parameters.PLAYER,
	],
	required_servers: [ids.servers.NAMESMITH],
	execute: async (interaction, {player: playerID}) => {
		const { playerService, perkService } = getNamesmithServices();

		const maybePlayer = await resolveTargetPlayer({
			playerService,
			interaction,
			givenPlayerResolvable: playerID,
		});

		if (maybePlayer === null) {
			if (interaction.user.id === playerID || playerID === null) {
				return `You are not a player, so you do not have any perks.`;
			}
			else {
				return `The given user is not a player, so they do not have any perks.`;
			}
		}

		const player = maybePlayer;
		const user = await fetchUser(player.id);
		const perks = perkService.getPerksOfPlayer(player);

		let firstLine = `${user}'s current perks are the following:`;
		if (interaction.user.id === player.id)
			firstLine = `Your current perks are the following:`;

		const perkStrings = perks.map((perk) => {
			return toPerkBulletPoint(perk);
		});

		return joinLines(
			firstLine,
			...perkStrings,
		);
	}
})
