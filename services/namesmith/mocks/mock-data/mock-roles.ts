import { WithAtLeastOneProperty } from "../../../../utilities/types/generic-types";
import { Role, RoleDefinition } from "../../types/role.types";
import { RoleRepository } from '../../repositories/role.repository';
import { DatabaseQuerier } from "../../database/database-querier";
import { RoleAlreadyExistsError } from "../../utilities/error.utility";
import { getRandomNameUUID } from "../../../../utilities/random-utils";

/**
 * Adds a mock role to the database.
 * @param db - The database to which the mock role will be added.
 * @param roleDefinition - The definition of the role to be added.
 * @returns The added role object.
 * @throws Error - If a role with the given ID already exists.
 */
export function addMockRole(
	db: DatabaseQuerier,
	roleDefinition: WithAtLeastOneProperty<RoleDefinition>
): Role {
	const roleRepository = RoleRepository.fromDB(db);
	const {
		id = undefined,
		name = getRandomNameUUID(),
		description = "",
		perks = [],
	} = roleDefinition;

	if (
		id !== undefined &&
		roleRepository.doesRoleExist(id)
	)
		throw new RoleAlreadyExistsError(id);

	return roleRepository.addRole({
		id,
		name,
		description,
		perks,
	});
}