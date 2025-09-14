import { Expand } from "../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../database/database-querier";
import { CharacterRepository } from "../repositories/character.repository";
import { GameStateRepository } from "../repositories/game-state.repository";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { PlayerRepository } from "../repositories/player.repository";
import { RecipeRepository } from "../repositories/recipe.repository";
import { TradeRepository } from "../repositories/trade.repository";
import { VoteRepository } from "../repositories/vote.repository";
import { CharacterService } from "../services/character.service";
import { GameStateService } from "../services/game-state.service";
import { MysteryBoxService } from "../services/mystery-box.service";
import { PlayerService } from "../services/player.service";
import { RecipeService } from "../services/recipe.service";
import { TradeService } from "../services/trade.service";
import { VoteService } from "../services/vote.service";

/**
 * A record of all database objects in Namesmith that provide access to the raw database connection and query execution that repositories depend on
 */
export type NamesmithDatabases = Expand<{
	db: DatabaseQuerier
}>;

/**
 * A record of all repositories in Namesmith that encapsulate direct database access and expose clean methods for fetching and persisting entities
 */
export type NamesmithRepositories = Expand<{
	mysteryBoxRepository: MysteryBoxRepository,
	characterRepository: CharacterRepository,
	playerRepository: PlayerRepository,
	gameStateRepository: GameStateRepository,
	voteRepository: VoteRepository,
	recipeRepository: RecipeRepository,
	tradeRepository: TradeRepository,
}>;

/**
 * A record of all services in Namesmith that coordinate repositories and external system to implement game rules and small reusable operations
 */
export type NamesmithServices = Expand<{
	mysteryBoxService: MysteryBoxService,
	characterService: CharacterService,
	playerService: PlayerService,
	gameStateService: GameStateService,
	voteService: VoteService,
	recipeService: RecipeService,
	tradeService: TradeService,
}>;

/**
 * A record of all required modules in Namesmith
 */
export type NamesmithDependencies = Expand<(
	& NamesmithDatabases
	& NamesmithServices
	& NamesmithRepositories
)>;