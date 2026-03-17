/* eslint-disable @typescript-eslint/no-unused-vars */
export const toRepositoryTestFile = ({ kebabCaseEntity, pascalCaseEntity, rawEntityName, camelCaseEntity, invalidIDConstant, pluralName }: Record<string, string>) =>
`import { makeSure } from "../../../utilities/jest/jest-utils";
import { ${invalidIDConstant} } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMock${pascalCaseEntity} } from "../mocks/mock-data/mock-${pluralName}";
import { ${pascalCaseEntity} } from "../types/${kebabCaseEntity}.types";
import { ${pascalCaseEntity}NotFoundError } from "../utilities/error.utility";
import { ${pascalCaseEntity}Repository } from "./${kebabCaseEntity}.repository";

describe('${pascalCaseEntity}Repository', () => {
	let ${camelCaseEntity}Repository: ${pascalCaseEntity}Repository;
	let db: DatabaseQuerier;

	let MOCK_${pascalCaseEntity.toUpperCase()}: ${pascalCaseEntity};

	beforeEach(() => {
		${camelCaseEntity}Repository = ${pascalCaseEntity}Repository.asMock();
		db = ${camelCaseEntity}Repository.db;

		MOCK_${pascalCaseEntity.toUpperCase()} = addMock${pascalCaseEntity}(db);
	});

	describe('get${pascalCaseEntity}s()', () => {
		it('returns all ${rawEntityName}s', () => {
			const ${camelCaseEntity}s = ${camelCaseEntity}Repository.get${pascalCaseEntity}s();
			makeSure(${camelCaseEntity}s).isNotEmpty();
			makeSure(${camelCaseEntity}s).haveProperties('id');
		});

		it('contains the mock ${rawEntityName}', () => {
			const ${camelCaseEntity}s = ${camelCaseEntity}Repository.get${pascalCaseEntity}s();
			makeSure(${camelCaseEntity}s).contains(MOCK_${pascalCaseEntity.toUpperCase()});
		});
	});

	describe('get${pascalCaseEntity}ByID()', () => {
		it('returns the ${rawEntityName} with the given ID', () => {
			const ${camelCaseEntity} = ${camelCaseEntity}Repository.get${pascalCaseEntity}ByID(MOCK_${pascalCaseEntity.toUpperCase()}.id);
			makeSure(${camelCaseEntity}).is(MOCK_${pascalCaseEntity.toUpperCase()});
		});

		it('returns null if no ${rawEntityName} with the given ID exists', () => {
			const ${camelCaseEntity} = ${camelCaseEntity}Repository.get${pascalCaseEntity}ByID(${invalidIDConstant});
			makeSure(${camelCaseEntity}).isNull();
		});
	});

	describe('get${pascalCaseEntity}OrThrow()', () => {
		it('returns the ${rawEntityName} with the given ID', () => {
			const ${camelCaseEntity} = ${camelCaseEntity}Repository.get${pascalCaseEntity}OrThrow(MOCK_${pascalCaseEntity.toUpperCase()}.id);
			makeSure(${camelCaseEntity}).is(MOCK_${pascalCaseEntity.toUpperCase()});
		});

		it('throws a ${pascalCaseEntity}NotFoundError if no ${rawEntityName} with the given ID exists', () => {
			makeSure(() =>
				${camelCaseEntity}Repository.get${pascalCaseEntity}OrThrow(${invalidIDConstant})
			).throws(${pascalCaseEntity}NotFoundError);
		});
	});

	describe('does${pascalCaseEntity}Exist()', () => {
		it('returns true if a ${rawEntityName} with the given ID exists', () => {
			makeSure(${camelCaseEntity}Repository.does${pascalCaseEntity}Exist(MOCK_${pascalCaseEntity.toUpperCase()}.id)).isTrue();
		});

		it('returns false if no ${rawEntityName} with the given ID exists', () => {
			makeSure(${camelCaseEntity}Repository.does${pascalCaseEntity}Exist(${invalidIDConstant})).isFalse();
		});
	});

	describe('add${pascalCaseEntity}()', () => {
		it('adds a new ${rawEntityName} to the database', () => {
			// TODO: Add properties of the mock ${rawEntityName}
			const ${camelCaseEntity} = ${camelCaseEntity}Repository.add${pascalCaseEntity}({
			
			});

			// TODO: Assert the created ${rawEntityName} has the appropriate values for its properties

			const resolved${pascalCaseEntity} = ${camelCaseEntity}Repository.get${pascalCaseEntity}OrThrow(${camelCaseEntity}.id);
			makeSure(resolved${pascalCaseEntity}).is(${camelCaseEntity});
		});

		it('generates an id for the new ${rawEntityName}', () => {
			// TODO: Add properties of the mock ${rawEntityName}
			const ${camelCaseEntity} = ${camelCaseEntity}Repository.add${pascalCaseEntity}({
			
			});
			makeSure(${camelCaseEntity}).hasProperty('id');
		});
	});
});
`;
