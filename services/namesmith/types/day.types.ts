import { object, number, ExtractDomainType } from "../../../utilities/runtime-types-utils";
import { DBDate } from "../utilities/db.utility";

const DBDay = object.asTransformableType('Day', {
  id: number,
  timeStarted: DBDate,
});
export const asDay = DBDay.toDay;
export const asDays = DBDay.toDays;
export type Day = ExtractDomainType<typeof DBDay>;


export type DayDefinition = {
	timeStarted: Date;
};

export type DayID = Day['id'];
export type DayResolvable = 
	| DayID
	| { id: DayID };