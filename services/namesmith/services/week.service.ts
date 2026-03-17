import { WeekRepository } from "../repositories/week.repository";
import { DatabaseQuerier } from "../database/database-querier";
import { Week, WeekID, WeekResolvable } from "../types/week.types";
import { createMockDB } from "../mocks/mock-database";

/**
 * Provides methods for interacting with weeks.
 */
export class WeekService {
  constructor(
    public weekRepository: WeekRepository,
  ) {}

  static fromDB(db: DatabaseQuerier) {
    return new WeekService(
      WeekRepository.fromDB(db),
    );
  }

	static asMock() {
		const db = createMockDB();
		return WeekService.fromDB(db);
	}

	/**
	 * Resolves a week object from an id, existing object, or other resolvable value.
	 * @param weekResolvable - The week resolvable to resolve.
	 * @returns The resolved week object.
	 */
  resolveWeek(weekResolvable: WeekResolvable): Week {
    return this.weekRepository.resolveWeek(weekResolvable);
  }

	/**
	 * Resolves an ID for a week from an id, existing object, or other resolvable value.
	 * @param weekResolvable - The week resolvable to resolve the ID for.
	 * @returns The resolved week ID.
	 */
  resolveID(weekResolvable: WeekResolvable): WeekID {
    return this.weekRepository.resolveID(weekResolvable);
  }

	/**
	 * Creates a new week with the given time it started or the current time if not provided.
	 * @param timeStarted - The time at which the new week will start.
	 * @returns The week that was just started.
	 */
	addNewWeek(timeStarted?: Date): Week {
		if (timeStarted === undefined) timeStarted = new Date();
		return this.weekRepository.addWeek({timeStarted});
	}

	/**
	 * Gets the last week that was created or null if no weeks exist
	 * @returns The last added week, or null if there are no weeks
	 */
	getLastAddedWeek(): Week | null {
		return this.weekRepository.getWeekWithHighestID();
	}
}
