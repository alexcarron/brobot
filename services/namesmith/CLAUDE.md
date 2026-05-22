# Namesmith — CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Namesmith is a Discord-hosted naming competition game. Players collect Unicode characters via tokens, craft and trade them to build a creative name, then the community votes on the best name. Winner earns 100 LL Points.

See `ARCHITECTURE.md` for deeper system explanations.

## Docs

- `docs/namesmith-rules-and-gameplay-mechanics.md` — Player-facing rules
- `docs/namesmith-style-guide.md` — UI tone, colors, Discord icon vocabulary
- `docs/namesmith-playstyles.md` — Player archetypes

---

## Architecture

```
Commands ──► Workflows ──► Services ──► Repositories ──► SQLite
../../commands/namesmith/  workflows/  services/       repositories/  database/
```

- **Repositories** — SQL only, one per table, no Discord logic.
- **Services** — Business logic over repositories. No Discord I/O.
- **Workflows** — Orchestrate services for a single user action. Return `WorkflowResult`, never throw for expected failures.
- **Commands** — Thin Discord handlers. Call one workflow, map result to a reply string.
- **Interfaces** — Discord UI (buttons/modals/messages) in `interfaces/`. Trading and voting bypass workflows and call services directly — errors surface as `UserActionError`.

All services are accessed via `getNamesmithServices()` (`services/get-namesmith-services.ts`), which reads from `global.namesmith`. Construct services with `Service.fromDB(db)`, never `new`.

---

## Game Loop

**Build phase (7 days):** Earn tokens → buy mystery boxes → get characters → craft / trade → publish name (≤32 chars).  
Token sources: `/mine-tokens` (unlimited, ~1.5 avg), `/claim-refill` (2h cooldown, ~75 avg), daily/weekly quests.

**Vote phase (3 days):** Community votes on published names. Ranked 3-vote system (1st=3pts, 2nd=2pts, 3rd=1pt). Results revealed worst→best, then archived.

**Perk windows:** New perks offered on game-days 3 and 6. Players pick 1 of 3 each window. `hasPickedPerk` flag resets at each window start.

---

## Domain Model

| Concept | Key facts |
|---|---|
| **Player** | Discord ID as PK. Has tokens, inventory (raw unicode string), currentName, publishedName, role (FK), perks (M:M), `hasPickedPerk` flag. |
| **Character** | Unicode code point as ID. Has rarity. Referenced by inventory strings, recipes, and mystery box odds. |
| **Inventory** | Concatenated unicode string on `player.inventory`. No delimiters. Characters may be multi-codepoint — always use helpers in `utilities/character.utility.ts`, never `string[i]`. |
| **Mystery Box** | Has token cost and weighted character odds. Opening awards 1 random character. |
| **Recipe** | Maps an `inputCharacters` string → `outputCharacters` string. Input may include utility characters (↻ rotate, ⇋ flip, ✂ split, etc.). |
| **Trade** | Two-party character exchange. Statuses: `awaitingRecipient` → `awaitingInitiator` (if modified) → `accepted` \| `declined` \| `ignored`. |
| **Quest** | Daily or weekly challenge. 2–3 shown daily; 1–2 hidden (revealed only after all shown dailies complete, reward ×1.5). Weekly quests don't repeat until full rotation shown. |
| **Role** | Chosen once at game start, permanent. Grants 2 fixed perks. 3 roles total (static data). |
| **Perk** | Permanent effect. Applied inline in workflows via `perkService.doIfPlayerHas(Perks.NAME, player, () => {...})`. Static data, referenced by name enum. |
| **Vote** | One row per voter. Stores up to 3 ranked player IDs. Must be filled in order; same player cannot appear in two ranks. |
| **Activity Log** | Append-only audit trail. 13 activity types. Never mutate existing rows. |
| **Day / Week** | Game-relative boundaries (not wall-clock), tracked in DB. Used for quest rotation and perk windows. |

---

## Key Conventions

**WorkflowResult pattern** — Workflows never throw for expected failures. Define schema with `getWorkflowResultCreator` (`workflows/workflow-result-creator.ts`), return typed `result.failure.xxx()` or `result.success({...})`. Check with `result.isXxx()` at the call site. See `ARCHITECTURE.md` for a full example.

**Resolvable types** — Every entity has a `*Resolvable` union (ID string/number, `{id: ...}`, or the full object). Services accept resolvables and resolve internally. Never pass raw IDs deeper than the service layer.

**Static data** — Characters, perks, roles, recipes, mystery boxes are defined in `database/static-data/*.ts` and synced to the DB on every boot. **Never add static data via SQL.** Modify the TS source files instead.

**`fromDB` / `asMock`** — Every service and repository has `static fromDB(db)` (production) and `static asMock()` (test, uses in-memory DB). Never call `new` directly.

---

## Critical Invariants

