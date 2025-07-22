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

module.exports = { toUnixTimestamp, createNowUnixTimestamp, toCronExpression };
