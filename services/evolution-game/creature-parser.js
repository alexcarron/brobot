const { Message } = require("discord.js");

/**
 * Parse creature entry from raw biological text data.
 * @param {string} text - Raw text to parse
 * @param {Array<string>} knownCreatureNames - Array of known creature names
 * @returns {Array<{ name: string, evolvedFrom: string[] }> | undefined} Array of creature entries, or undefined if the text is invalid
 */
const parseCreature = (text, knownCreatureNames = []) => {
	// Remove markdown (backticks, astricks, etc.)
	text = text
		.replace(/`/g, '') // Remove backticks
		.replace(/\*/g, '') // Remove asterisks
		.replace(/_/g, '') // Remove underscores

	// Remove link markdown (i.e. [text](link))
	text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');

	const nameMatch = text.match(/Name:\s*([^\n]+)/);
	let evolvedMatch = text.match(/(?:Evolved|Evolution|Evol\w*)(?:\s+(?:from|of|into|\w+)?)?:\s*([^\n]+)/i);

	if (!nameMatch) return undefined; // skip invalid entries

	const name = nameMatch[1].trim();
	let evolvedFrom = [];

	if (!evolvedMatch)
		evolvedMatch = text.match(/Evolution of:\s*([^\n]+)/i);

	if (evolvedMatch) {
		// Handle both single name and hybrids
		const rawEvolvedMatch = evolvedMatch[1].trim();

    // Normalize and tokenize the line
    let candidates = rawEvolvedMatch
      .replace(/(?:Hybrid|Hybryd|Hy\w*d) of/i, '') // Remove leading 'Hybrid of' if present
			.split(/\s*(?:(?:, and )|,|\/|&|\sand\s)\s*/i) // Split on commas, slashes, and 'and'
			.map(s => s.trim()) // Trim whitespace from each name
			.filter(text =>
				text !== undefined &&
				text !== null &&
				text !== ""
			);

		// Split hybrid mentions like "Hybrid of X and Y"
		evolvedFrom = candidates
	}

	return {
		name,
		evolvedFrom,
	};
}

/**
 * Given an array of Discord messages describing creatures and an optional array of known
 * creature names, returns an array of parsed creature objects. Each creature
 * object has a name and an evolvedFrom property, which is an array of other
 * creature names that the creature evolved from.
 *
 * @param {Message[]} [messages=[]] - An array of Discord messages to parse.
 * @param {string[]} [knownCreatureNames=[]] - An array of known creature names.
 * @returns {{name: string, evolvedFrom: string[], link: string}[]} - An array of parsed creature objects.
 */
const parseCreaturesFromMessages = (messages = [], knownCreatureNames = []) => {
	const creatures = [];

	for (const message of messages) {
		const creatureText = message.content;
		const creature = parseCreature(creatureText, knownCreatureNames);
		if (creature === undefined) continue;

		const linkToMessage = `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;
		creature.link = linkToMessage;

		knownCreatureNames.push(creature.name);
		knownCreatureNames.push(...creature.evolvedFrom);
		creatures.push(creature);
	}

	return creatures;
}

// Export the module
module.exports = { parseCreature, parseCreaturesFromMessages };
