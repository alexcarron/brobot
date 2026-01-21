import { attempt } from "./error-utils";
import { toListOfWords } from "./string-manipulation-utils";
import { WithAtLeastOneProperty } from "./types/generic-types";

/**
 * The oldest possible Date object.
 */
export const OLDEST_DATE = new Date(0);

/**
 * Converts a given Date object to its corresponding Unix timestamp.
 * @param date - The Date object to convert.
 * @returns The Unix timestamp corresponding to the given date.
 */
export const toUnixTimestamp = (date: Date): number =>
	Math.floor(date.getTime() / 1000);

/**
 * Creates a Unix timestamp for the current time.
 * @returns A Unix timestamp for the current time.
 */
export const createNowUnixTimestamp = (): number =>
	toUnixTimestamp(new Date());

/**
 * Converts a given Date object to a CRON expression.
 * @param date - The Date object to convert.
 * @returns The CRON expression corresponding to the given date.
 */
export const toCronExpression = (date: Date): string => {
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
export const addDays = (date: Date, days: number): Date => {
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
export const addHours = (date: Date, hours: number): Date => {
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
export const addMinutes = (date: Date, minutes: number): Date => {
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
export const addSeconds = (date: Date, seconds: number): Date => {
	const newDate = new Date(date.getTime());
	newDate.setSeconds(newDate.getSeconds() + seconds);
	return newDate;
}

/**
 * Adds a specified number of milliseconds to a given Date object.
 * @param date - The Date object to modify.
 * @param milliseconds - The number of milliseconds to add to the given Date object.
 * @returns A new Date object with the specified number of milliseconds added to the original date.
 */
export const addMilliseconds = (date: Date, milliseconds: number): Date => {
	const newDate = new Date(date.getTime());
	newDate.setMilliseconds(newDate.getMilliseconds() + milliseconds);
	return newDate;
}

/**
 * Represents a duration in days, hours, minutes, seconds, and milliseconds.
 * @example
 * const duration = { days: 1, hours: 2, minutes: 3, seconds: 4, milliseconds: 5 };
 */
export type Duration = WithAtLeastOneProperty<{
	days?: number;
	hours?: number;
	minutes?: number;
	seconds?: number;
	milliseconds?: number;
}>;

/**
 * Returns the total number of milliseconds in a given duration.
 * @param duration - The duration object to convert to milliseconds.
 * @returns The total number of milliseconds in the given duration.
 * @example
 * const duration = { days: 1, hours: 2, minutes: 3, seconds: 4, milliseconds: 5 };
 * const milliseconds = getMillisecondsOfDuration(duration);
 */
export function getMillisecondsOfDuration(duration: Duration): number {
	return (
		(duration?.days ?? 0) * 24 * 60 * 60 * 1000 +
		(duration?.hours ?? 0) * 60 * 60 * 1000 +
		(duration?.minutes ?? 0) * 60 * 1000 +
		(duration?.seconds ?? 0) * 1000 +
		(duration?.milliseconds ?? 0)
	);
}

/**
 * Adds a specified duration to a given Date object.
 * @param date - The Date object to modify.
 * @param duration - The duration to add to the given Date object.
 * @param duration.days - The number of days to add to the given Date object.
 * @param duration.hours - The number of hours to add to the given Date object.
 * @param duration.minutes - The number of minutes to add to the given Date object.
 * @param duration.seconds - The number of seconds to add to the given Date object.
 * @param duration.milliseconds - The number of milliseconds to add to the given Date object.
 * @returns A new Date object with the specified duration added to the original date.
 * @example
 * const fiveMinutesLater = addDuration(new Date(), { minutes: 5 });
 */
export function addDuration(
	date: Date,
	duration: Duration,
): Date {
	const newDate = new Date(date.getTime());
	newDate.setDate((newDate.getDate() + (duration?.days ?? 0)));
	newDate.setHours((newDate.getHours() + (duration?.hours ?? 0)));
	newDate.setMinutes((newDate.getMinutes() + (duration?.minutes ?? 0)));
	newDate.setSeconds((newDate.getSeconds() + (duration?.seconds ?? 0)));
	newDate.setMilliseconds((newDate.getMilliseconds() + (duration?.milliseconds ?? 0)));
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
export const toDateFromTimeString = (timeString: string): Date => {
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

export const getYesterday = (): Date => addDays(new Date(), -1);
export const getToday = (): Date => new Date();
export const getTomorrow = (): Date => addDays(new Date(), 1);

/**
 * Converts the date into the same date but with a normalized time of 0:00
 * @param date - The date to normalize
 * @returns The normalized date
 */
export function toNormalizedDate(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Returns the date of the Monday of the week that the given date falls in.
 * @param date - The date to get the Monday of the week for.
 * @returns The date of the Monday of the week that the given date falls in.
 * @example
 * const monday = getMondayOfThisWeek(new Date());
 */
export function getMondayOfThisWeek(date: Date): Date {
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
export function getSundayOfThisWeek(date: Date): Date {
	return addDays(getMondayOfThisWeek(date), 6);
}

/**
 * Returns the hours from the given milliseconds since 1970-01-01T00:00:00Z.
 * @param milliseconds - The milliseconds since 1970-01-01T00:00:00Z.
 * @returns The hours from the given milliseconds since 1970-01-01T00:00:00Z.
 * @example
 * const hours = getHoursInTime(1640995200000);
 */
export function getHoursInTime(milliseconds: number): number {
	if (milliseconds < 0) throw new Error(`Expected given milliseconds in getHoursInTime function to be 0 or greater, but was ${milliseconds}`);

	return Math.floor(milliseconds / 1000 / 60 / 60);
}

/**
 * Returns the seconds from the given milliseconds since 1970-01-01T00:00:00Z.
 * @param milliseconds - The milliseconds since 1970-01-01T00:00:00Z.
 * @returns The seconds from the given milliseconds since 1970-01-01T00:00:00Z.
 * @example
 * const seconds = getSecondsInTime(1640995200000);
 */
export function getSecondsInTime(milliseconds: number): number {
	if (milliseconds < 0) throw new Error(`Expected given milliseconds in getSecondsInTime function to be 0 or greater, but was ${milliseconds}`);

	return Math.floor(milliseconds / 1000);
}

/**
 * Returns the minutes from the given milliseconds since 1970-01-01T00:00:00Z.
 * @param milliseconds - The milliseconds since 1970-01-01T00:00:00Z.
 * @returns The minutes from the given milliseconds since 1970-01-01T00:00:00Z.
 * @example
 * const minutes = getMinutesInTime(1640995200000);
 */
export function getMinutesInTime(milliseconds: number): number {
	if (milliseconds < 0) throw new Error(`Expected given milliseconds in getMinutesInTime function to be 0 or greater, but was ${milliseconds}`);

	return Math.floor(milliseconds / 1000 / 60);
}

export function getMinutesDurationFromTime(milliseconds: number): {
	minutes: number;
	seconds: number;
	milliseconds: number;
} {
	if (milliseconds < 0) throw new Error(`Expected given milliseconds in getMinutesDurationFromTime function to be 0 or greater, but was ${milliseconds}`)

	const totalMinutes = Math.floor(milliseconds / 1000 / 60);
	const remainingSeconds = Math.floor((milliseconds / 1000) % 60);
	const remainingMilliseconds = milliseconds % 1000;
	return { minutes: totalMinutes, seconds: remainingSeconds, milliseconds: remainingMilliseconds };
}

export function getReadableDuration(totalSeconds: number): string {
	const days = Math.floor(totalSeconds / 60 / 60 / 24);
	const hours = Math.floor((totalSeconds / 60 / 60) % 24);
	const minutes = Math.floor((totalSeconds / 60) % 60);
	const seconds = totalSeconds % 60;

	const toReadableNumber = (number: number): string => {
		if (number >= 0 && number <= 9) {
			switch (number) {
				case 0: return "zero";
				case 1: return "one";
				case 2: return "two";
				case 3: return "three";
				case 4: return "four";
				case 5: return "five";
				case 6: return "six";
				case 7: return "seven";
				case 8: return "eight";
				case 9: return "nine";
			}
		}

		// Add comma separator every three digits
		if (number >= 1000)
			return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");

		return number.toString();
	}

	const segments: string[] = [];
	if (days > 0)
		segments.push(`${toReadableNumber(days)} day${days > 1 ? "s" : ""}`);

	if (hours > 0)
		segments.push(`${toReadableNumber(hours)} hour${hours > 1 ? "s" : ""}`);

	if (minutes > 0)
		segments.push(`${toReadableNumber(minutes)} minute${minutes > 1 ? "s" : ""}`);

	if (seconds > 0)
		segments.push(`${toReadableNumber(seconds)} second${seconds > 1 ? "s" : ""}`);

	if (segments.length === 0)
		return "zero seconds";

	return toListOfWords(segments);
}