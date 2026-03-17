import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_WEEK_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockWeek } from "../mocks/mock-data/mock-weeks";
import { Week } from "../types/week.types";
import { WeekNotFoundError } from "../utilities/error.utility";
import { WeekRepository } from "./week.repository";

describe('WeekRepository', () => {
	let weekRepository: WeekRepository;
	let db: DatabaseQuerier;

	let MOCK_WEEK: Week;
	let SOME_TIME: Date;

	beforeEach(() => {
		weekRepository = WeekRepository.asMock();
		db = weekRepository.db;

		MOCK_WEEK = addMockWeek(db);
		SOME_TIME = new Date();
	});

	describe('getWeeks()', () => {
		it('returns all weeks', () => {
			const weeks = weekRepository.getWeeks();
			makeSure(weeks).isNotEmpty();
			makeSure(weeks).haveProperties('id');
		});

		it('contains the mock week', () => {
			const weeks = weekRepository.getWeeks();
			makeSure(weeks).contains(MOCK_WEEK);
		});
	});

	describe('getWeekByID()', () => {
		it('returns the week with the given ID', () => {
			const week = weekRepository.getWeekByID(MOCK_WEEK.id);
			makeSure(week).is(MOCK_WEEK);
		});

		it('returns null if no week with the given ID exists', () => {
			const week = weekRepository.getWeekByID(INVALID_WEEK_ID);
			makeSure(week).isNull();
		});
	});

	describe('getWeekOrThrow()', () => {
		it('returns the week with the given ID', () => {
			const week = weekRepository.getWeekOrThrow(MOCK_WEEK.id);
			makeSure(week).is(MOCK_WEEK);
		});

		it('throws a WeekNotFoundError if no week with the given ID exists', () => {
			makeSure(() =>
				weekRepository.getWeekOrThrow(INVALID_WEEK_ID)
			).throws(WeekNotFoundError);
		});
	});

	describe('doesWeekExist()', () => {
		it('returns true if a week with the given ID exists', () => {
			makeSure(weekRepository.doesWeekExist(MOCK_WEEK.id)).isTrue();
		});

		it('returns false if no week with the given ID exists', () => {
			makeSure(weekRepository.doesWeekExist(INVALID_WEEK_ID)).isFalse();
		});
	});

	describe('addWeek()', () => {
		it('adds a new week to the database', () => {
			const week = weekRepository.addWeek({
				timeStarted: SOME_TIME,
			});

			makeSure(week.timeStarted).is(SOME_TIME);

			const resolvedWeek = weekRepository.getWeekOrThrow(week.id);
			makeSure(resolvedWeek).is(week);
		});

		it('generates an id for the new week', () => {
			const week = weekRepository.addWeek({
				timeStarted: SOME_TIME,
			});
			makeSure(week).hasProperty('id');
		});
	});

	describe('getWeekWithHighestID()', () => {
		it('returns null if the database is empty', () => {
			db.deleteAllFromTable('week');
			makeSure(weekRepository.getWeekWithHighestID()).isNull();
		});

		it('returns the week with the highest ID from the database', () => {
			weekRepository.addWeek({ timeStarted: new Date('2023-01-01') });
			weekRepository.addWeek({ timeStarted: new Date('2023-01-03') });
			const highestWeek = weekRepository.addWeek({ timeStarted: new Date('2023-01-02') });

			const resolvedWeek = weekRepository.getWeekWithHighestID();
			makeSure(resolvedWeek).is(highestWeek);
		});

		it('returns the only week if there is only one week in the database', () => {
			const onlyWeek = weekRepository.addWeek({ timeStarted: new Date('2023-01-01') });

			const resolvedWeek = weekRepository.getWeekWithHighestID();
			makeSure(resolvedWeek).is(onlyWeek);
		});
	});
});
