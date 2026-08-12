import { toEnumFromObjects } from "../../../utilities/enum-utilts";
import { quests } from "../database/static-data/quests";

export const Quests = toEnumFromObjects(quests, "name");

/**
 * The multiplier applied to the tokens reward for hidden quests
 */
export const HIDDEN_QUEST_TOKEN_MULTIPLIER = 1.5;