# Namesmith — Architecture

Deep-dive reference. See `CLAUDE.md` for quick orientation, invariants, and common tasks.

---

## Layer Responsibilities

### Repositories
- One class per DB table (e.g. `PlayerRepository`, `VoteRepository`)
- Only SQL: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- Each exposes typed `resolve*(resolvable)` methods that accept IDs, `{id}` shapes, or full objects
- Constructed via `static fromDB(db: DatabaseQuerier)`
- No Discord imports, no business logic

### Services
- One class per domain entity (e.g. `PlayerService`, `QuestService`)
- Contain business logic and game rule enforcement
- Accept `*Resolvable` types and delegate persistence to their owned repository
- May cross-call other services (e.g. `GameStateService` uses `PlayerService`, `VoteService`, `RecipeService`)
- Constructed via `static fromDB(db)` which wires its own repositories
- `static asMock()` creates an in-memory test instance

### Workflows
- One file per user-facing action (e.g. `mine-tokens.workflow.ts`)
- Orchestrate multiple services for a complete operation
- Call `getNamesmithServices()` at the top — returns all services from `global.namesmith`
- Return a typed `WorkflowResult` — never throw for expected failures
- Always call `activityLogService.logXxx(...)` on success
- Current workflows: `mine-tokens`, `claim-refill`, `buy-mystery-box`, `craft-characters`, `choose-role`, `pick-perk`
- **Trading and voting are not workflows** — handled directly in `interfaces/trading/` and `interfaces/voting/` via service calls, with `UserActionError` caught at the interface layer

### Commands
- Files in `../../commands/namesmith/` (outside `services/namesmith/`)
- Instantiate a `SlashCommand` with `required_servers`, `required_channels`, `required_roles` for access control
- Call one workflow (or rarely, one service method for read-only queries)
- Map each `WorkflowResult` case to a reply string
- Return a string from `execute()` and the framework sends it as a deferred reply

### Interfaces
- Discord UI components: embeds, buttons, modals, and multi-step flows
- Organized by feature: `interfaces/trading/`, `interfaces/quests/`, `interfaces/voting/`, `interfaces/results/`
- Register button/select handlers via the bot's global `EventHandler` mechanism
- For trading and voting, interfaces call services directly and catch `UserActionError.userFriendlyMessage` to display to the user

---

## WorkflowResult Pattern

The result schema is declared at module scope (once), then used in the workflow function:

```ts
// Declare once at module scope
const result = getWorkflowResultCreator({
  success: provides<{ tokensEarned: number; newTokenCount: number; hasMineBonusPerk: boolean }>(),
  notAPlayer: null,                                       // no payload
  cannotAfford: provides<{ cost: number }>(),             // typed payload
});

// In workflow function:
export const mineTokens = ({ playerMining }: { playerMining: PlayerResolvable }) => {
  const { playerService, perkService, activityLogService } = getNamesmithServices();

  if (!playerService.isPlayer(playerMining))
    return result.failure.notAPlayer();

  // ... logic ...
  return result.success({ tokensEarned, newTokenCount, hasMineBonusPerk });
};

// In command:
const workflowResult = mineTokens({ playerMining: interaction.user.id });
if (workflowResult.isNotAPlayer())   return "You're not a player.";
if (workflowResult.isCannotAfford()) return `Costs ${workflowResult.cost} tokens.`;
const { tokensEarned } = workflowResult; // type-safe destructure
```

Guard methods (`isXxx()`) are auto-generated from the result schema keys (camelCase key → `isKey()`). `isFailure()` is a generic guard for any failure type.

---

## Resolvable Types

Every entity exposes a `*Resolvable` union type, for example:

```ts
type PlayerResolvable = PlayerID | { id: PlayerID };
type QuestResolvable  = QuestID | QuestName | { id: QuestID };
```

Services always accept the resolvable and resolve to the concrete type internally via `resolveXxx(resolvable)`. Never pass raw IDs deeper than the service boundary.

---

## Database

