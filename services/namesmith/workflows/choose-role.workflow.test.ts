import { failTest, makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID, INVALID_ROLE_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { RoleService } from "../services/role.service";
import { Player } from "../types/player.types";
import { RoleID } from "../types/role.types";
import { returnIfNotFailure } from "../utilities/workflow.utility";
import { chooseRole } from './choose-role.workflow';

describe('choose-role.workflow', () => {
	let roleService: RoleService;
	let db: DatabaseQuerier;

	let NO_ROLE_PLAYER: Player;
	let SOME_ROLE_ID: RoleID;

	beforeEach(() => {
		const dependencies = setupMockNamesmith();
		roleService = dependencies.roleService;
		db = dependencies.db;

		NO_ROLE_PLAYER = addMockPlayer(db, {
			role: null
		});
		SOME_ROLE_ID = roleService.roleRepository.getRoles()[0].id;
	});

	describe('chooseRole()', () => {
		it('should set the role of the given player to the given role', () => {
			chooseRole({
				...getNamesmithServices(),
				player: NO_ROLE_PLAYER,
				role: SOME_ROLE_ID
			});

			const hasRole = roleService.doesPlayerHave(SOME_ROLE_ID, NO_ROLE_PLAYER);
			const role = roleService.getRoleOfPlayer(NO_ROLE_PLAYER);

			makeSure(hasRole).isTrue();
			makeSure(role).isNotNull();
			makeSure(role!.id).is(SOME_ROLE_ID);
		});

		it('should return nothing if it is a success', () => {
			const result = returnIfNotFailure(
				chooseRole({
					...getNamesmithServices(),
					player: NO_ROLE_PLAYER,
					role: SOME_ROLE_ID
				})
			);

			makeSure(result).isAnObject();
		});

		it('should return a roleAlreadyChosen failure if the player already has a role', () => {
			const player = addMockPlayer(db, {
				role: SOME_ROLE_ID
			});

			const result =
				chooseRole({
					...getNamesmithServices(),
					player: player,
					role: SOME_ROLE_ID
				})

			makeSure(result).isAnObject();
			makeSure(result.isFailure()).isTrue();
			if (!result.isRoleAlreadyChosen()) {
				failTest('Returned result is not a roleAlreadyChosen failure');
			}

			makeSure(result.chosenRole.id).is(SOME_ROLE_ID);
		});

		it('should return nonPlayer failure if the player does not exist', () => {
			const result =
				chooseRole({
					...getNamesmithServices(),
					player: INVALID_PLAYER_ID,
					role: SOME_ROLE_ID
				});

			makeSure(result).isAnObject();
			makeSure(result.isFailure()).isTrue();
			makeSure(result.isNotAPlayer()).isTrue();
		});

		it('should return roleDoesNotExist failure if the role does not exist', () => {
			const result =
				chooseRole({
					...getNamesmithServices(),
					player: NO_ROLE_PLAYER,
					role: INVALID_ROLE_ID
				});

			makeSure(result).isAnObject();
			makeSure(result.isFailure()).isTrue();
			makeSure(result.isRoleDoesNotExist()).isTrue();
		});
	});
})