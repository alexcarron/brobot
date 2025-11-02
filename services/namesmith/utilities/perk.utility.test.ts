import { makeSure } from "../../../utilities/jest/jest-utils";
import { DBPerk, Perk } from "../types/perk.types";
import { toDBPerk, toPerk, toPerks } from "./perk.utility";

describe('perk.utility', () => {
	describe('toPerk()', () => {
		it('converts a DBPerk object into a Perk object', () => {
			const dbPerk: DBPerk = {
				id: 1,
				name: 'test',
				description: 'test',
				wasOffered: 1
			};

			const perk: Perk = toPerk(dbPerk);

			makeSure(perk).is({
				id: 1,
				name: 'test',
				description: 'test',
				wasOffered: true
			});
		});
	});

	describe('toPerks', () => {
		it('converts an array of DBPerk objects into an array of Perk objects', () => {
			const dbPerks: DBPerk[] = [
				{
					id: 1,
					name: 'test',
					description: 'test',
					wasOffered: 1
				},
				{
					id: 2,
					name: 'test2',
					description: 'test2',
					wasOffered: 0
				}
			];

			const perks: Perk[] = toPerks(dbPerks);

			makeSure(perks).hasLengthOf(2);
			makeSure(perks[0]).is({
				id: 1,
				name: 'test',
				description: 'test',
				wasOffered: true
			});
			makeSure(perks[1]).is({
				id: 2,
				name: 'test2',
				description: 'test2',
				wasOffered: false
			});
		});
	});

	describe('toDBPerk', () => {
		it('converts a Perk object into a DBPerk object', () => {
			const perk = {
				id: 1,
				name: 'test',
				description: 'test',
				wasOffered: true
			};

			const dbPerk: DBPerk = toDBPerk(perk);

			makeSure(dbPerk).is({
				id: 1,
				name: 'test',
				description: 'test',
				wasOffered: 1
			});
		});
	})
});