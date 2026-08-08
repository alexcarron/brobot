import { ids } from "../../../../bot-config/discord-ids";
import { TipDefinition } from "../../types/tip.types";

const namesmithChannelIDs = ids.namesmith.channels;

export const tips = [
	{
		key: "howToBuyMysteryBox",
		message: `You can spend your tokens on a mystery box in <#${namesmithChannelIDs.BUY_MYSTERY_BOXES}> with \`/buy-mystery-box\` to get characters for your name.`,
	},
	{
		key: "howToRearrangeName",
		message: "You can add characters you own to your name and order them however you like with `/rearrange-name`.",
	},
	{
		key: "howToPublishName",
		message: "If you're happy with your current name, you can lock it in as an entry for the final vote with `/publish-name`.",
	},
	{
		key: "howToClaimRefillForMoreTokens",
		message: `You can earn far more tokens at once by claiming a refill every 2 hours in <#${namesmithChannelIDs.CLAIM_REFILL}> with \`/claim-refill\`.`,
	},
	{
		key: "howToEnableRefillReminders",
		message: "You can get DM reminders whenever your next refill is ready by pressing the button below.",
	},
	{
		key: "whatAreDailyQuests",
		message: `Every day, you can complete new quests that appear in <#${namesmithChannelIDs.DAILY_QUESTS}> to earn rewards.`,
	},
	{
		key: "whatAreWeeklyQuests",
		message: `Each week, you can also complete longer, more challenging quests in <#${namesmithChannelIDs.WEEKLY_QUESTS}> for bigger rewards.`,
	},
	{
		key: "whatAreHiddenQuests",
		message: `Each day, you can unlock hidden quests for bigger rewards if you complete all daily quests in <#${namesmithChannelIDs.DAILY_QUESTS}>.`,
	},
	{
		key: "howToCraftCharacters",
		message: `Utility characters are used in crafting recipes. You can turn characters you own into new ones in <#${namesmithChannelIDs.CRAFT_CHARACTERS}> with \`/craft-characters\`.`,
	},
	{
		key: "howToTrade",
		message: `You can trade characters with other players using \`/trade\` in <#${namesmithChannelIDs.TRADE_CHARACTERS}>.`,
	},
	{
		key: "howToSeePerks",
		message: "You can review your perks anytime with `/see-perks`.",
	},
	{
		key: "whatIsThePublishCapAndCost",
		message: "You can publish up to 4 names in total. Your next one costs 250 tokens, then 500, then 1000.",
	},
] as const satisfies readonly TipDefinition[];
