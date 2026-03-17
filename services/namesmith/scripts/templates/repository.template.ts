/* eslint-disable @typescript-eslint/no-unused-vars */
export const toRepositoryFile = ({ kebabCaseEntity, pascalCaseEntity, rawEntityName, camelCaseEntity, columnDefinitions, insertedFieldsDefinitions, extractedParamsDefinitions, hasDBBoolean }: Record<string, string>) =>
`import { returnNonNullOrThrow } from "../../../utilities/error-utils";
import { isNumber } from "../../../utilities/types/type-guards";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { as${pascalCaseEntity}, as${pascalCaseEntity}s, ${pascalCaseEntity}, ${pascalCaseEntity}Definition, ${pascalCaseEntity}ID, ${pascalCaseEntity}Resolvable } from "../types/${kebabCaseEntity}.types";
import { DBDate${hasDBBoolean === 'true' ? ', DBBoolean' : ''} } from "../utilities/db.utility";
import { ${pascalCaseEntity}AlreadyExistsError, ${pascalCaseEntity}NotFoundError } from "../utilities/error.utility";

const TABLE_NAME = '${kebabCaseEntity}';

/**
 * Provides access to the ${rawEntityName} data.
 */
export class ${pascalCaseEntity}Repository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(
		public db: DatabaseQuerier
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new ${pascalCaseEntity}Repository(db);
	}

	static asMock() {
		const db = createMockDB();
		return ${pascalCaseEntity}Repository.fromDB(db);
	}

	/**
	 * Resolves a ${rawEntityName} object from an id, existing object, or other resolvable value.
	 * @param ${camelCaseEntity}Resolvable - The ${rawEntityName} resolvable to resolve.
	 * @returns The resolved ${rawEntityName} object.
	 */
	resolve${pascalCaseEntity}(${camelCaseEntity}Resolvable: ${pascalCaseEntity}Resolvable): ${pascalCaseEntity} {
		if (isNumber(${camelCaseEntity}Resolvable)) {
			return this.get${pascalCaseEntity}OrThrow(${camelCaseEntity}Resolvable);
		}
		else {
			return this.get${pascalCaseEntity}OrThrow(${camelCaseEntity}Resolvable.id);
		}
	}

	/**
	 * Resolves a ${rawEntityName} ID from a given ID or ${rawEntityName} object.
	 * @param ${camelCaseEntity}Resolvable - A ${rawEntityName} ID or ${rawEntityName} object.
	 * @returns The resolved ${rawEntityName} ID.
	 * @throws {${pascalCaseEntity}NotFoundError} If no ${rawEntityName} with the given ID exists.
	 */
	resolveID(${camelCaseEntity}Resolvable: ${pascalCaseEntity}Resolvable): ${pascalCaseEntity}ID {
		if (isNumber(${camelCaseEntity}Resolvable)) {
			return ${camelCaseEntity}Resolvable;
		}
		else {
			return ${camelCaseEntity}Resolvable.id;
		}
	}

	/**
	 * Retrieves all ${rawEntityName}s from the database.
	 * @returns An array of all ${rawEntityName}s.
	 */
	get${pascalCaseEntity}s(): ${pascalCaseEntity}[] {
		return as${pascalCaseEntity}s(this.db.selectAllFromTable(TABLE_NAME));
	}

	/**
	 * Retrieves a ${rawEntityName} by its ID.
	 * @param id - The ID of the ${rawEntityName} to retrieve.
	 * @returns The ${rawEntityName} with the given ID, or null if not found.
	 */
	get${pascalCaseEntity}ByID(id: ${pascalCaseEntity}ID): ${pascalCaseEntity} | null {
		const row = this.db.selectRowFromTableByID(TABLE_NAME, id);
		if (row === undefined) return null;
		return as${pascalCaseEntity}(row);
	}

	/**
	 * Retrieves a ${rawEntityName} by its ID, throwing an error if not found.
	 * @param id - The ID of the ${rawEntityName} to retrieve.
	 * @returns The ${rawEntityName} with the given ID.
	 * @throws {${pascalCaseEntity}NotFoundError} If no ${rawEntityName} with the given ID exists.
	 */
	get${pascalCaseEntity}OrThrow(id: ${pascalCaseEntity}ID): ${pascalCaseEntity} {
		return returnNonNullOrThrow(
			this.get${pascalCaseEntity}ByID(id),
			new ${pascalCaseEntity}NotFoundError(id)
		)
	}

	/**
	 * Checks if a ${rawEntityName} with the given ID exists.
	 * @param id - The ID of the ${rawEntityName} to check.
	 * @returns True if the ${rawEntityName} exists, false otherwise.
	 */
	does${pascalCaseEntity}Exist(id: ${pascalCaseEntity}ID): boolean {
		return this.db.doesExistInTable(TABLE_NAME, {id});
	}

	/**
	 * Adds a new ${rawEntityName} to the database.
	 * @param params - The properties of the ${rawEntityName} to be added.
	 * @returns The added ${rawEntityName}.
	 * @throws {${pascalCaseEntity}AlreadyExistsError} If the ${rawEntityName} already exists in the database.
	 */
	add${pascalCaseEntity}(params: ${pascalCaseEntity}Definition): ${pascalCaseEntity} {
		const {
${extractedParamsDefinitions}
		} = params;

		const insertedFields = {
${insertedFieldsDefinitions}
		};
		const id = this.db.insertIntoTable(TABLE_NAME, insertedFields);
		return this.get${pascalCaseEntity}OrThrow(id);
	}
}
`;
