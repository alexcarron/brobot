import { toEnumFromObjects } from "./enum-utilts";
import { makeSure } from "./jest/jest-utils";

describe('enum-utils', () => {
	describe('toEnumFromObjects()', () => {
		it('converts an array of single property objects to an enum', () => {
			const fruits = [
				{name: "Apple"},
				{name: "Banana"},
				{name: "Cherry"}
			] as const;

			const FruitsEnum = toEnumFromObjects(fruits, "name");

			makeSure(FruitsEnum).is({
				APPLE: {name: "Apple"},
				BANANA: {name: "Banana"},
				CHERRY: {name: "Cherry"}
			});
		});

		it('converts an array of multiple property objects to an enum', () => {
			const items = [
				{name: "Spear", type: "weapon", cost: 10},
				{name: "Shield", type: "armor", cost: 5},
				{name: "First Aid Kit", type: "consumable", cost: 20}
			];

			const ItemsEnum = toEnumFromObjects(items, "name");

			makeSure(ItemsEnum).is({
				SPEAR: {name: "Spear", type: "weapon", cost: 10},
				SHIELD: {name: "Shield", type: "armor", cost: 5},
				FIRST_AID_KIT: {name: "First Aid Kit", type: "consumable", cost: 20}
			});
		});
	});
})