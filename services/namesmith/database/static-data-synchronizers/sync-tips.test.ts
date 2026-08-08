import { makeSure } from "../../../../utilities/jest/jest-utils";
import { ignoreError } from "../../../../utilities/error-utils";
import { TipRepository } from "../../repositories/tip.repository";
import { DatabaseQuerier } from "../database-querier";
import { syncTipsToDB } from "./sync-tips";

describe('sync-tips.ts', () => {
	let db: DatabaseQuerier;
	let tipRepository: TipRepository;

	beforeEach(() => {
		tipRepository = TipRepository.asMock();
		db = tipRepository.db;
	});

	describe('syncTipsToDB()', () => {
		it('should add new tip definitions to the database', () => {
			syncTipsToDB(db, [
				{ key: 'newTipOne', message: 'First new tip.' },
				{ key: 'newTipTwo', message: 'Second new tip.' },
			]);

			const tips = tipRepository.getTips();
			makeSure(tips).hasAnItemWhere(tip => tip.key === 'newTipOne');
			makeSure(tips).hasAnItemWhere(tip => tip.key === 'newTipTwo');

			makeSure(tipRepository.getTip('newTipOne').message).is('First new tip.');
			makeSure(tipRepository.getTip('newTipTwo').message).is('Second new tip.');
		});

		it('should update the message of an existing tip by key', () => {
			syncTipsToDB(db, [
				{ key: 'existingTip', message: 'Old message.' },
			]);

			syncTipsToDB(db, [
				{ key: 'existingTip', message: 'New message.' },
			]);

			const tips = tipRepository.getTips();
			makeSure(tips).hasLengthOf(1);
			makeSure(tips[0].key).is('existingTip');
			makeSure(tips[0].message).is('New message.');
		});

		it('should delete tips not defined in the static data', () => {
			syncTipsToDB(db, [
				{ key: 'onlyTip', message: 'The only tip.' },
			]);

			const tips = tipRepository.getTips();
			makeSure(tips).hasLengthOf(1);
			makeSure(tips[0].key).is('onlyTip');
		});

		it('should delete, update, and add tips all at once', () => {
			syncTipsToDB(db, [
				{ key: 'tipToDelete', message: 'Delete me.' },
				{ key: 'tipToUpdate', message: 'Old message.' },
			]);

			syncTipsToDB(db, [
				{ key: 'tipToUpdate', message: 'Updated message.' },
				{ key: 'tipToAdd', message: 'Added message.' },
			]);

			const tips = tipRepository.getTips();
			makeSure(tips).hasLengthOf(2);
			makeSure(tips).hasNoItemWhere(tip => tip.key === 'tipToDelete');
			makeSure(tips).hasAnItemWhere(tip =>
				tip.key === 'tipToUpdate' &&
				tip.message === 'Updated message.'
			);
			makeSure(tips).hasAnItemWhere(tip =>
				tip.key === 'tipToAdd' &&
				tip.message === 'Added message.'
			);
		});

		it('should reset all queries on failure', () => {
			syncTipsToDB(db, [
				{ key: 'survivingTip', message: 'I should survive.' },
			]);

			ignoreError(() =>
				syncTipsToDB(db, [
					{ key: 'duplicatedTip', message: 'First.' },
					{ key: 'duplicatedTip', message: 'Second.' },
				])
			);

			const tips = tipRepository.getTips();
			makeSure(tips).hasLengthOf(1);
			makeSure(tips[0].key).is('survivingTip');
			makeSure(tips[0].message).is('I should survive.');
		});
	});
});
