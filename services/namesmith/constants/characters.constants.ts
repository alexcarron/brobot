import { toEnumFromObjects } from "../../../utilities/enum-utilts";
import { characters } from "../database/static-data/characters";

export const Characters = toEnumFromObjects(characters, "value");