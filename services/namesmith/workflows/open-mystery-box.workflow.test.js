const { openMysteryBox } = require("./open-mystery-box.workflow");
const { mockPlayers } = require("../repositories/mock-repositories");
const { setupMockNamesmith } = require("../event-listeners/mock-setup");
const { changeDiscordNameOfPlayer } = require("../utilities/discord-action.utility");
const { getNamesmithServices } = require("../services/get-namesmith-services");
const MysteryBoxService = require("../services/mysteryBox.service");
const PlayerService = require("../services/player.service");

jest.mock("../utilities/discord-action.utility", () => ({
	changeDiscordNameOfPlayer: jest.fn(),
}));

describe('open-mystery-box.workflow', () => {
	/**
	 * The services to use for opening the mystery box and adding a character to the player's name.
	 * @type {{
	 * 	mysteryBoxService: MysteryBoxService,
	 * 	playerService: PlayerService
	 * }}
	 */
	let services;

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
			const { character } = await openMysteryBox(services,
				mockPlayers[0].id, 1
			);
			expect(character).toHaveProperty('id', expect.any(Number));
			expect(character).toHaveProperty('value', expect.any(String));
			expect(character).toHaveProperty('rarity', expect.any(Number));
		});

		it('should change the player\'s Discord name to their current name plus that recieved character', async () => {
			const { character } = await openMysteryBox(services,
				mockPlayers[0].id, 1
			);

			expect(changeDiscordNameOfPlayer).toHaveBeenCalledTimes(1);
			expect(changeDiscordNameOfPlayer).toHaveBeenCalledWith(
				mockPlayers[0].id,
				mockPlayers[0].currentName + character.value
			)
		});

		it('should change the player\'s name to their current name plus that recieved character', async () => {
			const { character } = await openMysteryBox(services,
				mockPlayers[0].id, 1
			);

			const newCurrentName = await services.playerService.getCurrentName(mockPlayers[0].id);
			expect(newCurrentName).toEqual(mockPlayers[0].currentName + character.value);
		});

		it('should throw an error if the player is not found', async () => {
			await expect(openMysteryBox(services, "invalid-id", 1)).rejects.toThrow();
		});

		it('should throw an error if no mystery box is found', async () => {
			await expect(openMysteryBox(services, mockPlayers[0].id, -23)).rejects.toThrow();
		});
	})
})