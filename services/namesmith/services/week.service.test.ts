import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_WEEK_ID } from "../constants/testing.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockWeek } from "../mocks/mock-data/mock-weeks";
import { Week } from "../types/week.types";
import { WeekNotFoundError } from "../utilities/error.utility";
import { WeekService } from "./week.service";

describe('WeekService', () => {
	let db: DatabaseQuerier;
	let weekService: WeekService;

	let SOME_WEEK: Week;

	beforeEach(() => {
		weekService = WeekService.asMock();
		db = weekService.weekRepository.db;

		SOME_WEEK = addMockWeek(db);
	});

	describe(`resolveWeek()`, () => {
		it(`resolves a week object from a week id`, () => {
			makeSure(weekService.resolveWeek(SOME_WEEK.id)).is(SOME_WEEK);
		});

		it(`resolves a week object from an outdated week object`, () => {
			const OUTDATED_WEEK = {
				id: SOME_WEEK.id,
				timeStarted: new Date(),
			};
			makeSure(weekService.resolveWeek(OUTDATED_WEEK)).is(SOME_WEEK);
		});

		it('throws a WeekNotFoundError if the week does not exist', () => {
			makeSure(() => weekService.resolveWeek(INVALID_WEEK_ID)).throws(WeekNotFoundError);
		});
	});

	describe('resolveID()', () => {
		it('resolves a week id from a week id', () => {
			makeSure(weekService.resolveID(SOME_WEEK.id)).is(SOME_WEEK.id);
		});
		
		it('resolves a week id from a week object', () => {
			makeSure(weekService.resolveID(SOME_WEEK)).is(SOME_WEEK.id);
		});

		it('resolves a week id from an outdated week object', () => {
			const OUTDATED_WEEK = {
				id: SOME_WEEK.id,
				timeStarted: new Date(),
			};
			makeSure(weekService.resolveID(OUTDATED_WEEK)).is(SOME_WEEK.id);
		});

		it('does not throw an error if the week does not exist', () => {
			makeSure(() => weekService.resolveID(INVALID_WEEK_ID)).doesNotThrow();
		});
	});
});