import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { Tips } from "../../services/namesmith/constants/tip.constants";
import { joinLines, toAmountOfNoun } from "../../utilities/string-manipulation-utils";
import { claimRefill } from "../../services/namesmith/workflows/claim-refill.workflow";
import { toUnixTimestamp } from "../../utilities/date-time-utils";
import { getTokensEarnedFeedback, toTipLine, toTokenEmojis } from "../../services/namesmith/utilities/player-message.utility";
import { replyToInteraction } from "../../utilities/discord/interaction-reply-utils";
import { DiscordButton } from "../../utilities/discord-interfaces/discord-button";
import { getRefillReminderToggleButton } from "../../services/namesmith/interfaces/refill-reminders/refill-reminder-toggle-button";
import { TipResolvable } from "../../services/namesmith/types/tip.types";

export const command = new SlashCommand({
	name: "claim-refill",
	description: "Claim your refill of a decent amount of tokens every so often.",
	required_servers: [ids.servers.NAMESMITH],
	required_channels: [ids.namesmith.channels.CLAIM_REFILL],
	execute: async function execute(interaction) {
		const { playerService, tipService, mysteryBoxService } = getNamesmithServices();

		const refillResult = claimRefill({
			...getNamesmithServices(),
			playerRefilling: interaction.user.id,
		});

		let replyText: string;
		const hasRefillReminderEnabled = playerService.hasRefillReminderEnabled(interaction.user.id);

		if (refillResult.isNotAPlayer()) {
			replyText = `You're not a player, so you can't claim a refill of tokens.`;
		}
		else if (refillResult.isRefillAlreadyClaimed()) {
			const possibleTipKeys: TipResolvable[] = [];
			if (!hasRefillReminderEnabled)
				possibleTipKeys.push(Tips.HOW_TO_ENABLE_REFILL_REMINDERS.key);

			const tipMessage = tipService.getAndViewFirstTipPlayerShouldSee(interaction.user.id, possibleTipKeys);
			const tipLine = toTipLine(tipMessage);

			replyText = joinLines(
				`You've already claimed your refill.`,
				`Don't worry, your next refill is available <t:${toUnixTimestamp(refillResult.nextRefillTime)}:R>`,
				tipLine,
			);
		}
		else {
			const { baseTokensEarned, newTokenCount, nextRefillTime, tokensFromRefillBonus, tokensFromLuckyDoubleTokens } = refillResult;

			const baseTokensLine = getTokensEarnedFeedback(baseTokensEarned);

			const luckyDoubleTokensLine = (tokensFromLuckyDoubleTokens > 0)
				? joinLines(
					'',
					`+${toAmountOfNoun(baseTokensEarned, 'Lucky Double Token')}`,
					toTokenEmojis(tokensFromLuckyDoubleTokens),
				)
				: null;

			const refillBonusLine = (tokensFromRefillBonus > 0)
				? joinLines(
					'',
					`+${toAmountOfNoun(tokensFromRefillBonus, 'Refill Bonus Token')}`,
					toTokenEmojis(tokensFromRefillBonus),
				)
				: null;

			const possibleTipKeys1: TipResolvable[] = [];

			if (mysteryBoxService.canPlayerAffordCheapestMysteryBox(interaction.user.id))
				possibleTipKeys1.push(Tips.HOW_TO_BUY_MYSTERY_BOX.key);

			const tipMessage1 = tipService.getAndViewFirstTipPlayerShouldSee(interaction.user.id, possibleTipKeys1);
			const tipLine1 = toTipLine(tipMessage1);

			const possibleTipKeys2: TipResolvable[] = [];

			if (!hasRefillReminderEnabled)
				possibleTipKeys2.push(Tips.HOW_TO_ENABLE_REFILL_REMINDERS.key);

			const tipMessage2 = tipService.getAndViewFirstTipPlayerShouldSee(interaction.user.id, possibleTipKeys2);
			const tipLine2 = toTipLine(tipMessage2);

			replyText = joinLines(
				baseTokensLine,
				luckyDoubleTokensLine,
				refillBonusLine,
				``,
				`-# You now have ${toAmountOfNoun(newTokenCount, 'token')}`,
				`-# Claim your next refill of tokens <t:${toUnixTimestamp(nextRefillTime)}:R>`,
				tipLine1,
				tipLine2,
			);
		}

		const reminderButton = new DiscordButton({
			promptText: replyText,
			...getRefillReminderToggleButton(hasRefillReminderEnabled),
		});

		await replyToInteraction(interaction, reminderButton.getMessageContents());
	},
});