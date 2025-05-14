const { Client } = require("discord.js");

/**
 * Creates a mock Client instance with an isReady property.
 * @param {Object} [options] - Options for the mock client.
 * @param {boolean} [options.isReady] - Whether the client is ready.
 * @returns {Client} - A mock Client instance.
 */
const mockClient = ({ isReady = true } = {}) => {
	const client = new Client({ intents: [] });
	client.isReady = jest.fn().mockReturnValue(isReady);
	return client;
}

module.exports = { mockClient };