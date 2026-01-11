# Namesmith Project File Structure
# `namesmith/`
Contains the core game logic for Namesmith, including setup, Discord integration, workflows, services, and database interaction.
## `constants/`
Contains all reusable static values referenced throughout the Namesmith codebase.
- Holds numeric limits, display characters, token values, and other fixed game parameters.
- Should only include immutable values, not functions or state.
## `database/`
Handles all aspects of the SQLite database, including schema setup, queries, static data population, and backup.
- Defines and managing the database schema
- Runs SQL queries
- Loads static data into the database
- Manages local backups of the database
### `backups/`
Stores timestamped SQLite database backups.
### `db/`
Contains the actual SQLite database files used during development or production.
### `queries/`
Contains SQL schema definitions and JavaScript helpers for executing those queries.
### `static-data/`
Contains `.ts` files defining static game data (e.g., characters, mystery boxes) as constants
### `static-data-synchronizers/`
Contains files for keeping the static database data in sync with the canonical definitions without breaking foreign keys.
* Delete entities not defined in the canonical list, handling cascading deletes if needed.
* Identify entities that already exist in the database and ones that do not
* Update existing entities if their definition changed (without deleting them).
* Add new static entities that are missing.
## `docs/`
Contains markdown documentation files that explain how the project works, how to use it, and any conventions or guidelines
## `event-listeners/`
Contains handlers for Discord and system events, such as bot startup, user interactions, or server joins.
- Reacts to Discord events
- Binds specific logic to lifecycle or user-triggered events
## `interfaces/`
Contains all Discord-facing components, menus, buttons, and other interface elements that players use to interact with Namesmith outside of direct commands.
- Defines reusable UI elements
- Encapsulates the presentation and interaction logic for a specific user action or workflow
## `mocks/`
Contains all mock implementations and helpers used for testing Namesmith
- Provides in-memory databases, mock repositories, and mock services for unit and integration tests
- Includes utilities to create a full mock environment for testing or simulations
- Isolated from production code to avoid accidental imports
## `repositories/`
Contains classes that abstract all direct database access. Each repository manages a specific entity type.
- Encapsulates SQL queries and data fetching
- Provides an interface to query or mutate the database
- Avoids all Discord-related logic
- Only used by service classes
## `scripts/`
Contains scripts executed by develops to more easily create files for the codebase like adding a new service to the system
## `services/`
Contains service classes that handle business logic and coordinate between repositories and external systems like Discord.
- Provides reusable methods for manipulating and validating entities
- Acts as the main interface for workflows to interact with game logic
- Manages communication with Discord where appropriate
- May access repositories and Discord
- Should not perform high-level flow orchestration (that’s the responsibility of workflows)
## `types/`
Contains shared TypeScript type definitions used throughout the codebase.
- Defines consistent types and interfaces for core entities
- All type definitions should live here to avoid duplication
- Types may be grouped by domain or functionality as needed
## `utilities/`
Contains reusable, stateless utility functions
- Contains pure functions related to formatting, error handling, logging, validation, etc.
- Contains utility functions for interacting with external systems like Discord (e.g., fetching entities)
- Utilities must not maintain state
## `workflows/`
Contains high-level functions that define full user or system operations (e.g., opening a mystery box).
- Orchestrates complete actions using service methods
- Performs validation, calling appropriate services, and returning results or error messages
- Acts as the main layer between Discord commands and the game logic
- Should not contain low-level business logic