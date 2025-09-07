jest.mock("../utilities/discord-action.utility", () => ({
	changeDiscordNameOfPlayer: jest.fn(),
}));

import { makeSure } from "../../../utilities/jest/jest-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer, addMockRecipe } from "../database/mock-database";
import { setupMockNamesmith } from "../event-listeners/mock-setup";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerService } from "../services/player.service";
import { RecipeService } from "../services/recipe.service";
import { MissingRequiredCharactersError, RecipeNotUnlockedError } from "../utilities/error.utility";
import { craftCharacter } from "./craft-character.workflow";
import { returnIfNotError } from '../../../utilities/error-utils';

describe('craft-character.workflow', () => {
	let recipeService: RecipeService;
	let playerService: PlayerService;
	let db: DatabaseQuerier;

	beforeEach(() => {
		setupMockNamesmith();
		const services = getNamesmithServices();
		recipeService = services.recipeService;
		playerService = services.playerService;
		db = playerService.playerRepository.db;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe('craftCharacter()', () => {
		it('should craft a character using a given recipe and player.', async () => {
			const player = addMockPlayer(db, {
				inventory: 'aabbccdd'
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abb',
				outputCharacters: 'c'
			});

			const result = returnIfNotError(await craftCharacter({
				playerService, recipeService, player, recipe
			}));

			const inventoryAfter = playerService.getInventory(player);

			makeSure(inventoryAfter).is('accddc');
			makeSure(result).is({
				newInventory: 'accddc',
				craftedCharacter: 'c',
				recipeUsed: recipe,
				playerCrafting: player,
			});
		});

		it('should throw MissingRequiredCharactersError if the player does not have all the required characters to craft the character.', async () => {
			const player = addMockPlayer(db, {
				inventory: 'abc'
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'def'
			});

			await makeSure(await craftCharacter({
				playerService, recipeService, player, recipe
			})).isAnInstanceOf(MissingRequiredCharactersError);
		});

		it('should throw RecipeNotUnlockedError if the recipe is not unlocked for the player.', async () => {
			const isUnlockedForPlayer = jest.spyOn(recipeService, 'isUnlockedForPlayer');
			isUnlockedForPlayer.mockReturnValue(false);

			const player = addMockPlayer(db, {
				inventory: 'aabbccdd'
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abb',
				outputCharacters: 'c'
			});

			await makeSure(await craftCharacter({
				playerService, recipeService, player, recipe
			})).isAnInstanceOf(RecipeNotUnlockedError);
		});
	});
});