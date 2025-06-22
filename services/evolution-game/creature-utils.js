const { arraysHaveSameElements } = require("../../utilities/data-structure-utils");
const { createListFromWords } = require("../../utilities/text-formatting-utils");

/**
 * Asserts that the given creature is a valid creature object. Throws an error
 * if any of the required properties are missing.
 *
 * @param {Object} creature - The creature to validate.
 * @property {string} creature.name - The name of the creature.
 * @property {string[]} creature.evolvedFrom - The names of the creatures that the
 *                                              creature evolved from.
 */
const assertIsCreature = (creature, isFromArray=false) => {
	let errorMessage = undefined;

	if (creature === undefined)
		errorMessage = isFromArray ?
			'creature in creatures array is undefined' :
			'creature is undefined';
	else if (creature.name === undefined)
		errorMessage = isFromArray ?
			'creature.name in creatures array is undefined' :
			'creature.name is undefined';
	else if (creature.evolvedFrom === undefined)
		errorMessage = isFromArray ?
			'creature.evolvedFrom in creatures array is undefined' :
			'creature.evolvedFrom is undefined';

	if (errorMessage !== undefined) throw new Error(errorMessage);
}

/**
 * Asserts that the given array of creatures contains only valid creature objects.
 * Throws an error if any of the creatures are invalid or missing required
 * properties.
 *
 * @param {Object[]} creatures - The array of creatures to validate.
 */
const assertAreCreatures = (creatures) => {
	if (!Array.isArray(creatures)) throw new Error('creatures is not an array');
	creatures.forEach(creature => assertIsCreature(creature, true));
}

/**
 * Returns an array of root creatures from the given array of creatures.
 * A root creature is defined as a creature that has no ancestors (i.e., its evolvedFrom
 * array is empty).
 *
 * @param {Object[]} creatures - The array of creatures to search for root creatures.
 * @returns {Object[]} An array of root creatures.
 */

const getRootCreatures = (creatures) => {
	assertAreCreatures(creatures);
	return creatures.filter(creature => creature.evolvedFrom.length === 0);
}

/**
 * Given an array of creatures, returns an array of all the unique hybrid
 * combinations that appear in the array. A "hybrid combination" is an
 * array of creature names that together form a hybrid.
 *
 * @param {Object[]} creatures - The array of creatures to find the unique
 * hybrid combinations of.
 * @returns {string[][]} - An array of arrays of creature names, where each
 * inner array represents a unique hybrid combination.
 */
const getAllHybridTypes = (creatures) => {
	assertAreCreatures(creatures);

	const creaturesFromHybrid = creatures.filter(creature =>
		creature.evolvedFrom.length > 1
	); // Hybrids have 2+ creatures

	const hybridCombinations = creaturesFromHybrid.map(creature => creature.evolvedFrom);

	const uniqueHybridCombinations = [
		...new Map(
			hybridCombinations.map(array =>
				[JSON.stringify(array), array]

			)
		).values()
	]

	return uniqueHybridCombinations;
}

/**
 * Given an array of creatures, returns an array of all the root creatures.
 * A "root creature" is a creature that has no evolution parents, or a set of
 * creatures that together form a hybrid.
 *
 * @param {Object[]} creatures - The array of creatures to find the root
 * creatures of.
 * @returns {string[][]} - An array of arrays of creature names, where each
 * inner array represents a root creature (or a set of creatures that form a
 * hybrid).
 */
const getEvolutionRoots = (creatures) => {
	assertAreCreatures(creatures);
	const rootCreatures = getRootCreatures(creatures);
	const hybridTypes = getAllHybridTypes(creatures);

	const rootCreatureTypes = rootCreatures.map(creature => [creature.name]);
	return [...rootCreatureTypes, ...hybridTypes];
}

/**
 * Given a creature name and an array of creatures, returns the creature with
 * the given name, or undefined if no creature with that name is found.
 *
 * @param {string} creatureName - The name of the creature to search for.
 * @param {Object[]} creatures - The array of creatures to search in.
 * @returns {Object | undefined} - The creature with the given name, or undefined
 * if no creature with that name is found.
 */
const getCreatureWithName = (creatureName, creatures) => {
	assertAreCreatures(creatures);

	const creature = creatures.find(creature => creature.name.toLowerCase() === creatureName.toLowerCase());

	if (creature === undefined)
		throw new Error(`Creature with name ${creatureName} not found in creatures array`);

	return creature;
}


/**
 * Given an array of creature names, returns an array of all creatures that
 * have the given names as their evolution parents.
 *
 * @param {string[]} parentCreatureNames - The array of creature names to
 * search for in the evolution parents of the given creatures.
 * @param {Object[]} creatures - The array of creatures to search in.
 * @returns {Object[]} - An array of creatures that have the given names as
 * their evolution parents.
 */
const getChildCreaturesOf = (parentCreatureNames, creatures) => {
	assertAreCreatures(creatures);

	return creatures.filter(creature =>
		arraysHaveSameElements(parentCreatureNames, creature.evolvedFrom)
	);
}

module.exports = { assertIsCreature, assertAreCreatures, getRootCreatures, getAllHybridTypes, getEvolutionRoots, getCreatureWithName, getChildCreaturesOf, };