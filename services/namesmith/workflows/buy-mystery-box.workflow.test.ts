jest.mock("../utilities/discord-action.utility", () => ({
	changeDiscordNameOfPlayer: jest.fn(),
}));

import { buyMysteryBox } from "./buy-mystery-box.workflow";
import { mockPlayers } from "../repositories/mock-repositories";
import { setupMockNamesmith } from "../event-listeners/mock-setup";
import { changeDiscordNameOfPlayer } from "../utilities/discord-action.utility";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { MysteryBoxService } from "../services/mystery-box.service";
import { PlayerService } from "../services/player.service";
import { MysteryBoxNotFoundError, NotAPlayerError, PlayerCantAffordMysteryBoxError } from "../utilities/error.utility";
import { INVALID_MYSTERY_BOX_ID, INVALID_PLAYER_ID } from "../constants/test.constants";
import { addMockMysteryBox, addMockPlayer } from "../database/mock-database";
import { DatabaseQuerier } from "../database/database-querier";

describe('buy-mystery-box.workflow', () => {
	/**
	 * The services to use for opening the mystery box and adding a character to the player's name.
	 */
	let services: {
		mysteryBoxService: MysteryBoxService,
		playerService: PlayerService
	};

	let db: DatabaseQuerier;

	beforeEach(() => {
		setupMockNamesmith();
		const { mysteryBoxService, playerService } = getNamesmithServices();
		services = {
			mysteryBoxService,
			playerService
		};

		db = playerService.playerRepository.db;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe('buyMysteryBox()', () => {
		it('should return the recieved character', async () => {
			const richPlayer = addMockPlayer(db, {
				tokens: 9999
			});

			const { character } = await buyMysteryBox({
				...services,
				player: richPlayer.id,
				mysteryBox: 1
			});
			expect(character).toHaveProperty('id', expect.any(Number));
			expect(character).toHaveProperty('value', expect.any(String));
			expect(character).toHaveProperty('rarity', expect.any(Number));
		});

		it('should change the player\'s Discord name to their current name plus that recieved character', async () => {
			const richPlayer = addMockPlayer(db, {
				tokens: 9999
			});

			const { character } = await buyMysteryBox({
				...services,
				player: richPlayer.id,
				mysteryBox: 1
			});

			expect(changeDiscordNameOfPlayer).toHaveBeenCalledTimes(1);
			expect(changeDiscordNameOfPlayer).toHaveBeenCalledWith(
				richPlayer.id,
				richPlayer.currentName + character.value
			)
		});

		it('should change the player\'s name to their current name plus that recieved character', async () => {
			const richPlayer = addMockPlayer(db, {
				tokens: 9999
			});

			const { character } = await buyMysteryBox({
				...services,
				player: richPlayer.id,
				mysteryBox: 1
			});

			const newCurrentName = services.playerService.getCurrentName(richPlayer.id);
			expect(newCurrentName).toEqual(richPlayer.currentName + character.value);
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
				mysteryBox: 1
			})).rejects.toThrow(NotAPlayerError);
		});

		it('should throw an error if no mystery box is found', async () => {
			await expect(buyMysteryBox({
				...services,
				player: mockPlayers[0].id,
				mysteryBox: INVALID_MYSTERY_BOX_ID
			})).rejects.toThrow(MysteryBoxNotFoundError);
		});
	})
})