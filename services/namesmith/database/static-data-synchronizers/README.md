# Static Data Synchronizers

These functions keeps static database data in sync with the canonical definitions without breaking foreign keys.

**What it does:**

* Delete entities not defined in the canonical list, handling cascading deletes if needed.
* Identify entities that already exist in the database and ones that do not
* Update existing entities if their definition changed (without deleting them).
* Add new static entities that are missing.