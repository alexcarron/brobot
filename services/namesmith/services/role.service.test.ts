import { makeSure } from "../../../utilities/jest/jest-utils";
import { Perks } from "../constants/perks.constants";
import { Roles } from "../constants/roles.constants";
import { INVALID_ROLE_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { Role } from "../types/role.types";
import { RoleService } from "./role.service";

describe('RoleService', () => {
	let roleService: RoleService;
	let db: DatabaseQuerier;

	const SOME_ROLE = Roles.PROSPECTOR;

	beforeEach(() => {
		roleService = RoleService.asMock();
		db = roleService.roleRepository.db;
	});

	describe('resolveRole()', () => {
		it('should resolve a role ID to a role object', () => {
			const role = roleService.resolveRole(SOME_ROLE.id);

			makeSure(role).isAnObject();
			makeSure(role.id).is(SOME_ROLE.id);
			makeSure(role.name).is(SOME_ROLE.name);
			makeSure(role).hasProperties('id', 'name', 'description', 'perks');
		});

		it('should reoslve a role name to a role object', () => {
			const role = roleService.resolveRole(SOME_ROLE.name);

			makeSure(role).isAnObject();
			makeSure(role.id).is(SOME_ROLE.id);
			makeSure(role.name).is(SOME_ROLE.name);
			makeSure(role).hasProperties('id', 'name', 'description', 'perks');
		});

		it('should resolve a Role object to itself in its current state', () => {
			const role = roleService.resolveRole(SOME_ROLE.id);

			const outdatedRole: Role = {
				...role,
				description: 'Outdated description',
				perks: []
			};

			const resolvedRole = roleService.resolveRole(outdatedRole);

			makeSure(resolvedRole).isAnObject();
			makeSure(resolvedRole.id).is(SOME_ROLE.id);
			makeSure(resolvedRole.name).is(SOME_ROLE.name);
			makeSure(resolvedRole).hasProperties('id', 'name', 'description', 'perks');
			makeSure(resolvedRole.description).is(SOME_ROLE.description);
			makeSure(resolvedRole.perks).hasAnItemWhere(perk =>
				perk.id === Perks.MINE_BONUS.id
			);
		});

		it('should reoslve a Role Defintion object to a role object', () => {
			const role = roleService.resolveRole(SOME_ROLE);

			makeSure(role).isAnObject();
			makeSure(role.id).is(SOME_ROLE.id);
			makeSure(role.name).is(SOME_ROLE.name);
			makeSure(role).hasProperties('id', 'name', 'description', 'perks');
		});
	});

	describe('resolveID()', () => {
		it('should resolve a role ID to itself', () => {
			const roleID = roleService.resolveID(SOME_ROLE.id);
			makeSure(roleID).is(SOME_ROLE.id);
		});

		it('should resolve a role name to its ID', () => {
			const roleID = roleService.resolveID(SOME_ROLE.name);
			makeSure(roleID).is(SOME_ROLE.id);
		});

		it('should resolve a role definition object to its ID', () => {
			const roleID = roleService.resolveID(SOME_ROLE);
			makeSure(roleID).is(SOME_ROLE.id);
		});

		it('should resolve a role object to its ID', () => {
			const role = roleService.resolveRole(SOME_ROLE);
			const roleID = roleService.resolveID(role);
			makeSure(roleID).is(SOME_ROLE.id);
		});
	});

	describe('isRole()', () => {
		it('should return true if the given value is a role', () => {
			const role = roleService.resolveRole(SOME_ROLE);
			const isRole = roleService.isRole(role);
			makeSure(isRole).isTrue();
		});

		it('should return true if the given value is a role ID', () => {
			const isRole = roleService.isRole(SOME_ROLE.id);
			makeSure(isRole).isTrue();
		});

		it('should return true if the given value is a role name', () => {
			const isRole = roleService.isRole(SOME_ROLE.name);
			makeSure(isRole).isTrue();
		});

		it('should return false if the given value is not resolvable to a role', () => {
			const isRole = roleService.isRole(INVALID_ROLE_ID);
			makeSure(isRole).isFalse();
		});
	});

	describe('doesPlayerHave()', () => {
		it('should return true if the player has the role', () => {
			const player = addMockPlayer(db, {
				role: SOME_ROLE
			});

			const hasRole = roleService.doesPlayerHave(
				SOME_ROLE,
				player
			);

			makeSure(hasRole).isTrue();
		});

		it('should return false if the player does not have the role', () => {
			const player = addMockPlayer(db, {
				role: null
			});

			const hasRole = roleService.doesPlayerHave(
				SOME_ROLE,
				player
			);

			makeSure(hasRole).isFalse();
		});
	})

	describe('setPlayerRole()', () => {
		it('should assign a role to a player', () => {
			const player = addMockPlayer(db, {
				role: null
			});

			roleService.setPlayerRole(SOME_ROLE, player);

			const hasRole = roleService.doesPlayerHave(
				SOME_ROLE,
				player
			);

			makeSure(hasRole).isTrue();
		});
	});

	describe('getRoleOfPlayer()', () => {
		it('should return the role of a player if they have one', () => {
			const player = addMockPlayer(db, {
				role: SOME_ROLE
			});

			const role = roleService.getRoleOfPlayer(player);

			makeSure(role).isNotNull();
			makeSure(role!.id).is(SOME_ROLE.id);
		});

		it('should return null if the player has no role', () => {
			const player = addMockPlayer(db, {
				role: null
			});

			const role = roleService.getRoleOfPlayer(player);

			makeSure(role).isNull();
		});
	});
});