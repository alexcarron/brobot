import { AutocompleteInteraction, ChatInputCommandInteraction, Guild } from "discord.js";
import { ids } from "../../bot-config/discord-ids";
import { assertClientSetup } from "./client-utils";

/**
 * Fetches a guild from Discord using the global client.
 * @param guildID The ID of the guild to fetch.
 * @returns A Promise that resolves with the Guild object if successful, or rejects with an Error if not.
 * @throws {Error} If the client is not setup or not ready.
 */
export async function fetchGuild(guildID: string): Promise<Guild> {
	assertClientSetup();
	return await global.client.guilds.fetch(guildID);
}

/**
 * Gets the guild of the interaction.
 * @param interaction The interaction object of the slash command.
 * @returns The Guild object of the interaction.
 * @throws {Error} If the interaction is not in a guild.
 */
export function getGuildOfInteraction(interaction: ChatInputCommandInteraction | AutocompleteInteraction): Guild {
	const guild = interaction.guild;

	if (guild === null) {
		throw new Error(`getGuildOfInteraction: Interaction is not in a guild, got ${guild}`);
	}

	return guild;
}

/**
 * Fetches the Rapid Discord Mafia guild.
 * @returns A Promise that resolves with the Rapid Discord Mafia guild.
 */
export async function fetchRDMGuild(): Promise<Guild> {
	return await fetchGuild(ids.servers.rapid_discord_mafia);
}
