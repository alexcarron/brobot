const { createListFromWords } = require("../../utilities/string-manipulation-utils");
const { getChildCreaturesOf, assertAreCreatures, assertIsCreature } = require("./creature-utils");

const getCreatureText = creature => {
	assertIsCreature(creature);

	return `[${creature.name}](${creature.link})`;
}

const getCreaturesText = creatures => {
	assertAreCreatures(creatures);

	return createListFromWords(
		creatures.map(creature => getCreatureText(creature))
	);
};

/**
 * Recursively generate a string of all child creatures of each creature in the
 * childCreatures array, indented by numParents levels.
 * @param {object[]} childCreatures - An array of creature objects
 * @param {object[]} creatures - An array of all creature objects
 * @param {number} [numParents] - The number of levels of indentation to use
 * @returns {string} - A string of all child creatures indented by numParents levels
 */
const getChildCreaturesText = (childCreatures, creatures, numParents = 1) => {
	assertAreCreatures(creatures);

	let message  = '';

	for (const child of childCreatures) {
		const indent = '  '.repeat(numParents - 1);
		const childCreatureText = getCreatureText(child);
		const childMessage = `${indent}* ${childCreatureText}\n`;
		message += childMessage;

		const subChildren = getChildCreaturesOf([child.name], creatures);
		if (subChildren.length === 0) continue;

		const subChildMessage = getChildCreaturesText(subChildren, creatures, numParents + 1);
		message += subChildMessage;
	}

	return message;

}

module.exports = { getCreatureText, getCreaturesText, getChildCreaturesText };