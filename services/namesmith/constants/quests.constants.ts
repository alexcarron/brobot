import { toEnumFromObjects } from "../../../utilities/enum-utilts";
import { quests } from "../database/static-data/quests";

export const Quests = toEnumFromObjects(quests, "name");