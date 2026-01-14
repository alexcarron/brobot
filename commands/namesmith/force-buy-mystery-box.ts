import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from '../../services/command-creation/parameter';
import { SlashCommand } from "../../services/command-creation/slash-command";
import { Perks } from "../../services/namesmith/constants/perks.constants";
import { forcePlayerToBuyMysteryBox } from "../../services/namesmith/mocks/mock-data/mock-mystery-boxes";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { sortByAscendingProperty } from "../../utilities/data-structure-utils";
import { joinLines, toAmountOfNoun } from "../../utilities/string-manipulation-utils";
import { isNotNullable } from "../../utilities/types/type-guards";

const Parameters = Object.freeze({
	MYSTERY_BOX: new Parameter({
		type: ParameterTypes.STRING,
		name: "mystery-box",
		description: "The mystery box to buy",
		autocomplete: ({user}) => {
			const { mysteryBoxService, perkService, playerService } = getNamesmithServices();
			if (playerService.isPlayer(user.id) === false) {
				return ['You are not a player, so you cannot buy a mystery box.'];
			}

			const mysteryBoxes = mysteryBoxService.getMysteryBoxes();
			return sortByAscendingProperty(mysteryBoxes, 'tokenCost')
				.map(mysteryBox => {
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
	RECIEVED_CHARACTERS: new Parameter({
		type: ParameterTypes.STRING,
		name: "recieved-characters",
		description: "The characters you will be forced to receive from the mystery box",
		isOptional: true,
	})
});

export const command = new SlashCommand({
	name: "force-buy-mystery-box",
	description: "Force yourself to buy a mystery box to instantly open",
	parameters: [
		Parameters.MYSTERY_BOX,
		Parameters.RECIEVED_CHARACTERS,
	],
	required_servers: [ids.servers.NAMESMITH],
	isInDevelopment: true,
	execute: function execute(interaction, {mysteryBox: mysteryBoxID, recievedCharacters}) {
		if (isNotNullable(recievedCharacters))
			recievedCharacters = recievedCharacters.replace(/\[SPACE\]/g, ' ');
		
		const result = forcePlayerToBuyMysteryBox(
			interaction.user.id,
			parseInt(mysteryBoxID),
			recievedCharacters ?? undefined
		);


		if (result.isNotAPlayer()) {
			return `You're not a player, so you can't buy a mystery box.`;
		}
		else if (result.isMysteryBoxDoesNotExist()) {
			return `The "${mysteryBoxID}" mystery box does not exist.`;
		}

		const { receivedCharacterValues: recievedCharacterValues, mysteryBox, tokenCost, player, wasRefunded, gotDuplicate, gotAnotherCharacter } = result;
		const newTokenCount = player.tokens;
		const newInventory = player.inventory;

		const luckyRefundLine = (wasRefunded)
			? joinLines(
				`**Lucky Refund!** You also got your ${toAmountOfNoun(tokenCost, 'token')} back.`,
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


		const luckyDoubleLine = (gotAnotherCharacter)
			? joinLines(
				'**Lucky Double!** You also got another character.',
				''
			)
			: null;

		return joinLines(
			`You opened a ${mysteryBox.name} mystery box and received:`,
			`\`\`\`${recievedCharacterValues}\`\`\``,
			luckyDuplicateLine,
			luckyDoubleLine,
			luckyRefundLine,
			`-# You now have ${toAmountOfNoun(newTokenCount, 'token')}`,
			`-# Your inventory now contains: ${newInventory}`,
		);
	}
});