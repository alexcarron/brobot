export const perks = [
	{
		id: 1,
		name: "Mine Bonus",
		description: "Gain +1 token every time you mine for tokens."
	},
	{
		id: 2,
		name: "Refill Bonus",
		description: "Gain +25% tokens every time you claim a refill (After all other perks are applied)."
	},
	{
		id: 3,
		name: "Faster Refill",
		description: "Reduce the cooldown time between refills by 50%."
	},
	{
		id: 4,
		name: "Refill Interest",
		description: "Earn 10% of your current token count on average from refills (Before all other perks are applied)."
	},
	{
		id: 5,
		name: "Refill Inventory Override",
		description: "Earn as many tokens as the amount of characters in your inventory from refills (Overrides all other perks)."
	},
	{
		id: 6,
		name: "Discount",
		description: "Pay 10% less for all mystery boxes."
	},
	{
		id: 7,
		name: "Lucky Refund",
		description: "Have a 10% chance to get your tokens back after buying a mystery box."
	},
	{
		id: 8,
		name: "Lucky Double",
		description: "Have a 2% chance to double your token count when claiming refills."
	},
	{
		id: 9,
		name: "Lucky Duplicate Characters",
		description: "Have a 10% chance of duplicating the character you get from a mystery box."
	},
	{
		id: 10,
		name: "Free Tokens",
		description: "Gain 500 tokens."
	}
] as const;