1. **Inventory strings are raw unicode** — use `character.utility.ts` helpers, not `str[i]` or `.length`.
2. **Static data uses auto-increment IDs** — renaming a perk/role/etc. in the TS source inserts a *new* row on next boot, orphaning the old one and silently breaking any player who had it. Update the `name` field only if no players currently hold that entity, or write a migration.
3. **`Perks` enum is dynamically built** from perk names in `database/static-data/perks.ts`. If you rename a perk, `Perks.OLD_NAME` references in workflow code break at runtime — TypeScript won't catch it.
4. **Quest eligibility must be implemented** for every new quest or it throws `QuestEligbilityNotImplementedError` at runtime. Don't add a quest to static data without wiring its check.
5. **Voting is strictly ordered** — cannot cast 2nd-place vote without 1st filled (`VoteOutOfOrderError`). Cannot vote same player twice (`NameVotedTwiceError`).
6. **`activityLog` is append-only** — never update or delete rows.
7. **Player role is permanent** — set once, never change.
8. **Bot restart mid-game** — `scheduleGameEvents()` on `GameStateService` must be called again on bot startup to re-register cron jobs. This is handled in `event-listeners/on-setup.ts`.
9. **Max name length is 32 chars** — enforced by `NameTooLongError`.
10. **`hasPickedPerk` resets each perk window** — `on-pick-a-perk.ts` is responsible for resetting it; forgetting leaves players unable to pick in future windows.

---

## Directory Navigation

```
services/namesmith/
├── constants/          All game constants — check here before hardcoding any values
├── database/
│   ├── queries/schema.sql          Authoritative DB schema
│   ├── static-data/                Source of truth for characters, perks, roles, recipes, boxes, quests
│   ├── static-data-synchronizers/  Boot-time DB sync logic
│   └── backups/                    Auto-generated .db backup files (gitignored effectively)
├── repositories/       One file per DB table
├── services/           One file per domain entity
├── workflows/          One file per user-facing action
├── interfaces/         Discord UI components, organized by feature (trading/, voting/, quests/, results/)
├── event-listeners/    NamesmithEvents singleton + per-event handler files + setup-event-listeners.ts
├── types/              *.types.ts per entity + namesmith.types.ts (central class registry)
├── utilities/          character.utility.ts, error.utility.ts, db.utility.ts, etc.
└── mocks/              MockDatabase for tests
```

Commands live in `../../commands/namesmith/` (outside this directory).

---

## Common Tasks

**Add a workflow:**
1. Create `workflows/my-action.workflow.ts`
2. Define result with `getWorkflowResultCreator` + `provides<...>()`
3. Call `getNamesmithServices()`, validate player/state, mutate, log to `activityLogService`
4. Create `../../commands/namesmith/my-action.ts` — call workflow, map each result case to a reply

**Add a perk:**
1. Add entry to `database/static-data/perks.ts`
2. Apply its effect in the relevant workflow with `perkService.doIfPlayerHas(Perks.MY_PERK, player, () => {...})`
3. `Perks` enum auto-updates from the static data on next boot

**Add a quest:**
1. Add entry to `database/static-data/quests.ts` (set `recurrence`, `tokensReward`, `charactersReward`)
2. Implement eligibility check in `QuestService` — required or it throws at runtime

**Add a service or repository:**
Run `npm run create-service` / `npm run create-repo` from the repo root for scaffolding, then register the new class in `types/namesmith.types.ts` (`NamesmithServiceClasses` / `NamesmithRepositoryClasses`).

**Add an event handler:**
Register in `event-listeners/setup-event-listeners.ts`. Use `NamesmithEvents.EventName.addHandler(async (payload) => {...})`.

**Add a Discord command:**
Create `../../commands/namesmith/my-command.ts`. Use `required_servers`, `required_channels` for access control. Run `npm run dev:deploy` to register with Discord.

--

## Planning Workflow

The `planning/` directory is the source of truth for feature planning, design decisions, implementation strategy, and active work tracking.

Purpose:
- preserve important reasoning outside conversation history
- reduce context-window bloat
- avoid repeatedly rediscovering decisions
- keep implementation work focused and scoped

### Directory Structure

planning/
  active/      -> active feature work and ongoing design
  completed/   -> finalized/implemented feature plans
  archive/     -> abandoned or outdated ideas

### Planning File Rules

Each major feature or epic should have its own planning file.

Example:
- planning/active/mining-rework.md
- planning/active/reminder-system.md

Planning files may contain:
- problem statements
- goals
- UX reasoning
- gameplay analysis
- architecture decisions
- implementation plans
- edge cases
- unresolved questions
- testing requirements

### Workflow Expectations

Before implementing a major feature:
1. Read the relevant planning file
2. Investigate the existing implementation
3. Propose improvements or implementation plans
4. Update the planning document with important decisions
5. Only then begin implementation

After implementation:
- update the planning file with final decisions
- move completed plans into planning/completed/

### Context Usage

When working on a feature:
- read only the relevant planning file(s)
- avoid loading unrelated planning documents
- keep context focused on the active task

---

## UI Style

- Colors: `#5500ff` purple (player names/highlights), `#ffffff` white (text), `#202024` dark gray (hidden players)
- Voice: second-person present tense ("you"), no metaphors, plain verbs, concise
- Encouragement is minimal and understated ("Well done.", "Good job.")
- Loot box openings convey suspense through visuals only ("Opening mystery box...")
- Full icon vocabulary in `docs/namesmith-style-guide.md`
