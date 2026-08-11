import { toPercentageString } from "../../../../utilities/string-manipulation-utils";
import { AUTO_MINE_INTERVAL_SECONDS, CHARACTER_DISCOVERY_CHANCE_INCREMENT_PER_LAYER, FRACTION_OF_TOKENS_KEPT_ON_COLLAPSE } from "../../constants/mine-tokens.constants";
import { MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER, PUBLISHED_NAME_SLOT_COSTS } from "../../constants/name-publishing.constants";
import { AUTO_MINE_BUTTON_LABEL, STOP_AUTO_MINE_BUTTON_LABEL } from "../../interfaces/mining/mining-button-labels";
import { TipDefinition } from "../../types/tip.types";

export const tips = [
	{
		key: "howToBuyMysteryBox",
		message: "You can spend your tokens on a mystery box to get characters for your name in {{CHANNEL:BUY_MYSTERY_BOXES}} with `/buy-mystery-box`",
	},
	{
		key: "howToRearrangeName",
		message: "You can add characters you own to your name and order them however you like with `/rearrange-name`",
	},
	{
		key: "howToPublishName",
		message: "If you're happy with your current name, you can lock it in as an entry for the final vote with `/publish-name`",
	},
	{
		key: "howToClaimRefillForMoreTokens",
		message: "You can earn far more tokens at once by claiming a refill every 2 hours in {{CHANNEL:CLAIM_REFILL}} with `/claim-refill`",
	},
	{
		key: "howToEarnMoreWithQuests",
		message: "You can also earn tokens by completing daily quests in {{CHANNEL:DAILY_QUESTS}} or weekly quests in {{CHANNEL:WEEKLY_QUESTS}}",
	},
	{
		key: "howToEnableRefillReminders",
		message: "Press the button below to receive a DM reminder whenever your next refill is ready",
	},
	{
		key: "whatAreDailyQuests",
		message: "Every day, you can complete new quests that appear in {{CHANNEL:DAILY_QUESTS}} to earn rewards",
	},
	{
		key: "whatAreWeeklyQuests",
		message: "Each week, you can also complete longer, more challenging quests in {{CHANNEL:WEEKLY_QUESTS}} for bigger rewards",
	},
	{
		key: "whatAreHiddenQuests",
		message: "Each day, you can unlock hidden quests for bigger rewards if you complete all daily quests in {{CHANNEL:DAILY_QUESTS}}",
	},
	{
		key: "howToCraftCharacters",
		message: "Utility characters are used in crafting recipes. You can turn characters you own into new ones in {{CHANNEL:CRAFT_CHARACTERS}} with `/craft-characters`",
	},
	{
		key: "howToTrade",
		message: "You can trade characters with other players using `/trade` in {{CHANNEL:TRADE_CHARACTERS}}",
	},
	{
		key: "howToSeePerks",
		message: "You can review your perks anytime with `/see-perks`",
	},
	{
		key: "whatIsThePublishCapAndCost",
		message: `You can publish up to ${MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER} names in total. Your second one costs ${PUBLISHED_NAME_SLOT_COSTS[1]} tokens, ${PUBLISHED_NAME_SLOT_COSTS.slice(2).map((cost) => `then ${cost}`).join(', ')}`,
	},
	{
		key: "howMiningRiskWorks",
		message: `Press "Resurface" anytime to keep the tokens you've mined so far safe. If the mine collapses, you will lose ${toPercentageString(1-FRACTION_OF_TOKENS_KEPT_ON_COLLAPSE)} of them`,
	},
	{
		key: "autoMiningRiskKeepsClimbing",
		message: `"${AUTO_MINE_BUTTON_LABEL}" automatically mines deeper every ${AUTO_MINE_INTERVAL_SECONDS} seconds until you press "${STOP_AUTO_MINE_BUTTON_LABEL}", increasing the risk of collapse the longer you let it run`,
	},
	{
		key: "miningHasNoCooldown",
		message: "Run `/mine-tokens` again anytime to start a new mining session",
	},
	{
		key: "characterOddsImproveWithDepth",
		message: `Your chance to discover a character increases by ${toPercentageString(CHARACTER_DISCOVERY_CHANCE_INCREMENT_PER_LAYER)} each layer deeper you mine`,
	},
] as const satisfies readonly TipDefinition[];
