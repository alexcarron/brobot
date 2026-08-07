import { TransactionRunner } from "./transaction-runner";
import { DatabaseQuerier } from "./database-querier";

describe('TransactionRunner', () => {
	let db: DatabaseQuerier;
	let transactionRunner: TransactionRunner;

	beforeEach(() => {
		db = new DatabaseQuerier({ inMemory: true });
		db.exec(`
			CREATE TABLE item (
				id INTEGER PRIMARY KEY,
				value TEXT NOT NULL
			);
		`);
		transactionRunner = TransactionRunner.fromDB(db);
	});

	describe('runInTransaction()', () => {
		it('commits every write when the operation returns normally and passes its return value back', () => {
			const returnValue = transactionRunner.runInTransaction(() => {
				db.run(`INSERT INTO item (value) VALUES (?)`, 'first');
				db.run(`INSERT INTO item (value) VALUES (?)`, 'second');
				return 'done';
			});

			expect(returnValue).toBe('done');
			expect(db.getRows(`SELECT value FROM item`)).toEqual([
				{ value: 'first' },
				{ value: 'second' },
			]);
		});

		it('rolls back every write made before the operation throws and rethrows the error', () => {
			const error = new Error('operation failed');

			expect(() =>
				transactionRunner.runInTransaction(() => {
					db.run(`INSERT INTO item (value) VALUES (?)`, 'first');
					throw error;
				})
			).toThrow(error);

			expect(db.getRows(`SELECT value FROM item`)).toEqual([]);
		});
	});
});
