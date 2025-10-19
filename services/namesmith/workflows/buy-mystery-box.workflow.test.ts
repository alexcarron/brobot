jest.mock("../utilities/discord-action.utility", () => ({
	changeDiscordNameOfPlayer: jest.fn(),
}));

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
import { returnIfNotFailure } from "./workflow-result-creator";
import { Perks } from "../constants/perks.constants";

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
			const { recievedCharacter, tokenCost, player, mysteryBox } = returnIfNotFailure(
				buyMysteryBox({
					...getNamesmithServices(),
					player: richPlayer.id,
					mysteryBox: defaultMysteryBox.id
				})
			);

			expect(recievedCharacter).toHaveProperty('id', expect.any(Number));
			expect(recievedCharacter).toHaveProperty('value', expect.any(String));
			expect(recievedCharacter).toHaveProperty('rarity', expect.any(Number));

			expect(tokenCost).toBe(25);

			expect(player).toEqual({
				...richPlayer,
				tokens: richPlayer.tokens - tokenCost,
				currentName: richPlayer.currentName + recievedCharacter.value,
				inventory: richPlayer.inventory + recievedCharacter.value
			});

			expect(mysteryBox).toEqual(defaultMysteryBox);
		});

		it('should change the player\'s Discord name to their current name plus that recieved character', () => {
			const announceNameChangeEvent = jest.spyOn(NamesmithEvents.NameChange, "announce");

			const { recievedCharacter } = returnIfNotFailure(
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
				newName: richPlayer.currentName + recievedCharacter.value
			})
		});

		it('should change the player\'s name to their current name plus that recieved character', () => {
			const { recievedCharacter } =
				returnIfNotFailure(
					buyMysteryBox({
						...getNamesmithServices(),
						player: richPlayer.id,
						mysteryBox: defaultMysteryBox.id
					})
				);

			const newCurrentName = services.playerService.getCurrentName(richPlayer.id);
			expect(newCurrentName).toEqual(richPlayer.currentName + recievedCharacter.value);
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

			makeSure(result.isNonPlayerBoughtMysteryBox()).isTrue();
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