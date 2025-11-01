import { toPropertyValues } from "../../../../utilities/data-structure-utils";
import { WithOptional } from "../../../../utilities/types/generic-types";
import { isNotUndefined } from "../../../../utilities/types/type-guards";
import { RoleRepository } from "../../repositories/role.repository";
import { DBRole, RoleDefinition } from "../../types/role.types";
import { DatabaseQuerier, toListPlaceholder } from "../database-querier";


/**
 * Syncronizes the database to match a list of role data defintions without breaking existing data.
 * @param db - The database querier used to execute queries.
 * @param roles - An array of role objects to be inserted. Each role can optionally include an 'id'. If 'id' is not provided, it will be auto-generated.
 */
export function syncRolesToDB(
	db: DatabaseQuerier,
	roles: Readonly<WithOptional<RoleDefinition, "id">[]>
) {
	const roleRepository = new RoleRepository(db);

	const roleIDs = toPropertyValues([...roles], "id").filter(isNotUndefined);
	const roleNames = toPropertyValues([...roles], "name").filter(isNotUndefined);

	const runTransaction = db.getTransaction((
		roleDefinitions: WithOptional<RoleDefinition, "id">[]
	) => {
		const deleteRolesNotDefined = db.getQuery(`
			DELETE FROM role
			WHERE
				id NOT IN ${toListPlaceholder(roleIDs)}
				AND name NOT IN ${toListPlaceholder(roleNames)}
		`);
		deleteRolesNotDefined.run(...roleIDs, ...roleNames);

		const findExistingRoles = db.getQuery(`
			SELECT * FROM role
			WHERE
				id IN ${toListPlaceholder(roleIDs)}
				OR name IN ${toListPlaceholder(roleNames)}
		`);
		const existingDBRoles = findExistingRoles.getRows(
			...roleIDs, ...roleNames
		) as DBRole[];

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

	runTransaction(roles);
}