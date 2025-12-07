import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { Perks } from "../../services/namesmith/constants/perks.constants";
import { NamesmithEvents } from "../../services/namesmith/event-listeners/namesmith-events";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { resolveTargetPlayer } from "../../services/namesmith/utilities/interface.utility";
import { mapToObject } from "../../utilities/data-structure-utils";

const Parameters = Object.freeze({
	PERK: new Parameter({
		type: ParameterTypes.STRING,
		name: "perk",
		description: "The perk to give to the player",
		autocomplete: mapToObject(Object.values(Perks), (perk) =>
			({[perk.name]: perk.id.toString()})
		),
	}),
	PLAYER: new Parameter({
		type: ParameterTypes.STRING,
		name: "player",
		description: "The player to give the perk",
		isRequired: false,
	}),
});

export const command = new SlashCommand({
	name: "give-perk",
	description: "Gives yourself or another player a perk",
	parameters: [
		Parameters.PERK,
		Parameters.PLAYER,
	],
	required_servers: [ids.servers.NAMESMITH],
	isInDevelopment: true,
	execute: async (interaction, {perk: perkIDString, player: playerResolvable}) => {
		const { playerService, perkService } = getNamesmithServices();

		const perkID = parseInt(perkIDString);
		const perk = perkService.resolvePerk(perkID);
		const maybePlayer = await resolveTargetPlayer({
			playerService,
			interaction,
			givenPlayerResolvable: playerResolvable,
		});

		if (maybePlayer === null) {
			return `Could not find player. Given player identifier was an invalid name, username, or ID, and/or you are not a player.`;
		}

		NamesmithEvents.DayStart.triggerEvent({});

		const player = maybePlayer;
		if (perkService.doesPlayerHave(perkID, player)) {
			return `${maybePlayer.currentName} already has the ${perk.name} perk.`;
		}

		perkService.giveToPlayer(perkID, player);

		return `${maybePlayer.currentName} has been given the ${perk.name} perk.`;
	}
})