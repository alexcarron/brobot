import { ButtonStyle } from "discord.js";
import { ids } from "../../../bot-config/discord-ids";
import { joinLines, toAmountOfNoun } from "../../../utilities/string-manipulation-utils";
import { PerkService } from "../services/perk.service";
import { PlayerService } from "../services/player.service";
import { Perk } from "../types/perk.types";
import { fetchNamesmithChannel } from "../utilities/discord-fetch.utility";
import { pickPerk } from "../workflows/pick-perk.workflow";
import { replyToInteraction } from "../../../utilities/discord-action-utils";
import { DiscordButtons } from "../../../utilities/discord-interfaces/discord-buttons";
import { DiscordButtonDefinition } from '../../../utilities/discord-interfaces/discord-button';
import { ignoreError } from "../../../utilities/error-utils";

/**
 * Generates a messaeg that prompts the user to pick a perk.
 * @param services - An object containing the necessary services to generate the message.
 * @param services.playerService - The player service to use to get the player.
 * @param services.perkService - The perk service to use to get the perks.
 * @returns A DiscordButtons object with the prompt text and empty buttons.
 */
export function getPickAPerkMessage(
	{threePerks, playerService, perkService}: {
		threePerks: Perk[],
		playerService: PlayerService,
		perkService: PerkService
	},
): DiscordButtons {
	const message = joinLines(
		'# Pick a Perk',
		'Choose one of the three perks below to gain a unique, permanent enhancement to your Namesmith gameplay.',
		threePerks.map(toPerkBulletPoint),
	);

	return new DiscordButtons({
		promptText: message,
		buttons: threePerks.map(perk =>
			toPerkButton({
				playerService, perkService, perk,
				perksPickingFrom: threePerks
			})
		),
	});
}

export const toPerkBulletPoint = (perk: Perk) =>
	`- **${perk.name}**: ${perk.description}`;

/**
 * Converts a Perk object to a DiscordButtonDefinition.
 * @param parameters - An object containing the following parameters:
 * @param parameters.playerService - The player service to use to get the player.
 * @param parameters.perkService - The perk service to use to get the perks.
 * @param parameters.perk - The Perk object to be converted.
 * @param parameters.perksPickingFrom - The perks that the player is picking from.
 * @returns A DiscordButtonDefinition with the specified properties.
 */
export function toPerkButton(
	{playerService, perkService, perk, perksPickingFrom}: {
		playerService: PlayerService,
		perkService: PerkService,
		perk: Perk,
		perksPickingFrom: Perk[],
	}
): DiscordButtonDefinition {
	return {
		id: `pick-a-perk-button-${perk.id}`,
		label: `Get ${perk.name} Perk`,
		style: ButtonStyle.Secondary,
		onButtonPressed: async (buttonInteraction) => {
			const result = pickPerk({
				playerService,
				perkService,
				player: buttonInteraction.user.id,
				pickedPerk: perk,
				perksPickingFrom
			});

			if (result.isNonPlayer())
				return await replyToInteraction(buttonInteraction,
					'You are not a player, so you cannot pick a perk.'
				);

			if (result.isPerkDoesNotExist())
				return await replyToInteraction(buttonInteraction,
					`The perk "${perk.name}" does not exist, so you cannot pick it.`
				);

			if (result.isPlayerAlreadyHasThatPerk())
				return await replyToInteraction(buttonInteraction,
					`You already picked the "${perk.name}" perk!`
				);

			const {perkBeingReplaced, freeTokensEarned} = result;

			const lostTokensLine = (freeTokensEarned < 0)
				? `**-${toAmountOfNoun(-freeTokensEarned, 'Token')}**`
				: null;

			if (freeTokensEarned > 0)
				return await replyToInteraction(buttonInteraction,
					`**+${toAmountOfNoun(freeTokensEarned, 'Token')}**`, '🪙'.repeat(freeTokensEarned)
				);
			else if (perkBeingReplaced === null)
				return await replyToInteraction(buttonInteraction,
					lostTokensLine,
					`You now have the "${perk.name}" perk!`
				);
			else
				return await replyToInteraction(buttonInteraction,
					lostTokensLine,
					`You have replaced the "${perkBeingReplaced.name}" perk with the "${perk.name}" perk.`
				);
		},
	};
}

/**
 * Sends a message to the 'Pick A Perk' channel asking the user to choose one of the given perks.
 * The message lists the perks and describes the benefits of choosing one.
 * @param services - The services to use to get the perks.
 * @param services.playerService - The player service to use to get the player.
 * @param services.perkService - The perk service to use to get the perks.
 * @returns A promise that resolves once the message has been sent.
 */
export async function sendPickAPerkMessage(
	services: {
		playerService: PlayerService,
		perkService: PerkService
	},
): Promise<void> {
	const threePerks = services.perkService.offerThreeRandomNewPerks();
	const pickAPerkMessage = getPickAPerkMessage({
		...services,
		threePerks
	});
	const channel = await fetchNamesmithChannel(ids.namesmith.channels.PICK_A_PERK);
	await pickAPerkMessage.setIn(channel);
}

/**
 * Regenerates the 'Pick A Perk' message in the 'Pick A Perk' channel.
 * The message lists the currently offered perks and describes the benefits of choosing one.
 * @param services - The services to use to get the perks.
 * @param services.playerService - The player service to use to get the player.
 * @param services.perkService - The perk service to use to get the currently offered perks.
 * @returns A promise that resolves once the message has been regenerated.
 */
export async function regeneratePickAPerkMessage(
	services: {
		playerService: PlayerService,
		perkService: PerkService
	}
): Promise<void> {
	const threePerks = services.perkService.getCurrentlyOfferedPerks();
	if (threePerks.length < 3) return;

	const pickAPerkMessage = getPickAPerkMessage({
		...services,
		threePerks
	});
	const channel = await fetchNamesmithChannel(ids.namesmith.channels.PICK_A_PERK);
	await ignoreError(pickAPerkMessage.regenerate({channel}))
}