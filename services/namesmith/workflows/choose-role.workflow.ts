import { getNamesmithServices } from "../services/get-namesmith-services";
import { Player, PlayerResolvable } from "../types/player.types";
import { Role, RoleResolvable } from "../types/role.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";
import { telemetry } from "../telemetry/telemetry";
import { EventType } from "../telemetry/telemetry-event.types";


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
	{player, role: roleResolvable}: {
		player: PlayerResolvable,
		role: RoleResolvable
	}
) {
	const {playerService, roleService, activityLogService} = getNamesmithServices();

	if (!playerService.isPlayer(player)) {
		return result.failure.notAPlayer();
	}

	if (!roleService.isRole(roleResolvable)) {
		return result.failure.roleDoesNotExist();
	}

	const currentRole = roleService.getRoleOfPlayer(player);
	if (currentRole !== null) {
		return result.failure.roleAlreadyChosen({
			chosenRole: currentRole
		});
	}

	roleService.setPlayerRole(roleResolvable, player);

	activityLogService.logChooseRole({player, role: roleResolvable})

	const role = roleService.resolveRole(roleResolvable);
	telemetry.track({
		eventType: EventType.ROLE_CHOSEN,
		playerID: playerService.resolveID(player),
		roleID: role.id,
		roleName: role.name,
	});

	return result.success({
		player: playerService.resolvePlayer(player),
	});
}