import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerResolvable } from "../types/player.types";
import { RoleResolvable } from "../types/role.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";


const result = getWorkflowResultCreator({
	success: provides<{
		isNewRole: boolean
	}>(),

	nonPlayer: null,
	roleDoesNotExist: null,
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
	const {playerService, roleService} = getNamesmithServices();

	if (!playerService.isPlayer(player)) {
		return result.failure.nonPlayer();
	}

	if (!roleService.isRole(role)) {
		return result.failure.roleDoesNotExist();
	}

	const previousRole = roleService.getRoleOfPlayer(player);
	roleService.setPlayerRole(role, player);

	const isNewRole = (
		previousRole === null ||
		previousRole.id !== roleService.resolveID(role)
	);

	return result.success({
		isNewRole
	});
}