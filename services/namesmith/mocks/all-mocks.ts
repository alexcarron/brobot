import { NamesmithDependencies, NamesmithDependencyClasses } from "../types/namesmith.types";
import { createRepositoriesFromDB, createServicesFromDB } from "../utilities/dependency.utility";
import { createMockDB } from "./mock-database";

/**
 * Creates all the mock services and repositories needed for testing.
 * @returns An object containing all the mock services and repositories.
 */
export const createAllMocks = (): NamesmithDependencies => {
	const mockDB = createMockDB();
	const repositories = createRepositoriesFromDB(mockDB);
	const services = createServicesFromDB(mockDB);
	const allMocks = {
		db: mockDB,
		...repositories,
		...services
	};

	// Validate all Mocks has correct shape
	for (const [dependencyName, DependencyClass] of Object.entries(NamesmithDependencyClasses)) {
		if (allMocks[dependencyName] === undefined) {
			throw new Error(`createAllMocks: Dependency ${dependencyName} must be defined in NamesmithDependencyClasses and have a corresponding implementation in the all-mocks file. If you added a new dependency, make sure to add its implementation here too.`);
		}

		if (allMocks[dependencyName] instanceof DependencyClass === false) {
			throw new Error(
				`createAllMocks: Dependency ${dependencyName} must be an instance of ${DependencyClass.name}.` +
				` Received ${typeof allMocks[dependencyName]} instead.` +
				` Check that the dependency is correctly implemented in the all-mocks file.`
			);
		}
	}

	return allMocks;
}