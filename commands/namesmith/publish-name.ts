import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER } from "../../services/namesmith/constants/name-publishing.constants";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { getHowToEarnMoreTokensHint, toDisplayedName } from "../../services/namesmith/utilities/player-message.utility";
import { publishName } from "../../services/namesmith/workflows/publish-name.workflow";
import { addReplyToInteraction, confirmInteractionWithButtons } from "../../utilities/discord-action-utils";
import { addSIfPlural, joinLines, toAmountOfNoun, toNumericOrdinal, toReadableNumber } from "../../utilities/string-manipulation-utils";

export const command = new SlashCommand({
	name: "publish-name",
	description: "Publishes your current name to eventually be automatically submitted for voting",
	required_servers: [ids.servers.NAMESMITH],
	execute: async function execute(interaction) {
		const { playerService, publishedNameService, questService } = getNamesmithServices();

		const playerID = interaction.user.id;

		const currentName = playerService.getCurrentName(playerID);
		const tokensOwned = playerService.getTokens(playerID);
		const nextPublishedNameSlotNumber = publishedNameService.getLowestAvailableSlotNumberOfPlayer(playerID)!;
		const nextPublishedNameCost = publishedNameService.getCostOfNextPublishedNameForPlayer(playerID);
		const availableSlots = MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER - publishedNameService.getNumPublishedNamesOfPlayer(playerID);

		if (publishedNameService.isPlayerAtPublishedNameLimit(playerID)) {
			return `You have already used all ${toAmountOfNoun(MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER, 'published name slot')}.`;
		}

		const isFree = (nextPublishedNameCost === null || nextPublishedNameCost === 0);
		const costLine = isFree 
			? "This will not cost any tokens."
			: `This will cost you **${toAmountOfNoun(nextPublishedNameCost, 'token')}**.`;

		const didConfirmAction = await confirmInteractionWithButtons({
			interaction,
			message: joinLines(
				`Are you sure you want to publish your current name, ${toDisplayedName(currentName)}, as your ${toNumericOrdinal(nextPublishedNameSlotNumber)} published name?`,
				costLine,
				`-# You have ${toAmountOfNoun(availableSlots, 'available published name slot')} remaining.`,
				isFree ? null : `-# You have ${toAmountOfNoun(tokensOwned, 'token')}.`,
			),
			confirmText: "Yes, Publish My Name",
			cancelText: "No, Don't Publish My Name",
			confirmUpdateText: `Publishing your current name, ${toDisplayedName(currentName)}...`,
			cancelUpdateText: "Canceled publishing your current name.",
		});

		if (!didConfirmAction)
			return;

		const result = publishName({ player: playerID });

		if (result.isNotAPlayer()) {
			return await addReplyToInteraction(interaction,
				"You're not a player, so you can't publish a name."
			);
		}
		else if (result.isCurrentNameEmpty()) {
			return await addReplyToInteraction(interaction,
				"You have no current name to publish."
			);
		}
		else if (result.isNameAlreadyPublished()) {
			return await addReplyToInteraction(interaction,
				`You have already published ${toDisplayedName(result.name)}.`
			);
		}
		else if (result.isAtPublishedNameLimit()) {
			return await addReplyToInteraction(interaction,
				`You have already used all ${toAmountOfNoun(result.publishedNameLimit, 'published name slot')}.`
			);
		}
		else if (result.isCannotAffordPublishedName()) {
			const { tokenCost, tokensOwned, tokensNeeded } = result;
			const howToEarnMoreTokensHint = getHowToEarnMoreTokensHint({
				hasHiddenQuestsUnlocked: questService.isHiddenQuestUnlockedForPlayer(playerID),
			});

			return await addReplyToInteraction(interaction,
				joinLines(
					`You need **${toReadableNumber(tokensNeeded)} more ${addSIfPlural('token', tokensNeeded)}** to publish this name for ${toAmountOfNoun(tokenCost, 'token')}`,
					`-# You only have **${toAmountOfNoun(tokensOwned, 'token')}**`,
					howToEarnMoreTokensHint,
				)
			);
		}

		const { slotNumber, tokensSpent, tokensRemaining } = result;
		let spentLine = undefined;

		if (tokensSpent > 0) {
			spentLine = [
				`-# This published name cost ${toAmountOfNoun(tokensSpent, 'token')}.`,
				`-# You now have ${toAmountOfNoun(tokensRemaining, 'token')}.`
			];
		}

		return await addReplyToInteraction(interaction,
			`Your current name was published as your ${toNumericOrdinal(slotNumber)} published name:`,
			`> ${toDisplayedName(currentName)}`,
			spentLine,
		);
	},
});
