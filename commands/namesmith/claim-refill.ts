import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { deferInteraction, replyToInteraction } from "../../utilities/discord-action-utils";
import { attempt } from "../../utilities/error-utils";
import { NonPlayerRefilledError, RefillAlreadyClaimedError } from '../../services/namesmith/utilities/error.utility';
import { toAmountOfNoun } from "../../utilities/string-manipulation-utils";
import { refillTokens } from "../../services/namesmith/workflows/refill-tokens.workflow";
import { toUnixTimestamp } from "../../utilities/date-time-utils";

export const command = new SlashCommand({
	name: "claim-refill",
	description: "Claim your refill of a decent amount of tokens every so often.",
	required_servers: [ids.servers.NAMESMITH],
	required_roles: [
		[ids.namesmith.roles.namesmither, ids.namesmith.roles.noName, ids.namesmith.roles.smithedName],
	],
	required_channels: [ids.namesmith.channels.CLAIM_REFILL],
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		attempt(() =>
			refillTokens({
				...getNamesmithServices(),
				playerRefilling: interaction.user.id,
			})
		)
		.onError(NonPlayerRefilledError, async () => {
			await replyToInteraction(interaction,
				`You're not a player, so you can't claim a refill of tokens.`
			);
		})
		.onError(RefillAlreadyClaimedError, async (error) => {
			const nextRefillTime = error.relevantData.nextRefillTime;
			await replyToInteraction(interaction,
				`You’ve already claimed your refill!\n` +
				`Don't worry, your next refill is available <t:${toUnixTimestamp(nextRefillTime)}:R>`
			);
		})
		.onSuccess(async ({ tokensEarned, newTokenCount, nextRefillTime }) => {
			await replyToInteraction(interaction,
				`**+${toAmountOfNoun(tokensEarned, 'Token')}**\n` +
				`${'🪙'.repeat(tokensEarned)}\n` +
				`\n` +
				`-# You now have ${toAmountOfNoun(newTokenCount, 'token')}\n` +
				`-# Claim your next refill of tokens <t:${toUnixTimestamp(nextRefillTime)}:R>\n`
			);
		})
		.execute();
	},
});