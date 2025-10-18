import { sendChooseARoleMessage } from '../interfaces/choose-a-role-message';
import { sendPickAPerkMessage } from '../interfaces/pick-a-perk-message';
import { sendRecipeSelectMenu } from '../interfaces/recipe-select-menu';
import { GameStateService } from '../services/game-state.service';
import { PerkService } from '../services/perk.service';
import { PlayerService } from '../services/player.service';
import { RecipeService } from '../services/recipe.service';
import { RoleService } from '../services/role.service';
import { clearNamesToVoteOnChannel, clearPublishedNamesChannel, clearTheWinnerChannel, closeNamesToVoteOnChannel, closeTheWinnerChannel, openPublishedNamesChannel } from '../utilities/discord-action.utility';

/**
 * Starts a new game by doing the following
 * - Resetting the channel permissions
 * - Setting up the players
 * - Sending the recipe select menu
 * - Setting the game start and end times
 * - Starting the cron jobs to end the game and end voting at the times stored in the game state
 * @param services - The services to use
 * @param services.gameStateService - The game state service
 * @param services.playerService - The player service
 * @param services.recipeService - The recipe service
 * @param services.roleService - The role service
 * @param services.perkService - The perk service
 */
export async function startGame(
	{ gameStateService, playerService, recipeService, roleService, perkService }: {
		gameStateService: GameStateService;
		playerService: PlayerService;
		recipeService: RecipeService;
		roleService: RoleService;
		perkService: PerkService;
	}
): Promise<void> {
	// Reset the channel permissions
	await closeNamesToVoteOnChannel();
	await clearNamesToVoteOnChannel();

	await closeTheWinnerChannel();
	await clearTheWinnerChannel();

	await clearPublishedNamesChannel();
	await openPublishedNamesChannel();

	// Set up the players
	playerService.reset();
	await playerService.addEveryoneInServer();

	// Send the recipe select menu in the recipes channel
	await sendRecipeSelectMenu({recipeService});

	await sendChooseARoleMessage({playerService, roleService});
	await sendPickAPerkMessage({playerService, perkService});

	// Set the game start and end times
	const now = new Date();
	gameStateService.setupTimings(now);
	gameStateService.scheduleGameEvents();
}