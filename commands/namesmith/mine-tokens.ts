import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { MINE_BONUS_BONUS_TOKENS } from "../../services/namesmith/constants/perks.constants";
import { Tips } from "../../services/namesmith/constants/tips.constants";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { TipResolvable } from "../../services/namesmith/types/tip.types";
import { getTokensEarnedFeedback, toDisplayedCharactersInline, toTipLine, toTokenEmojis } from "../../services/namesmith/utilities/player-message.utility";
import { mineOneLayer } from "../../services/namesmith/workflows/mine-tokens.workflow";
import { joinLines, toAmountOfNoun } from "../../utilities/string-manipulation-utils";

export const command = new SlashCommand({
	name: "mine-tokens",
	description: "Mines a small amount of tokens",
	required_servers: [ids.servers.NAMESMITH],
	required_channels: [ids.namesmith.channels.MINE_TOKENS],
	execute: function execute(interaction) {
		const { tipService, playerService, mysteryBoxService } = getNamesmithServices();

		const result = mineOneLayer({
			player: interaction.user.id,
			currentLayerNumber: 1,
			tokensMinedThisSession: 0,
		})

		if (result.isNotAPlayer())
			return `You're not a player, so you can't mine tokens.`;

		const { tokensGained, characterDiscovered, newTokenCount, hasMineBonusPerk } = result;

		let baseMessage = getTokensEarnedFeedback(tokensGained, {isOneLine: true});

		if (hasMineBonusPerk) {
			const baseTokensGained = tokensGained - MINE_BONUS_BONUS_TOKENS;
			baseMessage =
				getTokensEarnedFeedback(baseTokensGained, {isOneLine: true}) + `\n` +
				`+${toAmountOfNoun(MINE_BONUS_BONUS_TOKENS, 'Bonus Token')} ${toTokenEmojis(MINE_BONUS_BONUS_TOKENS)}`;
		}

		if (characterDiscovered !== null) {
			baseMessage += `\nYou dug up a character: ${toDisplayedCharactersInline(characterDiscovered)}`;
		}

		const possibleTipKeys: TipResolvable[] = [];

		const canAffordCheapestMysteryBox = mysteryBoxService.canPlayerAffordCheapestMysteryBox(interaction.user.id);
		if (canAffordCheapestMysteryBox)
			possibleTipKeys.push(Tips.HOW_TO_BUY_MYSTERY_BOX.key);

		const hasNeverClaimedRefill = playerService.getLastClaimedRefillTime(interaction.user.id) === null;
		if (hasNeverClaimedRefill)
			possibleTipKeys.push(Tips.HOW_TO_CLAIM_REFILL_FOR_MORE_TOKENS.key);

		if (!canAffordCheapestMysteryBox)
			possibleTipKeys.push(Tips.HOW_TO_EARN_MORE_WITH_QUESTS.key);

		const tipMessage = tipService.getAndViewFirstTipPlayerShouldSee(interaction.user.id, possibleTipKeys);
		const tipLine = toTipLine(tipMessage);

		return joinLines(
			baseMessage,
			`-# You now have ${toAmountOfNoun(newTokenCount, 'token')}`,
			tipLine,
		);
	}
});