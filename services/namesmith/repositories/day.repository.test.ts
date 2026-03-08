import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_DAY_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockDay } from "../mocks/mock-data/mock-days";
import { Day } from "../types/day.types";
import { DayAlreadyExistsError } from "../utilities/error.utility";
import { DayRepository } from "./day.repository";

describe('DayRepository', () => {
	let dayRepository: DayRepository;
	let db: DatabaseQuerier;

	let MOCK_DAY: Day;

	beforeEach(() => {
		dayRepository = DayRepository.asMock();
		db = dayRepository.db;

		MOCK_DAY = addMockDay(db);
	});

	describe('getDays()', () => {
		it('returns all days', () => {
			const days = dayRepository.getDays();
			makeSure(days).isNotEmpty();
			makeSure(days).haveProperties('id', 'timeStarted');
		});

		it('contains the mock day', () => {
			const days = dayRepository.getDays();
			makeSure(days).contains(MOCK_DAY);
		});
	});

	describe('getDayByID()', () => {
		it('returns the day with the given ID', () => {
			const day = dayRepository.getDayByID(MOCK_DAY.id);
			makeSure(day).is(MOCK_DAY);
		});

		it('returns null if no day with the given ID exists', () => {
			const day = dayRepository.getDayByID(INVALID_DAY_ID);
			makeSure(day).isNull();
		});
	});

	describe('getDayOrThrow()', () => {
		it('returns the day with the given ID', () => {
			const day = dayRepository.getDayOrThrow(MOCK_DAY.id);
			makeSure(day).is(MOCK_DAY);
		});

		it('throws a DayAlreadyExistsError if no day with the given ID exists', () => {
			makeSure(() =>
				dayRepository.getDayOrThrow(INVALID_DAY_ID)
			).throws(DayAlreadyExistsError);
		});
	});

	describe('doesDayExist()', () => {
		it('returns true if a day with the given ID exists', () => {
			makeSure(dayRepository.doesDayExist(MOCK_DAY.id)).isTrue();
		});

		it('returns false if no day with the given ID exists', () => {
			makeSure(dayRepository.doesDayExist(INVALID_DAY_ID)).isFalse();
		});
	});

	describe('addDay()', () => {
		it('adds a new day to the database', () => {
			const timeStarted = new Date('2023-01-01');
			const day = dayRepository.addDay({ timeStarted });

			makeSure(day).is({ id: 2, timeStarted });

			const resolvedDay = dayRepository.getDayOrThrow(day.id);
			makeSure(resolvedDay).is(day);
		});

		it('generates an id for the new day', () => {
			const day = dayRepository.addDay({ timeStarted: new Date('2023-01-01') });
			makeSure(day).hasProperty('id');
		});

		it('persists the timeStarted property correctly', () => {
			const timeStarted = new Date('2023-06-15T08:30:00');
			const day = dayRepository.addDay({ timeStarted });

			makeSure(day).hasProperty('timeStarted', timeStarted);
		});

		it('stores multiple days independently', () => {
			const day1 = dayRepository.addDay({ timeStarted: new Date('2023-01-01') });
			const day2 = dayRepository.addDay({ timeStarted: new Date('2023-01-02') });

			makeSure(day1.id).isNot(day2.id);

			const days = dayRepository.getDays();
			makeSure(days).contains(day1);
			makeSure(days).contains(day2);
		});
	});
});