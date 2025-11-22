export const toServiceFile = ({ kebabCaseEntity, pascalCaseEntity, rawEntityName, camelCaseEntity }: Record<string, string>) =>
`import { ${pascalCaseEntity}Repository } from "../repositories/${kebabCaseEntity}.repository";
import { DatabaseQuerier } from "../database/database-querier";
import { ${pascalCaseEntity}, ${pascalCaseEntity}ID, ${pascalCaseEntity}Resolvable } from "../types/${kebabCaseEntity}.types";
import { createMockDB } from "../mocks/mock-database";

/**
 * Provides methods for interacting with ${rawEntityName}s.
 */
export class ${pascalCaseEntity}Service {
  constructor(
    public ${camelCaseEntity}Repository: ${pascalCaseEntity}Repository,
  ) {}

  static fromDB(db: DatabaseQuerier) {
    return new ${pascalCaseEntity}Service(
      ${pascalCaseEntity}Repository.fromDB(db),
    );
  }

	static asMock() {
		const db = createMockDB();
		return ${pascalCaseEntity}Service.fromDB(db);
	}

	/**
	 * Resolves a ${rawEntityName} object from an id, existing object, or other resolvable value.
	 * @param ${camelCaseEntity}Resolvable - The ${rawEntityName} resolvable to resolve.
	 * @returns The resolved ${rawEntityName} object.
	 */
  resolve${pascalCaseEntity}(${camelCaseEntity}Resolvable: ${pascalCaseEntity}Resolvable): ${pascalCaseEntity} {
    return this.${camelCaseEntity}Repository.resolve${pascalCaseEntity}(${camelCaseEntity}Resolvable);
  }

	/**
	 * Resolves an ID for a ${rawEntityName} from an id, existing object, or other resolvable value.
	 * @param ${camelCaseEntity}Resolvable - The ${rawEntityName} resolvable to resolve the ID for.
	 * @returns The resolved ${rawEntityName} ID.
	 */
  resolveID(${camelCaseEntity}Resolvable: ${pascalCaseEntity}Resolvable): ${pascalCaseEntity}ID {
    return this.${camelCaseEntity}Repository.resolveID(${camelCaseEntity}Resolvable);
  }
}
`;