import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { buyMysteryBox } from "../../services/namesmith/workflows/buy-mystery-box.workflow";
import { addSIfPlural, toAmountOfNoun } from "../../utilities/string-manipulation-utils";

const Parameters = Object.freeze({
	MYSTERY_BOX: new Parameter({
		type: ParameterTypes.STRING,
		name: "mystery-box",
		description: "The mystery box to buy",
		autocomplete: () => {
			const { mysteryBoxService } = getNamesmithServices()
			const mysteryBoxes = mysteryBoxService.getMysteryBoxes();
			return mysteryBoxes.map(mysteryBox => {
				const {id, tokenCost, name, characterOdds} = mysteryBox;
				const characters = Object.keys(characterOdds);

				return {
					name: `$${tokenCost} - ${name}: ${characters.sort().join("")}`,
					value: id.toString()
				}
			});
		}
	}),
});

export const command = new SlashCommand({
	name: "buy-mystery-box",
	description: "Buy a mystery box to instantly open",
	parameters: [
		Parameters.MYSTERY_BOX
	],
	required_servers: [ids.servers.NAMESMITH],
	required_channels: [ids.namesmith.channels.OPEN_MYSTERY_BOXES],
	execute: async function execute(interaction, {mysteryBox: mysteryBoxID}) {
		// await deferInteraction(interaction);

		const result = await buyMysteryBox({
			...getNamesmithServices(),
			player: interaction.user.id,
			mysteryBox: parseInt(mysteryBoxID)
		});

		if (result.isNonPlayerBoughtMysteryBox()) {
			return `You're not a player, so you can't buy a mystery box.`;
		}
		else if (result.isMysteryBoxDoesNotExist()) {
			return `The "${mysteryBoxID}" mystery box does not exist.`;
		}
		else if (result.isPlayerCantAffordMysteryBox()) {
			const { mysteryBoxName, tokensNeeded, tokensOwned } = result;

			return (
				`You need **${tokensNeeded} more ${addSIfPlural('token', tokensNeeded)}** to afford the "${mysteryBoxName}" mystery box\n` +
				`-# You only have **${toAmountOfNoun(tokensOwned, 'token')}**\n` +
				`-# <#${ids.namesmith.channels.MINE_TOKENS}> and <#${ids.namesmith.channels.CLAIM_REFILL}> to get more \n`
			);
		}

		const {recievedCharacter, mysteryBox, player} = result;
		const characterValue = recievedCharacter.value;
		const newTokenCount = player.tokens;
		const newInventory = player.inventory;

		return (
			`You opened a ${mysteryBox.name} mystery box and received:\n` +
			`\`\`\`${characterValue}\`\`\`\n` +
			`-# You now have ${toAmountOfNoun(newTokenCount, 'token')}\n` +
			`-# Your inventory now contains: ${newInventory}`
		);
	}
});