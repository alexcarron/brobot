import { toEnumFromObjects } from "../../../utilities/enum-utilts";
import { mysteryBoxes } from "../database/static-data/mystery-boxes";

export const MysteryBoxes = toEnumFromObjects(mysteryBoxes, "name");