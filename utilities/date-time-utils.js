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

module.exports = { toUnixTimestamp, createNowUnixTimestamp, toCronExpression, addDays, addSeconds };
