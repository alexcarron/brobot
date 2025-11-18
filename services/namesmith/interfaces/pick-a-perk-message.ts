import { ButtonStyle } from "discord.js";
import { ids } from "../../../bot-config/discord-ids";
import { joinLines, toAmountOfNoun } from "../../../utilities/string-manipulation-utils";
import { Perk } from "../types/perk.types";
import { fetchNamesmithChannel } from "../utilities/discord-fetch.utility";
import { pickPerk } from "../workflows/pick-perk.workflow";
import { replyToInteraction } from "../../../utilities/discord-action-utils";
import { DiscordButtons } from "../../../utilities/discord-interfaces/discord-buttons";
import { DiscordButtonDefinition } from '../../../utilities/discord-interfaces/discord-button';
import { ignoreError } from "../../../utilities/error-utils";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { sortByAscendingProperty } from "../../../utilities/data-structure-utils";

/**
 * Generates a messaeg that prompts the user to pick a perk.
 * @param services - An object containing the necessary services to generate the message.
 * @param services.threePerks - The perks to be displayed in the message.
 * @returns A DiscordButtons object with the prompt text and empty buttons.
 */
export function createPickAPerkMessage(
	{threePerks}: {
		threePerks: Perk[],
	},
): DiscordButtons {
	threePerks = sortByAscendingProperty(threePerks, 'id');

	const message = joinLines(
		'# Pick a Perk',
		'Choose one of the three perks below to gain a unique, permanent enhancement to your Namesmith gameplay.',
		threePerks.map(toPerkBulletPoint),
	);

	return new DiscordButtons({
		promptText: message,
		buttons: threePerks.map(perk =>
			toPerkButton({
				perk,
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
	{perk, perksPickingFrom}: {
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
				player: buttonInteraction.user.id,
				pickedPerk: perk,
				perksPickingFrom
			});

			if (result.isNotAPlayer())
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
 * @returns A promise that resolves once the message has been sent.
 */
export async function sendPickAPerkMessage(): Promise<void> {
	const {perkService} = getNamesmithServices();

	const threePerks = perkService.offerThreeRandomNewPerks();
	const pickAPerkMessage = createPickAPerkMessage({threePerks});
	const channel = await fetchNamesmithChannel(ids.namesmith.channels.PICK_A_PERK);
	await pickAPerkMessage.setIn(channel);
}

/**
 * Regenerates the 'Pick A Perk' message in the 'Pick A Perk' channel.
 * The message lists the currently offered perks and describes the benefits of choosing one.
 * @returns A promise that resolves once the message has been regenerated.
 */
export async function regeneratePickAPerkMessage(): Promise<void> {
	const {perkService} = getNamesmithServices();
	const threePerks = perkService.getCurrentlyOfferedPerks();
	if (threePerks.length < 3) return;

	const pickAPerkMessage = createPickAPerkMessage({threePerks});
	const channel = await fetchNamesmithChannel(ids.namesmith.channels.PICK_A_PERK);
	await ignoreError(pickAPerkMessage.regenerate({channel}))
}