**Tech:** `better-sqlite3` (synchronous). WAL mode, foreign keys ON.  
**Connection:** Singleton in `database/get-database.ts`. Setup (schema + static data + backup cron) via `database/setup-database.ts`.  
**Querier:** `database/database-querier.ts` — typed wrapper exposing `run`, `get`, `all`, etc.  
**Schema:** `database/queries/schema.sql` — applied idempotently via `CREATE TABLE IF NOT EXISTS`.

### Table Reference

| Table | Purpose |
|---|---|
| `player` | `id` (Discord snowflake), `currentName`, `publishedName`, `tokens`, `inventory` (raw unicode string), `role` FK, `lastClaimedRefillTime`, `hasPickedPerk` |
| `character` | `id` (unicode code point integer), `value` (the literal char), `rarity` |
| `recipe` | `inputCharacters` string → `outputCharacters` string |
| `mysteryBox` | `id`, `name`, `tokenCost` |
| `mysteryBoxCharacterOdds` | `mysteryBoxID`, `characterID`, `weight` — for weighted random selection |
| `perk` | `id`, `name`, `description`, `isBeingOffered`, `wasOffered` |
| `role` | `id`, `name`, `description` |
| `rolePerk` | join table: `roleID` + `perkID` |
| `playerPerk` | join table: `playerID` + `perkID` |
| `vote` | `voterID` (PK), `votedFirstPlayerID`, `votedSecondPlayerID`, `votedThirdPlayerID` |
| `trade` | `id`, `initiatingPlayerID`, `recipientPlayerID`, `offeredCharacters`, `requestedCharacters`, `status` |
| `quest` | `id`, `name`, `description`, `recurrence` (daily/weekly), `tokensReward`, `charactersReward` |
| `shownDailyQuest` | `dayID` FK, `questID` FK, `isHidden` bool |
| `shownWeeklyQuest` | `weekID` FK, `questID` FK |
| `day` | `id`, `timeStarted` — game-relative day boundary |
| `week` | `id`, `timeStarted` — game-relative week boundary |
| `activityLog` | `id`, `activityType` (13 types), polymorphic reference columns for involved entities |

### Static Data

Characters, perks, roles, recipes, mystery boxes, and quests are hardcoded in `database/static-data/*.ts`. On every boot, `database/static-data-synchronizers/` syncs the DB to match the TS definitions.

**Critical:** Static data rows use auto-increment integer IDs. The synchronizer matches existing rows by name/value. If you rename an entity in the TS file, the synchronizer inserts a new row and leaves the old one orphaned — any player data referencing the old ID silently breaks. Only rename static data entities if no live player data references them, or write a manual migration.

---

## Event System

`event-listeners/namesmith-events.ts` exports a `NamesmithEvents` singleton. Each event has:
- `addHandler(fn)` — register a persistent handler, returns a remove function
- `addOneTimeHandler(fn)` — fires once then self-removes
- `triggerEvent(payload)` — fires all handlers (alias: `runHandlers`)

| Event | Payload | Fired by |
|---|---|---|
| `ChangeName` | `{ playerID, oldName, newName }` | `PlayerService` |
| `PublishName` | `{ player }` | `PlayerService` |
| `DayStart` | `{}` | `GameStateService` cron |
| `WeekStart` | `{}` | `GameStateService` cron |
| `StartVoting` | `{}` | `GameStateService` cron |
| `EndVoting` | `{}` | `GameStateService` cron |
| `PickAPerk` | `{}` | `GameStateService` cron |

All handlers are registered in `event-listeners/setup-event-listeners.ts`. Individual handler files are in `event-listeners/on-*.ts`.

---

## Game Timing

`GameStateService` computes all event times from a single `startDate` stored in the DB:

- `timeVotingStarts = startDate + DAYS_TO_BUILD_NAME (7)`
- `timeVotingEnds = startDate + DAYS_TO_BUILD_NAME + DAYS_TO_VOTE (10)`
- `timesPickAPerkStarts` — offsets [3, 6] from each week boundary within the build phase
- `timesDayStarts` — one entry per day from start to vote start
- `timesWeekStarts` — one entry per 7-day block from start to vote start

