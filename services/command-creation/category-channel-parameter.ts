import { ApplicationCommandOptionChoiceData, AutocompleteInteraction, CategoryChannel, ChatInputCommandInteraction, Guild } from 'discord.js';
import { Parameter, ParameterTypes } from './parameter';
import { filterAutocompleteByEnteredValue, getEnteredValue, limitAutocompleteChoices } from './autocomplete-utils';
import { fetchCategory, getRequiredStringParam } from '../../utilities/discord-fetch-utils';
import { getCachedCategoryChannelsOfGuild } from '../../utilities/discord-cache-utils';

/**
 * A reusable category channel parameter.
 */
export const CategoryChannelParameter = new Parameter({
	type: ParameterTypes.STRING,
	name: "category",
	description: "The category channel",
	isAutocomplete: true,
});

/**
 * Autocomplete handler for CategoryChannelParameter. Suggests category channels in the guild whose names start with what the user has typed so far.
 * @param interaction - The autocomplete interaction to respond to.
 */
export async function autocompleteCategoryChannelParameter(interaction: AutocompleteInteraction): Promise<void> {
	const guild = interaction.guild;
	if (!guild) return;

	const enteredValue = getEnteredValue(interaction);
	const allCategories = getCachedCategoryChannelsOfGuild(guild);

	let choices: ApplicationCommandOptionChoiceData[] = allCategories.map((category) => ({
		name: category.name, 
		value: category.id
	}));
	choices = filterAutocompleteByEnteredValue(choices, enteredValue);
	choices = limitAutocompleteChoices(choices);

	if (choices.length <= 0) {
		choices = [{name: "Sorry, there are no categories to choose from", value: "N/A"}];
	}

	await interaction.respond(choices);
}

/**
 * Resolves the category channel selected via CategoryChannelParameter on an interaction.
 * @param interaction - The interaction the category channel was selected on.
 * @param guild - The guild the category channel belongs to.
 * @returns The selected category channel.
 */
export async function getCategoryChannelFromInteraction(interaction: ChatInputCommandInteraction, guild: Guild): Promise<CategoryChannel> {
	const categoryID = getRequiredStringParam(interaction, CategoryChannelParameter.name);
	return await fetchCategory(guild, categoryID);
}
