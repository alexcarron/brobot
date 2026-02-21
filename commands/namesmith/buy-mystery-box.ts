import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { Perks } from "../../services/namesmith/constants/perks.constants";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { toTokenEmojis as toTokenEmojis } from "../../services/namesmith/utilities/feedback-message.utility";
import { getStaticMysteryBox, getStaticMysteryBoxes } from "../../services/namesmith/utilities/mystery-box.utility";
import { buyMysteryBox } from "../../services/namesmith/workflows/buy-mystery-box.workflow";
import { sortByAscendingProperty } from "../../utilities/data-structure-utils";
import { addReplyToInteraction } from "../../utilities/discord-action-utils";
import { addSIfPlural, chooseByPlurality, joinLines, toAmountOfNoun } from "../../utilities/string-manipulation-utils";

const INVALID_MYSTERY_BOX_AMOUNT = 'INVALID_MYSTERY_BOX_AMOUNT';

const Parameters = Object.freeze({
	MYSTERY_BOX: new Parameter({
		type: ParameterTypes.STRING,
		name: "mystery-box",
		description: "The mystery box to buy",
		autocomplete: ({user}) => {
			const mysteryBoxes = getStaticMysteryBoxes();
			return sortByAscendingProperty(mysteryBoxes, 'tokenCost')
				.map(mysteryBox => {
					const {id, name, characterOdds} = mysteryBox;
					let {tokenCost} = mysteryBox;
					const characters = Object.keys(characterOdds);

					const { perkService } = getNamesmithServices();
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
	AMOUNT: new Parameter({
		type: ParameterTypes.STRING,
		name: "amount",
		description: "The number of the mystery boxes of that type you want to buy",
		isOptional: true,
		isAutocompleteFiltered: false,
		autocomplete: ({user, enteredValue, enteredValueByParameter}) => {
			const mysteryBoxIDString: string | undefined = enteredValueByParameter['mystery-box'] ?? undefined;
			const mysteryBoxID = Number.isFinite(Number(mysteryBoxIDString)) 
				? Number(mysteryBoxIDString)
				: null;

			const mysteryBox = getStaticMysteryBox(mysteryBoxID);

			// If not a whole number, display that they must enter a positve whole number of mystery boxes to buy
			if (
				enteredValue === undefined || 
				Number.isNaN(Number(enteredValue)) ||
				Number.isInteger(Number(enteredValue)) === false ||
				Number(enteredValue) <= 0
			) {
				if (mysteryBox === null) {
					return [
						{
							name: 'You must enter a whole number of mystery boxes to buy.',
							value: INVALID_MYSTERY_BOX_AMOUNT
						}
					]
				}
				else {
					return [
						{
							name: `You must enter a whole number of "${mysteryBox.name}" mystery boxes to buy.`,
							value: INVALID_MYSTERY_BOX_AMOUNT
						}
					]
				}
			}

			const trimmed = enteredValue.trim();
			const parsed = Number(trimmed);
			const amount =
				/^[+]?\d+$/.test(trimmed) && parsed > 0 ? parsed : 1;

			if (mysteryBox === null) {
				return {[amount]: amount.toString()};
			}
			else {
				const { perkService } = getNamesmithServices();
				let mysteryBoxCost = mysteryBox.tokenCost;
				perkService.doIfPlayerHas(Perks.DISCOUNT, user.id, () => {
					mysteryBoxCost = Math.ceil(mysteryBoxCost * 0.9);
				});
				const tokenCost = amount * mysteryBoxCost;
				const feedback = `${amount} "${mysteryBox.name}" Mystery ${chooseByPlurality(amount, 'Box', 'Boxes')} - $${tokenCost}`;
				return [
					{
						name: feedback,
						value: amount.toString()
					}
				]
			}
		}
	})
});

export const command = new SlashCommand({
	name: "buy-mystery-box",
	description: "Buy a mystery box to instantly open",
	parameters: [
		Parameters.MYSTERY_BOX,
		Parameters.AMOUNT
	],
	required_servers: [ids.servers.NAMESMITH],
	required_channels: [ids.namesmith.channels.OPEN_MYSTERY_BOXES],
	execute: async function execute(interaction, {mysteryBox: mysteryBoxIDString, amount: amountString}) {
		let amount: number = 1;
		if (amountString !== undefined && Number.isFinite(parseInt(amountString))) {
			amount = parseInt(amountString);
		}

		const mysteryBoxID = parseInt(mysteryBoxIDString);
		
		const {mysteryBoxService, playerService, perkService} = getNamesmithServices();
		let mysteryBoxCost = mysteryBoxService.getCost(mysteryBoxID);
		perkService.doIfPlayerHas(Perks.DISCOUNT, interaction.user.id, () => {
			mysteryBoxCost = Math.ceil(mysteryBoxCost * 0.9);
		});
		const totalPrice = amount * mysteryBoxCost;
		if (!playerService.hasTokens(interaction.user.id, totalPrice)) {
			const mysteryBoxName = mysteryBoxService.getName(mysteryBoxID);
			const tokensOwned = playerService.getTokens(interaction.user.id);
			const tokensNeeded = totalPrice - tokensOwned;

			return (
				`You need **${tokensNeeded} more ${addSIfPlural('token', tokensNeeded)}** to afford ${amount} "${mysteryBoxName}" mystery ${chooseByPlurality(amount, 'box', 'boxes')}\n` +
				`-# You only have **${toAmountOfNoun(tokensOwned, 'token')}**\n` +
				`-# <#${ids.namesmith.channels.MINE_TOKENS}> and <#${ids.namesmith.channels.CLAIM_REFILL}> to get more \n`
			);
		}
		
		for (let numMysteryBox = 1; numMysteryBox <= amount; numMysteryBox++) {
			const result = buyMysteryBox({
				...getNamesmithServices(),
				player: interaction.user.id,
				mysteryBox: mysteryBoxID,
			});
	
			if (result.isNotAPlayer()) {
				return await addReplyToInteraction(interaction, `You're not a player, so you can't buy a mystery box.`);
			}
			else if (result.isMysteryBoxDoesNotExist()) {
				return await addReplyToInteraction(interaction, `The "${mysteryBoxIDString}" mystery box does not exist.`);
			}
			else if (result.isPlayerCantAffordMysteryBox()) {
				const { mysteryBoxName, tokensNeeded, tokensOwned } = result;
	
				return await addReplyToInteraction(interaction,
					`You need **${tokensNeeded} more ${addSIfPlural('token', tokensNeeded)}** to afford ${chooseByPlurality(numMysteryBox, 'the', 'another')} "${mysteryBoxName}" mystery box\n` +
					`-# You only have **${toAmountOfNoun(tokensOwned, 'token')}**\n` +
					`-# <#${ids.namesmith.channels.MINE_TOKENS}> and <#${ids.namesmith.channels.CLAIM_REFILL}> to get more \n`
				);
			}
	
			const { receivedCharacterValues: recievedCharacterValues, mysteryBox, tokenCost, player, wasRefunded, gotDuplicate, gotAnotherCharacter } = result;
			const newTokenCount = player.tokens;
			const newInventory = player.inventory;
	
			const luckyRefundLine = (wasRefunded)
				? joinLines(
					`**Lucky Refund!** You also got your ${toAmountOfNoun(tokenCost, 'token')} back.`,
					toTokenEmojis(tokenCost),
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
	
			await addReplyToInteraction(interaction,
				`You opened a ${mysteryBox.name} mystery box and received:`,
				`\`\`\`${recievedCharacterValues}\`\`\``,
				luckyDuplicateLine,
				luckyDoubleLine,
				luckyRefundLine,
				`-# You now have ${toAmountOfNoun(newTokenCount, 'token')}`,
				`-# Your inventory now contains: ${newInventory}`,
			);
		}
	}
});