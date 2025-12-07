jest.mock("../utilities/discord-action.utility", () => ({
	changeDiscordNameOfPlayer: jest.fn(),
}));

jest.mock("../../../utilities/random-utils", () => {
	const actual = jest.requireActual("../../../utilities/random-utils");
	return {
		...actual,
		getRandomBoolean: jest.fn().mockReturnValue(true),
	};
});

import { buyMysteryBox } from "./buy-mystery-box.workflow";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { MysteryBoxService } from "../services/mystery-box.service";
import { PlayerService } from "../services/player.service";
import { INVALID_MYSTERY_BOX_ID, INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { Player } from '../types/player.types';
import { MinimalMysteryBox } from "../types/mystery-box.types";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { addMockMysteryBox } from "../mocks/mock-data/mock-mystery-boxes";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { NamesmithEvents } from "../event-listeners/namesmith-events";
import { Perks } from "../constants/perks.constants";
import { returnIfNotFailure } from "../utilities/workflow.utility";
import { isOneSymbol } from "../../../utilities/string-checks-utils";

describe('buy-mystery-box.workflow', () => {
	/**
	 * The services to use for opening the mystery box and adding a character to the player's name.
	 */
	let services: {
		mysteryBoxService: MysteryBoxService,
		playerService: PlayerService
	};

	let db: DatabaseQuerier;
	let richPlayer: Player;
	let defaultMysteryBox: MinimalMysteryBox;

	beforeEach(() => {
		setupMockNamesmith();
		const { mysteryBoxService, playerService } = getNamesmithServices();
		services = {
			mysteryBoxService,
			playerService
		};

		db = playerService.playerRepository.db;
		richPlayer = addMockPlayer(db, {
			tokens: 9999
		});
		defaultMysteryBox = mysteryBoxService.resolveMysteryBox(1);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe('buyMysteryBox()', () => {
		it('should return the recieved character, token cost, player and mystery box', () => {
			const result = returnIfNotFailure(
				buyMysteryBox({
					...getNamesmithServices(),
					player: richPlayer.id,
					mysteryBox: defaultMysteryBox.id
				})
			);

			makeSure(
				isOneSymbol(result.recievedCharacterValues)
			).isTrue();
			makeSure(result.tokenCost).is(25);
			makeSure(result.player).is({
				...richPlayer,
				tokens: richPlayer.tokens - result.tokenCost,
				currentName: richPlayer.currentName + result.recievedCharacterValues,
				inventory: richPlayer.inventory + result.recievedCharacterValues
			});
			makeSure(result.mysteryBox).is(defaultMysteryBox);
			makeSure(result.wasRefunded).isFalse();
			makeSure(result.gotDuplicate).isFalse();
			makeSure(result.gotAnotherCharacter).isFalse();
		});

		it('should change the player\'s Discord name to their current name plus that recieved character', () => {
			const announceNameChangeEvent = jest.spyOn(NamesmithEvents.ChangeName, "triggerEvent");

			const { recievedCharacterValues } = returnIfNotFailure(
				buyMysteryBox({
				...getNamesmithServices(),
					player: richPlayer.id,
					mysteryBox: defaultMysteryBox.id
				})
			);

			expect(announceNameChangeEvent).toHaveBeenCalledTimes(1);
			expect(announceNameChangeEvent).toHaveBeenCalledWith({
				playerID: richPlayer.id,
				oldName: richPlayer.currentName,
				newName: richPlayer.currentName + recievedCharacterValues
			})
		});

		it('should change the player\'s name to their current name plus that recieved character', () => {
			const { recievedCharacterValues } =
				returnIfNotFailure(
					buyMysteryBox({
						...getNamesmithServices(),
						player: richPlayer.id,
						mysteryBox: defaultMysteryBox.id
					})
				);

			const newCurrentName = services.playerService.getCurrentName(richPlayer.id);
			expect(newCurrentName).toEqual(richPlayer.currentName + recievedCharacterValues);
		});

		it('should cost 10% less if the player has the discount perk', () => {
			const expensiveMysteryBox = addMockMysteryBox(db, {
				tokenCost: 100
			});

			const playerWithPerk = addMockPlayer(db, {
				tokens: 90,
				perks: [Perks.DISCOUNT.name]
			});

			const { player, tokenCost } = returnIfNotFailure(
				buyMysteryBox({
					...getNamesmithServices(),
					player: playerWithPerk,
					mysteryBox: expensiveMysteryBox.id
				})
			);

			makeSure(player.tokens).is(0);
			makeSure(tokenCost).is(90);
		});

		it('should refund the player 10% of the time if they have the Lucky Refund perk', () => {
			const playerWithPerk = addMockPlayer(db, {
				tokens: 200,
				perks: [Perks.LUCKY_REFUND.name]
			});

			const { player, wasRefunded } = returnIfNotFailure(
				buyMysteryBox({
					...getNamesmithServices(),
					player: playerWithPerk,
					mysteryBox: defaultMysteryBox.id
				})
			);

			makeSure(player.tokens).is(200);
			makeSure(wasRefunded).isTrue();
		});

		it('should give player two of the same character 10% of the time if they have the Lucky Duplicate Character perk', () => {
			const playerWithPerk = addMockPlayer(db, {
				tokens: 200,
				perks: [Perks.LUCKY_DUPLICATE_CHARACTERS.name]
			});

			const result = returnIfNotFailure(
				buyMysteryBox({
					...getNamesmithServices(),
					player: playerWithPerk,
					mysteryBox: defaultMysteryBox.id
				})
			);

			makeSure(result.recievedCharacterValues).hasLengthOf(2);
			makeSure(result.recievedCharacterValues[0]).is(result.recievedCharacterValues[1]);
			makeSure(result.player.inventory).is(
				playerWithPerk.inventory + result.recievedCharacterValues
			);
		})

		it('should throw PlayerCantAffordMysteryBoxError error if the player does not have enough tokens to buy the mystery box', () => {
			const expensiveMysteryBox = addMockMysteryBox(db, {
				tokenCost: 100
			});

			const brokePlayer = addMockPlayer(db, {
				tokens: 30
			});

			const result = buyMysteryBox({
				...getNamesmithServices(),
				player: brokePlayer,
				mysteryBox: expensiveMysteryBox
			})

			makeSure(result.isPlayerCantAffordMysteryBox()).isTrue();
		});

		it('should throw NotAPlayerError error if the user is not a player', () => {
			const result = buyMysteryBox({
				...getNamesmithServices(),
				player: INVALID_PLAYER_ID,
				mysteryBox: defaultMysteryBox.id
			})

			makeSure(result.isNotAPlayer()).isTrue();
		});

		it('should throw an error if no mystery box is found', () => {
			const result = buyMysteryBox({
				...getNamesmithServices(),
				player: richPlayer.id,
				mysteryBox: INVALID_MYSTERY_BOX_ID
			});

			makeSure(result.isMysteryBoxDoesNotExist()).isTrue();
		});
	})
})