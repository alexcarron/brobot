import { returnNonNullOrThrow } from "../../../utilities/error-utils";
import { WithRequiredAndOneOther } from "../../../utilities/types/generic-types";
import { isNumber, isString } from "../../../utilities/types/type-guards";
import { DatabaseQuerier, toAssignmentsPlaceholder } from "../database/database-querier";
import { DBQuest, Quest, QuestDefinition, QuestID, QuestName, QuestResolvable } from "../types/quest.types";
import { QuestAlreadyExistsError, QuestNotFoundError } from "../utilities/error.utility";
import { toQuest } from '../utilities/quest.utility';
import { toDBBool, toOptionalDBBool } from "../utilities/db.utility";

/**
 * Provides access to the quest data.
 */
export class QuestRepository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(
		public db: DatabaseQuerier
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new QuestRepository(db);
	}

	/**
	 * @param dbQuest - The DB representation of a quest to convert.
	 * @returns The converted quest.
	 */
	private toQuestFromDB(dbQuest: DBQuest): Quest {
		return toQuest(dbQuest);
	}

	/**
	 * Returns all quests in the database.
	 * @returns An array of all quest objects.
	 */
	getQuests(): Quest[] {
		const dbQuests = this.db.getRows(
			"SELECT * FROM quest"
		) as DBQuest[];
		return dbQuests
			.map(dbQuest => this.toQuestFromDB(dbQuest));
	}

	/**
	 * Retrieves a quest object by its ID.
	 * @param id - The ID of the quest to retrieve.
	 * @returns The quest object with the given ID, or null if no such quest exists.
	 */
	getQuestByID(id: QuestID): Quest | null {
		const dbQuest = this.db.getRow(
			"SELECT * FROM quest WHERE id = ?", id
		) as DBQuest | undefined;

		if (dbQuest === undefined)
			return null;

		return this.toQuestFromDB(dbQuest);
	}

	/**
	 * Retrieves a quest object by its ID, or throws an error if no such quest exists.
	 * @param id - The ID of the quest to retrieve.
	 * @returns The quest object with the given ID.
	 * @throws {QuestNotFoundError} If no quest with the given ID exists.
	 */
	getQuestOrThrow(id: QuestID): Quest {
		return returnNonNullOrThrow(
			this.getQuestByID(id),
			new QuestNotFoundError(id)
		)
	}

	/**
	 * Retrieves a quest object by its name.
	 * @param name - The name of the quest to retrieve.
	 * @returns The quest object with the given name, or null if no such quest exists.
	 */
	getQuestByName(name: string): Quest | null {
		const dbQuest = this.db.getRow(
			"SELECT * FROM quest WHERE name = ?", name
		) as DBQuest | undefined;

		if (dbQuest === undefined)
			return null;

		return this.toQuestFromDB(dbQuest);
	}

	/**
	 * Retrieves a quest object by its name, or throws an error if no such quest exists.
	 * @param name - The name of the quest to retrieve.
	 * @returns The quest object with the given name.
	 * @throws {QuestNotFoundError} If no quest with the given name exists.
	 */
	getQuestByNameOrThrow(name: string): Quest {
		return returnNonNullOrThrow(
			this.getQuestByName(name),
			new QuestNotFoundError(name)
		)
	}

	/**
	 * Resolves a quest object from a given quest ID, quest name, or a quest object.
	 * @param questResolvable - A quest id, quest name, or a quest object.
	 * @returns The resolved quest object.
	 * @throws {QuestNotFoundError} If no quest with the given ID or name exists.
	 */
	resolveQuest(questResolvable: QuestResolvable): Quest {
		if (isNumber(questResolvable)) {
			const id = questResolvable;
			return this.getQuestOrThrow(id);
		}
		else if (isString(questResolvable)) {
			const name = questResolvable;
			return this.getQuestByNameOrThrow(name);
		}
		else {
			const id = questResolvable.id;
			return this.getQuestOrThrow(id);
		}
	}

	/**
	 * Resolves a quest ID from a given quest ID, quest name, or a quest object.
	 * @param questResolvable - A quest id, quest name, or a quest object.
	 * @returns The resolved quest ID.
	 * @throws {QuestNotFoundError} If no quest with the given ID or name exists.
	 */
	resolveID(questResolvable: QuestResolvable): QuestID {
		if (isNumber(questResolvable)) {
			return questResolvable;
		}
		else if (isString(questResolvable)) {
			const quest = this.getQuestByNameOrThrow(questResolvable);
			return quest.id;
		}
		else {
			return questResolvable.id;
		}
	}

	/**
	 * Checks if a quest with the given ID or name exists
	 * @param idOrName - The ID or name of the quest to check.
	 * @returns true if a quest with the given ID or name exists, false otherwise.
	 */
	doesQuestExist(idOrName: QuestID | QuestName): boolean {
		if (isNumber(idOrName)) {
			const id = idOrName;
			return this.db.getValue(
				'SELECT 1 FROM quest WHERE id = @id LIMIT 1',
				{ id }
			) === 1;
		}
		else {
			const name = idOrName;
			return this.db.getValue(
				'SELECT 1 FROM quest WHERE name = @name LIMIT 1',
				{ name }
			) === 1;
		}
	}

	/**
	 * Adds a new quest to the database.
	 * @param questDefinition - The definition of the quest to add.
	 * @param questDefinition.id - The ID of the quest to add. If not provided, a new ID will be generated.
	 * @param questDefinition.name - The name of the quest to add.
	 * @param questDefinition.description - The description of the quest to add.
	 * @param questDefinition.tokensReward - The tokens reward of the quest to add.
	 * @param questDefinition.charactersReward - The characters reward of the quest to add.
	 * @param questDefinition.wasShown - Whether the quest was shown to the players yet.
	 * @param questDefinition.isShown - Whether the quest is currently shown to the players.
	 * @returns The added quest object.
	 * @throws {QuestAlreadyExistsError} If a quest with the given name or ID already exists.
	 */
	addQuest({id, name, description, tokensReward, charactersReward, wasShown, isShown}: QuestDefinition): Quest {
		if (this.doesQuestExist(name))
			throw new QuestAlreadyExistsError(name);

		const queryParameters = {
			name,
			description,
			tokensReward: tokensReward ?? 0,
			charactersReward: charactersReward ?? '',
			wasShown: toDBBool(wasShown),
			isShown: toDBBool(isShown),
		};

		if (id === undefined) {
			const result = this.db.run(
				`INSERT INTO quest (name, description, tokensReward, charactersReward, wasShown, isShown)
				VALUES (@name, @description, @tokensReward, @charactersReward, @wasShown, @isShown)`,
				queryParameters
			);
			id = Number(result.lastInsertRowid);
		}
		else {
			if (this.doesQuestExist(id))
				throw new QuestAlreadyExistsError(id);

			this.db.run(
				`INSERT INTO quest (id, name, description, tokensReward, charactersReward, wasShown, isShown)
				VALUES (@id, @name, @description, @tokensReward, @charactersReward, @wasShown, @isShown)`,
				{ ...queryParameters, id }
			);
		}

		return this.getQuestOrThrow(id);
	}

	/**
	 * Updates a quest object in the database.
	 * @param questDefintion - The definition of the quest to update.
	 * @param questDefintion.id - The ID of the quest to update. If not provided, the quest with the given name will be updated.
	 * @param questDefintion.name - The name of the quest to update. If not provided, the quest with the given ID will be updated.
	 * @param questDefintion.description - The description of the quest to update.
	 * @param questDefintion.tokensReward - The tokens reward of the quest to update.
	 * @param questDefintion.charactersReward - The characters reward of the quest to update.
	 * @param questDefintion.wasShown - Whether the quest was shown to the players yet.
	 * @param questDefintion.isShown - Whether the quest is currently shown to the players.
	 * @returns The updated quest object.
	 * @throws {QuestNotFoundError} If no quest with the given ID or name exists.
	 */
	updateQuest({id, name, description, tokensReward, charactersReward, wasShown, isShown}:
		| WithRequiredAndOneOther<Quest, 'id'>
		| WithRequiredAndOneOther<Quest, 'name'>
	): Quest {
		if (id !== undefined) {
			if (!this.doesQuestExist(id))
				throw new QuestNotFoundError(id);
		}
		else if (name !== undefined) {
			if (!this.doesQuestExist(name))
				throw new QuestNotFoundError(name);
		}

		this.db.run(
			`UPDATE quest
			SET ${toAssignmentsPlaceholder({
				name,
				description,
				tokensReward,
				charactersReward,
				wasShown,
				isShown
			})}
			WHERE
				id = @id
				OR name = @name`,
			{
				id, name, description, tokensReward, charactersReward,
				wasShown: toOptionalDBBool(wasShown),
				isShown: toOptionalDBBool(isShown)
			}
		);

		if (id !== undefined)
			return this.getQuestOrThrow(id);
		else
			return this.getQuestByNameOrThrow(name!);
	}
}