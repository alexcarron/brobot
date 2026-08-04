# Namesmith Architecture

## Layer Responsibilities

### Repositories

**Scope**: One class per DB table (e.g. `PlayerRepository`, `VoteRepository`).

**Contents**: Only SQL. `SELECT`, `INSERT`, `UPDATE`, `DELETE`.

**Resolvables**: Each exposes typed `resolve*(resolvable)` methods that accept IDs, `{id}` shapes, or full objects.

**Construction**: `static fromDB(db: DatabaseQuerier)`.

**Restrictions**: No Discord imports, no business logic.

### Services

**Scope**: One class per domain entity (e.g. `PlayerService`, `QuestService`).

**Contents**: Business logic and game rule enforcement.

**Resolvables**: Accept `*Resolvable` types and delegate persistence to their owned repository.

**Cross-calls**: A service can call other services. `GameStateService` uses `PlayerService`, `VoteService`, and `RecipeService`.

**Construction**: `static fromDB(db)` wires its own repositories. `static asMock()` builds an in-memory test instance.

### Workflows

**Scope**: One file per user-facing action (e.g. `mine-tokens.workflow.ts`).

**Contents**: Orchestrate multiple services for a complete operation.

**Service access**: `getNamesmithServices()`, called at the top of the function, returns all services from `global.namesmith`.

**Return value**: A typed `WorkflowResult`. A workflow never throws for an expected failure.

**Logging**: `activityLogService.logXxx(...)` is called on success.

**Current workflows**: `mine-tokens`, `claim-refill`, `buy-mystery-box`, `craft-characters`, `choose-role`, `pick-perk`.

Trading and voting are not workflows. They are handled directly in `interfaces/trading/` and `interfaces/voting/` through service calls, with `UserActionError` caught at the interface layer.

### Commands

**Location**: `../../commands/namesmith/`, outside `services/namesmith/`.

**Construction**: Instantiate a `SlashCommand` with `required_servers`, `required_channels`, and `required_roles` for access control.

**Body**: Call one workflow, or, for a read-only query, one service method.

**Reply mapping**: Map each `WorkflowResult` case to a reply string.

**Return value**: A string from `execute()`, sent by the framework as a deferred reply.

### Interfaces

**Contents**: Discord UI components. Embeds, buttons, modals, multi-step flows.

**Organization**: By feature. `interfaces/trading/`, `interfaces/quests/`, `interfaces/voting/`, `interfaces/results/`.

**Handlers**: Registered through the bot's global `EventHandler` mechanism.

**Trading and voting**: Call services directly and catch `UserActionError.userFriendlyMessage` to display to the user.

## WorkflowResult Pattern

The result schema is declared once at module scope, then used inside the workflow function.

```ts
const result = getWorkflowResultCreator({
  success: provides<{ tokensEarned: number; newTokenCount: number; hasMineBonusPerk: boolean }>(),
  notAPlayer: null,
  cannotAfford: provides<{ cost: number }>(),
});

export const mineTokens = ({ playerMining }: { playerMining: PlayerResolvable }) => {
  const { playerService, perkService, activityLogService } = getNamesmithServices();

  if (!playerService.isPlayer(playerMining))
    return result.failure.notAPlayer();

  // ... logic ...
  return result.success({ tokensEarned, newTokenCount, hasMineBonusPerk });
};

const workflowResult = mineTokens({ playerMining: interaction.user.id });
if (workflowResult.isNotAPlayer())   return "You're not a player.";
if (workflowResult.isCannotAfford()) return `Costs ${workflowResult.cost} tokens.`;
const { tokensEarned } = workflowResult;
```

Guard methods (`isXxx()`) are generated from the result schema keys. A camelCase key becomes `isKey()`. `isFailure()` is a generic guard that matches any failure case.

## Resolvable Types

Every entity exposes a `*Resolvable` union type.

```ts
type PlayerResolvable = PlayerID | { id: PlayerID };
type QuestResolvable  = QuestID | QuestName | { id: QuestID };
```

Services accept the resolvable and resolve it to the concrete type internally through `resolveXxx(resolvable)`. A raw ID never travels deeper than the service boundary.

## Database

**Engine**: `better-sqlite3`, synchronous. WAL mode, foreign keys on.

**Connection**: A singleton in `database/get-database.ts`.

