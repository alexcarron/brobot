import { toEnumFromObjects } from "../../../utilities/enum-utilts";
import { quests } from "../database/static-data/quests";

export const Quests = toEnumFromObjects(quests, "name");

export const INVESTMENT_PERCENTAGE = 0.02; // 2%

export const IDLE_INTEREST_TOKEN_REWARD = 150;