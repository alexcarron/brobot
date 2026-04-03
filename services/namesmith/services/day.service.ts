import { DayRepository } from "../repositories/day.repository";
import { DatabaseQuerier } from "../database/database-querier";
import { Day, DayID, DayResolvable } from "../types/day.types";
import { createMockDB } from "../mocks/mock-database";
import { NoDaysExistError } from "../utilities/error.utility";

/**
 * Provides methods for interacting with days.
 */
export class DayService {
  constructor(
    public dayRepository: DayRepository,
  ) {}

  static fromDB(db: DatabaseQuerier) {
    return new DayService(
      DayRepository.fromDB(db),
    );
  }

	static asMock() {
		const db = createMockDB();
		return DayService.fromDB(db);
	}

	/**
	 * Resolves a day object from an id, existing object, or other resolvable value.
	 * @param dayResolvable - The day resolvable to resolve.
	 * @returns The resolved day object.
	 */
  resolveDay(dayResolvable: DayResolvable): Day {
    return this.dayRepository.resolveDay(dayResolvable);
  }

	/**
	 * Resolves an ID for a day from an id, existing object, or other resolvable value.
	 * @param dayResolvable - The day resolvable to resolve the ID for.
	 * @returns The resolved day ID.
	 */
  resolveID(dayResolvable: DayResolvable): DayID {
    return this.dayRepository.resolveID(dayResolvable);
  }

	/**
	 * Creates a new day, with the given time started.
	 * If the time started is not provided, the current time will be used.
	 * @param timeStarted - The time at which the new day will start.
	 * @returns The day that was just started.
	 */
	addNewDay(timeStarted?: Date): Day {
		if (timeStarted === undefined) timeStarted = new Date();
		return this.dayRepository.addDay({timeStarted});
	}

	/**
	 * Returns the last added day, or null if there are no days that have been created
	 * @returns The last added day, or null if there are no days
	 */
	getLastAddedDay(): Day | null {
		return this.dayRepository.getDayWithHighestID();
	}

	/**
	 * Returns the last added day, or throws an error if there are no days
	 * @returns The last added day
	 */
	getCurrentDayOrThrow(): Day {
		const lastAddedDay = this.getLastAddedDay();
		if (lastAddedDay === null) 
			throw new NoDaysExistError();

		return lastAddedDay;
	}
}
