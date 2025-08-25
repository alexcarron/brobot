import { InvalidArgumentError } from "../../../utilities/error-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { CharacterOdds, DBCharacterOddsRow, DBMysteryBox, MysteryBox, MysteryBoxWithOdds } from "../types/mystery-box.types";
import { getCharacterValueFromID } from "../utilities/character.utility";

/**
 * Provides access to the static mystery box data.
 */
export class MysteryBoxRepository {
	db: DatabaseQuerier;

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(db: DatabaseQuerier) {
		this.db = db;
	}

	/**
	 * Returns a list of all mystery box objects in the game.
	 * @returns An array of mystery box objects.
	 */
	getMysteryBoxes(): MysteryBox[] {
		const query = `SELECT DISTINCT * FROM mysteryBox`;
		const getAllMysteryBoxes = this.db.prepare(query);
		return getAllMysteryBoxes.all() as DBMysteryBox[];
	}

	/**
	 * Returns a list of all mystery box objects in the game with their character odds.
	 * The character odds are an object with character IDs as keys and the weight of the character in the mystery box as the value.
	 * @returns An array of mystery box objects with their character odds.
	 */
	getMysteryBoxesWithOdds(): MysteryBoxWithOdds[] {
		const mysteryBoxes = this.getMysteryBoxes();
		const characterOddsRows =
			this.db.prepare(`SELECT mysteryBoxID, characterID, weight FROM mysteryBoxCharacterOdds`)
			.all() as DBCharacterOddsRow[];

		return mysteryBoxes.map(mysteryBox => {
			const characterOdds = characterOddsRows
				.filter(row => row.mysteryBoxID === mysteryBox.id)
				.reduce<CharacterOdds>((characterOdds, oddsRow) => {
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
	 * @param id - The id of the mystery box to return.
	 * @returns The mystery box object with the given id or null if no such object exists.
	 */
	getMysteryBoxByID(id: number): MysteryBox | null {
		if (!id)
			throw new InvalidArgumentError('getMysteryBoxByID: Mystery box id must be provided.');

		if (typeof id !== 'number')
			throw new InvalidArgumentError('getMysteryBoxByID: Mystery box id must be a number.');

		const query = `SELECT * FROM mysteryBox WHERE id = @id`;
		const getMysteryBoxById = this.db.prepare(query);
		const mysteryBox = getMysteryBoxById.get({ id }) as DBMysteryBox | undefined;
		return mysteryBox ?? null;
	}

	/**
	 * Given a mystery box id, returns the corresponding mystery box object with its character odds.
	 * @param id - The id of the mystery box to return.
	 * @returns The mystery box object with the given id and its character odds or null if no such object exists.
	 */
	getMysteryBoxWithOdds(id: number): MysteryBoxWithOdds | null {
		const mysteryBox = this.getMysteryBoxByID(id);
		if (mysteryBox === null) return null;

		const characterOddsRows = this.db.prepare(`
			SELECT characterID, weight FROM mysteryBoxCharacterOdds
			WHERE mysteryBoxID = @id
		`).all({ id }) as DBCharacterOddsRow[];

		const characterOdds = characterOddsRows
			.reduce<CharacterOdds>((characterOdds, oddsRow) => {
				characterOdds[getCharacterValueFromID(oddsRow.characterID)] = oddsRow.weight;
				return characterOdds;
			}, {});

		return {
			...mysteryBox,
			characterOdds
		};
	}

	/**
	 * Given a mystery box id, returns an object with character IDs as keys and the weight of the character in the mystery box as the value.
	 * @param mysteryBoxID - The id of the mystery box to return the character odds for.
	 * @returns An object with character IDs as keys and the weight of the character in the mystery box as the value.
	 */
	getCharacterOdds(mysteryBoxID: number): CharacterOdds {
		const query = `SELECT characterID, weight FROM mysteryBoxCharacterOdds WHERE mysteryBoxID = @mysteryBoxID`;
		const getCharacterOdds = this.db.prepare(query);
		const characterOddsRows = getCharacterOdds.all({ mysteryBoxID }) as DBCharacterOddsRow[];

		return characterOddsRows
			.reduce<CharacterOdds>((characterOdds, oddsRow) => {
				characterOdds[oddsRow.characterID] = oddsRow.weight;
				return characterOdds;
			}, {});
	}
}