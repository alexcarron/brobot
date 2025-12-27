import { makeSure } from "../../../../utilities/jest/jest-utils";
import { Perks } from "../../constants/perks.constants";
import { RoleRepository } from "../../repositories/role.repository";
import { DatabaseQuerier } from "../database-querier";
import { syncRolesToDB } from "./sync-roles";
import { INVALID_PERK_NAME } from "../../constants/test.constants";
import { ignoreError } from "../../../../utilities/error-utils";

describe('sync-roles.ts', () => {
	let db: DatabaseQuerier;
	let roleRepository: RoleRepository;

	beforeEach(() => {
		roleRepository = RoleRepository.asMock();
		db = roleRepository.db;
	});

	describe('syncRolesToDB()', () => {
		it('should add new role defintions to the database', () => {
			syncRolesToDB(db, [
				{
					name: 'Newly Added Role',
					description: 'Test Role Description',
					perks: [Perks.FASTER_REFILL.name, Perks.DISCOUNT.name]
				},
				{
					name: 'Newly Added Role 2',
					description: 'Test Role Description 2',
					perks: []
				}
			]);

			const roles = roleRepository.getRoles();
			makeSure(roles).hasAnItemWhere(role =>
				role.name === 'Newly Added Role'
			);
			makeSure(roles).hasAnItemWhere(role =>
				role.name === 'Newly Added Role 2'
			);

			const newRole1 = roleRepository.getRoleByName('Newly Added Role');
			makeSure(newRole1).isNotNull();
			makeSure(newRole1!.description).is('Test Role Description');
			makeSure(newRole1!.perks).hasAnItemWhere(perk =>
				perk.id === Perks.FASTER_REFILL.id
			);
			makeSure(newRole1!.perks).hasAnItemWhere(perk =>
				perk.id === Perks.DISCOUNT.id
			);

			const newRole2 = roleRepository.getRoleByName('Newly Added Role 2');
			makeSure(newRole2).isNotNull();
			makeSure(newRole2!.description).is('Test Role Description 2');
			makeSure(newRole2!.perks).isEmpty();
		});

		it('should delete roles not defined in the static data', () => {
			syncRolesToDB(db, [
				{
					name: 'Newly Added Role',
					description: 'Test Role Description',
					perks: [Perks.FASTER_REFILL.name, Perks.DISCOUNT.name]
				}
			]);

			const roles = roleRepository.getRoles();
			makeSure(roles).hasLengthOf(1);
			makeSure(roles[0].name).is('Newly Added Role');
		});
	});

	it('should update existing roles defined in the static data by ID', () => {
		syncRolesToDB(db, [
			{
				id: 1,
				name: 'Role Name',
				description: 'Description',
				perks: [Perks.MINE_BONUS.name]
			}
		]);

		syncRolesToDB(db, [
			{
				id: 1,
				name: 'New Role Name',
				description: 'New Description',
				perks: [Perks.FASTER_REFILL.name, Perks.DISCOUNT.name]
			}
		]);

		const roles = roleRepository.getRoles();

		makeSure(roles).hasLengthOf(1);
		makeSure(roles[0].name).is('New Role Name');
		makeSure(roles[0].description).is('New Description');
		makeSure(roles[0].perks).hasAnItemWhere(perk =>
			perk.id === Perks.FASTER_REFILL.id
		);
		makeSure(roles[0].perks).hasAnItemWhere(perk =>
			perk.id === Perks.DISCOUNT.id
		);
	});

	it('should update existing roles defined in the static data by Name', () => {
		syncRolesToDB(db, [
			{
				id: 1,
				name: 'Role Name',
				description: 'Description',
				perks: [Perks.MINE_BONUS.name]
			}
		]);

		syncRolesToDB(db, [
			{
				name: 'Role Name',
				description: 'New Description',
				perks: [Perks.FASTER_REFILL.name, Perks.DISCOUNT.name]
			}
		]);

		const roles = roleRepository.getRoles();

		makeSure(roles).hasLengthOf(1);
		makeSure(roles[0].name).is('Role Name');
		makeSure(roles[0].description).is('New Description');
		makeSure(roles[0].perks).hasAnItemWhere(perk =>
			perk.id === Perks.FASTER_REFILL.id
		);
		makeSure(roles[0].perks).hasAnItemWhere(perk =>
			perk.id === Perks.DISCOUNT.id
		);
	});

	it('should delete, update, and add roles all at once', () => {
		syncRolesToDB(db, [
			{
				id: 1,
				name: 'Role Name',
				description: 'Description',
				perks: [Perks.MINE_BONUS.name]
			},
			{
				id: 2,
				name: 'Role Name 2',
				description: 'Description 2',
				perks: [Perks.DISCOUNT.name]
			},
			{
				name: 'Role Name 3',
				description: 'Description 3',
				perks: [Perks.FREE_TOKENS.name]
			}
		]);

		syncRolesToDB(db, [
			{
				id: 2,
				name: 'New Role Name 2',
				description: 'New Description 2',
				perks: [Perks.FASTER_REFILL.name]
			},
			{
				name: 'Role Name 3',
				description: 'New Description 3',
				perks: []
			},
			{
				name: 'Role Name 4',
				description: 'Description 4',
				perks: [Perks.DISCOUNT.name, Perks.FASTER_REFILL.name]
			}
		]);

		const roles = roleRepository.getRoles();
		makeSure(roles).hasLengthOf(3);
		makeSure(roles).hasNoItemWhere(role =>
			role.id === 1 ||
			role.name === 'Role Name'
		);
		makeSure(roles).hasAnItemWhere(role =>
			role.id === 2 &&
			role.name === 'New Role Name 2' &&
			role.description === 'New Description 2' &&
			role.perks.length === 1 &&
			role.perks[0].id === Perks.FASTER_REFILL.id
		);
		makeSure(roles).hasAnItemWhere(role =>
			role.name === 'Role Name 3' &&
			role.description === 'New Description 3' &&
			role.perks.length === 0
		);
		makeSure(roles).hasAnItemWhere(role =>
			role.name === 'Role Name 4' &&
			role.description === 'Description 4' &&
			role.perks.length === 2 &&
			role.perks.some(perk =>
				perk.id === Perks.DISCOUNT.id
			) &&
			role.perks.some(perk =>
				perk.id === Perks.FASTER_REFILL.id
			)
		);
	});

	it('should reset all queries on failure', () => {
		syncRolesToDB(db, [
			{
				id: 1,
				name: 'Role Name',
				description: 'Description',
				perks: [Perks.MINE_BONUS.name]
			}
		]);

		ignoreError(() =>
			syncRolesToDB(db, [
				{
					id: 2,
					name: 'Role Name 2',
					description: 'Description 2',
					perks: [INVALID_PERK_NAME]
				}
			])
		)

		const roles = roleRepository.getRoles();

		makeSure(roles).hasLengthOf(1);
		makeSure(roles[0].name).is('Role Name');
		makeSure(roles[0].description).is('Description');
		makeSure(roles[0].perks).hasAnItemWhere(perk =>
			perk.id === Perks.MINE_BONUS.id
		);
	})
});