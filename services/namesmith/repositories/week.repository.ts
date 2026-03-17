import { returnNonNullOrThrow } from "../../../utilities/error-utils";
import { isNumber } from "../../../utilities/types/type-guards";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { asWeek, asWeeks, Week, WeekDefinition, WeekID, WeekResolvable } from "../types/week.types";
import { DBDate } from "../utilities/db.utility";
import { WeekAlreadyExistsError, WeekNotFoundError } from "../utilities/error.utility";

const TABLE_NAME = 'week';

/**
 * Provides access to the week data.
 */
export class WeekRepository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(
		public db: DatabaseQuerier
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new WeekRepository(db);
	}

	static asMock() {
		const db = createMockDB();
		return WeekRepository.fromDB(db);
	}

	/**
	 * Resolves a week object from an id, existing object, or other resolvable value.
	 * @param weekResolvable - The week resolvable to resolve.
	 * @returns The resolved week object.
	 */
	resolveWeek(weekResolvable: WeekResolvable): Week {
		if (isNumber(weekResolvable)) {
			return this.getWeekOrThrow(weekResolvable);
		}
		else {
			return this.getWeekOrThrow(weekResolvable.id);
		}
	}

	/**
	 * Resolves a week ID from a given ID or week object.
	 * @param weekResolvable - A week ID or week object.
	 * @returns The resolved week ID.
	 * @throws {WeekNotFoundError} If no week with the given ID exists.
	 */
	resolveID(weekResolvable: WeekResolvable): WeekID {
		if (isNumber(weekResolvable)) {
			return weekResolvable;
		}
		else {
			return weekResolvable.id;
		}
	}

	/**
	 * Retrieves all weeks from the database.
	 * @returns An array of all weeks.
	 */
	getWeeks(): Week[] {
		return asWeeks(this.db.selectAllFromTable(TABLE_NAME));
	}

	/**
	 * Retrieves a week by its ID.
	 * @param id - The ID of the week to retrieve.
	 * @returns The week with the given ID, or null if not found.
	 */
	getWeekByID(id: WeekID): Week | null {
		const row = this.db.selectRowFromTableByID(TABLE_NAME, id);
		if (row === undefined) return null;
		return asWeek(row);
	}

	/**
	 * Retrieves a week by its ID, throwing an error if not found.
	 * @param id - The ID of the week to retrieve.
	 * @returns The week with the given ID.
	 * @throws {WeekNotFoundError} If no week with the given ID exists.
	 */
	getWeekOrThrow(id: WeekID): Week {
		return returnNonNullOrThrow(
			this.getWeekByID(id),
			new WeekNotFoundError(id)
		)
	}

	/**
	 * Checks if a week with the given ID exists.
	 * @param id - The ID of the week to check.
	 * @returns True if the week exists, false otherwise.
	 */
	doesWeekExist(id: WeekID): boolean {
		return this.db.doesExistInTable(TABLE_NAME, {id});
	}

	/**
	 * Adds a new week to the database.
	 * @param params - The properties of the week to be added.
	 * @returns The added week.
	 * @throws {WeekAlreadyExistsError} If the week already exists in the database.
	 */
	addWeek(params: WeekDefinition): Week {
		const {
		timeStarted,
		} = params;

		const insertedFields = {
			timeStarted: DBDate.fromDomain(timeStarted),
		};
		const id = this.db.insertIntoTable(TABLE_NAME, insertedFields);
		return this.getWeekOrThrow(id);
	}

	/**
	 * Retrieves the week with the highest ID from the database.
	 * @returns The week with the highest ID from the database, or null if there are no weeks.
	 */
	getWeekWithHighestID(): Week | null {
		const row = this.db.getRow(
			'SELECT * FROM week ORDER BY id DESC LIMIT 1'
		)

		if (row === undefined) {
			return null;
		}

		return asWeek(row);
	}
}
