import { Client } from "discord.js";

/**
 * Asserts that the Discord client is setup and ready.
 * This function will throw an Error if the client is not setup or not ready.
 * @throws {Error} If the client is not setup or not ready.
 */
export function assertClientSetup(): void {
	const client = global.client;
	if (!client)
		throw new Error(`assertClientSetup: client is not setup, got ${client}`);

	if (!(client instanceof Client))
		throw new Error(`assertClientSetup: client is not an instance of Client, got ${client}`);

	if (!client.isReady())
		throw new Error(`assertClientSetup: client is not ready, got ${client}`);
}
