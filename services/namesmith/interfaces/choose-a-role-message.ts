import { ButtonStyle } from "discord.js";
import { ids } from "../../../bot-config/discord-ids";
import { EMPTY } from "../../../utilities/constants/discord-interface.constants";
import { DiscordButtonDefinition, DiscordButtons } from "../../../utilities/discord-interface-utils";
import { joinLines } from "../../../utilities/string-manipulation-utils";
import { RoleService } from "../services/role.service";
import { Role } from "../types/role.types";
import { chooseRole } from "../workflows/choose-role.workflow";
import { PlayerService } from "../services/player.service";
import { replyToInteraction } from "../../../utilities/discord-action-utils";
import { fetchNamesmithChannel } from "../utilities/discord-fetch.utility";
import { toPerkBulletPoint } from "./pick-a-perk-message";
import { ignoreError } from "../../../utilities/error-utils";

/**
 * Generates a message that asks the user to choose one of the given roles.
 * The message lists the roles and describes the benefits of choosing one.
 * @param services - The services to use to get the roles.
 * @param services.playerService - The player service to use to get the player.
 * @param services.roleService - The role service to use to get the roles.
 * @returns A message that asks the user to choose one of the given roles.
 */
export function getChooseARoleMessage(
	{playerService, roleService}: {
		playerService: PlayerService,
		roleService: RoleService
	},
): DiscordButtons {
	const roles = roleService.getRoles();

	const message = joinLines(
		'# Choose Your Role!',
		'Choose one of the three roles below to define your Namesmith journey. Each role gives you unique, permanent perks that enhance different parts of the game. Pick the one that best matches your playstyle!',
		roles.map(toRoleMessage)
	);

	return new DiscordButtons({
		promptText: message,
		buttons: roles.map(role => toRoleButton({playerService, roleService, role}))
	})
}

const toRoleMessage = (role: Role) => joinLines(
	EMPTY,
	`## ${role.name}`,
	`${role.description}`,
	role.perks.map(toPerkBulletPoint)
) + '\n';

/**
 * Converts a role into a Discord button definition that, when pressed, assigns the role to the user who pressed it.
 * @param params - An object with the following parameters:
 * @param params.playerService - The player service to use to get the player.
 * @param params.roleService - The role service to use to assign the role.
 * @param params.role - The role to assign.
 * @returns A Discord button definition that, when pressed, assigns the role to the user who pressed it.
 */
export function toRoleButton(
	{playerService, roleService, role}: {
		playerService: PlayerService,
		roleService: RoleService,
		role: Role
	},
): DiscordButtonDefinition {
	return {
		id: `choose-a-role-button-${role.id}`,
		label: `Become ${role.name}`,
		style: ButtonStyle.Primary,
		onButtonPressed: async (buttonInteraction) => {
			const result = chooseRole({
				playerService,
				roleService,
				player: buttonInteraction.user.id,
				role
			});

			if (result.isNonPlayer()) {
				return await replyToInteraction(buttonInteraction,
					`You are not a player, so you cannot choose a role.`
				);
			}

			else if (result.isRoleDoesNotExist()) {
				return await replyToInteraction(buttonInteraction,
					`The role ${role.name} does not exist.`
				);
			}

			const {isNewRole} = result;

			if (isNewRole) {
				await replyToInteraction(buttonInteraction,
					`Your role is now ${role.name}!`
				);
			}
			else {
				await replyToInteraction(buttonInteraction,
					`Your role is already ${role.name}.`
				);
			}
		}
	}
}

/**
 * Sends a message to the 'Names to Vote On' channel asking the user to choose one of the given roles.
 * The message lists the roles and describes the benefits of choosing one.
 * @param services - The services to use to get the roles.
 * @param services.playerService - The player service to use to get the player.
 * @param services.roleService - The role service to use to get the roles.
 * @returns A promise that resolves once the message has been sent.
 */
export async function sendChooseARoleMessage(
	services: {
		playerService: PlayerService,
		roleService: RoleService
	},
): Promise<void> {
	const chooseARoleMessage = getChooseARoleMessage(services);
	const channel = await fetchNamesmithChannel(ids.namesmith.channels.CHOOSE_A_ROLE);
	await chooseARoleMessage.setIn(channel);
}

/**
 * Regenerates the choose-a-role message in the 'choose-a-role' channel.
 * @param services - An object containing the necessary services to regenerate the message.
 * @param services.playerService - The player service to use to get the player.
 * @param services.roleService - The role service to use to get the roles.
 * @returns A promise that resolves once the message has been regenerated.
 */
export async function regenerateChooseARoleMessage(
	services: {
		playerService: PlayerService,
		roleService: RoleService
}) {
	const chooseARoleMessage = getChooseARoleMessage(services);
	const channel = await fetchNamesmithChannel(ids.namesmith.channels.CHOOSE_A_ROLE);

	await ignoreError(chooseARoleMessage.regenerate({channel}))
}