import { attempt } from "./error-utils";

/**
 * Converts a given Date object to its corresponding Unix timestamp.
 * @param date - The Date object to convert.
 * @returns The Unix timestamp corresponding to the given date.
 */
const toUnixTimestamp = (date: Date): number =>
	Math.floor(date.getTime() / 1000);

/**
 * Creates a Unix timestamp for the current time.
 * @returns A Unix timestamp for the current time.
 */
const createNowUnixTimestamp = (): number =>
	toUnixTimestamp(new Date());

/**
 * Converts a given Date object to a CRON expression.
 * @param date - The Date object to convert.
 * @returns The CRON expression corresponding to the given date.
 */
const toCronExpression = (date: Date): string => {
	const seconds = date.getSeconds();
	const minutes = date.getMinutes();
	const hours = date.getHours();
	const dayOfMonth = date.getDate();
	const month = date.getMonth();
	const dayOfWeek = date.getDay();

	const cronExpression = `${seconds} ${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;
	return cronExpression;
}

/**
 * Adds a specified number of days to a given Date object.
 * @param date - The Date object to modify.
 * @param days - The number of days to add to the given Date object.
 * @returns A new Date object with the specified number of days added to the original date.
 * @example
 * const fiveDaysLater = addDays(new Date(), 5);
 */
const addDays = (date: Date, days: number): Date => {
	const newDate = new Date(date.getTime());
	newDate.setDate(newDate.getDate() + days);
	return newDate;
}

/**
 * Adds a specified number of hours to a given Date object.
 * @param date - The Date object to modify.
 * @param hours - The number of hours to add to the given Date object.
 * @returns A new Date object with the specified number of hours added to the original date.
 * @example
 * const fiveHoursLater = addHours(new Date(), 5);
 */
const addHours = (date: Date, hours: number): Date => {
	const newDate = new Date(date.getTime());
	newDate.setHours(newDate.getHours() + hours);
	return newDate;
}

/**
 * Adds a specified number of minutes to a given Date object.
 * @param date - The Date object to modify.
 * @param minutes - The number of minutes to add to the given Date object.
 * @returns A new Date object with the specified number of minutes added to the original date.
 * @example
 * const fiveMinutesLater = addMinutes(new Date(), 5);
 */
const addMinutes = (date: Date, minutes: number): Date => {
	const newDate = new Date(date.getTime());
	newDate.setMinutes(newDate.getMinutes() + minutes);
	return newDate;
}

/**
 * Adds a specified number of seconds to a given Date object.
 * @param date - The Date object to modify.
 * @param seconds - The number of seconds to add to the given Date object.
 * @returns A new Date object with the specified number of seconds added to the original date.
 * @example
 * const fiveSecondsLater = addSeconds(new Date(), 5);
 */
const addSeconds = (date: Date, seconds: number): Date => {
	const newDate = new Date(date.getTime());
	newDate.setSeconds(newDate.getSeconds() + seconds);
	return newDate;
}

/**
 * Converts a given time string to a Date object.
 * @param timeString - The number of milliseconds since 1970-01-01T00:00:00Z.
 * @returns A Date object with the given time string.
 * @throws An error if the time string is not a valid number of milliseconds since 1970-01-01T00:00:00Z.
 * @example
 * const date = toDateFromTimeString('1640995200000');
 */
const toDateFromTimeString = (timeString: string): Date => {
	const time = attempt(() => parseInt(timeString))
		.onError(() => {
			throw new Error(`Time string should be the number of milliseconds since 1970-01-01T00:00:00Z, but was ${timeString}`)
		})
		.getReturnValue();

	const date = new Date(time);
	if (isNaN(date.getTime()))
		throw new Error(`Time string should be the number of milliseconds since 1970-01-01T00:00:00Z, but was ${timeString}`);

	return date;
}

const getYesterday = (): Date => addDays(new Date(), -1);
const getToday = (): Date => new Date();
const getTomorrow = (): Date => addDays(new Date(), 1);

/**
 * Converts the date into the same date but with a normalized time of 0:00
 * @param date - The date to normalize
 * @returns The normalized date
 */
function toNormalizedDate(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Returns the date of the Monday of the week that the given date falls in.
 * @param date - The date to get the Monday of the week for.
 * @returns The date of the Monday of the week that the given date falls in.
 * @example
 * const monday = getMondayOfThisWeek(new Date());
 */
function getMondayOfThisWeek(date: Date): Date {
	const weekdayNum = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
	const daysToMonday = (weekdayNum + 6) % 7; // Sunday -> 6, Monday -> 0, Tuesday -> 1, etc.
	return toNormalizedDate(addDays(date, -daysToMonday));
}

/**
 * Returns the date of the Sunday of the week that the given date falls in.
 * @param date - The date to get the Sunday of the week for.
 * @returns The date of the Sunday of the week that the given date falls in.
 * @example
 * const sunday = getSundayOfThisWeek(new Date());
 */
function getSundayOfThisWeek(date: Date): Date {
	return addDays(getMondayOfThisWeek(date), 6);
}

/**
 * Returns the hours from the given milliseconds since 1970-01-01T00:00:00Z.
 * @param milliseconds - The milliseconds since 1970-01-01T00:00:00Z.
 * @returns The hours from the given milliseconds since 1970-01-01T00:00:00Z.
 * @example
 * const hours = getHoursInTime(1640995200000);
 */
function getHoursInTime(milliseconds: number): number {
	if (milliseconds < 0) throw new Error(`Expected given milliseconds in getHoursInTime function to be 0 or greater, but was ${milliseconds}`);

	return Math.floor(milliseconds / 1000 / 60 / 60);
}

/**
 * Returns the minutes from the given milliseconds since 1970-01-01T00:00:00Z.
 * @param milliseconds - The milliseconds since 1970-01-01T00:00:00Z.
 * @returns The minutes from the given milliseconds since 1970-01-01T00:00:00Z.
 * @example
 * const minutes = getMinutesInTime(1640995200000);
 */
function getMinutesInTime(milliseconds: number): number {
	if (milliseconds < 0) throw new Error(`Expected given milliseconds in getMinutesInTime function to be 0 or greater, but was ${milliseconds}`);

	return Math.floor(milliseconds / 1000 / 60);
}

export { toUnixTimestamp, createNowUnixTimestamp, toCronExpression, addDays, addHours, addMinutes, addSeconds, toDateFromTimeString, getYesterday, getToday, getTomorrow, getMondayOfThisWeek, getSundayOfThisWeek, toNormalizedDate, getHoursInTime, getMinutesInTime };
