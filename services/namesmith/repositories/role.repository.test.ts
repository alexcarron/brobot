import { getRandomElement } from "../../../utilities/data-structure-utils";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { Perks } from "../constants/perks.constants";
import { Roles } from "../constants/roles.constants";
import { INVALID_PLAYER_ID, INVALID_ROLE_ID, INVALID_ROLE_NAME } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { crateMockRoleRepo } from "../mocks/mock-repositories";
import { PlayerNotFoundError, RoleNotFoundError } from "../utilities/error.utility";
import { RoleRepository } from "./role.repository";

describe('RoleRepository', () => {
	let roleRepository: RoleRepository;
	let db: DatabaseQuerier;

	const SOME_ROLE = Roles.PROSPECTOR;

	beforeEach(() => {
		roleRepository = crateMockRoleRepo();
		db = roleRepository.db;
	});

	describe('getMinimalRoles()', () => {
		it('returns an array of all role objects with minimal fields', () => {
			const minimalRoles = roleRepository.getMinimalRoles();

			makeSure(minimalRoles).isAnArray();
			makeSure(minimalRoles).isNotEmpty();
			makeSure(minimalRoles).haveProperties('id', 'name', 'description');
		});
	});

	describe('getRoles()', () => {
		it('returns an array of all role objects', () => {
			const roles = roleRepository.getRoles();

			makeSure(roles).isAnArray();
			makeSure(roles).isNotEmpty();
			makeSure(roles).haveProperties('id', 'name', 'description', 'perks');
			makeSure(roles[0].perks).haveProperties('id', 'name', 'description');
		});
	});

	describe('getMinimalRoleOrThrow()', () => {
		it('returns the correct role object when given a valid ID', () => {
			const ALL_ROLES = roleRepository.getMinimalRoles();
			const RANDOM_ROLE = getRandomElement(ALL_ROLES);

			const role = roleRepository.getMinimalRoleOrThrow(RANDOM_ROLE.id);

			makeSure(role).isNotNull();
			makeSure(role).hasProperties('id', 'name', 'description');
			makeSure(role.id).is(RANDOM_ROLE.id);
		});

		it('throws an error when given an invalid ID', () => {
			makeSure(() => roleRepository.getMinimalRoleOrThrow(INVALID_ROLE_ID)).throws(RoleNotFoundError);
		});
	});

	describe('getMinimalRoleByID()', () => {
		it('returns the correct role object when given a valid ID', () => {
			const ALL_ROLES = roleRepository.getMinimalRoles();
			const RANDOM_ROLE = getRandomElement(ALL_ROLES);

			const role = roleRepository.getMinimalRoleByID(RANDOM_ROLE.id);

			makeSure(role).isNotNull();
			makeSure(role).hasProperties('id', 'name', 'description');
			makeSure(role?.id).is(RANDOM_ROLE.id);
		});

		it('returns null when given an invalid ID', () => {
			const role = roleRepository.getMinimalRoleByID(INVALID_ROLE_ID);

			makeSure(role).isNull();
		});
	});

	describe('getRoleOrThrow()', () => {
		it('returns the correct role object when given a valid ID', () => {
			const role = roleRepository.getRoleOrThrow(SOME_ROLE.id);

			makeSure(role).isNotNull();
			makeSure(role).hasProperties('id', 'name', 'description', 'perks');
			makeSure(role.id).is(SOME_ROLE.id);
			makeSure(role.perks).hasAnItemWhere(perk =>
				perk.id === Perks.MINE_BONUS.id
			);
		});

		it('throws an error when given an invalid ID', () => {
			makeSure(() => roleRepository.getRoleOrThrow(INVALID_ROLE_ID)).throws(RoleNotFoundError);
		});
	});

	describe('getMinimalRoleByName()', () => {
		it('returns the correct role object when given a valid name', () => {
			const role = roleRepository.getMinimalRoleByName(SOME_ROLE.name);

			makeSure(role).isNotNull();
			makeSure(role).hasProperties('id', 'name', 'description');
			makeSure(role!.id).is(SOME_ROLE.id);
		});

		it('returns null when given an invalid name', () => {
			const role = roleRepository.getMinimalRoleByName(INVALID_ROLE_NAME);

			makeSure(role).isNull();
		});
	});

	describe('getRoleByName()', () => {
		it('returns the correct role object when given a valid name', () => {
			const role = roleRepository.getRoleByName(SOME_ROLE.name);

			makeSure(role).isNotNull();
			makeSure(role).hasProperties('id', 'name', 'description', 'perks');
			makeSure(role!.id).is(SOME_ROLE.id);
			makeSure(role!.perks).hasAnItemWhere(perk =>
				perk.id === Perks.MINE_BONUS.id
			);
		});

		it('returns null when given an invalid name', () => {
			const role = roleRepository.getRoleByName(INVALID_ROLE_NAME);

			makeSure(role).isNull();
		});
	});

	describe('getRoleIDOfPlayerID()', () => {
		it('returns the correct role ID when given a valid player ID', () => {
			const player = addMockPlayer(db, {
				role: SOME_ROLE
			});

			const roleID = roleRepository.getRoleIDOfPlayerID(player.id);

			makeSure(roleID).is(SOME_ROLE.id);
		});

		it('throws when given an invalid player ID', () => {
			makeSure(() => roleRepository.getRoleIDOfPlayerID(INVALID_PLAYER_ID)).throws(PlayerNotFoundError);
		});

		it('returns null when the player has no role', () => {
			const player = addMockPlayer(db, {
				role: null
			});

			const roleID = roleRepository.getRoleIDOfPlayerID(player.id);

			makeSure(roleID).isNull();
		});
	});

	describe('addRoleIDToPlayer()', () => {
		it('adds the role ID to the player', () => {
			const player = addMockPlayer(db, {
				role: null
			});

			roleRepository.addRoleIDToPlayer(SOME_ROLE.id, player.id);

			const roleID = roleRepository.getRoleIDOfPlayerID(player.id);

			makeSure(roleID).is(SOME_ROLE.id);
		});
	});
});