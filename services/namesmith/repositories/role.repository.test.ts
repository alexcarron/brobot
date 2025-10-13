import { getRandomElement } from "../../../utilities/data-structure-utils";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_ROLE_ID } from "../constants/test.constants";
import { crateMockRoleRepo } from "../mocks/mock-repositories";
import { RoleNotFoundError } from "../utilities/error.utility";
import { RoleRepository } from "./role.repository";

describe('RoleRepository', () => {
	let roleRepository: RoleRepository;

	beforeEach(() => {
		roleRepository = crateMockRoleRepo();
	});

	describe('getMinimalRoles()', () => {
		it('returns an array of all role objects with minimal fields', () => {
			const minimalRoles = roleRepository.getMinimalRoles();

			makeSure(minimalRoles).isAnArray();
			makeSure(minimalRoles).isNotEmpty();
			makeSure(minimalRoles).haveProperties('id', 'name', 'description');
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
});