import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { getTokensEarnedFeedback } from "../../services/namesmith/utilities/feedback-message.utility";
import { mineTokens } from "../../services/namesmith/workflows/mine-tokens.workflow";
import { toAmountOfNoun } from "../../utilities/string-manipulation-utils";

export const command = new SlashCommand({
	name: "mine-tokens",
	description: "Mines a small amount of tokens",
	required_servers: [ids.servers.NAMESMITH],
	required_channels: [ids.namesmith.channels.MINE_TOKENS],
	execute: function execute(interaction) {
		const result = mineTokens({
			...getNamesmithServices(),
			playerMining: interaction.user.id,
		})

		if (result.isNotAPlayer())
			return `You're not a player, so you can't mine tokens.`;

		const { tokensEarned, newTokenCount, hasMineBonusPerk } = result;

		let baseMessage = getTokensEarnedFeedback(tokensEarned, {isOneLine: true}) + `\n`

		if (hasMineBonusPerk) {
			const baseTokensEarned = tokensEarned - 1;
			baseMessage =
				getTokensEarnedFeedback(baseTokensEarned, {isOneLine: true}) + `\n` +
				'+1 Bonus Token 🪙\n';
		}

		return (
			baseMessage +
			`-# You now have ${toAmountOfNoun(newTokenCount, 'token')}\n`
		);
	}
});