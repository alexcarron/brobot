import { randomUUID } from "crypto";
import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { Tips } from "../../services/namesmith/constants/tip.constants";
import { sendFirstMineMessage } from "../../services/namesmith/interfaces/mining/first-mine-message";
import { NOT_A_PLAYER_MINING_MESSAGE } from "../../services/namesmith/interfaces/mining/mining-message-lines";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { TipResolvable } from "../../services/namesmith/types/tip.types";
import { toTipLine } from "../../services/namesmith/utilities/player-message.utility";
import { mineOneLayer } from "../../services/namesmith/workflows/mine-tokens.workflow";

export const command = new SlashCommand({
	name: "mine-tokens",
	description: "Mines a small amount of tokens",
	required_servers: [ids.servers.NAMESMITH],
	required_channels: [ids.namesmith.channels.MINE_TOKENS],
	execute: async function execute(interaction) {
		const { tipService, playerService, mysteryBoxService } = getNamesmithServices();

		const miningSessionID = randomUUID();
		const result = mineOneLayer({
			player: interaction.user.id,
			miningSessionID,
			currentLayerNumber: 1,
			tokensMinedThisSession: 0,
		});

		if (result.isNotAPlayer())
			return NOT_A_PLAYER_MINING_MESSAGE;

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

		await sendFirstMineMessage({
			interaction,
			miningSessionID,
			firstMineResult: result,
			tipLine,
		});
	}
});
