import { DatabaseQuerier } from "../database/database-querier";
import { NamesmithRepositoryClasses, NamesmithServiceClasses } from "../types/namesmith.types";

/**
 * Creates an object containing all Namesmith repositories
 * from a given database connection.
 * @param db - The database connection to use for creating the repositories.
 * @returns An object containing all Namesmith repositories, keyed by repository name.
 */
export function createRepositoriesFromDB(
	db: DatabaseQuerier
) {
	const repositories: any = {};
	for (const [repositoryName, Repository] of Object.entries(NamesmithRepositoryClasses)) {
		repositories[repositoryName] = Repository.fromDB(db);
	}
	return repositories;
}

/**
 * Creates an object containing all Namesmith services
 * from a given database connection.
 * @param db - The database connection to use for creating the services.
 * @returns An object containing all Namesmith services, keyed by service name.
 */
export function createServicesFromDB(
	db: DatabaseQuerier
) {
	const services: any = {};
	for (const [serviceName, Service] of Object.entries(NamesmithServiceClasses)) {
		services[serviceName] = Service.fromDB(db);
	}
	return services;
}
