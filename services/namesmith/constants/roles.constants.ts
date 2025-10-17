import { toEnumFromObjects } from "../../../utilities/enum-utilts";
import { roles } from "../database/static-data/roles";

export const Roles = toEnumFromObjects(roles, "name");