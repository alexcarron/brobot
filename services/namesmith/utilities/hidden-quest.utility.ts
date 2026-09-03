import { ids } from '../../../bot-config/discord-ids';
import { fetchNamesmithChannel } from './discord-fetch.utility';
import { addPermissionToChannel } from '../../../utilities/discord/permission-utils';

export async function revealHiddenQuestChannelToPlayer(playerID: string): Promise<void> {
	const hiddenChannel = await fetchNamesmithChannel(ids.namesmith.channels.HIDDEN_QUESTS);

	await addPermissionToChannel({
		channel: hiddenChannel,
		userOrRoleID: playerID,
		allowedPermissions: ['ViewChannel'],
	});
}
