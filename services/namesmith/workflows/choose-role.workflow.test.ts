import { makeSure } from "../../../utilities/jest/jest-utils";
import { Roles } from "../constants/roles.constants";
import { INVALID_PLAYER_ID, INVALID_ROLE_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { setupMockNamesmith } from "../mocks/mock-setup"
import { getNamesmithServices } from "../services/get-namesmith-services";
import { RoleService } from "../services/role.service";
import { Player } from "../types/player.types";
import { RoleID } from "../types/role.types";
import { chooseRole } from "./choose-role.workflow";
import { returnIfNotFailure } from "./workflow-result-creator";

describe('choose-role.workflow', () => {
	let roleService: RoleService;
	let db: DatabaseQuerier;

	let NO_ROLE_PLAYER: Player;
	const SOME_ROLE_ID: RoleID = Roles.PROSPECTOR.id;

	beforeEach(() => {
		const dependencies = setupMockNamesmith();
		roleService = dependencies.roleService;
		db = dependencies.db;

		NO_ROLE_PLAYER = addMockPlayer(db, {
			role: null
		});
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

		it('should return result.isNewRole as true if the player did not have a role before', () => {
			const result = returnIfNotFailure(
				chooseRole({
					...getNamesmithServices(),
					player: NO_ROLE_PLAYER,
					role: SOME_ROLE_ID
				})
			);

			makeSure(result).isAnObject();
			makeSure(result.isNewRole).isTrue();
		});

		it('should return result.isNewRole as false if the player had the same role before', () => {
			const player = addMockPlayer(db, {
				role: SOME_ROLE_ID
			});

			const result = returnIfNotFailure(
				chooseRole({
					...getNamesmithServices(),
					player: player,
					role: SOME_ROLE_ID
				})
			);

			makeSure(result).isAnObject();
			makeSure(result.isNewRole).isFalse();
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
			makeSure(result.isNonPlayer()).isTrue();
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