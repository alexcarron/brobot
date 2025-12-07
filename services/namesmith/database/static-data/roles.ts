import { Perks } from "../../constants/perks.constants";

export const roles = [
	{
		id: 1,
    name: "Prospector",
    description: "Masters of mining and token collection, they always maximize their gains from raw resources.",
    perks: [Perks.MINE_BONUS.name, Perks.REFILL_BONUS.name]
  },
  {
		id: 2,
    name: "Merchant",
    description: "Savvy traders who save and profit from every transaction, ensuring maximum value from purchases.",
    perks: [Perks.DISCOUNT.name, Perks.LUCKY_REFUND.name]
  },
  {
		id: 3,
    name: "Fortune Seeker",
    description: "Risk-takers and luck-driven adventurers who chase rare opportunities and massive gains.",
    perks: [Perks.LUCKY_DOUBLE_TOKENS.name, Perks.LUCKY_DUPLICATE_CHARACTERS.name]
  },
] as const;