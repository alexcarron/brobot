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
import { isOneSymbol, getNumCharacters } from '../../../utilities/string-checks-utils';
import { getLatestActivityLog } from "../mocks/mock-data/mock-activity-logs";
import { ActivityTypes } from "../types/activity-log.types";

describe('buy-mystery-box.workflow', () => {
	/**
	 * The services to use for opening the mystery box and adding a character to the player's name.
	 */
	let services: {
		mysteryBoxService: MysteryBoxService,
		playerService: PlayerService
	};

	let db: DatabaseQuerier;
	let RICH_PLAYER: Player;
	let FIRST_MYSTERY_BOX: MinimalMysteryBox;

	beforeEach(() => {
		setupMockNamesmith();
		const { mysteryBoxService, playerService } = getNamesmithServices();
		services = {
			mysteryBoxService,
			playerService
		};

		db = playerService.playerRepository.db;
		RICH_PLAYER = addMockPlayer(db, {
			tokens: 9999
		});
		FIRST_MYSTERY_BOX = mysteryBoxService.resolveMysteryBox(1);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe('buyMysteryBox()', () => {
		it('creates an activity log with accurate metadata', () => {
			const player = addMockPlayer(db, {
				currentName: 'SOME_NAME',
				tokens: 9999,
			});
			const result = returnIfNotFailure( buyMysteryBox({
				player: player.id,
				mysteryBox: FIRST_MYSTERY_BOX.id
			}) );

			const activityLog = getLatestActivityLog(db);

			makeSure(activityLog.player.id).is(player.id);
			makeSure(activityLog.type).is(ActivityTypes.BUY_MYSTERY_BOX);
			makeSure(activityLog.involvedMysteryBox!.id).is(FIRST_MYSTERY_BOX.id);
			makeSure(activityLog.nameChangedFrom).is('SOME_NAME');
			makeSure(activityLog.currentName).is('SOME_NAME' + result.receivedCharacterValues);
			makeSure(activityLog.charactersGained).is(result.receivedCharacterValues);
			makeSure(activityLog.charactersLost).isNull();
		});

		it('should return the recieved character, token cost, player and mystery box', () => {
			const result = returnIfNotFailure(
				buyMysteryBox({
					...getNamesmithServices(),
					player: RICH_PLAYER.id,
					mysteryBox: FIRST_MYSTERY_BOX.id
				})
			);

			makeSure(
				isOneSymbol(result.receivedCharacterValues)
			).isTrue();
			makeSure(result.tokenCost).is(25);
			makeSure(result.player).is({
				...RICH_PLAYER,
				tokens: RICH_PLAYER.tokens - result.tokenCost,
				currentName: RICH_PLAYER.currentName + result.receivedCharacterValues,
				inventory: RICH_PLAYER.inventory + result.receivedCharacterValues
			});
			makeSure(result.mysteryBox).is(FIRST_MYSTERY_BOX);
			makeSure(result.wasRefunded).isFalse();
			makeSure(result.gotDuplicate).isFalse();
			makeSure(result.gotAnotherCharacter).isFalse();
		});

		it('should change the player\'s Discord name to their current name plus that recieved character', () => {
			const announceNameChangeEvent = jest.spyOn(NamesmithEvents.ChangeName, "triggerEvent");

			const { receivedCharacterValues: recievedCharacterValues } = returnIfNotFailure(
				buyMysteryBox({
				...getNamesmithServices(),
					player: RICH_PLAYER.id,
					mysteryBox: FIRST_MYSTERY_BOX.id
				})
			);

			expect(announceNameChangeEvent).toHaveBeenCalledTimes(1);
			expect(announceNameChangeEvent).toHaveBeenCalledWith({
				playerID: RICH_PLAYER.id,
				oldName: RICH_PLAYER.currentName,
				newName: RICH_PLAYER.currentName + recievedCharacterValues
			})
		});

		it('should change the player\'s name to their current name plus that recieved character', () => {
			const { receivedCharacterValues: recievedCharacterValues } =
				returnIfNotFailure(
					buyMysteryBox({
						...getNamesmithServices(),
						player: RICH_PLAYER.id,
						mysteryBox: FIRST_MYSTERY_BOX.id
					})
				);

			const newCurrentName = services.playerService.getCurrentName(RICH_PLAYER.id);
			expect(newCurrentName).toEqual(RICH_PLAYER.currentName + recievedCharacterValues);
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
					mysteryBox: FIRST_MYSTERY_BOX.id
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
					mysteryBox: FIRST_MYSTERY_BOX.id
				})
			);

			makeSure(getNumCharacters(result.receivedCharacterValues)).is(2);
			makeSure(result.receivedCharacterValues[0]).is(result.receivedCharacterValues[1]);
			makeSure(result.player.inventory).is(
				playerWithPerk.inventory + result.receivedCharacterValues
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
				mysteryBox: FIRST_MYSTERY_BOX.id
			})

			makeSure(result.isNotAPlayer()).isTrue();
		});

		it('should throw an error if no mystery box is found', () => {
			const result = buyMysteryBox({
				...getNamesmithServices(),
				player: RICH_PLAYER.id,
				mysteryBox: INVALID_MYSTERY_BOX_ID
			});

			makeSure(result.isMysteryBoxDoesNotExist()).isTrue();
		});
	})
})