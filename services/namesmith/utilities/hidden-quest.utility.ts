import { ids } from '../../../bot-config/discord-ids';
import { fetchNamesmithChannel } from './discord-fetch.utility';
import { addPermissionToChannel } from '../../../utilities/discord-action-utils';

export async function revealHiddenQuestToPlayer(playerID: string): Promise<void> {
	const hiddenChannel = await fetchNamesmithChannel(ids.namesmith.channels.HIDDEN_QUESTS);

	// Grant view permission for player to hidden channel
	await addPermissionToChannel({
		channel: hiddenChannel,
		userOrRoleID: playerID,
		allowedPermissions: ['ViewChannel'],
	});
}
