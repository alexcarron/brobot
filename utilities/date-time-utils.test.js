const { toUnixTimestamp, toCronExpression, addDays } = require("./date-time-utils");

describe('toUnixTimestamp()', () => {
	it('should return the correct Unix timestamp for a valid Date object', () => {
		const date = new Date('2022-01-01T00:00:00.000Z');
		const expected = 1640995200;
		expect(toUnixTimestamp(date)).toBe(expected);
	});

	it('should throw an error for an invalid Date object (null)', () => {
		expect(() => toUnixTimestamp(null)).toThrow();
	});

	it('should throw an error for an invalid Date object (undefined)', () => {
		expect(() => toUnixTimestamp(undefined)).toThrow();
	});

	it('should throw an error for an invalid Date object (string)', () => {
		expect(() => toUnixTimestamp('not a date')).toThrow();
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

	it('should throw an error for an invalid Date object (null)', () => {
		expect(() => toCronExpression(null)).toThrow();
	});

	it('should throw an error for an invalid Date object (undefined)', () => {
		expect(() => toCronExpression(undefined)).toThrow();
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

  it('throws an error for an invalid Date object (null)', () => {
    expect(() => addDays(null, 5)).toThrow();
  });

  it('throws an error for an invalid Date object (undefined)', () => {
    expect(() => addDays(undefined, 5)).toThrow();
  });

  it('throws an error for an invalid Date object (string)', () => {
    expect(() => addDays('not a date', 5)).toThrow();
  });
});