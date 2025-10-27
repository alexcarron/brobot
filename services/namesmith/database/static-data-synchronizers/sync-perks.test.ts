import { makeSure } from "../../../../utilities/jest/jest-utils";
import { createMockDB } from "../../mocks/mock-database";
import { PerkRepository } from "../../repositories/perk.repository";
import { DatabaseQuerier } from "../database-querier";
import { syncPerksToDB } from "./sync-perks";

describe('sync-perks.ts', () => {
	let db: DatabaseQuerier;
	let perkRepository: PerkRepository;

	beforeEach(() => {
		db = createMockDB();
		perkRepository = new PerkRepository(db);
	});

	describe('syncPerksToDB()', () => {
		it('should add new perk defintions to the database', () => {
			syncPerksToDB(db, [
				{
					name: 'Newly Added Perk',
					description: 'Test Perk Description',
				},
				{
					name: 'Newly Added Perk 2',
					description: 'Test Perk Description 2',
				}
			]);

			const perks = perkRepository.getPerks();
			makeSure(perks).hasAnItemWhere(perk =>
				perk.name === 'Newly Added Perk'
			);
			makeSure(perks).hasAnItemWhere(perk =>
				perk.name === 'Newly Added Perk 2'
			);

			const newPerk1 = perkRepository.getPerkByName('Newly Added Perk');
			makeSure(newPerk1).isNotNull();
			makeSure(newPerk1!.description).is('Test Perk Description');

			const newPerk2 = perkRepository.getPerkByName('Newly Added Perk 2');
			makeSure(newPerk2).isNotNull();
			makeSure(newPerk2!.description).is('Test Perk Description 2');
		});

		it('should delete perks not defined in the static data', () => {
			syncPerksToDB(db, [
				{
					name: 'Newly Added Perk',
					description: 'Test Perk Description',
				}
			]);

			const perks = perkRepository.getPerks();
			makeSure(perks).hasLengthOf(1);
			makeSure(perks[0].name).is('Newly Added Perk');
		});
	});

	it('should update existing perks defined in the static data by ID', () => {
		syncPerksToDB(db, [
			{
				id: 1,
				name: 'Perk Name',
				description: 'Description',
			}
		]);

		syncPerksToDB(db, [
			{
				id: 1,
				name: 'New Perk Name',
				description: 'New Description',
			}
		]);

		const perks = perkRepository.getPerks();

		makeSure(perks).hasLengthOf(1);
		makeSure(perks[0].name).is('New Perk Name');
		makeSure(perks[0].description).is('New Description');
	});

	it('should update existing perks defined in the static data by Name', () => {
		syncPerksToDB(db, [
			{
				id: 1,
				name: 'Perk Name',
				description: 'Description',
			}
		]);

		syncPerksToDB(db, [
			{
				name: 'Perk Name',
				description: 'New Description',
			}
		]);

		const perks = perkRepository.getPerks();

		makeSure(perks).hasLengthOf(1);
		makeSure(perks[0].name).is('Perk Name');
		makeSure(perks[0].description).is('New Description');
	});

	it('should delete, update, and add perks all at once', () => {
		syncPerksToDB(db, [
			{
				id: 1,
				name: 'Perk Name',
				description: 'Description',
			},
			{
				id: 2,
				name: 'Perk Name 2',
				description: 'Description 2',
			},
			{
				name: 'Perk Name 3',
				description: 'Description 3',
			}
		]);

		syncPerksToDB(db, [
			{
				id: 2,
				name: 'New Perk Name 2',
				description: 'New Description 2',
			},
			{
				name: 'Perk Name 3',
				description: 'New Description 3',
			},
			{
				name: 'Perk Name 4',
				description: 'Description 4',
			}
		]);

		const perks = perkRepository.getPerks();
		makeSure(perks).hasLengthOf(3);
		makeSure(perks).hasNoItemsWhere(perk =>
			perk.id === 1 ||
			perk.name === 'Perk Name'
		);
		makeSure(perks).hasAnItemWhere(perk =>
			perk.id === 2 &&
			perk.name === 'New Perk Name 2' &&
			perk.description === 'New Description 2'
		);
		makeSure(perks).hasAnItemWhere(perk =>
			perk.name === 'Perk Name 3' &&
			perk.description === 'New Description 3'
		);
		makeSure(perks).hasAnItemWhere(perk =>
			perk.name === 'Perk Name 4' &&
			perk.description === 'Description 4'
		);
	});
});