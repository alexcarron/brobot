jest.mock("../utilities/discord-action.utility", () => ({
	changeDiscordNameOfPlayer: jest.fn(),
}));

import { buyMysteryBox } from "./buy-mystery-box.workflow";
import { setupMockNamesmith } from "../event-listeners/mock-setup";
import { changeDiscordNameOfPlayer } from "../utilities/discord-action.utility";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { MysteryBoxService } from "../services/mystery-box.service";
import { PlayerService } from "../services/player.service";
import { MysteryBoxNotFoundError, NotAPlayerError, PlayerCantAffordMysteryBoxError } from "../utilities/error.utility";
import { INVALID_MYSTERY_BOX_ID, INVALID_PLAYER_ID } from "../constants/test.constants";
import { addMockMysteryBox, addMockPlayer } from "../database/mock-database";
import { DatabaseQuerier } from "../database/database-querier";
import { Player } from '../types/player.types';
import { MysteryBox } from "../types/mystery-box.types";

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
	let defaultMysteryBox: MysteryBox;

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
		it('should return the recieved character, token cost, player and mystery box', async () => {
			const { recievedCharacter, tokenCost, player, mysteryBox } = await buyMysteryBox({
				...services,
				player: richPlayer.id,
				mysteryBox: defaultMysteryBox.id
			});

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

		it('should change the player\'s Discord name to their current name plus that recieved character', async () => {
			const { recievedCharacter } = await buyMysteryBox({
				...services,
				player: richPlayer.id,
				mysteryBox: defaultMysteryBox.id
			});

			expect(changeDiscordNameOfPlayer).toHaveBeenCalledTimes(1);
			expect(changeDiscordNameOfPlayer).toHaveBeenCalledWith(
				richPlayer.id,
				richPlayer.currentName + recievedCharacter.value
			)
		});

		it('should change the player\'s name to their current name plus that recieved character', async () => {
			const { recievedCharacter } = await buyMysteryBox({
				...services,
				player: richPlayer.id,
				mysteryBox: defaultMysteryBox.id
			});

			const newCurrentName = services.playerService.getCurrentName(richPlayer.id);
			expect(newCurrentName).toEqual(richPlayer.currentName + recievedCharacter.value);
		});

		it('should throw PlayerCantAffordMysteryBoxError error if the player does not have enough tokens to buy the mystery box', async () => {
			const expensiveMysteryBox = addMockMysteryBox(db, {
				tokenCost: 100
			});

			const brokePlayer = addMockPlayer(db, {
				tokens: 30
			});

			await expect(buyMysteryBox({
				...services,
				player: brokePlayer,
				mysteryBox: expensiveMysteryBox
			})).rejects.toThrow(PlayerCantAffordMysteryBoxError);
		});

		it('should throw NotAPlayerError error if the user is not a player', async () => {
			await expect(buyMysteryBox({
				...services,
				player: INVALID_PLAYER_ID,
				mysteryBox: defaultMysteryBox.id
			})).rejects.toThrow(NotAPlayerError);
		});

		it('should throw an error if no mystery box is found', async () => {
			await expect(buyMysteryBox({
				...services,
				player: richPlayer.id,
				mysteryBox: INVALID_MYSTERY_BOX_ID
			})).rejects.toThrow(MysteryBoxNotFoundError);
		});
	})
})