# Namesmith Repository RAGU Methods

Every repository that accesses static-data table (perks, roles, quests, tips, characters, mystery boxes, recipes) shoud have the same four baseline methods for managing its own table's rows. These are RAGU methods: Remove, Add, Get, Update.

The static-data synchronizers in `database/static-data-synchronizers/` use these methods to sync the database against the definition list on every boot.

## The Four Baseline Methods

Using an entity named `Entity` with an identity value (an auto-increment `id`, a unique `name`, or a natural key like a tip's `key`).

**`addEntity(definition: EntityDefinition): Entity`**

Inserts a new row and returns the created domain object. Throws `EntityAlreadyExistsError` when a row with that identity already exists. Implement it by checking `doesEntityExist(...)` first, then `db.insertIntoTable('tableName', {...})`, then returning `getEntity(...)` so the caller always gets the full object back.

**`getEntity(identity): Entity`**

Retrieves a single row by its identity and returns the domain object. Throws `EntityNotFoundError` when no row matches. Implement it with `db.getRow('SELECT * FROM tableName WHERE ...')`, throw when the row is `undefined`, and pass the row through the type's `asEntity` runtime parser before returning. Repositories whose entity has sub-entities keep a `getEntityOrThrow` plus a nullable `getEntityByID` variant, but the throwing getter is the baseline.

**`updateEntity(definition: EntityDefinition): Entity`**

Updates an existing row's mutable fields and returns the updated domain object. Throws `EntityNotFoundError` when the row does not exist. Implement it by checking `doesRntityExist(...)`, then `db.updateInTable('tableName', { fieldsUpdating: {...}, identifiers: {...} })`, then returning `getEntity(...)`.

**`removeEntity(identity): void`**

Deletes the row for the given identity. Throws `EntityNotFoundError` when nothing was deleted. Implement it with `db.deleteFromTable('tableName', {...})` and throw when `result.changes === 0`.

## Supporting Methods

**`getEntities(): Entity[]`** returns every row using `db.getRows('SELECT * FROM tableName')` passed through `asEntities`.

**`doesEntityExist(identity): boolean`** wraps `db.doesExistInTable('tableName', {...})` and is the guard used by `addEntity`, `updateEntity`, and `removeEntity`.

Repositories that accept resolvables also have `resolveEntity(resolvable): Entity` and a `resolveID` or `resolveKey` that turn an id, a name or key, or a full object into a fetched entity or its identity.

## Reference Implementations

- `repositories/perk.repository.ts` and `repositories/role.repository.ts` for the auto-increment id plus unique name style.
- `repositories/tip.repository.ts` for the natural-key style.
