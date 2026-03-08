import { returnNonNullOrThrow } from "../../../utilities/error-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { asDay, asDays, Day, DayDefinition, DayID } from "../types/day.types";
import { DBDate } from "../utilities/db.utility";
import { DayAlreadyExistsError } from "../utilities/error.utility";

const TABLE_NAME = 'day';

/**
 * Provides access to the day data.
 */
export class DayRepository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(
		public db: DatabaseQuerier
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new DayRepository(db);
	}

	static asMock() {
		const db = createMockDB();
		return DayRepository.fromDB(db);
	}

	getDays(): Day[] {
		return asDays(this.db.selectAllFromTable(TABLE_NAME));
	}

	getDayByID(id: DayID): Day | null {
		const row = this.db.selectRowFromTableByID(TABLE_NAME, id);
		if (row === undefined) return null;
		return asDay(row);
	}

	getDayOrThrow(id: DayID): Day {
		return returnNonNullOrThrow(
			this.getDayByID(id),
			new DayAlreadyExistsError(id)
		)
	}

	doesDayExist(id: DayID): boolean {
		return this.db.doesExistInTable(TABLE_NAME, {id});
	}

	/**
	 * Adds a new day to the database.
	 * @param {DayDefinition} params - The properties of the day to be added.
	 * @param {Date} params.timeStarted - The time at which the day started.
	 * @returns {Day} The added day.
	 * @throws {DayAlreadyExistsError} If the day already exists in the database.
	 */
	addDay({timeStarted}: DayDefinition): Day {
		const insertedFields = {
			timeStarted: DBDate.fromDomain(timeStarted),
		};
		const id = this.db.insertIntoTable(TABLE_NAME, insertedFields);
		return this.getDayOrThrow(id);
	}
}