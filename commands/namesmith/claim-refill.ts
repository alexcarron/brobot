import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { joinLines, toAmountOfNoun } from "../../utilities/string-manipulation-utils";
import { claimRefill } from "../../services/namesmith/workflows/claim-refill.workflow";
import { toUnixTimestamp } from "../../utilities/date-time-utils";
import { getTokensEarnedFeedback, toTokenEmojis } from "../../services/namesmith/utilities/player-message.utility";
import { replyToInteraction } from "../../utilities/discord-action-utils";
import { DiscordButton } from "../../utilities/discord-interfaces/discord-button";
import { getRefillReminderToggleButton } from "../../services/namesmith/interfaces/refill-reminders/refill-reminder-toggle-button";

export const command = new SlashCommand({
	name: "claim-refill",
	description: "Claim your refill of a decent amount of tokens every so often.",
	required_servers: [ids.servers.NAMESMITH],
	required_channels: [ids.namesmith.channels.CLAIM_REFILL],
	execute: async function execute(interaction) {
		const { playerService } = getNamesmithServices();

		const refillResult = claimRefill({
			...getNamesmithServices(),
			playerRefilling: interaction.user.id,
		});

		let replyText: string;

		if (refillResult.isNotAPlayer()) {
			replyText = `You're not a player, so you can't claim a refill of tokens.`;
		}
		else if (refillResult.isRefillAlreadyClaimed()) {
			replyText = (
				`You've already claimed your refill.\n` +
				`Don't worry, your next refill is available <t:${toUnixTimestamp(refillResult.nextRefillTime)}:R>`
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

			replyText = joinLines(
				baseTokensLine,
				luckyDoubleTokensLine,
				refillBonusLine,
				``,
				`-# You now have ${toAmountOfNoun(newTokenCount, 'token')}`,
				`-# Claim your next refill of tokens <t:${toUnixTimestamp(nextRefillTime)}:R>`,
			);
		}

		const reminderButton = new DiscordButton({
			promptText: replyText,
			...getRefillReminderToggleButton(playerService.hasRefillReminderEnabled(interaction.user.id)),
		});

		await replyToInteraction(interaction, reminderButton.getMessageContents());
	},
});