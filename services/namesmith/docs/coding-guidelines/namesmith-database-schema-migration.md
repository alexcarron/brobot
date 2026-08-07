# Namesmith Database Schema Migration

## Explanation

Namesmith stores its data in a single SQLite file (`database/db/namesmith.db`) accessed through the repository layer.

The schema lives in `database/queries/schema.sql` and is applied on every boot by `applySchemaToDB`, which runs the file as-is. Every statement in it uses `CREATE TABLE IF NOT EXISTS`, so applying the schema to a database that already has the old tables does nothing. It will create brand new tables, but it will not alter or drop a column on an existing one.

The supported way to change the schema is to wipe the database file and let the next boot recreate it from the updated `schema.sql` plus the static data sync. This is safe because Namesmith games are self-contained. Each game is set up fresh by `startGame` (`event-listeners/on-game-start.ts`), which repopulates every player and all game state from scratch. Wiping the database only discards an in-progress game, and no permanent record is lost, because there is nothing that must survive across games.

## The Reset Workflow

1. Edit `database/queries/schema.sql` to the new schema. Add, remove, or change tables and columns as needed.

2. Update any static data source files under `database/static-data/` that the change affects. Never insert static data with raw SQL. It is synced from those TypeScript files on every boot.

3. Run `npm run reset-namesmith-db`. This deletes `namesmith.db` along with its `-wal` and `-shm` write-ahead-log sidecars via `database/reset-database.ts`.

4. Start the bot as usual (`npm run dev`, or `npm start` in production). `setupDatabase` recreates the file, applies the updated schema, and re-inserts the static data.

5. Update the test mocks and fixtures so they match the new schema. The in-memory mock database (`mocks/mock-database.ts`) rebuilds from `schema.sql` on each test run, so it needs no structural change, but `mocks/mock-data/` and any tests that assert on the changed schema do.