**Setup**: Schema, static data, and the backup cron are wired in `database/setup-database.ts`.

**Querier**: `database/database-querier.ts`, a typed wrapper exposing `run`, `get`, `all`, and similar methods.

**Schema**: `database/queries/schema.sql`, applied idempotently through `CREATE TABLE IF NOT EXISTS`.

### Tables

- **player**: id (Discord snowflake), currentName, publishedName, tokens, inventory (a raw unicode string), a role foreign key, lastClaimedRefillTime, hasPickedPerk.
- **character**: id (a unicode code point integer), value (the literal character), rarity.
- **recipe**: inputCharacters string mapped to outputCharacters string.
- **mysteryBox**: id, name, tokenCost.
- **mysteryBoxCharacterOdds**: mysteryBoxID, characterID, weight, used for weighted random selection.
- **perk**: id, name, description, isBeingOffered, wasOffered.
- **role**: id, name, description.
- **rolePerk**: a join table of roleID and perkID.
- **playerPerk**: a join table of playerID and perkID.
- **vote**: voterID as primary key, votedFirstPlayerID, votedSecondPlayerID, votedThirdPlayerID.
- **trade**: id, initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters, status.
- **quest**: id, name, description, recurrence (daily or weekly), tokensReward, charactersReward.
- **shownDailyQuest**: a dayID foreign key, a questID foreign key, isHidden.
- **shownWeeklyQuest**: a weekID foreign key, a questID foreign key.
- **day**: id, timeStarted, a game-relative day boundary.
- **week**: id, timeStarted, a game-relative week boundary.
- **activityLog**: id, activityType (13 types), and polymorphic reference columns for the entities involved.

### Static Data

Characters, perks, roles, recipes, mystery boxes, and quests are hardcoded in `database/static-data/*.ts`. On every boot, `database/static-data-synchronizers/` syncs the DB to match the TS definitions.

Static data rows use auto-increment integer IDs, and the synchronizer matches existing rows by name or value. Renaming an entity in the TS file makes the synchronizer insert a new row and leave the old one orphaned, silently breaking any player data that referenced the old ID. Only rename a static data entity if no live player data references it, or write a manual migration.

## Event System

`event-listeners/namesmith-events.ts` exports a `NamesmithEvents` singleton. Each event exposes:

- **addHandler(fn)**: Registers a persistent handler and returns a remove function.
- **addOneTimeHandler(fn)**: Fires once, then self-removes.
- **triggerEvent(payload)**: Fires every handler. The alias `runHandlers` does the same thing.

The events themselves:

- **ChangeName**: Payload `{ playerID, oldName, newName }`. Fired by `PlayerService`.
- **PublishName**: Payload `{ player }`. Fired by `PlayerService`.
- **DayStart**: No payload. Fired by the `GameStateService` cron.
- **WeekStart**: No payload. Fired by the `GameStateService` cron.
- **StartVoting**: No payload. Fired by the `GameStateService` cron.
- **EndVoting**: No payload. Fired by the `GameStateService` cron.
- **PickAPerk**: No payload. Fired by the `GameStateService` cron.

All handlers are registered in `event-listeners/setup-event-listeners.ts`. Individual handler files live in `event-listeners/on-*.ts`.

## Game Timing

`GameStateService` computes every event time from a single `startDate` stored in the DB.

- **timeVotingStarts**: `startDate` plus `DAYS_TO_BUILD_NAME` (7).
- **timeVotingEnds**: `startDate` plus `DAYS_TO_BUILD_NAME` plus `DAYS_TO_VOTE` (10).
- **timesPickAPerkStarts**: Offsets of 3 and 6 days from each week boundary within the build phase.
- **timesDayStarts**: One entry per day, from start to vote start.
- **timesWeekStarts**: One entry per seven day block, from start to vote start.

`scheduleGameEvents()` stops any existing cron jobs and re-registers all of them. It must be called on bot startup, which is handled in `event-listeners/on-setup.ts`, so scheduled events survive a restart mid-game.

Day and week records in the `day` and `week` tables are created by `DayService` and `WeekService` when each boundary fires. They are not pre-created at game start.

## Errors

All Namesmith errors extend `NamesmithError`, defined in `utilities/error.utility.ts`. Use `WorkflowResult` for expected user-facing failures, and reserve thrown exceptions for programmer errors and invariant violations.

