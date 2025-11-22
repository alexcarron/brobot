import { Expand } from "../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../database/database-querier";
import { ActivityLogRepository } from "../repositories/activity-log.repository";
import { CharacterRepository } from "../repositories/character.repository";
import { GameStateRepository } from "../repositories/game-state.repository";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { PerkRepository } from "../repositories/perk.repository";
import { PlayerRepository } from "../repositories/player.repository";
import { QuestRepository } from "../repositories/quest.repository";
import { RecipeRepository } from "../repositories/recipe.repository";
import { RoleRepository } from "../repositories/role.repository";
import { TradeRepository } from "../repositories/trade.repository";
import { VoteRepository } from "../repositories/vote.repository";
import { ActivityLogService } from "../services/activity-log.service";
import { CharacterService } from "../services/character.service";
import { GameStateService } from "../services/game-state.service";
import { MysteryBoxService } from "../services/mystery-box.service";
import { PerkService } from "../services/perk.service";
import { PlayerService } from "../services/player.service";
import { QuestService } from "../services/quest.service";
import { RecipeService } from "../services/recipe.service";
import { RoleService } from "../services/role.service";
import { TradeService } from "../services/trade.service";
import { VoteService } from "../services/vote.service";

/**
 * A record of all database classes in Namesmith
 */
const NamesmithDatabaseClasses = {
	db: DatabaseQuerier
};

/**
 * A record of all database objects in Namesmith that provide access to the raw database connection and query execution that repositories depend on
 */
export type NamesmithDatabases = Expand<{
	db: DatabaseQuerier
}>;

/**
 * A record of all repository names to their repository classes in Namesmith
 */
export const NamesmithRepositoryClasses = {
	mysteryBoxRepository: MysteryBoxRepository,
	characterRepository: CharacterRepository,
	playerRepository: PlayerRepository,
	gameStateRepository: GameStateRepository,
	voteRepository: VoteRepository,
	recipeRepository: RecipeRepository,
	tradeRepository: TradeRepository,
	perkRepository: PerkRepository,
	roleRepository: RoleRepository,
	questRepository: QuestRepository,
	activityLogRepository: ActivityLogRepository,
};

/**
 * A record of all repositories in Namesmith that encapsulate direct database access and expose clean methods for fetching and persisting entities
 */
export type NamesmithRepositories = {
	[RepoName in keyof typeof NamesmithRepositoryClasses]: InstanceType<typeof NamesmithRepositoryClasses[RepoName]>
}

/**
 * A record of all service names to their service classes in Namesmith
 */
export const NamesmithServiceClasses = {
	mysteryBoxService: MysteryBoxService,
	characterService: CharacterService,
	playerService: PlayerService,
	gameStateService: GameStateService,
	voteService: VoteService,
	recipeService: RecipeService,
	tradeService: TradeService,
	perkService: PerkService,
	roleService: RoleService,
	questService: QuestService,
	activityLogService: ActivityLogService,
};

/**
 * A record of all services in Namesmith that coordinate repositories and external system to implement game rules and small reusable operations
 */
export type NamesmithServices = {
	[ServiceName in keyof typeof NamesmithServiceClasses]: InstanceType<typeof NamesmithServiceClasses[ServiceName]>
}

/**
 * A record of all dependency names to their dependency classes in Namesmith
 */
export const NamesmithDependencyClasses = {
	...NamesmithDatabaseClasses,
	...NamesmithRepositoryClasses,
	...NamesmithServiceClasses
};

/**
 * A record of all required modules in Namesmith
 */
export type NamesmithDependencies = Expand<(
	& NamesmithDatabases
	& NamesmithServices
	& NamesmithRepositories
)>;