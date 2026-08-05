import { date, ExtractDomainType, ExtractType, object, string } from "../../../utilities/runtime-types-utils";
import { DBDate } from "../utilities/db.utility";

export const DBGameStateType = object.asTransformableType('GameState', {
	timeStarted: DBDate.orNull,
	timeEnding: DBDate.orNull,
	timeVoteIsEnding: DBDate.orNull,
	theme: string.orNull,
})
export const asGameState = DBGameStateType.toGameState;
export type GameState = ExtractDomainType<typeof DBGameStateType>;

export const DefinedGameStateType = object.asType({
	timeStarted: date,
	timeEnding: date,
	timeVoteIsEnding: date,
	theme: string.orNull,
});
export const isGameStateDefined = DefinedGameStateType.isType;
export type DefinedGameState = ExtractType<typeof DefinedGameStateType>;