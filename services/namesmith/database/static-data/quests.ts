export const quests = [
	{
		id: 1,
		name: "Experienced Craftsman",
		description: "Craft 5 new characters using at least 3 different recipes",
		tokensReward: 75,
	},
	{
		id: 2,
		name: "Diverse Name",
		description: "Have your currently published name contain at least one emoji, one symbol, and one letter",
		tokensReward: 450,
	},
	{
		id: 3,
		name: "Trade Diplomat",
		description: "Successfully have your trades accepted by 3 different players",
		tokensReward: 100,
		charactersReward: "trade",
	},
	{
		id: 4,
		name: "Twinsies",
		description: "Coordinate with another player to have the same published name with more than 6 characters",
		tokensReward: 200,
		charactersReward: "x",
	},
	{
		id: 5,
		name: "Get Rich Quick",
		description: "Gain 1,000 tokens total through any means necessary",
		tokensReward: 350,
		charactersReward: "tokens",
	}
] as const;