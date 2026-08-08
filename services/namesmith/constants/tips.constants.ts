import { toEnumFromObjects } from "../../../utilities/enum-utilts";
import { tips } from "../database/static-data/tips";

export const Tips = toEnumFromObjects(tips, "key");

export const MAX_TIP_VIEW_COUNT = 3;
