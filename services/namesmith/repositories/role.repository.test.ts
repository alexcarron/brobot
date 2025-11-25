import { getRandomElement } from "../../../utilities/data-structure-utils";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { Perks } from "../constants/perks.constants";
import { Roles } from "../constants/roles.constants";
import { INVALID_PLAYER_ID, INVALID_ROLE_ID, INVALID_ROLE_NAME } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { PlayerNotFoundError, RoleNotFoundError } from "../utilities/error.utility";
import { RoleRepository } from "./role.repository";

describe('RoleRepository', () => {
	let roleRepository: RoleRepository;
	let db: DatabaseQuerier;

	const SOME_ROLE = Roles.PROSPECTOR;

	beforeEach(() => {
		roleRepository = RoleRepository.asMock();
		db = roleRepository.db;
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
			const ALL_ROLES = roleRepository.getRoles();
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
			const ALL_ROLES = roleRepository.getRoles();
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

		describe('getRoleOfPlayerID()', () => {
			it('returns the correct role when given a valid player ID', () => {
				const player = addMockPlayer(db, {
					role: SOME_ROLE
				});

				const role = roleRepository.getRoleOfPlayerID(player.id);

				makeSure(role).isNotNull();
				makeSure(role).hasProperties('id', 'name', 'description', 'perks');
				makeSure(role!.id).is(SOME_ROLE.id);
				makeSure(role!.perks).hasAnItemWhere(perk =>
					perk.id === Perks.MINE_BONUS.id
				);
			});

			it('returns null when given a player without a role', () => {
				const player = addMockPlayer(db, {
					role: null
				});

				const role = roleRepository.getRoleOfPlayerID(player.id);

				makeSure(role).isNull();
			});

			it('throws an error when given an invalid player ID', () => {
				makeSure(() => roleRepository.getRoleOfPlayerID(INVALID_PLAYER_ID)).throws(PlayerNotFoundError);
			});
		})

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

	describe('addRole()', () => {
		it('adds a role to the database without an ID', () => {
			const role = roleRepository.addRole({
				name: 'New Role',
				description: 'New description'
			});

			makeSure(role.name).is('New Role');
			makeSure(role.description).is('New description');
			makeSure(role.perks).isEmpty();

			const retrievedRole = roleRepository.getRoleOrThrow(role.id);

			makeSure(retrievedRole.name).is('New Role');
			makeSure(retrievedRole.description).is('New description');
			makeSure(retrievedRole.perks).isEmpty();
		});

		it('adds a role to the database with a specified ID', () => {
			const role = roleRepository.addRole({
				id: 230,
				name: 'New Role',
				description: 'New description'
			});

			makeSure(role.name).is('New Role');
			makeSure(role.description).is('New description');
			makeSure(role.id).is(230);
			makeSure(role.perks).isEmpty();

			const retrievedRole = roleRepository.getRoleOrThrow(role.id);

			makeSure(retrievedRole.name).is('New Role');
			makeSure(retrievedRole.description).is('New description');
			makeSure(retrievedRole.id).is(230);
			makeSure(retrievedRole.perks).isEmpty();
		});

		it('adds a role with perks to the database', () => {
			const role = roleRepository.addRole({
				name: 'New Role',
				description: 'New description',
				perks: [Perks.DISCOUNT.name, Perks.FASTER_REFILL.name]
			});

			makeSure(role.name).is('New Role');
			makeSure(role.description).is('New description');
			makeSure(role.perks).hasAnItemWhere(perk =>
				perk.id === Perks.DISCOUNT.id
			);
			makeSure(role.perks).hasAnItemWhere(perk =>
				perk.id === Perks.FASTER_REFILL.id
			);

			const retrievedRole = roleRepository.getRoleOrThrow(role.id);

			makeSure(retrievedRole.name).is('New Role');
			makeSure(retrievedRole.description).is('New description');
			makeSure(retrievedRole.perks).hasAnItemWhere(perk =>
				perk.id === Perks.DISCOUNT.id
			);
			makeSure(retrievedRole.perks).hasAnItemWhere(perk =>
				perk.id === Perks.FASTER_REFILL.id
			);
		});
	});


	describe('updateRole', () => {
		it('updates a role with a new description based on ID', () => {
			roleRepository.updateRole({
				id: SOME_ROLE.id,
				description: 'New description'
			});

			const role = roleRepository.getRoleOrThrow(SOME_ROLE.id);

			makeSure(role.name).is(SOME_ROLE.name);
			makeSure(role.description).is('New description');
		});

		it('updates a role with a new description based on name', () => {
			roleRepository.updateRole({
				name: SOME_ROLE.name,
				description: 'New description'
			});

			const role = roleRepository.getRoleOrThrow(SOME_ROLE.id);

			makeSure(role.name).is(SOME_ROLE.name);
			makeSure(role.description).is('New description');
		});

		it('updates a role with a new name based on id', () => {
			roleRepository.updateRole({
				id: SOME_ROLE.id,
				name: 'New Name'
			});

			const role = roleRepository.getRoleOrThrow(SOME_ROLE.id);

			makeSure(role.name).is('New Name');
			makeSure(role.description).is(SOME_ROLE.description);
		});

		it('updates a role with a new perks based on id', () => {
			roleRepository.updateRole({
				id: SOME_ROLE.id,
				perks: [Perks.DISCOUNT.name, Perks.MINE_BONUS.name]
			});

			const role = roleRepository.getRoleOrThrow(SOME_ROLE.id);

			makeSure(role.perks).hasAnItemWhere(perk =>
				perk.id === Perks.DISCOUNT.id
			);
			makeSure(role.perks).hasAnItemWhere(perk =>
				perk.id === Perks.MINE_BONUS.id
			);
		});

		it('updates a role with a new name and description based on id', () => {
			roleRepository.updateRole({
				id: SOME_ROLE.id,
				name: 'New Name',
				description: 'New description'
			});

			const role = roleRepository.getRoleOrThrow(SOME_ROLE.id);

			makeSure(role.name).is('New Name');
			makeSure(role.description).is('New description');
		});

		it('throws RoleNotFoundError with given invalid role id', () => {
			makeSure(() =>
				roleRepository.updateRole({
					id: INVALID_ROLE_ID,
					description: 'New description',
				})
			).throws(RoleNotFoundError);
		});

		it('throws RoleNotFoundError with given invalid role name', () => {
			makeSure(() =>
				roleRepository.updateRole({
					name: INVALID_ROLE_NAME,
					description: 'New description',
				})
			).throws(RoleNotFoundError);
		});
	});

	describe('doesRoleExist()', () => {
		it('returns true if a role with the given ID exists', () => {
			const result = roleRepository.doesRoleExist(SOME_ROLE.id);
			expect(result).toBeTruthy();
		});

		it('returns true if a role with the given name exists', () => {
			const result = roleRepository.doesRoleExist(SOME_ROLE.name);
			expect(result).toBeTruthy();
		});

		it('returns false if a role with the given ID does not exist', () => {
			const result = roleRepository.doesRoleExist(INVALID_ROLE_ID);
			expect(result).toBeFalsy();
		});

		it('returns false if a role with the given name does not exist', () => {
			const result = roleRepository.doesRoleExist(INVALID_ROLE_NAME);
			expect(result).toBeFalsy();
		});
	});
});