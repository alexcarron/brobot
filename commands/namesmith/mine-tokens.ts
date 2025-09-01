import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { mineTokens } from "../../services/namesmith/workflows/mine-tokens.workflow";
import { deferInteraction, replyToInteraction } from "../../utilities/discord-action-utils";
import { attempt } from "../../utilities/error-utils";
import { NonPlayerMinedError } from '../../services/namesmith/utilities/error.utility';
import { toAmountOfNoun } from "../../utilities/string-manipulation-utils";
import { wait } from "../../utilities/realtime-utils";

export const command = new SlashCommand({
	name: "mine-tokens",
	description: "Mines a small amount of tokens",
	required_servers: [ids.servers.NAMESMITH],
	required_roles: [
		[ids.namesmith.roles.namesmither, ids.namesmith.roles.noName, ids.namesmith.roles.smithedName],
	],
	required_channels: [ids.namesmith.channels.MINE_TOKENS],
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		await wait({seconds: 10});

		attempt(
			() => mineTokens({
				...getNamesmithServices(),
				playerMining: interaction.user.id,
			})
		)
		.onError(NonPlayerMinedError, async () => {
			await replyToInteraction(interaction,
				`You're not a player, so you can't mine tokens.`
			);
		})
		.onSuccess(async ({ tokensEarned }) => {
			await replyToInteraction(interaction,
				'+' + toAmountOfNoun(tokensEarned, 'Token') + ' ' + '🪙'.repeat(tokensEarned)
			);
		})
		.execute();
	}
});