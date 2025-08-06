jest.mock("../utilities/discord-action.utility", () => ({
	changeDiscordNameOfPlayer: jest.fn(),
}));

import { openMysteryBox } from "./open-mystery-box.workflow";
import { mockPlayers } from "../repositories/mock-repositories";
import { setupMockNamesmith } from "../event-listeners/mock-setup";
import { changeDiscordNameOfPlayer } from "../utilities/discord-action.utility";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { MysteryBoxService } from "../services/mystery-box.service";
import { PlayerService } from "../services/player.service";
import { MysteryBoxNotFoundError, PlayerNotFoundError } from "../utilities/error.utility";

describe('open-mystery-box.workflow', () => {
	/**
	 * The services to use for opening the mystery box and adding a character to the player's name.
	 */
	let services: {
		mysteryBoxService: MysteryBoxService,
		playerService: PlayerService
	};

	beforeEach(() => {
		setupMockNamesmith();
		const { mysteryBoxService, playerService } = getNamesmithServices();
		services = {
			mysteryBoxService,
			playerService
		};
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe('openMysteryBox()', () => {
		it('should return the recieved character', async () => {
			const { character } = await openMysteryBox({
				...services,
				player: mockPlayers[0].id,
				mysteryBox: 1
			});
			expect(character).toHaveProperty('id', expect.any(Number));
			expect(character).toHaveProperty('value', expect.any(String));
			expect(character).toHaveProperty('rarity', expect.any(Number));
		});

		it('should change the player\'s Discord name to their current name plus that recieved character', async () => {
			const { character } = await openMysteryBox({
				...services,
				player: mockPlayers[0].id,
				mysteryBox: 1
			});

			expect(changeDiscordNameOfPlayer).toHaveBeenCalledTimes(1);
			expect(changeDiscordNameOfPlayer).toHaveBeenCalledWith(
				mockPlayers[0].id,
				mockPlayers[0].currentName + character.value
			)
		});

		it('should change the player\'s name to their current name plus that recieved character', async () => {
			const { character } = await openMysteryBox({
				...services,
				player: mockPlayers[0].id,
				mysteryBox: 1
			});

			const newCurrentName = await services.playerService.getCurrentName(mockPlayers[0].id);
			expect(newCurrentName).toEqual(mockPlayers[0].currentName + character.value);
		});

		it('should throw an error if the player is not found', async () => {
			await expect(openMysteryBox({
				...services,
				player: "0000009000000",
				mysteryBox: 1
			})).rejects.toThrow(PlayerNotFoundError);
		});

		it('should throw an error if no mystery box is found', async () => {
			await expect(openMysteryBox({
				...services,
				player: mockPlayers[0].id,
				mysteryBox: -999
			})).rejects.toThrow(MysteryBoxNotFoundError);
		});
	})
})