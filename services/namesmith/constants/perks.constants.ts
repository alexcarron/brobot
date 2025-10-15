import { toEnumFromObjects } from "../../../utilities/enum-utilts";
import { perks } from "../database/static-data/perks";

export const Perks = toEnumFromObjects(perks, "name");