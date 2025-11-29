import { toPropertyValues } from "../../../../utilities/data-structure-utils";
import { DeepReadonly } from "../../../../utilities/types/generic-types";
import { isDefined } from "../../../../utilities/types/type-guards";
import { RoleRepository } from "../../repositories/role.repository";
import { asMinimalRoles, RoleDefinition } from "../../types/role.types";
import { DatabaseQuerier, toPlaceholdersList } from "../database-querier";


/**
 * Syncronizes the database to match a list of role data defintions without breaking existing data.
 * @param db - The database querier used to execute queries.
 * @param roleDefinitions - An array of role objects to be inserted. Each role can optionally include an 'id'. If 'id' is not provided, it will be auto-generated.
 */
export function syncRolesToDB(
	db: DatabaseQuerier,
	roleDefinitions: DeepReadonly<RoleDefinition[]>
) {
	const roleRepository = RoleRepository.fromDB(db);

	const roleIDs = toPropertyValues([...roleDefinitions], "id").filter(isDefined);
	const roleNames = toPropertyValues([...roleDefinitions], "name").filter(isDefined);

	const runTransaction = db.getTransaction((
		roleDefinitions: RoleDefinition[]
	) => {
		const deleteRolesNotDefined = db.getQuery(`
			DELETE FROM role
			WHERE
				id NOT IN ${toPlaceholdersList(roleIDs)}
				AND name NOT IN ${toPlaceholdersList(roleNames)}
		`);
		deleteRolesNotDefined.run(...roleIDs, ...roleNames);

		const findExistingRoles =
			db.getQuery(`
				SELECT * FROM role
				WHERE
					id IN ${toPlaceholdersList(roleIDs)}
					OR name IN ${toPlaceholdersList(roleNames)}
			`);

		const existingDBRoles = asMinimalRoles(
			findExistingRoles.getRows(
				...roleIDs, ...roleNames
			)
		);

		for (const existingDBRole of existingDBRoles) {
			const roleDefinition = roleDefinitions.find(role =>
				role.id === existingDBRole.id ||
				role.name === existingDBRole.name
			);

			if (roleDefinition === undefined)
				continue;

			roleRepository.updateRole({
				...roleDefinition,
				id: existingDBRole.id,
			});
		}

		const newRoleDefintions = roleDefinitions.filter(roleDef =>
			!existingDBRoles.find(dbRole =>
				dbRole.id === roleDef.id ||
				dbRole.name === roleDef.name
			)
		);

		for (const roleDefinition of newRoleDefintions) {
			roleRepository.addRole(roleDefinition);
		}
	});

	runTransaction(roleDefinitions);
}