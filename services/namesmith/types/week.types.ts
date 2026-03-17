import { object, number, ExtractDomainType } from "../../../utilities/runtime-types-utils";
import { DBDate } from "../utilities/db.utility";

const DBWeek = object.asTransformableType('Week', {
  id: number,
  timeStarted: DBDate,
});
export const asWeek = DBWeek.toWeek;
export const asWeeks = DBWeek.toWeeks;
export type Week = ExtractDomainType<typeof DBWeek>;

export type WeekDefinition = {
	timeStarted: Date
};

export type WeekID = Week['id'];
export type WeekResolvable = 
	| WeekID
	| { id: WeekID };
