# Namesmith Testing and Mocks

How to set up state in Namesmith unit tests using `mocks/`, and how to extend `mocks/` instead of writing temporary setup helpers inside a test file.

# The Core Rule

Never define a local setup helper function inside a `*.test.ts` file (e.g. an arrow function at the top of a `describe` block that pokes at services to prepare state). If a test needs a player, entity, or derived state (inventory, tokens, cooldowns, published names, activity logs, etc.), look in `mocks/` first.

- If an existing mock function does what you need, use it.

- If nothing fits, add a new function to the most relevant existing file in `mocks/mock-data/`, or create a new `mocks/mock-data/mock-X.ts` file only if the entity has no owning mock file yet.

- Match the JSDoc style and parameter shape already used in that file (see the patterns below)

This keeps test setup reusable across files instead of every test file re-deriving its own way to achieve certain states.

# Two Mock Function Styles

## `addMockX(db, definition = {})`

Inserts a row directly via a repository built from the given `db`, with sensible defaults for every field, and returns the created domain object. Defaults reference other `addMockX` functions to satisfy foreign keys when not given explicitly.

```ts
export const addMockTrade = (
	db: DatabaseQuerier,
	tradeDefintion: WithAllOptional<TradeDefintion> = {}
): Trade => {
	let { 
		initiatingPlayer = undefined, 
		recipientPlayer = undefined 
	} = tradeDefintion;
	const { 
		id, 
		offeredCharacters = "abc", 
		requestedCharacters = "edf", 
		status = TradeStatuses.AWAITING_RECIPIENT 
	} = tradeDefintion;

	if (initiatingPlayer === undefined) initiatingPlayer = addMockPlayer(db);
	if (recipientPlayer === undefined) recipientPlayer = addMockPlayer(db);

	const tradeRepository = TradeRepository.fromDB(db);
	return tradeRepository.addTrade({ id, initiatingPlayer, recipientPlayer, offeredCharacters, requestedCharacters, status });
};
```

Use this when you just need a row to exist and don't care about simulating a real player action or triggering the side effects a workflow/service would normally cause.

Examples: `addMockPlayer`, `addMockTrade`, `addMockRecipe`, `addMockQuest`, `addMockActivityLog`, `addMockPublishedName`, `addMockRole`, `addMockPerk`, `addMockDay`, `addMockWeek`, `addMockMysteryBox`.

There's also `editMockPlayer(db, {...})` for overwriting fields on an already-existing row directly, bypassing service validation entirely. Use it when you need to force a value a normal service method wouldn't allow.

## `forcePlayerToX(playerResolvable, ...)` — high-level, simulates a real action

Pulls services from `getNamesmithServices()`, so it requires `setupMockNamesmith()` to have run first. Simulates a full player action across whatever services/tables that action really touches and returns the resulting domain object. Provides the player or enteres a state where all pre-conditions are met for the action to execute without error.

```ts
export function forcePlayerToPublishName(
	playerResolvable: PlayerResolvable,
	publishedName: string
): Player {
	const { playerService, publishedNameService, activityLogService } = getNamesmithServices();
	playerService.giveCharacters(playerResolvable, publishedName);
	playerService.changeCurrentName(playerResolvable, publishedName);
	publishedNameService.forceSetPublishedNameInSlot(playerResolvable, publishedName, 1);
	activityLogService.logPublishName({ playerPublishingName: playerResolvable });
	return playerService.resolvePlayer(playerResolvable);
}
```

Use this when the state you're setting up must satisfy invariants a service enforces (e.g. a player's inventory must actually contain the characters of a name before that name can be published, or a cooldown must be expired before a refill can be claimed), or when you're setting up state that spans several systems the way a real player action would.

Examples: `forcePlayerToHaveInventory`, `forcePlayerToChangeName`, `forcePlayerToPublishName`, `forcePlayerToPublishNameInSlot`, `forcePlayerToMineTokens`, `forcePlayerToClaimRefill`, `forcePlayerToCraftRecipe`, `forcePlayerToInitiateTrade`, `forcePlayerToAcceptNewTrade`, `forcePlayerToBuyNewMysteryBox`.

# Choosing How to Construct the Service Under Test

## `ServiceClass.asMock()`

Builds just that one service against its own fresh in-memory DB, with no other services wired in and no `global.namesmith` set.

```ts
beforeEach(() => {
	recipeService = RecipeService.asMock();
	db = recipeService.recipeRepository.db;
});
```

Use this for a narrow unit test of a single service where you don't need `forcePlayerToX` helpers and the service doesn't depend on other injected services you need to interact with directly.

## `setupMockNamesmith()`

Builds every repository and service against one shared mock DB, sets `global.namesmith`, and returns everything (db, every service, every repo)

```ts
beforeEach(() => {
	({ db, publishedNameService, playerService } = setupMockNamesmith());
	NAMED_PLAYER = addMockPlayer(db, { currentName: 'Namey' });
});
```

Use this whenever:
- The test needs any `forcePlayerToX` helper.
- You're testing a workflow.
- The service under test is injected with other services (e.g. `PublishedNameService` depends on `PlayerService`) and you want the real wiring instead of constructing dependencies by hand.

If you're not sure which to use, prefer `setupMockNamesmith()`/dif