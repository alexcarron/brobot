import { DBPerk } from "../types/perk.types";
import { toPerk } from "./perk.utility";

describe('perk.utility', () => {
	describe('toPerk()', () => {
		it('converts a DBPerk object into a Perk object', () => {
			const dbPerk: DBPerk = {
				id: 1,
				name: 'test',
				description: 'test',
				wasOffered: 1
			};

			const perk = toPerk(dbPerk);

			expect(perk).toEqual({
				id: 1,
				name: 'test',
				description: 'test',
				wasOffered: true
			});
		});
	})
});