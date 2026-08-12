import { ButtonStyle } from "discord.js";
import { ids } from "../../../bot-config/discord-ids";
import { joinLines, toAmountOfNoun } from "../../../utilities/string-manipulation-utils";
import { Perk } from "../types/perk.types";
import { fetchNamesmithChannel } from "../utilities/discord-fetch.utility";
import { pickPerk } from "../workflows/pick-perk.workflow";
import { DiscordButtons } from "../../../utilities/discord-interfaces/discord-buttons";
import { DiscordButtonDefinition } from '../../../utilities/discord-interfaces/discord-button';
import { ignoreError } from "../../../utilities/error-utils";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { Tips } from "../constants/tip.constants";
import { TipResolvable } from "../types/tip.types";
import { sortByAscendingProperty } from "../../../utilities/data-structure-utils";
import { getPingForAllPlayers, getTokensEarnedFeedback, toTipLine } from "../utilities/player-message.utility";
import { confirmInteraction } from "../../../utilities/discord-interfaces/discord-interface-utils";

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
		getPingForAllPlayers(),
		'Choose one of the three perks below to gain a unique, permanent enhancement to your Namesmith gameplay.',
		threePerks.map(toPerkBulletPoint),
		'',
		'-# ⚠️ **Warning**: Once you pick a perk, you CANNOT change it. The choice is permanent.',
	);

	return new DiscordButtons({
		promptText: message,
		buttons: threePerks.map(perk =>
			toPerkButton({perk})
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
	{perk}: {
		perk: Perk,
	}
): DiscordButtonDefinition {
	return {
		id: `pick-a-perk-button-${perk.id}`,
		label: `Get ${perk.name} Perk`,
		style: ButtonStyle.Secondary,
		onButtonPressed: async (buttonInteraction) => {
			await confirmInteraction({
				interactionToConfirm: buttonInteraction,
				confirmPromptText: `Are you sure you want to pick the ${perk.name} perk? You will NOT be able to switch perks after choosing one.`,
				confirmButtonText: `Lock In ${perk.name} Perk`,
				cancelButtonText: `Cancel`,
				onCancel: `Cancelled picking the ${perk.name} perk.`,
				onConfirm: async (confirmationInteraction) => {
					const result = pickPerk({
						player: confirmationInteraction.user.id,
						pickedPerk: perk,
					});

					if (result.isNotAPlayer())
						return await confirmationInteraction.update({
							content: 'You are not a player, so you cannot pick a perk.',
							components: [],
						});

					if (result.isPerkDoesNotExist())
						return await confirmationInteraction.update({
							content: `The perk "${perk.name}" does not exist, so you cannot pick it.`,
							components: [],
						});

					if (result.isPerkAlreadyChosen()) {
						return await confirmationInteraction.update({
							content: `You already picked a perk. You cannot switch perks after picking one.`,
							components: [],
						});
					}

					if (result.isPlayerAlreadyHasPerk()) {
						return await confirmationInteraction.update({
							content: `You already have the "${perk.name}" perk. You cannot have two of the same perk.`,
							components: [],
						});
					}

					const {freeTokensEarned} = result;

					const lostTokensLine = (freeTokensEarned < 0)
						? `**-${toAmountOfNoun(-freeTokensEarned, 'Token')}**`
						: null;

					const { tipService, mysteryBoxService } = getNamesmithServices();

					if (freeTokensEarned > 0) {
						const tipCandidates: TipResolvable[] = [];
						if (mysteryBoxService.canPlayerAffordCheapestMysteryBox(confirmationInteraction.user.id))
							tipCandidates.push(Tips.HOW_TO_BUY_MYSTERY_BOX.key);
						tipCandidates.push(Tips.HOW_TO_SEE_PERKS.key);

						const tipMessage = tipService.getAndViewFirstTipPlayerShouldSee(confirmationInteraction.user.id, tipCandidates);
						const tipLine = toTipLine(tipMessage);

						return await confirmationInteraction.update({
							content: joinLines(
								`You now have the "${perk.name}" perk!`,
								getTokensEarnedFeedback(freeTokensEarned),
								tipLine,
							),
							components: [],
						});
					}
					else {
						const tipMessage = tipService.getAndViewTipIfPlayerShouldSeeIt(confirmationInteraction.user.id, Tips.HOW_TO_SEE_PERKS.key);
						const tipLine = toTipLine(tipMessage);

						return await confirmationInteraction.update({
							content: joinLines(
								lostTokensLine,
								`You now have the "${perk.name}" perk!`,
								tipLine,
							),
							components: [],
						});
					}
				}
			});
		},
	};
}

/**
 * Sends a message to the 'Pick A Perk' channel asking the user to choose one of the given perks.
 * The message lists the perks and describes the benefits of choosing one.
 * @param threePerks - The perks to be displayed in the message.
 * @returns A promise that resolves once the message has been sent.
 */
export async function sendPickAPerkMessage(
	threePerks: Perk[],
): Promise<void> {
	const pickAPerkMessage = createPickAPerkMessage({threePerks});
	const channel = await fetchNamesmithChannel(ids.namesmith.channels.PICK_A_PERK);
	await pickAPerkMessage.setNewMessageIn(channel);
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