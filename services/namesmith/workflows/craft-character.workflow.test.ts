jest.mock("../utilities/discord-action.utility", () => ({
	changeDiscordNameOfPlayer: jest.fn(),
}));

import { makeSure } from "../../../utilities/jest/jest-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer, addMockRecipe } from "../mocks/mock-database";
import { setupMockNamesmith } from "../mocks/mock-setup";
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
		it('should return the player and recipe in the correct state.', async () => {
			const player = addMockPlayer(db, {
				inventory: 'aabbccdd'
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abb',
				outputCharacters: 'c'
			});

			const {newInventory, craftedCharacter, recipeUsed, playerCrafting} = returnIfNotError(
					await craftCharacter({
					playerService, recipeService, player, recipe
				})
			);

			makeSure(newInventory).is('accddc');
			makeSure(craftedCharacter).is('c');
			makeSure(recipeUsed).is(recipe);
			makeSure(playerCrafting).is({
				...playerCrafting,
				inventory: 'accddc'
			});
		});

		it('should craft a character using a given recipe and player.', async () => {
			const player = addMockPlayer(db, {
				inventory: 'aabbccdd'
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abb',
				outputCharacters: 'c'
			});

			await craftCharacter({
				playerService, recipeService, player, recipe
			});

			const inventoryAfter = playerService.getInventory(player);

			makeSure(inventoryAfter).is('accddc');
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