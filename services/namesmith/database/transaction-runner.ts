import { DatabaseQuerier } from "./database-querier";
import { createMockDB } from "../mocks/mock-database";

/**
 * Runs a group of operations inside a single database transaction that must all succeed together or all fail together.
 */
export class TransactionRunner {
	constructor(private db: DatabaseQuerier) {}

	static fromDB(db: DatabaseQuerier) {
		return new TransactionRunner(db);
	}

	static asMock() {
		return TransactionRunner.fromDB(createMockDB());
	}

	/**
	 * Runs the given operation inside a single database transaction. If the operation returns normally its writes are committed together. If it throws, every write it made is rolled back and the error is rethrown.
	 * @param operation - A function performing the operations that must all succeed together. Its return value is passed back unchanged.
	 * @returns Whatever the operation returns.
	 */
	runInTransaction<ReturnType>(operation: () => ReturnType): ReturnType {
		return this.db.transaction(operation)() as ReturnType;
	}
}
