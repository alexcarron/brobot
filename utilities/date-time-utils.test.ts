import { addToArrayMap } from "./data-structure-utils";
import { toUnixTimestamp, toCronExpression, addDays, addSeconds, addHours, toDateFromTimeString, toNormalizedDate, getMondayOfThisWeek, getSundayOfThisWeek, getHoursInTime } from "./date-time-utils";

describe('toUnixTimestamp()', () => {
	it('should return the correct Unix timestamp for a valid Date object', () => {
		const date = new Date('2022-01-01T00:00:00.000Z');
		const expected = 1640995200;
		expect(toUnixTimestamp(date)).toBe(expected);
	});

	it('should return the correct Unix timestamp for a Date object in a different timezone', () => {
		const date = new Date('2022-01-01T00:00:00.000-05:00');
		const expected = 1641013200;
		expect(toUnixTimestamp(date)).toBe(expected);
	});

	it('should return 0 for the Unix epoch', () => {
		const date = new Date('1970-01-01T00:00:00.000Z');
		const expected = 0;
		expect(toUnixTimestamp(date)).toBe(expected);
	});

	it('should return a positive value for a future date', () => {
		const date = new Date('2050-01-01T00:00:00.000Z');
		const expected = 2524608000;
		expect(toUnixTimestamp(date)).toBe(expected);
	});
});

describe('toCronExpression()', () => {
	it('should return a valid CRON expression for a valid Date object', () => {
		const date = new Date('2022-01-01T12:30:45.000Z');
		const expected = '45 30 6 1 0 6';
		expect(toCronExpression(date)).toBe(expected);
	});

	it('should return a CRON expression with specific values', () => {
		const date = new Date('2022-01-01T12:30:45.000Z');
		date.setSeconds(10);
		date.setMinutes(20);
		date.setHours(14);
		date.setDate(15);
		date.setMonth(3);
		const expected = '10 20 14 15 3 5';
		expect(toCronExpression(date)).toBe(expected);
	});
});

describe('addDays()', () => {
  it('adds positive number of days to a valid Date object', () => {
    const date = new Date('2022-01-01T00:00:00.000Z');
    const expected = new Date('2022-01-06T00:00:00.000Z');
    expect(addDays(date, 5)).toEqual(expected);
  });

  it('adds negative number of days to a valid Date object', () => {
    const date = new Date('2022-01-01T00:00:00.000Z');
    const expected = new Date('2021-12-27T00:00:00.000Z');
    expect(addDays(date, -5)).toEqual(expected);
  });

  it('adds zero days to a valid Date object', () => {
    const date = new Date('2022-01-01T00:00:00.000Z');
    expect(addDays(date, 0)).toEqual(date);
  });
});

describe('addSeconds()', () => {
	it('adds positive number of seconds to a valid Date object', () => {
		const date = new Date('2022-01-01T00:00:00.000Z');
		const expected = new Date('2022-01-01T00:00:10.000Z');
		expect(addSeconds(date, 10)).toEqual(expected);
	});

	it('adds negative number of seconds to a valid Date object', () => {
		const date = new Date('2022-01-01T00:01:00.000Z');
		const expected = new Date('2022-01-01T00:00:50.000Z');
		expect(addSeconds(date, -10)).toEqual(expected);
	});

	it('adds zero seconds to a valid Date object', () => {
		const date = new Date('2022-01-01T00:00:00.000Z');
		expect(addSeconds(date, 0)).toEqual(date);
	});
})

describe('addHours()', () => {
	it('adds positive number of hours to a valid Date object', () => {
		const date = new Date('2022-01-01T00:00:00.000Z');
		const expected = new Date('2022-01-01T02:00:00.000Z');
		expect(addHours(date, 2)).toEqual(expected);
	});

	it('adds negative number of hours to a valid Date object', () => {
		const date = new Date('2022-01-01T02:00:00.000Z');
		const expected = new Date('2022-01-01T00:00:00.000Z');
		expect(addHours(date, -2)).toEqual(expected);
	});

	it('adds zero hours to a valid Date object', () => {
		const date = new Date('2022-01-01T00:00:00.000Z');
		expect(addHours(date, 0)).toEqual(date);
	});
});

describe('toDateFromTimeString()', () => {
	it('should convert a string of a Date\'s time to a Date object', () => {
		const expected = new Date('2022-01-01T00:00:00.000Z');
		expect(toDateFromTimeString('1640995200000')).toEqual(expected);
	});

	it('should throw an error for an invalid string', () => {
		expect(() => toDateFromTimeString('not a date')).toThrow();
	});

	it('should throw an error for an integer that is an invalid timestamp', () => {
		expect(() => toDateFromTimeString('-921031291293812931')).toThrow();
	});
});

describe('toNormalizedDate()', () => {
	it('returns the date with a time of 0:00:00.000', () => {
		const date = new Date('2022-01-01T18:12:42.172Z');
		const expected = new Date('2022-01-01T06:00:00.000Z');
		expect(toNormalizedDate(date).toISOString()).toEqual(expected.toISOString());
	});
})

describe('getMondayOfThisWeek()', () => {
	it('should return the date of the Monday of the week that the given date falls in', () => {
		const date = new Date('2025-12-25T05:32:00.000Z');
		const expected = new Date('2025-12-22T06:00:00.000Z');
		expect(getMondayOfThisWeek(date).toISOString()).toEqual(expected.toISOString());
	});

	it('should return itself if the given date is a Monday', () => {
		const date = new Date('2025-12-22T07:00:00.000Z');
		const expected = new Date('2025-12-22T06:00:00.000Z');
		expect(getMondayOfThisWeek(date).toISOString()).toEqual(expected.toISOString());
	});
});

describe('getSundayOfThisWeek()', () => {
	it('should return the date of the Sunday of the week that the given date falls in', () => {
		const date = new Date('2025-12-25T05:32:00.000Z');
		const expected = new Date('2025-12-28T06:00:00.000Z');
		expect(getSundayOfThisWeek(date).toISOString()).toEqual(expected.toISOString());
	});

	it('should return itself if the given date is a Sunday', () => {
		const date = new Date('2025-12-28T06:00:00.000Z');
		expect(getSundayOfThisWeek(date).toISOString()).toEqual(date.toISOString());
	});
});

describe('getHoursInTime()', () => {
	it('should return the hours from the given milliseconds since 1970-01-01T00:00:00Z', () => {
		expect(getHoursInTime(18 * 60 * 60 * 1000 + 21.234 * 60 * 1000)).toEqual(18);
	});

	it('should return 0 hours for 30 minutes', () => {
		expect(getHoursInTime(30 * 60 * 1000)).toEqual(0);
	});

it('should return 0 hours for 0 milliseconds', () => {
		expect(getHoursInTime(0)).toEqual(0);
	});

	it('should throw an error for an invalid number of milliseconds', () => {
		expect(() => getHoursInTime(-1)).toThrow();
	});
});

describe('addToArrayMap()', () => {
	it('should create a new array and add an item to it if the key does not exist in the Map', () => {
		const map = new Map<string, string[]>();
		addToArrayMap(map, 'key', 'item');
		expect(map.get('key')).toEqual(['item']);
	});

	it('should add an item to an array associated with a key in a Map', () => {
		const map = new Map<string, string[]>([['key', ['item1']]]);
		addToArrayMap(map, 'key', 'item2');
		expect(map.get('key')).toEqual(['item1', 'item2']);
	});
});