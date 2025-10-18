import { toNullOnError } from "../../../utilities/error-utils";
import { Override } from "../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../database/database-querier";
import { DBPerk, Perk, PerkID } from "../types/perk.types";
import { PlayerID } from "../types/player.types";
import { RoleID } from "../types/role.types";
import { PerkNotFoundError } from "../utilities/error.utility";
import { toPerk } from "../utilities/perk.utility";

/**
 * Provides access to the dynamic perk data.
 */
export class PerkRepository {
	db: DatabaseQuerier;

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(db: DatabaseQuerier) {
		this.db = db;
	}

	/**
	 * Returns a list of all perk objects in the game.
	 * @returns An array of perk objects.
	 */
	getPerks(): Perk[] {
		const query = `SELECT * FROM perk`;
		const getAllPerks = this.db.prepare(query);
		const dbPerks = getAllPerks.all() as DBPerk[];
		return dbPerks.map(toPerk);
	}

	/**
	 * Retrieves a perk by its ID. If the perk does not exist, an error will be thrown.
	 * @param perkID - The ID of the perk to be retrieved.
	 * @returns The perk object if found.
	 * @throws PerkNotFoundError - If the perk does not exist.
	 */
	getPerkOrThrow(perkID: PerkID): Perk {
		const query = `SELECT * FROM perk WHERE id = @id`;
		const getPerkByID = this.db.prepare(query);
		const perk = getPerkByID.get({ id: perkID }) as DBPerk | undefined;

		if (perk === undefined)
			throw new PerkNotFoundError(perkID);

		return toPerk(perk);
	}

	/**
	 * Retrieves a perk by its ID.
	 * @param perkID - The ID of the perk to be retrieved.
	 * @returns The perk object if found, otherwise null.
	 */
	getPerkByID(perkID: PerkID): Perk | null {
		return toNullOnError(() =>
			this.getPerkOrThrow(perkID)
		);
	}

	/**
	 * Retrieves a perk by its name.
	 * @param name - The name of the perk to be retrieved.
	 * @returns The perk object if found, otherwise null.
	 */
	getPerkByName(name: string): Perk | null {
		const perk = this.db.getRow(
			"SELECT * FROM perk WHERE name = @name",
			{ name }
		) as DBPerk | undefined;

		if (perk === undefined)
			return null;

		return toPerk(perk);
	}

	/**
	 * Retrieves a list of player IDs that have a perk with the given ID.
	 * @param perkID - The ID of the perk to be retrieved.
	 * @returns An array of player IDs that have the perk with the given ID.
	 */
	getIDsofPlayersWithPerkID(perkID: PerkID): string[] {
		const query = `
			SELECT playerID FROM playerPerk
			WHERE perkID = @perkID
		`;
		const getPlayersWithPerkID = this.db.prepare(query);
		const rows = getPlayersWithPerkID.all({ perkID }) as { playerID: string }[];
		return rows.map(row => row.playerID);
	}

	/**
	 * Retrieves a list of perk IDs that a player with the given ID has.
	 * @param playerID - The ID of the player to be retrieved.
	 * @returns An array of perk IDs that the player with the given ID has.
	 */
	getPerkIDsOfPlayerID(playerID: PlayerID): PerkID[] {
		const query = `
			SELECT perkID FROM playerPerk
			WHERE playerID = @playerID
		`;
		const getPerksOfPlayer = this.db.prepare(query);
		const rows = getPerksOfPlayer.all({ playerID }) as { perkID: number }[];
		return rows.map(row => row.perkID);
	}

	/**
	 * Adds a perk ID to a player ID in the database.
	 * @param perkID - The ID of the perk to be added.
	 * @param playerID - The ID of the player to have the perk added.
	 */
	addPerkIDToPlayer(perkID: PerkID, playerID: PlayerID) {
		const query = `
			INSERT INTO playerPerk (playerID, perkID)
			VALUES (@playerID, @perkID)
		`;
		this.db.run(query, { playerID, perkID });
	}

	/**
	 * Removes a perk ID from a player ID in the database.
	 * @param perkID - The ID of the perk to be removed.
	 * @param playerID - The ID of the player to have the perk removed.
	 */
	removePerkIDFromPlayer(perkID: PerkID, playerID: PlayerID) {
		const query = `
			DELETE FROM playerPerk
			WHERE playerID = @playerID AND perkID = @perkID
		`;
		this.db.run(query, { playerID, perkID });
	}

	getPerkIDsOfRoleID(roleID: RoleID): PerkID[] {
		const query = `
			SELECT perkID FROM rolePerk
			WHERE roleID = @roleID
		`;
		const getPerksOfRole = this.db.prepare(query);
		const rows = getPerksOfRole.all({ roleID }) as { perkID: number }[];
		return rows.map(row => row.perkID);
	}

	/**
	 * Retrieves whether a perk with the given ID was offered.
	 * @param perkID - The ID of the perk to be retrieved.
	 * @returns A boolean indicating whether the perk with the given ID was offered.
	 */
	getWasOffered(perkID: PerkID): boolean {
		const perk = this.getPerkOrThrow(perkID);
		return perk.wasOffered;
	}

	/**
	 * Sets whether a perk with the given ID was offered.
	 * @param perkID - The ID of the perk to be updated.
	 * @param wasOffered - A boolean indicating whether the perk with the given ID was offered.
	 * @throws PerkNotFoundError - If the perk does not exist.
	 */
	setWasOffered(perkID: PerkID, wasOffered: boolean) {
		const query = `
			UPDATE perk
			SET wasOffered = @wasOffered
			WHERE id = @id
		`;

		const runResult = this.db.run(query, {
			wasOffered: wasOffered ? 1 : 0,
			id: perkID
		});

		if (runResult.changes === 0)
			throw new PerkNotFoundError(perkID);
	}

	/**
	 * Retrieves a list of perk objects that have not been offered yet.
	 * @returns An array of perk objects that have not been offered yet.
	 */
	getPerksNotYetOffered(): Override<Perk, { wasOffered: false }>[] {
		const rows = this.db.getRows(
			`SELECT * FROM perk
			WHERE wasOffered = 0`
		) as DBPerk[];

		return rows.map(toPerk) as Override<Perk, { wasOffered: false }>[];
	}

	/**
	 * Sets whether all perks have been offered.
	 * @param wasOffered - A boolean indicating whether all perks have been offered.
	 */
	setWasOfferedForAllPerks(wasOffered: boolean) {
		const query = `
			UPDATE perk
			SET wasOffered = @wasOffered
		`;
		this.db.run(query, { wasOffered: wasOffered ? 1 : 0 });
	}
}