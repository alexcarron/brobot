import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { mineTokens } from "../../services/namesmith/workflows/mine-tokens.workflow";
import { deferInteraction, replyToInteraction } from "../../utilities/discord-action-utils";
import { toAmountOfNoun } from "../../utilities/string-manipulation-utils";

export const command = new SlashCommand({
	name: "mine-tokens",
	description: "Mines a small amount of tokens",
	required_servers: [ids.servers.NAMESMITH],
	required_channels: [ids.namesmith.channels.MINE_TOKENS],
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const result = mineTokens({
			...getNamesmithServices(),
			playerMining: interaction.user.id,
		})

		if (result.isNonPlayerMined())
			return await replyToInteraction(interaction,
				`You're not a player, so you can't mine tokens.`
			);

		const { tokensEarned, newTokenCount } = result;
		await replyToInteraction(interaction,
			`**+${toAmountOfNoun(tokensEarned, 'Token')}** ` + '🪙'.repeat(tokensEarned) + `\n` +
			`-# You now have ${toAmountOfNoun(newTokenCount, 'token')}\n`
		);
	}
});