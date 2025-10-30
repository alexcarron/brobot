import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { Perks } from "../../services/namesmith/constants/perks.constants";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { buyMysteryBox } from "../../services/namesmith/workflows/buy-mystery-box.workflow";
import { addSIfPlural, joinLines, toAmountOfNoun } from "../../utilities/string-manipulation-utils";

const Parameters = Object.freeze({
	MYSTERY_BOX: new Parameter({
		type: ParameterTypes.STRING,
		name: "mystery-box",
		description: "The mystery box to buy",
		autocomplete: ({user}) => {
			const { mysteryBoxService, perkService } = getNamesmithServices()
			const mysteryBoxes = mysteryBoxService.getMysteryBoxes();
			return mysteryBoxes.map(mysteryBox => {
				const {id, name, characterOdds} = mysteryBox;
				let {tokenCost} = mysteryBox;
				const characters = Object.keys(characterOdds);

				perkService.doIfPlayerHas(Perks.DISCOUNT, user.id, () => {
					tokenCost = Math.ceil(tokenCost * 0.9);
				});

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

		const { recievedCharacterValues, mysteryBox, tokenCost, player, wasRefunded, gotDuplicate } = result;
		const newTokenCount = player.tokens;
		const newInventory = player.inventory;

		const luckyRefundLine = (wasRefunded)
			? joinLines(
				`**Lucky Refund!** You also get your ${toAmountOfNoun(tokenCost, 'token')} back.`,
				'🪙'.repeat(tokenCost),
				'',
			)
			: null;

		const luckyDuplicateLine = (gotDuplicate)
			? joinLines(
				'**Lucky Duplicate!** The character you received was duplicated.',
				''
			)
			: null;

		return joinLines(
			`You opened a ${mysteryBox.name} mystery box and received:`,
			`\`\`\`${recievedCharacterValues}\`\`\``,
			luckyDuplicateLine,
			luckyRefundLine,
			`-# You now have ${toAmountOfNoun(newTokenCount, 'token')}`,
			`-# Your inventory now contains: ${newInventory}`,
		);
	}
});