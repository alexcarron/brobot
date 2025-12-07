import { Perks } from "../../constants/perks.constants";

export const roles = [
	{
		id: 1,
    name: "The Passive Investor",
    description: "Someone focused on saving tokens and hoarding money without effort.",
    perks: [Perks.INVESTMENT.name, Perks.IDLE_INTEREST.name]
  },
  {
		id: 2,
    name: "The Grinder",
    description: "Someone focused on earning tokens fast with consistent effort.",
    perks: [Perks.MINE_BONUS.name, Perks.FASTER_REFILL.name]
  },
  {
		id: 3,
    name: "The Gambling Artifactor",
    description: "Someone focused on getting many characters through lucky occurances.",
    perks: [Perks.LUCKY_DOUBLE_BOX.name, Perks.LUCKY_DUPLICATE_CHARACTERS.name]
  },
] as const;