**QueryUsageError**: Bad SQL usage. Covers `MultiStatementQueryError` and `ForeignKeyConstraintError`.

**ResourceNotFoundError**: A resource does not exist. One `XxxNotFoundError` subclass per entity.

**ResourceAlreadyExistsError**: A resource already exists where it shouldn't. One `XxxAlreadyExistsError` subclass per entity.

**GameStateInitializationError**: The game has not started, or its state is not set.

**GameIsNotActiveError**: An action was attempted outside the active game window.

**VoteOutOfOrderError**: A voter skipped a rank.

**NameVotedTwiceError**: The same player appears in two ranks of one vote.

**PlayerAlreadyHasPerkError**: A player already holds the perk being granted.

**QuestEligbilityNotImplementedError**: A quest was added to static data without an eligibility check.

### UserActionError

`UserActionError` carries a `userFriendlyMessage` and is caught at the interface layer to show the user what went wrong. Its subclasses:

- **NotAPlayerError**: The acting user has no player record. Has subclasses per action.
- **RefillAlreadyClaimedError**: The refill cooldown has not elapsed.
- **PlayerCantAffordMysteryBoxError**: The player has fewer tokens than the box costs.
- **MissingRequiredCharactersError**: A recipe input character is missing from inventory.
- **MissingOfferedCharactersError**: A trade offer includes a character the initiator does not have.
- **MissingRequestedCharactersError**: A trade request includes a character the recipient does not have.
- **TradeAlreadyRespondedToError**: The trade has already been accepted, declined, or ignored.
- **TradeAwaitingDifferentPlayerError**: The responding player is not the one the trade is waiting on.
- **RecipeNotUnlockedError**: The player has not unlocked the recipe being crafted.
- **InvalidNameError**: The chosen name fails validation. `NameTooLongError` is its current subclass.

## Perk Application

Perks are applied inline at the point of effect, using a conditional callback.

```ts
perkService.doIfPlayerHas(Perks.MINE_BONUS, playerMining, () => {
  tokensEarned += 1;
});
```

`Perks` is a string enum generated from perk names in `database/static-data/perks.ts`, through `toEnumFromObjects(perks, "name")`. Renaming a perk in static data means every `Perks.OLD_NAME` reference in workflow files needs updating by hand. TypeScript will not catch a stale one.

The `perk.isBeingOffered` and `perk.wasOffered` DB flags drive the perk-pick UI rotation. `isBeingOffered` is true during an active pick window. `wasOffered` tracks historical offering for rotation purposes.

## Quest Rotation

**Daily**: On each `DayStart` event, `QuestService` selects 2 to 3 random daily quests to show and 1 to 2 to hide, tracked in `shownDailyQuest`. A hidden quest is revealed only after every shown daily quest is completed, and its token reward is multiplied by 1.5.

**Weekly**: On each `WeekStart` event, 3 to 4 weekly quests are selected. Rotation guarantees no quest repeats until every quest has been shown at least once, tracked by `wasShown` on `shownWeeklyQuest`.

**Eligibility**: Every quest needs a matching check in `QuestService`. Adding a quest to static data without implementing its eligibility check throws `QuestEligbilityNotImplementedError` at runtime.

## Testing

**Runner**: Jest, at 50 percent workers (`npm run test`).

**Location**: Tests live beside their source as `*.test.ts`.

**Database**: `MockDatabase`, from `mocks/mock-database.ts`, an in-memory SQLite instance that is fully functional.

**Services**: `Service.asMock()` constructs a service without `global.namesmith`.

**Test constants**: Player IDs, item IDs, and similar fixed values live in `constants/test.constants.ts`.

**Prebuilt mocks**: `mocks/all-mocks.ts` exports pre-built mock instances for common test setups.

## Scaffolding

From the repo root:

```bash
npm run create-service   # Generates services/namesmith/services/xxx.service.ts
npm run create-repo      # Generates services/namesmith/repositories/xxx.repository.ts
```

After generation, register the new class in `types/namesmith.types.ts`, under `NamesmithServiceClasses` or `NamesmithRepositoryClasses`. `getNamesmithServices()` and `createServicesFromDB()` need this entry to include the new class.
