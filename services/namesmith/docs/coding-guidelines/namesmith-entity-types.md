# Namesmith Entity Value Types

Every entity in Namesmith (`Player`, `Perk`, `Quest`, `Role`, `Character`, `Recipe`, `MysteryBox`, etc.) has several different types in the code. Each one exists for a specific reason. Do not mix them up, ignore one if needed, or name a variable as if it were one type when it's actually another. This file defines each type, why it exists, and what a variable holding it should be called.

## `[Entity]` 

The fully resolved domain object.

Any foreign key or relation on it is expanded into the full nested entity, not left as an ID. Some entities also restructure raw rows into a friendlier shape, not just expand relations.

### Examples
- `Player.role` is a full `Role`, not a role ID.
- `Role.perks` is `Perk[]`, not a list of perk IDs.
- `ShownDailyQuest.day` is a full `Day`, not a day ID.
- `MysteryBox.characterOdds` restructures the raw `mysteryBoxID`/`characterID`/`weight` rows into a `CharacterOdds` map (`{ [characterValue: string]: number }`), so code can read `characterOdds["A"]` directly instead of scanning rows.

### Why it exists 

This is the type most of the code actually wants to work with. Once you have a resolved `Player`, you can read `player.role.name` directly instead of doing a second lookup. Same idea for `characterOdds`: reading the odds for a character shouldn't require re-deriving a lookup structure every time.

### Variable naming 

Name it after the entity itself. For example, `player`, `pickedPerk`, `quest`. Never add a qualifier like `Details` or `Full`. An entity name by itself already means the full resolved object.

### Other Information

If an entity has no relations to expand and nothing to restructure (`Character`, `Recipe`), its `[Entity]` type is identical to its `Minimal[Entity]` type (e.g. `type Character = MinimalCharacter`) since there's nothing to expand.

## `Minimal[Entity]`

The same flat fields as the raw database row for that table, with DB-level value conversions already applied (e.g. `0`/`1` to `false`/`true` via `DBBoolean`, date strings to `Date`), but no relation expansion and no restructuring.

### Examples
- `MinimalPlayer.role` is a raw role ID (`number | null`), not a `Role`.
- `MinimalRole` has no `perks` field at all.
- `MinimalMysteryBox` has no `characterOdds` field. That's assembled separately onto `MysteryBox`.

### Why it exists

It's the direct output of a repository's `SELECT` (via `DBXType.from`/`asMinimalX`), before a service assembles relations or restructures anything onto it. Repositories work in this shape because they only know their own table.

### Variable naming

Name it with a `minimal` prefix. For example, `minimalPlayer`, `minimalRole`. Never call it just `player` or `role`, that implies the full object.

## `[Entity]Definition`

The shape used to define an entity for creation, not to represent one that already exists.

Used in three places: static data source files (`database/static-data/*.ts`), mock helper functions (`mocks/mock-data/*.ts`), and the baseline RAGU repository/service `Add` methods (see `namesmith-repository-ragu-methods.md`).

### Examples
- `PerkDefintion` makes `id`, `wasOffered`, and `isBeingOffered` optional since those are assigned or tracked by the system, not chosen by whoever is defining the perk.
- `PlayerDefinition` uses `RoleResolvable` and `PerkResolvable[]` for `role`/`perks` instead of full `Role`/`Perk[]`, so a mock or static-data entry can just name a role or perk instead of constructing it.

### Why it exists

Writing a new perk, quest, or mock player shouldn't require constructing every nested object and every generated field just to declare "here's a new one." A definition keeps only what's actually needed to define the entity.

### Variable naming

Name it with a `Definition` suffix. For example, `perkDefinition`, `newQuestDefinition`. Never call it just `perk` or `quest`.

## `[Entity]ID`

The identifier of the entity.

`Entity["id"]`

### Why it exists

Lots of code only needs to reference which entity without resolving it. Foreign key columns, lookups, and comparisons all work off the ID alone.

### Variable naming

Name it with an `ID` suffix. For example, `perkID`, `playerID`. `ID` stays all-caps, never `Id`.

## `[Entity]Name`

The unique name of the entity.

`Entity["name"]`, or the entity's equivalent (e.g. `CharacterValue` for `Character.value`).

### Why it exists

Some lookups and comparisons can be done by a unique name rather than ID. For example, `Perks.MY_PERK` enum values, or quest lookups by name.

### Variable naming

Name it with a `Name` suffix. For example, `perkName`, `questName`.

## `[Entity]Resolvable`

A union of everything that can be resolved to the full entity.

`ID | Name | {id: ID}`

### Why it exists

This is the input type for `resolveX(resolvable)` methods. It's used across service method parameters so a caller can pass whatever it already has. For example, an ID read from the DB, a name from static data, or the full object it just loaded. The service doesn't need to dictate one specific input shape.

### Variable naming

Name it with a `Resolvable` suffix when other types of the entity appear or its more readable to make it clear this is a resolvable. However, you can name it after only the entity itself in situations where it does not cause confusion like in the parameters for workflows or service methods. 
