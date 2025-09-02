const { attempt } = require("./error-utils");

/**
 * Converts a given Date object to its corresponding Unix timestamp.
 * @param {Date} date - The Date object to convert.
 * @returns {number} The Unix timestamp corresponding to the given date.
 */
const toUnixTimestamp = (date) =>
	Math.floor(date.getTime() / 1000);

/**
 * Creates a Unix timestamp for the current time.
 * @returns {number} A Unix timestamp for the current time.
 */
const createNowUnixTimestamp = () =>
	toUnixTimestamp(new Date());

/**
 * Converts a given Date object to a CRON expression.
 * @param {Date} date - The Date object to convert.
 * @returns {string} The CRON expression corresponding to the given date.
 */
const toCronExpression = (date) => {
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
 * @param {Date} date - The Date object to modify.
 * @param {number} days - The number of days to add to the given Date object.
 * @returns {Date} A new Date object with the specified number of days added to the original date.
 * @example
 * const fiveDaysLater = addDays(new Date(), 5);
 */
const addDays = (date, days) => {
	const newDate = new Date(date.getTime());
	newDate.setDate(newDate.getDate() + days);
	return newDate;
}

/**
 * Adds a specified number of hours to a given Date object.
 * @param {Date} date - The Date object to modify.
 * @param {number} hours - The number of hours to add to the given Date object.
 * @returns {Date} A new Date object with the specified number of hours added to the original date.
 * @example
 * const fiveHoursLater = addHours(new Date(), 5);
 */
const addHours = (date, hours) => {
	const newDate = new Date(date.getTime());
	newDate.setHours(newDate.getHours() + hours);
	return newDate;
}

/**
 * Adds a specified number of seconds to a given Date object.
 * @param {Date} date - The Date object to modify.
 * @param {number} seconds - The number of seconds to add to the given Date object.
 * @returns {Date} A new Date object with the specified number of seconds added to the original date.
 * @example
 * const fiveSecondsLater = addSeconds(new Date(), 5);
 */
const addSeconds = (date, seconds) => {
	const newDate = new Date(date.getTime());
	newDate.setSeconds(newDate.getSeconds() + seconds);
	return newDate;
}

/**
 * Converts a given time string to a Date object.
 * @param {string} timeString - The number of milliseconds since 1970-01-01T00:00:00Z.
 * @returns {Date} A Date object with the given time string.
 * @throws An error if the time string is not a valid number of milliseconds since 1970-01-01T00:00:00Z.
 * @example
 * const date = toDateFromTimeString('1640995200000');
 */
const toDateFromTimeString = (timeString) => {
	let time = attempt(() => parseInt(timeString))
		.onError(() => {
			throw new Error(`Time string should be the number of milliseconds since 1970-01-01T00:00:00Z, but was ${timeString}`)
		})
		.getReturnValue();

	const date = new Date(time);
	if (isNaN(date.getTime()))
		throw new Error(`Time string should be the number of milliseconds since 1970-01-01T00:00:00Z, but was ${timeString}`);

	return date;
}

module.exports = { toUnixTimestamp, createNowUnixTimestamp, toCronExpression, addDays, addHours, addSeconds, toDateFromTimeString };
