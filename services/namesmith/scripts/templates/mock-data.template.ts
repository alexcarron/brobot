/* eslint-disable @typescript-eslint/no-unused-vars */
export const toMockDataFile = ({ kebabCaseEntity, pascalCaseEntity, rawEntityName, camelCaseEntity, mockDefaults, mockPassthrough }: Record<string, string>) =>
`import { WithAllOptional } from "../../../../utilities/types/generic-types"
import { DatabaseQuerier } from "../../database/database-querier"
import { ${pascalCaseEntity}Repository } from "../../repositories/${kebabCaseEntity}.repository";
import { ${pascalCaseEntity}, ${pascalCaseEntity}Definition } from "../../types/${kebabCaseEntity}.types"

/**
 * Factory function to create mock ${rawEntityName}s for testing.
 * @param db - The database querier instance to use for insertion.
 * @param ${camelCaseEntity}Definition - Optional properties to override defaults.
 * @returns A newly created ${rawEntityName} with the given or default properties.
 */
export function addMock${pascalCaseEntity}(
	db: DatabaseQuerier,
	${camelCaseEntity}Definition: WithAllOptional<${pascalCaseEntity}Definition> = {}
): ${pascalCaseEntity} {
	const {
${mockDefaults}
	} = ${camelCaseEntity}Definition;

	const ${camelCaseEntity}Repository = ${pascalCaseEntity}Repository.fromDB(db);
	return ${camelCaseEntity}Repository.add${pascalCaseEntity}({
${mockPassthrough}
	});
}
`;
