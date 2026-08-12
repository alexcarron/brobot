import { makeSure, withFakeTimers } from "../../../utilities/jest/jest-utils";
import { INVALID_DAY_ID } from "../constants/testing.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockDay } from "../mocks/mock-data/mock-days";
import { Day } from "../types/day.types";
import { DayNotFoundError, NoDaysExistError } from "../utilities/error.utility";
import { DayService } from "./day.service";

describe('DayService', () => {
	let db: DatabaseQuerier;
	let dayService: DayService;

	let SOME_DAY: Day;
	

	beforeEach(() => {
		dayService = DayService.asMock();
		db = dayService.dayRepository.db;

		SOME_DAY = addMockDay(db);
	});

	describe(`resolveDay()`, () => {
		it(`resolves a day object from a day id`, () => {
			makeSure(dayService.resolveDay(SOME_DAY.id)).is(SOME_DAY);
		});

		it(`resolves a day object from an outdated day object`, () => {
			const OUTDATED_DAY = {
				id: SOME_DAY.id,
				timeStarted: new Date(),
			};
			makeSure(dayService.resolveDay(OUTDATED_DAY)).is(SOME_DAY);
		});

		it('throws a DayNotFoundError if the day does not exist', () => {
			makeSure(() => dayService.resolveDay(INVALID_DAY_ID)).throws(DayNotFoundError);
		});
	});

	describe('resolveID()', () => {
		it('resolves a day id from a day id', () => {
			makeSure(dayService.resolveID(SOME_DAY.id)).is(SOME_DAY.id);
		});
		
		it('resolves a day id from a day object', () => {
			makeSure(dayService.resolveID(SOME_DAY)).is(SOME_DAY.id);
		});

		it('resolves a day id from an outdated day object', () => {
			const OUTDATED_DAY = {
				id: SOME_DAY.id,
				timeStarted: new Date(),
			};
			makeSure(dayService.resolveID(OUTDATED_DAY)).is(SOME_DAY.id);
		});

		it('does not throw an error if the day does not exist', () => {
			makeSure(() => dayService.resolveID(INVALID_DAY_ID)).doesNotThrow();
		});
	});

	describe(`addNewDay()`, () => {
		it(`should create a new day at the given time`, () => {
			const SOME_TIME = new Date();
			dayService.addNewDay(SOME_TIME);

			const lastDay = dayService.getLastAddedDay();
			makeSure(lastDay).isNotNull();
			makeSure(lastDay?.timeStarted).is(SOME_TIME);
		});

		it('should return the created day', () => {
			const SOME_TIME = new Date();
			const day = dayService.addNewDay(SOME_TIME);

			makeSure(day).isNotNull();
			makeSure(day.timeStarted).is(SOME_TIME)
		});

		it('should create day at current time if no time is provided', () => {
			const SOME_TIME = new Date();
			withFakeTimers(SOME_TIME, () => {
				const day = dayService.addNewDay();
				makeSure(day.timeStarted).is(SOME_TIME);
			})
		});
	});

	describe('getCurrentDayOrThrow()', () => {
		it('should return the last added day', () => {
			const SOME_DAY = dayService.addNewDay();
			const lastAddedDay = dayService.getCurrentDayOrThrow();

			makeSure(lastAddedDay).is(SOME_DAY);
		});

		it('should throw an error if there are no days', () => {
			db.deleteAllFromTable('day');

			makeSure(() => dayService.getCurrentDayOrThrow()).throws(NoDaysExistError);
		});
	});
});