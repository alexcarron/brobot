/**
 * Converts a given Date object to its corresponding Unix timestamp.
 *
 * @param {Date} date - The Date object to convert.
 * @returns {number} The Unix timestamp corresponding to the given date.
 */
const toUnixTimestamp = (date) =>
	Math.floor(date.getTime() / 1000);

/**
 * Creates a Unix timestamp for the current time.
 *
 * @returns {number} A Unix timestamp for the current time.
 */
const createNowUnixTimestamp = () =>
	toUnixTimestamp(new Date());

module.exports = { toUnixTimestamp, createNowUnixTimestamp };
