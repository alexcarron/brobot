import { toUnixTimestamp, toCronExpression, addDays, addSeconds, addHours, toDateFromTimeString, toNormalizedDate, getMondayOfThisWeek, getSundayOfThisWeek, getHoursInTime, getReadableDuration, getMinutesInTime, getSecondsInTime, getMinutesDurationFromTime, addMinutes, addDuration } from "./date-time-utils";
import { makeSure } from "./jest/jest-utils";

describe('date-time-utils', () => {
	describe('toUnixTimestamp()', () => {
		it('should return the correct Unix timestamp for a valid Date object', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			const expected = 1640995200;
			makeSure(toUnixTimestamp(date)).toBe(expected);
		});

		it('should return the correct Unix timestamp for a Date object in a different timezone', () => {
			const date = new Date('2022-01-01T00:00:00.000-05:00');
			const expected = 1641013200;
			makeSure(toUnixTimestamp(date)).toBe(expected);
		});

		it('should return 0 for the Unix epoch', () => {
			const date = new Date('1970-01-01T00:00:00.000Z');
			const expected = 0;
			makeSure(toUnixTimestamp(date)).toBe(expected);
		});

		it('should return a positive value for a future date', () => {
			const date = new Date('2050-01-01T00:00:00.000Z');
			const expected = 2524608000;
			makeSure(toUnixTimestamp(date)).toBe(expected);
		});
	});

	describe('toCronExpression()', () => {
		it('should return a valid CRON expression for a valid Date object', () => {
			const date = new Date('2022-01-01T12:30:45.000Z');
			const expected = '45 30 6 1 0 6';
			makeSure(toCronExpression(date)).toBe(expected);
		});

		it('should return a CRON expression with specific values', () => {
			const date = new Date('2022-01-01T12:30:45.000Z');
			date.setSeconds(10);
			date.setMinutes(20);
			date.setHours(14);
			date.setDate(15);
			date.setMonth(3);
			const expected = '10 20 14 15 3 5';
			makeSure(toCronExpression(date)).toBe(expected);
		});
	});

	describe('addDays()', () => {
		it('adds positive number of days to a valid Date object', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			const expected = new Date('2022-01-06T00:00:00.000Z');
			makeSure(addDays(date, 5)).is(expected);
		});

		it('adds negative number of days to a valid Date object', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			const expected = new Date('2021-12-27T00:00:00.000Z');
			makeSure(addDays(date, -5)).is(expected);
		});

		it('adds zero days to a valid Date object', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			makeSure(addDays(date, 0)).is(date);
		});
	});

	describe('addSeconds()', () => {
		it('adds positive number of seconds to a valid Date object', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			const expected = new Date('2022-01-01T00:00:10.000Z');
			makeSure(addSeconds(date, 10)).is(expected);
		});

		it('adds negative number of seconds to a valid Date object', () => {
			const date = new Date('2022-01-01T00:01:00.000Z');
			const expected = new Date('2022-01-01T00:00:50.000Z');
			makeSure(addSeconds(date, -10)).is(expected);
		});

		it('adds zero seconds to a valid Date object', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			makeSure(addSeconds(date, 0)).is(date);
		});
	})

	describe('addHours()', () => {
		it('adds positive number of hours to a valid Date object', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			const expected = new Date('2022-01-01T02:00:00.000Z');
			makeSure(addHours(date, 2)).is(expected);
		});

		it('adds negative number of hours to a valid Date object', () => {
			const date = new Date('2022-01-01T02:00:00.000Z');
			const expected = new Date('2022-01-01T00:00:00.000Z');
			makeSure(addHours(date, -2)).is(expected);
		});

		it('adds zero hours to a valid Date object', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			makeSure(addHours(date, 0)).is(date);
		});
	});

	describe('addMinutes()', () => {
		it('adds positive number of minutes to a valid Date object', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			const expected = new Date('2022-01-01T00:10:00.000Z');
			makeSure(addMinutes(date, 10)).is(expected);
		});

		it('adds negative number of minutes to a valid Date object', () => {
			const date = new Date('2022-01-01T00:10:00.000Z');
			const expected = new Date('2022-01-01T00:00:00.000Z');
			makeSure(addMinutes(date, -10)).is(expected);
		});

		it('adds zero minutes to a valid Date object', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			makeSure(addMinutes(date, 0)).is(date);
		});
	});

	describe('addDuration()', () => {
		it('should return the original date if the duration is empty', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			const duration = {};
			makeSure(addDuration(date, duration)).is(date);
		});

		it('should return the original date if the duration is zero', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			const duration = { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
			makeSure(addDuration(date, duration)).is(date);
		});

		it('should return the date plus one day if the duration is one day', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			const duration = { days: 1, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
			const expected = new Date('2022-01-02T00:00:00.000Z');
			makeSure(addDuration(date, duration)).is(expected);
		});

		it('should return the date plus one hour if the duration is one hour', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			const duration = { days: 0, hours: 1, minutes: 0, seconds: 0, milliseconds: 0 };
			const expected = new Date('2022-01-01T01:00:00.000Z');
			makeSure(addDuration(date, duration)).is(expected);
		});

		it('should return the date plus one minute if the duration is one minute', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			const duration = { days: 0, hours: 0, minutes: 1, seconds: 0, milliseconds: 0 };
			const expected = new Date('2022-01-01T00:01:00.000Z');
			makeSure(addDuration(date, duration)).is(expected);
		});

		it('should return the date plus one second if the duration is one second', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			const duration = { days: 0, hours: 0, minutes: 0, seconds: 1, milliseconds: 0 };
			const expected = new Date('2022-01-01T00:00:01.000Z');
			makeSure(addDuration(date, duration)).is(expected);
		});

		it('should return the date plus one millisecond if the duration is one millisecond', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			const duration = { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 1 };
			const expected = new Date('2022-01-01T00:00:00.001Z');
			makeSure(addDuration(date, duration)).is(expected);
		});

		it('should return the date plus the duration if the duration is a combination of days, hours, minutes, seconds, and milliseconds', () => {
			const date = new Date('2022-01-01T00:00:00.000Z');
			const duration = { days: 1, hours: 2, minutes: 3, seconds: 4, milliseconds: 5 };
			const expected = new Date('2022-01-02T02:03:04.005Z');
			makeSure(addDuration(date, duration)).is(expected);
		});

	});

	describe('toDateFromTimeString()', () => {
		it('should convert a string of a Date\'s time to a Date object', () => {
			const expected = new Date('2022-01-01T00:00:00.000Z');
			makeSure(toDateFromTimeString('1640995200000')).is(expected);
		});

		it('should throw an error for an invalid string', () => {
			makeSure(() => toDateFromTimeString('not a date')).toThrow();
		});

		it('should throw an error for an integer that is an invalid timestamp', () => {
			makeSure(() => toDateFromTimeString('-921031291293812931')).toThrow();
		});
	});

	describe('toNormalizedDate()', () => {
		it('returns the date with a time of 0:00:00.000', () => {
			const date = new Date('2022-01-01T18:12:42.172Z');
			const expected = new Date('2022-01-01T06:00:00.000Z');
			makeSure(toNormalizedDate(date).toISOString()).is(expected.toISOString());
		});
	})

	describe('getMondayOfThisWeek()', () => {
		it('should return the date of the Monday of the week that the given date falls in', () => {
			const date = new Date('2025-12-25T05:32:00.000Z');
			const expected = new Date('2025-12-22T06:00:00.000Z');
			makeSure(getMondayOfThisWeek(date).toISOString()).is(expected.toISOString());
		});

		it('should return itself if the given date is a Monday', () => {
			const date = new Date('2025-12-22T07:00:00.000Z');
			const expected = new Date('2025-12-22T06:00:00.000Z');
			makeSure(getMondayOfThisWeek(date).toISOString()).is(expected.toISOString());
		});
	});

	describe('getSundayOfThisWeek()', () => {
		it('should return the date of the Sunday of the week that the given date falls in', () => {
			const date = new Date('2025-12-25T05:32:00.000Z');
			const expected = new Date('2025-12-28T06:00:00.000Z');
			makeSure(getSundayOfThisWeek(date).toISOString()).is(expected.toISOString());
		});

		it('should return itself if the given date is a Sunday', () => {
			const date = new Date('2025-12-28T06:00:00.000Z');
			makeSure(getSundayOfThisWeek(date).toISOString()).is(date.toISOString());
		});
	});

	describe('getHoursInTime()', () => {
		it('should return the hours from the given milliseconds since 1970-01-01T00:00:00Z', () => {
			makeSure(getHoursInTime(18 * 60 * 60 * 1000 + 21.234 * 60 * 1000)).is(18);
		});

		it('should return 0 hours for 30 minutes', () => {
			makeSure(getHoursInTime(30 * 60 * 1000)).is(0);
		});

	it('should return 0 hours for 0 milliseconds', () => {
			makeSure(getHoursInTime(0)).is(0);
		});

		it('should throw an error for an invalid number of milliseconds', () => {
			makeSure(() => getHoursInTime(-1)).toThrow();
		});
	});


	describe('getReadableDuration()', () => {
		it('should return a string representing the duration in days, hours, minutes, and seconds', () => {
			makeSure(getReadableDuration(0)).is('zero seconds');
			makeSure(getReadableDuration(1)).is('one second');
			makeSure(getReadableDuration(60)).is('one minute');
			makeSure(getReadableDuration(23)).is('23 seconds');
			makeSure(getReadableDuration(60 * 6 + 20)).is('six minutes and 20 seconds');
			makeSure(getReadableDuration(61)).is('one minute and one second');
			makeSure(getReadableDuration(60 * 60)).is('one hour');
			makeSure(getReadableDuration(60 * 60 + 1)).is('one hour and one second');
			makeSure(getReadableDuration(60 * 60 * 24)).is('one day');
			makeSure(getReadableDuration(60 * 60 * 24 + 1)).is('one day and one second');
			makeSure(getReadableDuration(60 * 60 * 24 + 60 * 60)).is('one day and one hour');
			makeSure(getReadableDuration(60 * 60 * 24 + 60 * 60 + 1)).is('one day, one hour, and one second');
			makeSure(getReadableDuration(60 * 60 * 24 * 2)).is('two days');
			makeSure(getReadableDuration(60 * 60 * 24 * 2 + 1)).is('two days and one second');
			makeSure(getReadableDuration(60 * 60 * 24 * 2 + 60 * 60)).is('two days and one hour');
			makeSure(getReadableDuration(60 * 60 * 24 * 2 + 60 * 60 + 1)).is('two days, one hour, and one second');
			makeSure(getReadableDuration(60 * 60 * 24 * 3)).is('three days');
			makeSure(getReadableDuration(60 * 60 * 24 * 3 + 1)).is('three days and one second');
			makeSure(getReadableDuration(60 * 60 * 24 * 3 + 60 * 60)).is('three days and one hour');
			makeSure(getReadableDuration(60 * 60 * 24 * 3 + 60 * 60 + 1)).is('three days, one hour, and one second');
		});

		it('should handle large numbers of days', () => {
			makeSure(getReadableDuration(60 * 60 * 24 * 100)).is('100 days');
			makeSure(getReadableDuration(60 * 60 * 24 * 1000)).is('1,000 days');
			makeSure(getReadableDuration(60 * 60 * 24 * 10000)).is('10,000 days');
			makeSure(getReadableDuration(60 * 60 * 24 * 100000)).is('100,000 days');
			makeSure(getReadableDuration(60 * 60 * 24 * 1000000)).is('1,000,000 days');
		})
	});

	describe('getMinutesInTime()', () => {
		it('should return the minutes from the given milliseconds since 1970-01-01T00:00:00Z', () => {
			makeSure(getMinutesInTime(18 * 60 * 1000 + 21.234 * 1000)).is(18);
		});

		it('should return 0 minutes for 30 seconds', () => {
			makeSure(getMinutesInTime(30 * 1000)).is(0);
		});

		it('should return 0 minutes for 0 milliseconds', () => {
			makeSure(getMinutesInTime(0)).is(0);
		});

		it('should throw an error for an invalid number of milliseconds', () => {
			makeSure(() => getMinutesInTime(-1)).toThrow();
		});
	});

	describe('getSecondsInTime()', () => {
		it('should return the seconds from the given milliseconds since 1970-01-01T00:00:00Z', () => {
			makeSure(getSecondsInTime(1000 * 18.234)).is(18);
		});

		it('should return 0 seconds for 30 milliseconds', () => {
			makeSure(getSecondsInTime(30)).is(0);
		});

		it('should return 0 seconds for 0 milliseconds', () => {
			makeSure(getSecondsInTime(0)).is(0);
		});

		it('should throw an error for an invalid number of milliseconds', () => {
			makeSure(() => getSecondsInTime(-1)).toThrow();
		});
	});

	describe('getMinutesDurationFromTime()', () => {
		it('should return the minutes and seconds from the given milliseconds since 1970-01-01T00:00:00Z', () => {
			makeSure(getMinutesDurationFromTime(
				1000 * 60 * 10 +
				1000 * 30 +
				234.5
			)).toEqual({ minutes: 10, seconds: 30, milliseconds: 234.5 });
		});

		it('should return 0 minutes but 30 seconds for 30 seconds', () => {
			makeSure(getMinutesDurationFromTime(30 * 1000)).toEqual({ minutes: 0, seconds: 30, milliseconds: 0 });
		});

		it('should return 0 minutes and 0 seconds for 0 milliseconds', () => {
			makeSure(getMinutesDurationFromTime(0)).toEqual({ minutes: 0, seconds: 0, milliseconds: 0 });
		});

		it('should throw an error for an invalid number of milliseconds', () => {
			makeSure(() => getMinutesDurationFromTime(-1)).toThrow();
		});
	});
});