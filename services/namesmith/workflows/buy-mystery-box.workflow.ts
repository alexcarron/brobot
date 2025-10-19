import { getRandomBoolean } from "../../../utilities/random-utils";
import { Perks } from "../constants/perks.constants";
import { MysteryBoxService } from "../services/mystery-box.service";
import { PerkService } from "../services/perk.service";
import { PlayerService } from "../services/player.service";
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
	}>(),

	nonPlayerBoughtMysteryBox: null,

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
		mysteryBoxService, playerService, perkService,
		player,
		mysteryBox = 1
	}: {
		mysteryBoxService: MysteryBoxService,
		playerService: PlayerService,
		perkService: PerkService,
		player: PlayerResolvable,
		mysteryBox?: MysteryBoxResolveable
	}
) => {
	if (!playerService.isPlayer(player)) {
		return result.failure.nonPlayerBoughtMysteryBox();
	}

	if (!mysteryBoxService.isMysteryBox(mysteryBox)) {
		return result.failure.mysteryBoxDoesNotExist();
	}

	let tokenCost = mysteryBoxService.getCost(mysteryBox);
	perkService.doIfPlayerHas(Perks.DISCOUNT, player, () => {
		tokenCost = Math.ceil(tokenCost * 0.90);
	});

	if (!playerService.hasTokens(player, tokenCost)) {
		mysteryBox = mysteryBoxService.resolveMysteryBox(mysteryBox);
		player = playerService.resolvePlayer(player);

		return result.failure.playerCantAffordMysteryBox({
			mysteryBoxName: mysteryBox.name,
			tokensNeeded: tokenCost - player.tokens,
			tokensOwned: player.tokens
		});
	}

	playerService.takeTokens(player, tokenCost);

	const recievedCharacter = mysteryBoxService.openBox(mysteryBox);
	const characterValue = recievedCharacter.value;
	let recievedCharacterValues = characterValue;

	playerService.giveCharacter(player, characterValue);

	// Handle Lucky Duplicate Characters perk
	let gotDuplicate = false;
	perkService.doIfPlayerHas(Perks.LUCKY_DUPLICATE_CHARACTERS, player, () => {
		if (getRandomBoolean(0.10)) {
			gotDuplicate = true;
			recievedCharacterValues += characterValue;
			playerService.giveCharacter(player, characterValue);
		}
	})

	// Handle Lucky Refund perk
	let wasRefunded = false;
	perkService.doIfPlayerHas(Perks.LUCKY_REFUND, player, () => {
		if (getRandomBoolean(0.10)) {
			wasRefunded = true;
			playerService.giveTokens(player, tokenCost);
		}
	});

	return result.success({
		player: playerService.resolvePlayer(player),
		mysteryBox: mysteryBoxService.resolveMysteryBox(mysteryBox),
		tokenCost,
		recievedCharacterValues,
		wasRefunded,
		gotDuplicate,
	});
};