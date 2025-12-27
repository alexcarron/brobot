import { makeSure } from "../../../../utilities/jest/jest-utils";
import { MysteryBoxRepository } from "../../repositories/mystery-box.repository";
import { DatabaseQuerier } from "../database-querier";
import { syncMysteryBoxesToDB } from "./sync-mystery-boxes";

describe('sync-mystery-boxes.ts', () => {
	let db: DatabaseQuerier;
	let mysteryBoxRepository: MysteryBoxRepository;

	beforeEach(() => {
		mysteryBoxRepository = MysteryBoxRepository.asMock();
		db = mysteryBoxRepository.db;
	});

	describe('syncMysteryBoxesToDB()', () => {
		it('should add new mysteryBox defintions to the database', () => {
			syncMysteryBoxesToDB(db, [
				{
					name: 'Newly Added Mystery Box',
					tokenCost: 100,
					characterOdds: {
						'A': 1,
						'B': 2
					}
				},
				{
					name: 'Newly Added Mystery Box 2',
					tokenCost: 200,
					characterOdds: {
						'C': 3,
						'D': 4
					}
				}
			]);

			const mysteryBoxes = mysteryBoxRepository.getMysteryBoxes();
			makeSure(mysteryBoxes).hasAnItemWhere(mysteryBox =>
				mysteryBox.name === 'Newly Added Mystery Box' &&
				mysteryBox.tokenCost === 100 &&
				mysteryBox.characterOdds.A === 1 &&
				mysteryBox.characterOdds.B === 2
			);
			makeSure(mysteryBoxes).hasAnItemWhere(mysteryBox =>
				mysteryBox.name === 'Newly Added Mystery Box 2' &&
				mysteryBox.tokenCost === 200 &&
				mysteryBox.characterOdds.C === 3 &&
				mysteryBox.characterOdds.D === 4
			);
		});

		it('should delete mysteryBoxes not defined in the static data', () => {
			syncMysteryBoxesToDB(db, [
				{
					name: 'Newly Added Mystery Box',
					tokenCost: 100,
					characterOdds: {
						'A': 1,
						'B': 2
					}
				}
			]);

			const mysteryBoxes = mysteryBoxRepository.getMysteryBoxes();
			makeSure(mysteryBoxes).hasLengthOf(1);
			makeSure(mysteryBoxes[0].name).is('Newly Added Mystery Box');
		});
	});

	it('should update existing mysteryBoxes defined in the static data by ID', () => {
		syncMysteryBoxesToDB(db, [
			{
				id: 1,
				name: 'Mystery Box Name',
				tokenCost: 100,
				characterOdds: {
					'A': 1,
					'B': 2
				}
			}
		]);

		syncMysteryBoxesToDB(db, [
			{
				id: 1,
				name: 'New Mystery Box Name',
				tokenCost: 200,
				characterOdds: {
					'C': 3,
					'D': 4
				}
			}
		]);

		const mysteryBoxes = mysteryBoxRepository.getMysteryBoxes();

		makeSure(mysteryBoxes).hasLengthOf(1);
		makeSure(mysteryBoxes[0].name).is('New Mystery Box Name');
		makeSure(mysteryBoxes[0].tokenCost).is(200);
		makeSure(mysteryBoxes[0].characterOdds.C).is(3);
		makeSure(mysteryBoxes[0].characterOdds.D).is(4);
	});

	it('should delete, update, and add mysteryBoxes all at once', () => {
		syncMysteryBoxesToDB(db, [
			{
				id: 1,
				name: 'MysteryBox Name',
				tokenCost: 100,
				characterOdds: {
					'A': 1,
					'B': 2
				}
			},
			{
				id: 2,
				name: 'MysteryBox Name 2',
				tokenCost: 200,
				characterOdds: {
					'C': 3,
					'D': 4
				}
			},
			{
				name: 'MysteryBox Name 3',
				tokenCost: 300,
				characterOdds: {
					'E': 5,
					'F': 6
				}
			}
		]);

		syncMysteryBoxesToDB(db, [
			{
				id: 2,
				name: 'New MysteryBox Name 2',
				tokenCost: 201,
				characterOdds: {
					'C': 13,
					'D': 14
				}
			},
			{
				name: 'MysteryBox Name 3',
				tokenCost: 301,
				characterOdds: {
					'E': 15,
					'F': 16
				}
			},
			{
				name: 'MysteryBox Name 4',
				tokenCost: 400,
				characterOdds: {
					'G': 7,
					'H': 8
				}
			}
		]);

		const mysteryBoxes = mysteryBoxRepository.getMysteryBoxes();
		makeSure(mysteryBoxes).hasLengthOf(3);
		makeSure(mysteryBoxes).hasNoItemWhere(mysteryBox =>
			mysteryBox.id === 1 ||
			mysteryBox.name === 'MysteryBox Name'
		);
		makeSure(mysteryBoxes).hasAnItemWhere(mysteryBox =>
			mysteryBox.id === 2 &&
			mysteryBox.name === 'New MysteryBox Name 2' &&
			mysteryBox.tokenCost === 201 &&
			mysteryBox.characterOdds.C === 13 &&
			mysteryBox.characterOdds.D === 14
		);
		makeSure(mysteryBoxes).hasAnItemWhere(mysteryBox =>
			mysteryBox.name === 'MysteryBox Name 3' &&
			mysteryBox.tokenCost === 301 &&
			mysteryBox.characterOdds.E === 15 &&
			mysteryBox.characterOdds.F === 16
		);
		makeSure(mysteryBoxes).hasAnItemWhere(mysteryBox =>
			mysteryBox.name === 'MysteryBox Name 4' &&
			mysteryBox.tokenCost === 400 &&
			mysteryBox.characterOdds.G === 7 &&
			mysteryBox.characterOdds.H === 8
		);
	});
});