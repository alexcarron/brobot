import { ButtonStyle } from "discord.js";
import { ids } from "../../../bot-config/discord-ids";
import { EMPTY } from "../../../utilities/constants/discord-interface.constants";
import { joinLines } from "../../../utilities/string-manipulation-utils";
import { Role } from "../types/role.types";
import { chooseRole } from "../workflows/choose-role.workflow";
import { editReplyToInteraction } from "../../../utilities/discord/interaction-reply-utils";
import { fetchNamesmithChannel } from "../utilities/discord-fetch.utility";
import { PERK_BULLET_POINT_TEXT } from "./pick-a-perk-message";
import { ignoreError } from "../../../utilities/error-utils";
import { DiscordButtonDefinition } from "../../../utilities/discord-interfaces/discord-button";
import { DiscordButtons } from "../../../utilities/discord-interfaces/discord-buttons";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { confirmInteraction } from "../../../utilities/discord-interfaces/discord-interface-utils";
import { getPingForAllPlayers } from "../utilities/player-message.utility";

const CHOOSE_A_ROLE_HEADER_TEXT = '# Choose Your Role!';
const CHOOSE_A_ROLE_DESCRIPTION_TEXT = 'Choose one of the three roles below to define your Namesmith journey. Each role gives you unique, permanent perks that enhance different parts of the game. Pick the one that best matches your playstyle!';
const CHOOSE_A_ROLE_WARNING_TEXT = '-# ⚠️ **Warning**: Once you choose a role, you CANNOT change it. The choice is permanent.';
const ROLE_DESCRIPTION_TEXT = (role: Role) => joinLines(
	EMPTY,
	`## ${role.name}`,
	`${role.description}`,
	role.perks.map(PERK_BULLET_POINT_TEXT)
);
const BECOME_ROLE_LABEL = (role: Role) => `Become ${role.name}`;
const CHOOSE_ROLE_CONFIRM_PROMPT_TEXT = (role: Role) => `Are you sure you want to choose the ${role.name} role? You will NOT be able to switch roles after choosing one.`;
const CHOOSE_ROLE_CONFIRM_BUTTON_LABEL = (role: Role) => `Permanently Become ${role.name}`;
const CANCEL_LABEL = `Cancel`;
const CHOOSE_ROLE_CANCELLED_FEEDBACK = (role: Role) => `Cancelled choosing the ${role.name} role.`;
const NOT_A_PLAYER_FEEDBACK = `You are not a player, so you cannot choose a role.`;
const ROLE_DOES_NOT_EXIST_FEEDBACK = (role: Role) => `The role ${role.name} does not exist.`;
const ROLE_ALREADY_CHOSEN_FEEDBACK = (chosenRole: Role) => `You have already chosen the ${chosenRole.name} role. You cannot switch roles after choosing one.`;
const CHOOSE_ROLE_SUCCESS_FEEDBACK = (role: Role) => `You have chosen the ${role.name} role! You are now a ${role.name}`;

/**
 * Generates a message that asks the user to choose one of the given roles.
 * The message lists the roles and describes the benefits of choosing one.
 * @returns A message that asks the user to choose one of the given roles.
 */
export function getChooseARoleMessage(): DiscordButtons {
	const {roleService} = getNamesmithServices();

	const roles = roleService.getRoles();

	const message = joinLines(
		CHOOSE_A_ROLE_HEADER_TEXT,
		getPingForAllPlayers(),
		CHOOSE_A_ROLE_DESCRIPTION_TEXT,
		...roles.map(ROLE_DESCRIPTION_TEXT),
		'',
		CHOOSE_A_ROLE_WARNING_TEXT,
	);

	return new DiscordButtons({
		promptText: message,
		buttons: roles.map(role => toRoleButton({role}))
	})
}

/**
 * Converts a role into a Discord button definition that, when pressed, assigns the role to the user who pressed it.
 * @param params - An object with the following parameters:
 * @param params.playerService - The player service to use to get the player.
 * @param params.roleService - The role service to use to assign the role.
 * @param params.role - The role to assign.
 * @returns A Discord button definition that, when pressed, assigns the role to the user who pressed it.
 */
export function toRoleButton(
	{role}: {
		role: Role
	},
): DiscordButtonDefinition {
	return {
		id: `choose-a-role-button-${role.id}`,
		label: BECOME_ROLE_LABEL(role),
		style: ButtonStyle.Secondary,
		onButtonPressed: async (buttonInteraction) => {
			await confirmInteraction({
				interactionToConfirm: buttonInteraction,
				confirmPromptText: CHOOSE_ROLE_CONFIRM_PROMPT_TEXT(role),
				confirmButtonText: CHOOSE_ROLE_CONFIRM_BUTTON_LABEL(role),
				cancelButtonText: CANCEL_LABEL,
				onCancel: CHOOSE_ROLE_CANCELLED_FEEDBACK(role),
				onConfirm: async (confirmationInteraction) => {
					const result = chooseRole({
						player: confirmationInteraction.user.id,
						role
					});

					if (result.isNotAPlayer()) {
						return await editReplyToInteraction(buttonInteraction,
							NOT_A_PLAYER_FEEDBACK
						);
					}

					if (result.isRoleDoesNotExist()) {
						return await editReplyToInteraction(buttonInteraction,
							ROLE_DOES_NOT_EXIST_FEEDBACK(role)
						);
					}

					if (result.isRoleAlreadyChosen()) {
						const {chosenRole} = result;
						return await editReplyToInteraction(buttonInteraction,
							ROLE_ALREADY_CHOSEN_FEEDBACK(chosenRole)
						);
					}

					await editReplyToInteraction(buttonInteraction,
						CHOOSE_ROLE_SUCCESS_FEEDBACK(role)
					);
				}
			});
		}
	}
}

/**
 * Sends a message to the 'Names to Vote On' channel asking the user to choose one of the given roles.
 * The message lists the roles and describes the benefits of choosing one.
 * @returns A promise that resolves once the message has been sent.
 */
export async function sendChooseARoleMessage(): Promise<void> {
	const chooseARoleMessage = getChooseARoleMessage();
	const channel = await fetchNamesmithChannel(ids.namesmith.channels.CHOOSE_A_ROLE);
	await chooseARoleMessage.setNewMessageIn(channel);
}

/**
 * Regenerates the choose-a-role message in the 'choose-a-role' channel.
 * @returns A promise that resolves once the message has been regenerated.
 */
export async function regenerateChooseARoleMessage() {
	const chooseARoleMessage = getChooseARoleMessage();
	const channel = await fetchNamesmithChannel(ids.namesmith.channels.CHOOSE_A_ROLE);

	await ignoreError(chooseARoleMessage.regenerate({channel}))
}