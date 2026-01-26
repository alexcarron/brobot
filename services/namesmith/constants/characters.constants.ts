import { toEnumFromObjects } from "../../../utilities/enum-utilts";
import { characters } from "../database/static-data/characters";
import { MysteryBoxes } from "./mystery-boxes.constants";

export const Characters = toEnumFromObjects(characters, "value");

export const UTILITY_CHARACTERS = Object.keys(MysteryBoxes.RECIPE_UTILITIES.characterOdds) as readonly (keyof typeof MysteryBoxes.RECIPE_UTILITIES.characterOdds)[];