import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterType } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { Player } from "../../services/namesmith/types/player.types";
import { deferInteraction, replyToInteraction } from "../../utilities/discord-action-utils";
import { getRequiredStringParam, getStringParamValue } from "../../utilities/discord-fetch-utils";

const Parameters = Object.freeze({
	INVENTORY: new Parameter({
		type: ParameterType.STRING,
		name: "inventory",
		description: "The inventory to give to the player"
	}),
	PLAYER: new Parameter({
		type: ParameterType.STRING,
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
	execute: async (interaction) => {
		await deferInteraction(interaction);

		const { playerService } = getNamesmithServices();

		const inventory = getRequiredStringParam(interaction, Parameters.INVENTORY);
		const playerNameOrUsernameOrID = getStringParamValue(interaction, Parameters.PLAYER);
		const playerParamGiven = playerNameOrUsernameOrID !== null;
		let player: Player | null;

		if (playerParamGiven) {
			player = await playerService.resolvePlayerFromString(playerNameOrUsernameOrID);


			if (player === null) {
				return await replyToInteraction(interaction,
					`The given player was not found: ${playerNameOrUsernameOrID}`
				);
			}
		}
		else {
			player = playerService.getPlayerRunningCommand(interaction);

			if (player === null) {
				return await replyToInteraction(interaction,
					`You must be be a player or specify a player to give the inventory to.`
				)
			}
		}

		playerService.setInventory(player.id, inventory);

		return await replyToInteraction(interaction,
			`${player.currentName}'s inventory has been set to: ${inventory}`
		);
	}
})