import { returnNonNullOrThrow } from "../../../utilities/error-utils";
import { isNumber } from "../../../utilities/types/type-guards";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { asDay, asDays, Day, DayDefinition, DayID, DayResolvable } from "../types/day.types";
import { DBDate } from "../utilities/db.utility";
import { DayAlreadyExistsError, DayNotFoundError } from "../utilities/error.utility";

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

	/**
	 * Resolves a day object from an id, existing object, or other resolvable value.
	 * @param dayResolvable - The day resolvable to resolve.
	 * @returns The resolved day object.
	 */
	resolveDay(dayResolvable: DayResolvable): Day {
		if (isNumber(dayResolvable)) {
			return this.getDayOrThrow(dayResolvable);
		}
		else {
			return this.getDayOrThrow(dayResolvable.id);
		}
	}

	/**
	 * Resolves a day ID from a given day ID or day object.
	 * @param dayResolvable - A day ID or day object.
	 * @returns The resolved day ID.
	 * @throws {DayNotFoundError} If no day with the given ID or name exists.
	 */
	resolveID(dayResolvable: DayResolvable): DayID {
		if (isNumber(dayResolvable)) {
			return dayResolvable;
		}
		else {
			return dayResolvable.id;
		}
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
			new DayNotFoundError(id)
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

	/**
	 * Returns the day with the highest ID from the database, or null if there are no days in the database.
	 * @returns The day with the highest ID from the database, or null if there are no days.
	 */
	getDayWithHighestID(): Day | null {
		const row = this.db.getRow(
			'SELECT * FROM day ORDER BY id DESC LIMIT 1'
		);

		if (row === undefined) {
			return null;
		}

		return asDay(row);
	}
}