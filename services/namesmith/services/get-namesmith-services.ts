import { InitializationError } from "../../../utilities/error-utils";
import { NamesmithServices } from "../types/namesmith.types";

/**
 * Returns the Namesmith services that have been set up.
 * @returns The Namesmith services.
 * @throws {Error} If Namesmith, MysteryBoxService, PlayerService, GameStateService, or VoteService is not set up yet.
 */
export const getNamesmithServices = (): NamesmithServices => {
	if (!global.namesmith)
		throw new InitializationError("getNamesmithServices: Namesmith is not set up yet.");

	if (!global.namesmith.mysteryBoxService)
		throw new InitializationError("getNamesmithServices: MysteryBoxService is not set up yet.");

	if (!global.namesmith.characterService)
		throw new InitializationError("getNamesmithServices: CharacterService is not set up yet.");

	if (!global.namesmith.playerService)
		throw new InitializationError("getNamesmithServices: PlayerService is not set up yet.");

	if (!global.namesmith.gameStateService)
		throw new InitializationError("getNamesmithServices: GameStateService is not set up yet.");

	if (!global.namesmith.voteService)
		throw new InitializationError("getNamesmithServices: VoteService is not set up yet.");

	if (!global.namesmith.recipeService)
		throw new InitializationError("getNamesmithServices: RecipeService is not set up yet.");

	if (!global.namesmith.tradeService)
		throw new InitializationError("getNamesmithServices: TradeService is not set up yet.");

	return {
		mysteryBoxService: global.namesmith.mysteryBoxService,
		characterService: global.namesmith.characterService,
		playerService: global.namesmith.playerService,
		gameStateService: global.namesmith.gameStateService,
		voteService: global.namesmith.voteService,
		recipeService: global.namesmith.recipeService,
		tradeService: global.namesmith.tradeService,
	}
}