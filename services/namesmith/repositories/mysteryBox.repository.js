const { InvalidArgumentError } = require("../../../utilities/error-utils");
const DatabaseQuerier = require("../database/database-querier");
const { getCharacterValueFromID } = require("../utilities/character.utility");

/**
 * Provides access to the static mystery box data.
 */
class MysteryBoxRepository {
	/**
	 * @type {DatabaseQuerier}
	 */
	db;

	/**
	 * @param {DatabaseQuerier} db - The database querier instance used for executing SQL statements.
	 */
	constructor(db) {
		if (!(db instanceof DatabaseQuerier))
			throw new InvalidArgumentError("CharacterRepository: db must be an instance of DatabaseQuerier.");

		this.db = db;
	}

	/**
	 * Returns a list of all mystery box objects in the game.
	 * @returns {Array<{
	 * 	id: number,
	 * 	name: string,
	 *  tokenCost: number,
	 * }>} An array of mystery box objects.
	 */
	getMysteryBoxes() {
		const query = `SELECT DISTINCT * FROM mysteryBox`;
		const getAllMysteryBoxes = this.db.prepare(query);
		// @ts-ignore
		return getAllMysteryBoxes.all();
	}

	/**
	 * Returns a list of all mystery box objects in the game with their character odds.
	 * The character odds are an object with character IDs as keys and the weight of the character in the mystery box as the value.
	 * @returns {Array<{
	 * 	id: number,
	 * 	name: string,
	 * 	tokenCost: number,
	 * 	characterOdds: Record<string, number>
	 * }>} An array of mystery box objects with their character odds.
	 */
	getMysteryBoxesWithOdds() {
		const mysteryBoxes = this.getMysteryBoxes();
		const characterOddsRows = this.db.prepare(`SELECT mysteryBoxID, characterID, weight FROM mysteryBoxCharacterOdds`).all();

		// @ts-ignore
		return mysteryBoxes.map(mysteryBox => {
			const characterOdds = characterOddsRows
				// @ts-ignore
				.filter(row => row.mysteryBoxID === mysteryBox.id)
				.reduce((characterOdds, oddsRow) => {
					// @ts-ignore
					characterOdds[getCharacterValueFromID(oddsRow.characterID)] = oddsRow.weight;
					return characterOdds;
				}, {});
			return {
				...mysteryBox,
				characterOdds
			};
		});
	}

	/**
	 * Given a mystery box id, returns the corresponding mystery box object.
	 * @param {number} id - The id of the mystery box to return.
	 * @returns {{
	 * 	id: number,
	 * 	name: string,
	 *  tokenCost: number,
	 * } | undefined} The mystery box object with the given id or undefined if no such object exists.
	 */
	getMysteryBoxByID(id) {
		if (!id)
			throw new InvalidArgumentError('getMysteryBoxByID: Mystery box id must be provided.');

		if (typeof id !== 'number')
			throw new InvalidArgumentError('getMysteryBoxByID: Mystery box id must be a number.');

		const query = `SELECT * FROM mysteryBox WHERE id = @id`;
		const getMysteryBoxById = this.db.prepare(query);
		// @ts-ignore
		return getMysteryBoxById.get({ id });
	}

	/**
	 * Given a mystery box id, returns the corresponding mystery box object with its character odds.
	 * @param {number} id - The id of the mystery box to return.
	 * @returns {{
	 * 	id: number,
	 * 	name: string,
	 * 	tokenCost: number,
	 * 	characterOdds: Record<string, number>
	 * } | undefined} The mystery box object with the given id and its character odds or undefined if no such object exists.
	 */
	getMysteryBoxWithOdds(id) {
		const mysteryBox = this.getMysteryBoxByID(id);
		const characterOddsRows = this.db.prepare(`
			SELECT characterID, weight FROM mysteryBoxCharacterOdds
			WHERE mysteryBoxID = @id
		`).all({ id });

		const characterOdds = characterOddsRows.reduce((characterOdds, oddsRow) => {
			// @ts-ignore
			characterOdds[getCharacterValueFromID(oddsRow.characterID)] = oddsRow.weight;
			return characterOdds;
		}, {});

		return {
			...mysteryBox,
			// @ts-ignore
			characterOdds
		};
	}

	/**
	 * Given a mystery box id, returns an object with character IDs as keys and the weight of the character in the mystery box as the value.
	 * @param {number} mysteryBoxID - The id of the mystery box to return the character odds for.
	 * @returns {Record<number, number>} An object with character IDs as keys and the weight of the character in the mystery box as the value.
	 */
	getCharacterOdds(mysteryBoxID) {
		const query = `SELECT characterID, weight FROM mysteryBoxCharacterOdds WHERE mysteryBoxID = @mysteryBoxID`;
		const getCharacterOdds = this.db.prepare(query);
		const characterOddsRows = getCharacterOdds.all({ mysteryBoxID });

		// @ts-ignore
		return characterOddsRows.reduce((characterOdds, oddsRow) => {
			// @ts-ignore
			characterOdds[oddsRow.characterID] = oddsRow.weight;
			return characterOdds;
		}, {});
	}
}

module.exports = MysteryBoxRepository;