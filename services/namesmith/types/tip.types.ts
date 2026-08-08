import { ExtractType, object, string } from '../../../utilities/runtime-types-utils';

const DBTipType = object.asType({
	key: string,
	message: string,
});
export const asDBTip = DBTipType.from;
export const asDBTips = DBTipType.fromAll;
export type Tip = ExtractType<typeof DBTipType>;

export type TipDefinition = Tip;

export type TipKey = Tip["key"];
export type TipResolvable =
	| TipKey
	| { key: TipKey }
	| Tip;
