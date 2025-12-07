import { getRandomBoolean } from "../../../utilities/random-utils";
import { Perks } from "../constants/perks.constants";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { MinimalMysteryBox, MysteryBoxResolveable } from '../types/mystery-box.types';
import { Player, PlayerResolvable } from "../types/player.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";

const result = getWorkflowResultCreator({
	success: provides<{
		player: Player,
		mysteryBox: MinimalMysteryBox,
		tokenCost: number,
		recievedCharacterValues: string,
		wasRefunded: boolean,
		gotDuplicate: boolean,
		gotAnotherCharacter: boolean,
	}>(),

	notAPlayer: null,
	mysteryBoxDoesNotExist: null,
	playerCantAffordMysteryBox: provides<{
		mysteryBoxName: string,
		tokensNeeded: number,
		tokensOwned: number
	}>(),
})

/**
 * Opens a mystery box and adds a character to the player's name.
 * @param options - The options for opening the mystery box.
 * @param options.mysteryBoxService - The service for opening the mystery box.
 * @param options.perkService - The service for applying perks to the player.
 * @param options.playerService - The service for adding a character to the player's name.
 * @param options.player - The player who is opening the mystery box.
 * @param options.mysteryBox - The mystery box to open.
 * @returns A promise that resolves with the character object received from the mystery box.
 * - NonPlayerBoughtMysteryBoxError if the player is not a player.
 * - PlayerCantAffordMysteryBoxError if the player does not have enough tokens to buy the mystery box.
 */
export const buyMysteryBox = (
	{
		player: playerResolvable,
		mysteryBox: mysteryBoxResolvable = 1
	}: {
		player: PlayerResolvable,
		mysteryBox?: MysteryBoxResolveable
	}
) => {
	const {mysteryBoxService, playerService, perkService, activityLogService} = getNamesmithServices();

	if (!playerService.isPlayer(playerResolvable)) {
		return result.failure.notAPlayer();
	}

	if (!mysteryBoxService.isMysteryBox(mysteryBoxResolvable)) {
		return result.failure.mysteryBoxDoesNotExist();
	}

	let tokenCost = mysteryBoxService.getCost(mysteryBoxResolvable);
	perkService.doIfPlayerHas(Perks.DISCOUNT, playerResolvable, () => {
		tokenCost = Math.ceil(tokenCost * 0.90);
	});

	if (!playerService.hasTokens(playerResolvable, tokenCost)) {
		const mysteryBox = mysteryBoxService.resolveMysteryBox(mysteryBoxResolvable);
		const player = playerService.resolvePlayer(playerResolvable);

		return result.failure.playerCantAffordMysteryBox({
			mysteryBoxName: mysteryBox.name,
			tokensNeeded: tokenCost - player.tokens,
			tokensOwned: player.tokens
		});
	}

	playerService.takeTokens(playerResolvable, tokenCost);

	const recievedCharacter = mysteryBoxService.openBox(mysteryBoxResolvable);
	const characterValue = recievedCharacter.value;
	let recievedCharacterValues = characterValue;

	// Handle Lucky Duplicate Characters perk
	let gotDuplicate = false;
	perkService.doIfPlayerHas(Perks.LUCKY_DUPLICATE_CHARACTERS, playerResolvable, () => {
		console.log('Lucky Duplicate Characters');
		if (getRandomBoolean(0.10)) {
			console.log('Lucky Duplicate Characters');
			gotDuplicate = true;
			recievedCharacterValues += characterValue;
		}
	});

	let gotAnotherCharacter = false;
	perkService.doIfPlayerHas(Perks.LUCKY_DOUBLE_BOX, playerResolvable, () => {
		console.log('Lucky Double Box');
		if (getRandomBoolean(0.05)) {
			console.log('Lucky Double Box');
			gotAnotherCharacter = true;
			const secondCharacterValue = mysteryBoxService.openBox(mysteryBoxResolvable).value;
			recievedCharacterValues += secondCharacterValue;
		}
	});

	playerService.giveCharacters(playerResolvable, recievedCharacterValues);

	// Handle Lucky Refund perk
	let wasRefunded = false;
	perkService.doIfPlayerHas(Perks.LUCKY_REFUND, playerResolvable, () => {
		console.log('Lucky Refund');
		if (getRandomBoolean(0.10)) {
			console.log('Lucky Refund');
			wasRefunded = true;
			playerService.giveTokens(playerResolvable, tokenCost);
		}
	});

	activityLogService.logBuyMysteryBox({
		playerBuyingBox: playerResolvable,
		tokensSpent: wasRefunded ? 0 : tokenCost,
	});

	return result.success({
		player: playerService.resolvePlayer(playerResolvable),
		mysteryBox: mysteryBoxService.resolveMysteryBox(mysteryBoxResolvable),
		tokenCost,
		recievedCharacterValues,
		wasRefunded,
		gotDuplicate,
		gotAnotherCharacter,
	});
};