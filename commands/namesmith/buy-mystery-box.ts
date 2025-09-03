import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { buyMysteryBox } from "../../services/namesmith/workflows/buy-mystery-box.workflow";
import { deferInteraction } from "../../utilities/discord-action-utils";

export const command = new SlashCommand({
	name: "buy-mystery-box",
	description: "Buy a mystery box to instantly open",
	required_servers: [ids.servers.NAMESMITH],
	required_roles: [
		[ids.namesmith.roles.namesmither, ids.namesmith.roles.noName, ids.namesmith.roles.smithedName],
	],
	required_channels: [ids.namesmith.channels.OPEN_MYSTERY_BOXES],
	cooldown: 5,
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const playerID = interaction.user.id;
		const mysteryBoxID = 1;
		const { mysteryBoxService, playerService } = getNamesmithServices();
		const { character } = await buyMysteryBox(
			{
				mysteryBoxService,
				playerService,
				player: playerID,
				mysteryBox: mysteryBoxID
			},
		);
		const characterValue = character.value;

		await interaction.editReply(`The character in your mystery box is:\n\`\`\`${characterValue}\`\`\``);
	}
});