`scheduleGameEvents()` stops any existing cron jobs and re-registers all of them. **Must be called on bot startup** (handled in `event-listeners/on-setup.ts`) to survive restarts mid-game.

Day and week records in the `day`/`week` tables are created by `DayService`/`WeekService` when each boundary fires — they are not pre-created at game start.

---

## Error Hierarchy

`utilities/error.utility.ts`:

```
NamesmithError
├── QueryUsageError           — bad SQL usage (MultiStatementQueryError, ForeignKeyConstraintError)
├── ResourceError
│   ├── ResourceNotFoundError — XxxNotFoundError per entity
│   └── ResourceAlreadyExistsError — XxxAlreadyExistsError per entity
├── UserActionError           — has userFriendlyMessage; caught by interface layer, shown to user
│   ├── NotAPlayerError (+ subclasses per action)
│   ├── RefillAlreadyClaimedError
│   ├── PlayerCantAffordMysteryBoxError
│   ├── MissingRequiredCharactersError
│   ├── MissingOfferedCharactersError, MissingRequestedCharactersError
│   ├── TradeAlreadyRespondedToError, TradeAwaitingDifferentPlayerError, etc.
│   ├── RecipeNotUnlockedError
│   └── InvalidNameError (NameTooLongError)
├── GameStateInitializationError — game not started / state not set
├── GameIsNotActiveError      — action outside active game window
├── VoteOutOfOrderError       — skipped a rank
├── NameVotedTwiceError       — same player in two ranks
├── PlayerAlreadyHasPerkError
└── QuestEligbilityNotImplementedError — new quest without eligibility check
```

Use `WorkflowResult` for expected user-facing failures. Reserve exceptions for programmer errors and invariant violations.

---

## Perk Application

Perks are applied inline at the point of effect using a conditional callback:

```ts
perkService.doIfPlayerHas(Perks.MINE_BONUS, playerMining, () => {
  tokensEarned += 1;
});
```

`Perks` is a string enum auto-generated from perk names in `database/static-data/perks.ts` via `toEnumFromObjects(perks, "name")`. If you rename a perk in static data, update all `Perks.OLD_NAME` references in workflow files — TypeScript will not catch this.

The `perk.isBeingOffered` and `perk.wasOffered` DB flags drive the perk-pick UI rotation. `isBeingOffered` is true during an active pick window; `wasOffered` tracks historical offering for rotation purposes.

---

## Quest Rotation

**Daily:** Each `DayStart` event, `QuestService` selects 2–3 random daily quests to show and 1–2 to hide. Uses `shownDailyQuest` table. Hidden quests are revealed only after all shown dailies are completed. Hidden quest token rewards are multiplied by 1.5.

**Weekly:** Each `WeekStart` event, 3–4 weekly quests are selected. Rotation ensures no quest repeats until all have been shown at least once (`wasShown` tracking on `shownWeeklyQuest`).

**Eligibility:** Every quest must have a corresponding check in `QuestService`. Adding a quest to static data without implementing the eligibility check throws `QuestEligbilityNotImplementedError` at runtime.

---

## Testing

- Jest, 50% workers (`npm run test`)
- Tests co-located with source as `*.test.ts`
- Use `MockDatabase` from `mocks/mock-database.ts` — in-memory SQLite, fully functional
- Use `Service.asMock()` to construct services without `global.namesmith`
- Test constants (player IDs, item IDs, etc.) in `constants/test.constants.ts`
- `mocks/all-mocks.ts` exports pre-built mock instances for common test setups

---

## Scaffolding

From the repo root:

```bash
npm run create-service   # Generates services/namesmith/services/xxx.service.ts
npm run create-repo      # Generates services/namesmith/repositories/xxx.repository.ts
```

After generation, manually register the new class in `types/namesmith.types.ts` under `NamesmithServiceClasses` or `NamesmithRepositoryClasses`. This is required for `getNamesmithServices()` and `createServicesFromDB()` to include the new class.
