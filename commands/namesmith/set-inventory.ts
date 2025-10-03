import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { resolveTargetPlayer } from "../../services/namesmith/utilities/interface.utility";

const Parameters = Object.freeze({
	INVENTORY: new Parameter({
		type: ParameterTypes.STRING,
		name: "inventory",
		description: "The inventory to give to the player"
	}),
	PLAYER: new Parameter({
		type: ParameterTypes.STRING,
		name: "player",
		description: "The player to give the inventory to",
		isRequired: false,
	}),
});

export const command = new SlashCommand({
	name: "set-inventory",
	description: "Sets the inventory of yourself or another player to the given characters",
	parameters: [
		Parameters.INVENTORY,
		Parameters.PLAYER,
	],
	required_servers: [ids.servers.NAMESMITH],
	isInDevelopment: true,
	execute: async (interaction, {inventory, player: playerResolvable}) => {
		const { playerService } = getNamesmithServices();

		const maybePlayer = await resolveTargetPlayer({
			playerService,
			interaction,
			givenPlayerResolvable: playerResolvable,
		});

		if (maybePlayer === null) {
			return `Could not find player. Given player identifier was an invalid name, username, or ID, and/or you are not a player.`;
		}

		const player = maybePlayer;

		playerService.setInventory(player.id, inventory);

		return `${player.currentName}'s inventory has been set to: ${inventory}`;
	}
})