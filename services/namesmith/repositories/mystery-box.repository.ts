import { ignoreError, InvalidArgumentError, returnNonNullOrThrow } from "../../../utilities/error-utils";
import { WithRequiredAndOneOther } from "../../../utilities/types/generic-types";
import { DatabaseQuerier, toAssignmentsPlaceholder } from "../database/database-querier";
import { CharacterOdds, DBCharacterOddsRow, DBMysteryBox, MinimalMysteryBox, MysteryBoxID, MysteryBox, MysteryBoxDefinition, MinimalMysteryBoxDefinition } from "../types/mystery-box.types";
import { getCharacterValueFromID, getIDfromCharacterValue } from "../utilities/character.utility";
import { MysteryBoxAlreadyExistsError, MysteryBoxNotFoundError } from "../utilities/error.utility";
import { CharacterRepository } from "./character.repository";

/**
 * Provides access to the static mystery box data.
 */
export class MysteryBoxRepository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(
		public db: DatabaseQuerier
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new MysteryBoxRepository(db);
	}

	/**
	 * Returns a list of all mystery box objects in the game without their character odds.
	 * @returns An array of mystery box objects with minimal fields.
	 */
	private getMinimalMysteryBoxes(): MinimalMysteryBox[] {
		const query = `SELECT DISTINCT * FROM mysteryBox`;
		const getAllMysteryBoxes = this.db.prepare(query);
		return getAllMysteryBoxes.all() as DBMysteryBox[];
	}

	/**
	 * Returns a list of all mystery box objects in the game with their character odds.
	 * The character odds are an object with character IDs as keys and the weight of the character in the mystery box as the value.
	 * @returns An array of mystery box objects with their character odds.
	 */
	getMysteryBoxes(): MysteryBox[] {
		const minimalMysteryBoxes = this.getMinimalMysteryBoxes();
		const characterOddsRows =
			this.db.getRows(
				`SELECT mysteryBoxID, characterID, weight
				FROM mysteryBoxCharacterOdds`
			) as DBCharacterOddsRow[];

		return minimalMysteryBoxes.map(minimalMysteryBox => {
			const characterOdds = characterOddsRows
				.filter(row => row.mysteryBoxID === minimalMysteryBox.id)
				.reduce<CharacterOdds>((characterOdds, oddsRow) => {
					const character = getCharacterValueFromID(oddsRow.characterID);
					characterOdds[character] = oddsRow.weight;
					return characterOdds;
				}, {});

			return {
				...minimalMysteryBox,
				characterOdds
			};
		});
	}

	/**
	 * Given a mystery box id, returns the corresponding mystery box object.
	 * @param id - The id of the mystery box to return.
	 * @returns The mystery box object with the given id or null if no such object exists.
	 */
	private getMinimalMysteryBox(id: MysteryBoxID): MinimalMysteryBox | null {
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
	getMysteryBox(id: number): MysteryBox | null {
		const mysteryBox = this.getMinimalMysteryBox(id);
		if (mysteryBox === null) return null;

		const characterOddsRows = this.db.getRows(
			`SELECT characterID, weight FROM mysteryBoxCharacterOdds
			WHERE mysteryBoxID = @id`,
			{ id }
		) as DBCharacterOddsRow[];

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

	getMinimalMysteryBoxOrThrow (id: MysteryBoxID): MinimalMysteryBox {
		return returnNonNullOrThrow(
			this.getMinimalMysteryBox(id),
			new MysteryBoxNotFoundError(id)
		);
	}

	getMysteryBoxOrThrow(id: MysteryBoxID): MysteryBox {
		return returnNonNullOrThrow(
			this.getMysteryBox(id),
			new MysteryBoxNotFoundError(id)
		);
	}

	/**
	 * Given a mystery box id, returns an object with character IDs as keys and the weight of the character in the mystery box as the value.
	 * @param mysteryBoxID - The id of the mystery box to return the character odds for.
	 * @returns An object with character IDs as keys and the weight of the character in the mystery box as the value.
	 */
	getCharacterOdds(mysteryBoxID: MysteryBoxID): CharacterOdds {
		const query = `SELECT characterID, weight FROM mysteryBoxCharacterOdds WHERE mysteryBoxID = @mysteryBoxID`;
		const getCharacterOdds = this.db.prepare(query);
		const characterOddsRows = getCharacterOdds.all({ mysteryBoxID }) as DBCharacterOddsRow[];

		return characterOddsRows
			.reduce<CharacterOdds>((characterOdds, oddsRow) => {
				characterOdds[oddsRow.characterID] = oddsRow.weight;
				return characterOdds;
			}, {});
	}

	/**
	 * Returns the token cost of a mystery box.
	 * @param mysteryBoxID - The ID of the mystery box to get the token cost for.
	 * @returns The token cost of the mystery box.
	 * @throws {MysteryBoxNotFoundError} If a mystery box with the given ID does not exist.
	 */
	getTokenCost(mysteryBoxID: MysteryBoxID): number {
		const mysteryBox = this.getMinimalMysteryBox(mysteryBoxID);

		if (mysteryBox === null)
			throw new MysteryBoxNotFoundError(mysteryBoxID);

		return mysteryBox.tokenCost;
	}

	/**
	 * Adds a mystery box to the database with the given properties.
	 * If the mystery box id is provided, it will be used to insert the mystery box into the database.
	 * If the mystery box id is not provided, the database will generate an id for the mystery box.
	 * @param mysteryBox - The mystery box data to add.
	 * @param mysteryBox.id - The ID of the mystery box.
	 * @param mysteryBox.name - The name of the mystery box.
	 * @param mysteryBox.tokenCost - The number of tokens to purchase the mystery box.
	 * @returns The added mystery box with an ID.
	 * @throws {MysteryBoxAlreadyExistsError} If the mystery box with the given ID already exists.
	 */
	private addMinimalMysteryBox(
		{id, name, tokenCost}: MinimalMysteryBoxDefinition
	): MinimalMysteryBox {
		if (id !== undefined) {
			const result = this.db.run(
				`INSERT OR IGNORE INTO mysteryBox (id, name, tokenCost)
				VALUES (@id, @name, @tokenCost)`,
				{ id, name, tokenCost }
			);

			if (result.changes === 0)
				throw new MysteryBoxAlreadyExistsError(id);
		}
		else {
			const result = this.db.run(
				`INSERT INTO mysteryBox (name, tokenCost)
				VALUES (@name, @tokenCost)`,
				{ name, tokenCost }
			);
			id = Number(result.lastInsertRowid);
		}

		return { id, name, tokenCost };
	}

	/**
	 * Adds a mystery box to the database with the given properties.
	 * @param mysteryBoxDefinition - The mystery box data to add.
	 * @param mysteryBoxDefinition.id - The ID of the mystery box.
	 * @param mysteryBoxDefinition.name - The name of the mystery box.
	 * @param mysteryBoxDefinition.tokenCost - The number of tokens to purchase the mystery box.
	 * @param mysteryBoxDefinition.characterOdds - The character odds of the mystery box.
	 * @returns The added mystery box with an ID.
	 * @throws {MysteryBoxAlreadyExistsError} If the mystery box with the given ID already exists.
	 */
	addMysteryBox(
		{id, name, tokenCost, characterOdds}: MysteryBoxDefinition
	): MysteryBox {
		const minimalMysteryBox = this.addMinimalMysteryBox({ id, name, tokenCost });

		for (const characterValue in characterOdds) {
			const weight = characterOdds[characterValue];
			const characterID = getIDfromCharacterValue(characterValue);

			ignoreError(() =>
				new CharacterRepository(this.db).addCharacter({
					id: characterID,
					value: characterValue,
					rarity: weight
				})
			);

			this.db.run(
				`INSERT INTO mysteryBoxCharacterOdds (mysteryBoxID, characterID, weight)
				VALUES (@mysteryBoxID, @characterID, @weight)`,
				{
					mysteryBoxID: minimalMysteryBox.id,
					characterID,
					weight
				}
			);
		}

		return {
			...minimalMysteryBox,
			characterOdds
		};
	}

	/**
	 * Updates a minimal mystery box in the database with the given properties.
	 * @param mysteryBoxDefintion - The mystery box data to update.
	 * @param mysteryBoxDefintion.id - The ID of the mystery box.
	 * @param mysteryBoxDefintion.name - The name of the mystery box.
	 * @param mysteryBoxDefintion.tokenCost - The number of tokens to purchase the mystery box.
	 * @returns The updated mystery box object or a MysteryBoxNotFoundError if the mystery box with the given ID does not exist.
	 */
	updateMinimalMysteryBox({ id, name, tokenCost }:
			WithRequiredAndOneOther<MinimalMysteryBoxDefinition, 'id'>
	) {
		this.db.run(
			`UPDATE mysteryBox
			SET ${toAssignmentsPlaceholder({ name, tokenCost })}
			WHERE id = @id`,
			{ id, name, tokenCost }
		);

		return this.getMinimalMysteryBoxOrThrow(id);
	}

	/**
	 * Updates a mystery box in the database with the given properties.
	 * @param mysteryBoxDefinition - The mystery box data to update.
	 * @param mysteryBoxDefinition.id - The ID of the mystery box.
	 * @param mysteryBoxDefinition.name - The name of the mystery box.
	 * @param mysteryBoxDefinition.tokenCost - The number of tokens to purchase the mystery box.
	 * @param mysteryBoxDefinition.characterOdds - The character odds of the mystery box.
	 * @returns The updated mystery box object or a MysteryBoxNotFoundError if the mystery box with the given ID does not exist.
	 * @throws {MysteryBoxNotFoundError} If no mystery box with the given ID exists.
	 */
	updateMysteryBox({ id, name, tokenCost, characterOdds }:
		WithRequiredAndOneOther<MysteryBoxDefinition, 'id'>
	): MysteryBox {
		if (name !== undefined || tokenCost !== undefined)
			this.updateMinimalMysteryBox({ id, name: name!, tokenCost });

		if (characterOdds !== undefined) {
			this.db.run(
				`DELETE FROM mysteryBoxCharacterOdds
				WHERE mysteryBoxID = @mysteryBoxID`,
				{ mysteryBoxID: id }
			);

			for (const characterValue in characterOdds) {
				const weight = characterOdds[characterValue];
				const characterID = getIDfromCharacterValue(characterValue);

				this.db.run(
					`INSERT INTO mysteryBoxCharacterOdds (mysteryBoxID, characterID, weight)
					VALUES (@mysteryBoxID, @characterID, @weight)`,
					{
						mysteryBoxID: id,
						characterID,
						weight
					}
				);
			}
		}

		return this.getMysteryBoxOrThrow(id);
	}

	/**
	 * Removes a mystery box with the given ID.
	 * @param id - The ID of the mystery box to remove.
	 * @throws {MysteryBoxNotFoundError} If no mystery box with the given ID exists.
	 */
	removeMysteryBox(id: MysteryBoxID) {
		const result = this.db.run(
			`DELETE FROM mysteryBox WHERE id = ?`, id
		);

		if (result.changes === 0)
			throw new MysteryBoxNotFoundError(id);
	}
}