import { getNamesmithServices } from "../services/get-namesmith-services";
import { Player, PlayerResolvable } from "../types/player.types";
import { Role, RoleResolvable } from "../types/role.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";


const result = getWorkflowResultCreator({
	success: provides<{
		player: Player,
	}>(),

	notAPlayer: null,
	roleDoesNotExist: null,
	roleAlreadyChosen: provides<{
		chosenRole: Role,
	}>(),
})

/**
 * Assigns a role to a player.
 * @param parameters - The parameters for the workflow.
 * @param parameters.playerService - The player service to use to get the player.
 * @param parameters.roleService - The role service to use to assign the role.
 * @param parameters.player - The player to assign the role to.
 * @param parameters.role - The role to assign.
 * @returns A workflow success object if the role was assigned successfully, or a workflow failure object if the role was not assigned successfully.
 */
export function chooseRole(
	{player, role}: {
		player: PlayerResolvable,
		role: RoleResolvable
	}
) {
	const {playerService, roleService, activityLogService} = getNamesmithServices();

	if (!playerService.isPlayer(player)) {
		return result.failure.notAPlayer();
	}

	if (!roleService.isRole(role)) {
		return result.failure.roleDoesNotExist();
	}

	const currentRole = roleService.getRoleOfPlayer(player);
	if (currentRole !== null) {
		return result.failure.roleAlreadyChosen({
			chosenRole: currentRole
		});
	}

	roleService.setPlayerRole(role, player);

	activityLogService.logChooseRole({player, role})

	return result.success({
		player: playerService.resolvePlayer(player),
	});
}