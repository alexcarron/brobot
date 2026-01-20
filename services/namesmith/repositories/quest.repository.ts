import { returnNonNullOrThrow } from "../../../utilities/error-utils";
import { WithRequiredAndOneOther } from "../../../utilities/types/generic-types";
import { isNumber, isString } from "../../../utilities/types/type-guards";
import { DatabaseQuerier } from "../database/database-querier";
import { asMinimalShownDailyQuest, asQuest, asQuests, Quest, QuestDefinition, QuestID, QuestName, QuestResolvable, ShownDailyQuestDefinition, ShownDailyQuest, toDBShownDailyQuest, ShownWeeklyQuestDefinition, ShownWeeklyQuest, toDBShownWeeklyQuest, asMinimalShownWeeklyQuest } from "../types/quest.types";
import { QuestAlreadyExistsError, QuestNotFoundError, ShownDailyQuestNotFoundError, ShownWeeklyQuestNotFoundError } from "../utilities/error.utility";
import { DBDate, toDBBool, toOptionalDBBool } from "../utilities/db.utility";
import { createMockDB } from "../mocks/mock-database";

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

	static asMock() {
		const db = createMockDB();
		return QuestRepository.fromDB(db);
	}

	/**
	 * Returns all quests in the database.
	 * @returns An array of all quest objects.
	 */
	getQuests(): Quest[] {
		return asQuests(
			this.db.getRows("SELECT * FROM quest")
		);
	}

	/**
	 * Retrieves a quest object by its ID.
	 * @param id - The ID of the quest to retrieve.
	 * @returns The quest object with the given ID, or null if no such quest exists.
	 */
	getQuestByID(id: QuestID): Quest | null {
		const row = this.db.getRow(
			"SELECT * FROM quest WHERE id = ?", id
		);

		if (row === undefined)
			return null;

		return asQuest(row);
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
		const row = this.db.getRow(
			"SELECT * FROM quest WHERE name = ?", name
		);

		if (row === undefined)
			return null;

		return asQuest(row);
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
		if (isString(questResolvable)) {
			const quest = this.getQuestByNameOrThrow(questResolvable);
			return quest.id;
		}

		let questID;
		if (isNumber(questResolvable))
			questID = questResolvable;
		else
			questID = questResolvable.id;

		if (!this.doesQuestExist(questID)) {
			throw new QuestNotFoundError(questID);
		}

		return questID;
	}

	/**
	 * Checks if a quest with the given ID or name exists
	 * @param idOrName - The ID or name of the quest to check.
	 * @returns true if a quest with the given ID or name exists, false otherwise.
	 */
	doesQuestExist(idOrName: QuestID | QuestName): boolean {
		if (isNumber(idOrName)) {
			const id = idOrName;
			return this.db.doesExistInTable('quest', { id });
		}
		else {
			const name = idOrName;
			return this.db.doesExistInTable('quest', { name });
		}
	}

	/**
	 * Adds a new quest to the database.
	 * @param questDefinition - The definition of the quest to add.
	 * @param questDefinition.id - The ID of the quest to add. If not provided, a new ID will be generated.
	 * @param questDefinition.name - The name of the quest to add.
	 * @param questDefinition.description - The description of the quest to add.
	 * @param questDefinition.recurrence - The recurrence of the quest to add.
	 * @param questDefinition.tokensReward - The tokens reward of the quest to add.
	 * @param questDefinition.charactersReward - The characters reward of the quest to add.
	 * @param questDefinition.wasShown - Whether the quest was shown to the players yet.
	 * @param questDefinition.isShown - Whether the quest is currently shown to the players.
	 * @returns The added quest object.
	 * @throws {QuestAlreadyExistsError} If a quest with the given name or ID already exists.
	 */
	addQuest(
		{id, name, description, recurrence, tokensReward, charactersReward, wasShown, isShown}: QuestDefinition
	): Quest {
		if (this.doesQuestExist(name))
			throw new QuestAlreadyExistsError(name);

		if (id !== undefined) {
			if (this.doesQuestExist(id))
				throw new QuestAlreadyExistsError(id);
		}

		const insertedFields = {
			id,
			name,
			description,
			recurrence,
			tokensReward: tokensReward ?? 0,
			charactersReward: charactersReward ?? '',
			wasShown: toDBBool(wasShown),
			isShown: toDBBool(isShown),
		};

		id = this.db.insertIntoTable('quest', insertedFields);

		return this.getQuestOrThrow(id);
	}

	/**
	 * Updates a quest object in the database.
	 * @param questDefintion - The definition of the quest to update.
	 * @param questDefintion.id - The ID of the quest to update. If not provided, the quest with the given name will be updated.
	 * @param questDefintion.name - The name of the quest to update. If not provided, the quest with the given ID will be updated.
	 * @param questDefintion.description - The description of the quest to update.
	 * @param questDefintion.recurrence - The recurrence of the quest to update.
	 * @param questDefintion.tokensReward - The tokens reward of the quest to update.
	 * @param questDefintion.charactersReward - The characters reward of the quest to update.
	 * @param questDefintion.wasShown - Whether the quest was shown to the players yet.
	 * @param questDefintion.isShown - Whether the quest is currently shown to the players.
	 * @returns The updated quest object.
	 * @throws {QuestNotFoundError} If no quest with the given ID or name exists.
	 */
	updateQuest({id, name, description, recurrence, tokensReward, charactersReward, wasShown, isShown}:
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

		this.db.updateInTable('quest', {
			fieldsUpdating: {
				name, description, tokensReward, charactersReward, recurrence,
				wasShown: toOptionalDBBool(wasShown),
				isShown: toOptionalDBBool(isShown),
			},
			identifiers: { id, name },
		});

		if (id !== undefined)
			return this.getQuestOrThrow(id);
		else
			return this.getQuestByNameOrThrow(name!);
	}

	/**
	 * Returns the shown daily quest with the given time shown and quest ID.
	 * If no shown daily quest with the given time shown and quest ID exists, throws a ShownDailyQuestNotFoundError.
	 * @param parameters - The time shown and quest ID of the shown daily quest to return.
	 * @param parameters.timeShown - The time shown of the shown daily quest.
	 * @param parameters.questID - The quest ID of the shown daily quest.
	 * @returns  The shown daily quest with the given time shown and quest ID.
	 * @throws {ShownDailyQuestNotFoundError} - If no shown daily quest with the given time shown and quest ID exists.
	 */
	getShownDailyQuestOrThrow(
		{timeShown, questID}: {
			timeShown: Date,
			questID: QuestID,
		}
	): ShownDailyQuest {
		const row = this.db.getRow(
			`SELECT * FROM shownDailyQuest
			WHERE
				timeShown = @timeShown AND
				questID = @questID`,
			toDBShownDailyQuest({timeShown, questID, isHidden: false})
		);

		if (row === undefined)
			throw new ShownDailyQuestNotFoundError({timeShown, questID});

		const minimalShownDailyQuest = asMinimalShownDailyQuest(row);
		const quest = this.getQuestOrThrow(minimalShownDailyQuest.questID);

		return {
			timeShown: minimalShownDailyQuest.timeShown,
			quest,
			isHidden: minimalShownDailyQuest.isHidden ?? false,
		};
	}

	/**
	 * Returns the shown weekly quest with the given time shown and quest ID.
	 * If no shown weekly quest with the given time shown and quest ID exists, throws a ShownWeeklyQuestNotFoundError.
	 * @param params - The time shown and quest ID of the shown weekly quest to return.
	 * @param params.timeShown - The time shown of the shown weekly quest.
	 * @param params.questID - The quest ID of the shown weekly quest.
	 * @returns The shown weekly quest with the given time shown and quest ID.
	 * @throws {ShownWeeklyQuestNotFoundError} - If no shown weekly quest with the given time shown and quest ID exists.
	 */
	getShownWeeklyQuestOrThrow(
		{timeShown, questID}: {
			timeShown: Date,
			questID: QuestID,
		}
	): ShownWeeklyQuest {
		const row = this.db.getRow(
			`SELECT * FROM shownWeeklyQuest
			WHERE
				timeShown = @timeShown AND
				questID = @questID`,
			toDBShownWeeklyQuest({timeShown, questID})
		);

		if (row === undefined)
			throw new ShownWeeklyQuestNotFoundError({timeShown, questID});

		return {
			timeShown: asMinimalShownWeeklyQuest(row).timeShown,
			quest: this.getQuestOrThrow(asMinimalShownWeeklyQuest(row).questID),
		};
	}

	/**
	 * Adds a new shown daily quest to the database.
	 * @param shownDailyQuestDefinition - The shown daily quest to add.
	 * @param shownDailyQuestDefinition.timeShown - The time shown of the shown daily quest.
	 * @param shownDailyQuestDefinition.quest - The quest of the shown daily quest.
	 * @param shownDailyQuestDefinition.isHidden - Whether the shown daily quest is hidden.
	 * @returns The added shown daily quest.
	 * @throws {ShownDailyQuestNotFoundError} - If no shown daily quest with the given time shown and quest ID exists.
	 */
	addShownDailyQuest(
		shownDailyQuestDefinition: ShownDailyQuestDefinition
	): ShownDailyQuest {
		const { timeShown, quest, isHidden } = shownDailyQuestDefinition;
		const questID = this.resolveID(quest);

		this.db.insertIntoTable('shownDailyQuest',
			toDBShownDailyQuest({timeShown, questID, isHidden: isHidden ?? false})
		);

		return this.getShownDailyQuestOrThrow({ timeShown, questID });
	}

	/**
	 * Adds a new shown weekly quest to the database.
	 * @param shownWeeklyQuestDefinition - The shown weekly quest to add.
	 * @param shownWeeklyQuestDefinition.timeShown - The time shown of the shown weekly quest.
	 * @param shownWeeklyQuestDefinition.quest - The quest of the shown weekly quest.
	 * @returns The added shown weekly quest.
	 * @throws {ShownWeeklyQuestNotFoundError} - If no shown weekly quest with the given time shown and quest ID exists.
	 */
	addShownWeeklyQuest(
		shownWeeklyQuestDefinition: ShownWeeklyQuestDefinition
	): ShownWeeklyQuest {
		const { timeShown, quest } = shownWeeklyQuestDefinition;
		const questID = this.resolveID(quest);

		this.db.insertIntoTable('shownWeeklyQuest',
			toDBShownWeeklyQuest({timeShown, questID})
		);

		return this.getShownWeeklyQuestOrThrow({ timeShown, questID });
	}

	/**
	 * Returns all shown daily quests that are currently being shown to the players
	 * on the given date.
	 * @param time - The date to check for shown daily quests.
	 * @returns An array of all shown daily quests that are currently being shown to the players.
	 */
	getShownDailyQuestDuring(time: Date): ShownDailyQuest[] {
		const rows = this.db.getRows(
			`SELECT * FROM shownDailyQuest
			WHERE
				timeShown <= @timeShown AND
				timeShown + 86400000 > @timeShown`,
			{ timeShown: DBDate.fromDomain(time) }
		);

		return rows
			.map(row => asMinimalShownDailyQuest(row))
			.map(minimalShownDailyQuest => ({
				timeShown: minimalShownDailyQuest.timeShown,
				quest: this.getQuestOrThrow(minimalShownDailyQuest.questID),
				isHidden: minimalShownDailyQuest.isHidden ?? false,
			}));
	}

	/**
	 * Returns all shown weekly quests that are currently being shown to the players
	 * on the given date.
	 * @param time - The date to check for shown weekly quests.
	 * @returns An array of all shown weekly quests that are currently being shown to the players.
	 */
	getShownWeeklyQuestDuring(time: Date): ShownWeeklyQuest[] {
		const rows = this.db.getRows(
			`SELECT * FROM shownWeeklyQuest
			WHERE
				timeShown <= @timeShown AND
				timeShown + 604800000 > @timeShown`,
				
			{ timeShown: DBDate.fromDomain(time) }
		);

		return rows
			.map(row => asMinimalShownWeeklyQuest(row))
			.map(minimalShownWeeklyQuest => ({
				timeShown: minimalShownWeeklyQuest.timeShown,
				quest: this.getQuestOrThrow(minimalShownWeeklyQuest.questID),
			}));
	}

	/**
	 * Returns an array of all the quest IDs of the daily quests that have not been shown.
	 * @returns An array of the quest IDs of the daily quests that have not been shown.
	 */
	getNotShownDailyQuestIDs(): QuestID[] {
		const rows = this.db.getRows(
			`SELECT id FROM quest
			WHERE
				recurrence = 'daily' AND
				wasShown = 0 AND
				isShown = 0`
		) as { id: QuestID }[];

		return rows
			.map(row => row.id);
	}

	/**
	 * Returns an array of all the quest IDs of the weekly quests that have not been shown.
	 * @returns An array of the quest IDs of the weekly quests that have not been shown.
	 */
	getNotShownWeeklyQuestIDs(): QuestID[] {
		const rows = this.db.getRows(
			`SELECT id FROM quest
			WHERE
				recurrence = 'weekly' AND
				wasShown = 0 AND
				isShown = 0`
		) as { id: QuestID }[];

		return rows
			.map(row => row.id);
	}

	/**
	 * Returns an array of all the quest IDs of the daily quests picked for today.
	 * @returns An array of the quest IDs of the daily quests picked for today.
	 */
	getCurrentlyShownDailyQuestIDs(): QuestID[] {
		const isShownRows = this.db.getRows(
			`SELECT id FROM quest
			WHERE 
				recurrence = 'daily' AND
				isShown = 1`
		) as { id: QuestID }[];
		const shownQuestIDs = isShownRows.map(row => row.id);
		return shownQuestIDs;
	}

	/**
	 * Returns the ids of the weekly quests currently being shown to players.
	 * @returns The ids of the weekly quests currently being shown to players.
	 */
	getCurrentlyShownWeeklyQuestIDs(): QuestID[] {
		const isShownRows = this.db.getRows(
			`SELECT id FROM quest
			WHERE 
				recurrence = 'weekly' AND
				isShown = 1`
		) as { id: QuestID }[];
		const shownQuestIDs = isShownRows.map(row => row.id);
		return shownQuestIDs;
	}

	setWasShown(questID: QuestID, wasShown: boolean) {
		if (!this.doesQuestExist(questID))
			throw new QuestNotFoundError(questID);

		this.db.updateInTable('quest', {
			fieldsUpdating: { wasShown: toDBBool(wasShown) },
			identifiers: { id: questID },
		});
	}

	setIsShown(questID: QuestID, isShown: boolean) {
		if (!this.doesQuestExist(questID))
			throw new QuestNotFoundError(questID);

		this.db.updateInTable('quest', {
			fieldsUpdating: { isShown: toDBBool(isShown) },
			identifiers: { id: questID },
		});
	}

	/**
	 * Resets all daily quests by setting wasShown to 0 for all quests with isShown equal to 0.
	 */
	resetWasShownForUnshownDailyQuests(): void {
		this.db.run(
			`UPDATE quest
				SET wasShown = 0
			WHERE 
				recurrence = 'daily' AND
				isShown = 0`
		);
	}

	/**
	 * Resets all weekly quests by setting wasShown to 0 for all quests with isShown equal to 0.
	 */
	resetWasShownForUnshownWeeklyQuests(): void {
		this.db.run(
			`UPDATE quest
				SET wasShown = 0
			WHERE 
				recurrence = 'weekly' AND
				isShown = 0`
		);
	}

	/**
	 * Resets all quests to never have been shown and not current shown
	 */
	resetQuestShownFields(): void {
		this.db.run(
			`UPDATE quest
				SET wasShown = 0, isShown = 0`
		);
	}

	/**
	 * Resets all shown daily quests by deleting all rows from the shownDailyQuest table.
	 */
	resetShownDailyQuests(): void {
		this.db.run(
			`DELETE FROM shownDailyQuest`
		);
	}

	/**
	 * Gets all weekly quests from the database.
	 * @returns  An array of all weekly quests.
	 */
	getWeeklyQuests(): Quest[] {
		const rows = this.db.getRows(`
			SELECT * FROM quest 
			WHERE recurrence = 'weekly'
		`);
		return rows.map(row => asQuest(row));
	}
}