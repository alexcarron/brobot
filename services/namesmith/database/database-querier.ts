import DatabasePkg, { Database, PragmaOptions, RunResult, Statement, Transaction } from "better-sqlite3";
import { ForeignKeyConstraintError, MultiStatementQueryError, QueryUsageError } from "../utilities/error.utility";
import { AnyFunction } from "../../../utilities/types/generic-types";
import { attempt } from '../../../utilities/error-utils';
import { isArray, isDefined, isObject } from "../../../utilities/types/type-guards";

/**
 * A union type representing a set of possible values that can be used as the rest parameter of a DatabaseQuerier query function.
 */
type RestSQLParams =
	| unknown[]
	| [unknown[]]
	| [object]

/**
 * The possible types for the `params` argument of a SQLite query function.
 */
type SQLParams =
  | undefined
	| unknown[]
	| object

/**
 * Converts the rest parameter of a DatabaseQuerier query function into a format that can be used as the `params` argument of a SQLite query function.
 * @param restSQLParams - The rest parameter of a DatabaseQuerier query function.
 * @returns The converted `params` argument of a SQLite query function.
 */
function toSQLParams(restSQLParams: RestSQLParams): SQLParams {
	if (restSQLParams.length === 0) return undefined;
	if (isArray(restSQLParams[0])) return restSQLParams[0];
	if (isObject(restSQLParams[0])) return restSQLParams[0];
	return restSQLParams;
}

/**
 * Converts an array of values into a parenthesized list of SQLite placeholders (`?`) for use in parameterized queries.
 * Useful when you want to safely query for multiple values using `IN (...)` without manually constructing the placeholders string.
 * @param array - The array of values to convert into a placeholder list.
 * @returns A string like "(?, ?, ?)" suitable for use in a parameterized query.
 * @example
 * const playerIDs = [1, 2, 3];
 * const players = db.all(
 *   `SELECT * FROM players WHERE id IN ${toPlaceholders(playerIDs)}`,
 *   ...playerIDs
 * );
 */
export function toPlaceholdersList(array: unknown[]): string {
	return '(' + array.map( () => '?' ).join(', ') + ')';
}

/**
 * Converts a record of column/field names of a database entity to the updated values for that entity into a string of assignment expressions suitable for use in a parameterized update query.
 * @param fieldToUpdatedValue - A record of column/field names of a database entity to the updated values for that entity.
 * @returns A string like "age = @age, tokens = @tokens" suitable for use in a parameterized update query.
 * @example
 * const playerToUpdate = { name: "John Doe", age: 21 };
 * const updatedPlayer = db.run(
 *   `UPDATE players SET ${toAssignmentsPlaceholder(playerToUpdate)}`,
 *   playerToUpdate
 * );
 */
export function toParameterSetClause(
	fieldToUpdatedValue: Record<string, unknown>
): string {
	return Object.entries(fieldToUpdatedValue)
		.filter(([, value]) => value !== undefined)
		.map(([key]) => `${key} = @${key}`)
		.join(", ");
}

/**
 * Converts an object of column/field names of a database entity to their expected values into a string of equality conditions suitable for use in a parameterized WHERE clause.
 * @param fieldToValue - An object of column/field names of a database entity to their expected values.
 * @returns A string like "age = @age AND tokens = @tokens" suitable for use in a parameterized WHERE clause.
 * @example
 * const playerConditions = { name: "John Doe", age: 21 };
 * const players = db.all(
 *   `SELECT * FROM players WHERE ${toEqualityConditionsPlaceholder(playerConditions)}`,
 *   playerConditions
 * );
 */
export function toParameterANDWhereClause(
	fieldToValue: Record<string, unknown>
): string {
	return Object.entries(fieldToValue)
		.filter(([, value]) => value !== undefined)
		.map(([key]) => `${key} = @${key}`)
		.join(" AND ");
}

/**
 * Converts an object of column/field names of a database entity to their expected values into a string of equality conditions suitable for use in a parameterized WHERE clause.
 * @param fieldToValue - An object of column/field names of a database entity to their expected values.
 * @returns A string like "age = @age OR tokens = @tokens" suitable for use in a parameterized WHERE clause.
 * @example
 * const playerConditions = { name: "John Doe", age: 21 };
 * const players = db.all(
 *   `SELECT * FROM players WHERE ${toParameterizedORWhereClause(playerConditions)}`,
 *   playerConditions
 * );
 */
export function toParameterORWhereClause(fieldToValue: Record<string, unknown>): string {
	return Object.entries(fieldToValue)
		.filter(([, value]) => value !== undefined)
		.map(([key]) => `${key} = @${key}`)
		.join(" OR ");
}

/**
 * Converts an object of column/field names of a database entity to their expected values into a parameterized UPDATE clause string.
 * @param parameters - An object containing the following parameters:
 * @param parameters.updatingFields - An object of column/field names of a database entity to their expected updated values.
 * @param parameters.identifiers - An object of column/field names of a database entity to their expected values to use as identifiers in the WHERE clause.
 * @returns A string like "SET name = @name, age = @age WHERE id = @id" suitable for use in a parameterized UPDATE query.
 * @example
 * const id = 1;
 * const name = "John Doe";
 * const age = 21;
 * const birthDate = new Date();
 * const updatedPlayer = db.run(
 *   `UPDATE players ${toParameterizedUpdateClause({
 *     	updatingFields: { name, age, birthDate },
 *     	identifiers: { id, name },
 *   })}`,
 *   { ...playerToUpdate, ...playerIdentifiers }
 * );
 */
export function toParameterUpdateClause(
	{updatingFields, identifiers}: {
		updatingFields: Record<string, unknown>;
		identifiers: Record<string, unknown>;
	}
): string {
	return `SET ${toParameterSetClause(updatingFields)} WHERE ${toParameterORWhereClause(identifiers)}`
}

/**
 * Converts an object of column/field names of a database entity to their expected values into a parameterized INSERT clause string.
 * @param fieldToValue An object of column/field names of a database entity to their expected values.
 * @returns A string like "(column1, column2) VALUES (@column1, @column2)" suitable for use in a parameterized INSERT query.
 * @example
 * const playerToInsert = { name: "John Doe", age: 21 };
 * const insertedPlayer = db.run(
 *   `INSERT INTO players (${toParameterizedInsertClause(playerToInsert)})`,
 *   playerToInsert
 * );
 */
export function toParameterInsertClause(
	fieldToValue: Record<string, unknown>,
): string {
	const columnNames =
		Object.keys(fieldToValue)
			.filter(isDefined)
			.join(", ");

	const parameters =
		Object.keys(fieldToValue)
			.filter(isDefined)
			.map(key => `@${key}`)
			.join(", ");

	return `(${columnNames}) VALUES (${parameters})`;
}

/**
 * A utility class for preparing and executing SQL queries using a better-sqlite3 database instance.
 * Provides methods for running single queries, retrieving results, and performing transactions.
 */
export class DatabaseQuerier {
	db: Database;

	/**
	 * If no parameters given, creates a new in-memory database instance.
	 * If options is provided, creates a new database instance based on the provided options.
	 * @param options - An object with optional parameters for the database instance.
	 * @param options.inMemory - A boolean indicating whether to use an in-memory database.
	 * @param options.path - The path to the database file for a disk-backed database.
	 */
  constructor(options?: {
		inMemory?: boolean;
		path?: string;
	} | Database) {
		if (options instanceof DatabasePkg) {
			this.db = options;
			return;
		}

    if (options?.inMemory) {
      this.db = new DatabasePkg(":memory:");
      // PRAGMA optimizations for in-memory testing
      this.db.pragma("synchronous = OFF");
      this.db.pragma("journal_mode = MEMORY");
      this.db.pragma("temp_store = MEMORY");
    } else {
      if (!options?.path) throw new Error("Database path must be provided for disk-backed DB");
      this.db = new DatabasePkg(options.path);
    }
  }

	/**
	 * Handles errors that occur while running a query.
	 * @param error - The error that occurred
	 * @param sqlQuery - The SQL query that was run
	 * @param params - The parameters that were passed to the query, if any
	 * @throws If the error is not a multi-statement query error or a foreign key constraint error
	 */
	private handleError(error: unknown, sqlQuery: string, params?: object | unknown[]): void {
		if (
			error === null ||
			typeof error !== "object" ||
			("message" in error) === false ||
			typeof error.message !== "string"
		) {
			throw error;
		}

		if (error.message.includes(
			"The supplied SQL string contains more than one statement"
		)) {
			throw new MultiStatementQueryError(sqlQuery, params);
		}
		else if (error.message.includes("FOREIGN KEY constraint failed")) {
			throw new ForeignKeyConstraintError(sqlQuery, params);
		}

		throw new QueryUsageError(error.message, sqlQuery, params);
	}

  /**
   * Prepare a SQL query and return a wrapper object with helpful methods:
   * - `run(params)`: Execute the query with the given parameters and return the result of `Database.RunResult`.
   * - `getRow(params)`: Execute the query with the given parameters and return a single row of the result set.
   * - `getRows(params)`: Execute the query with the given parameters and return all rows of the result set.
   * - `getIterator(params)`: Execute the query with the given parameters and return an iterator over the result set.
   * - `getFirstColumnValues()`: Execute the query with no parameters and return an Array of the first column of all rows of the result set.
   * @param sqlQuery - SQL query to prepare
   * @returns Wrapper object with the above methods
   */
  getQuery(sqlQuery: string) {
    const queryStatement =
			attempt(() => this.db.prepare(sqlQuery))
				.onError((error) => {
					this.handleError(error, sqlQuery)
					throw error;
				})
				.getReturnValue();

		const executeMethod = <ReturnType>(
			method: (...args: unknown[]) => ReturnType,
			queryStatement: Statement,
			params: unknown[]
		) => {
			try {
				if (params.length === 0)
					return method.call(queryStatement);
				return method.apply(queryStatement, params);
			}
			catch (error) {
				this.handleError(error, sqlQuery, params);
				throw error;
			}
		}

    return {
      run: (...params: unknown[]): RunResult => {
				return executeMethod(
					queryStatement.run,
					queryStatement,
					params
				);
			},
			getValue: (...params: unknown[]): unknown => {
				const row = executeMethod(
					queryStatement.get,
					queryStatement,
					params
				);

				if (isArray(row))
					return row[0];
				else if (isObject(row) && Object.keys(row).length !== 0) {
					return Object.values(row)[0];
				}
				else {
					return undefined;
				}
			},
      getRow: (...params: unknown[]): unknown => {
				return executeMethod(
					queryStatement.get,
					queryStatement,
					params
				);
			},
      getRows: (...params: unknown[]): unknown[] => {
				return executeMethod(
					queryStatement.all,
					queryStatement,
					params
				);
			},
      getIterator: (...params: unknown[]): IterableIterator<unknown> => {
				return executeMethod(
					queryStatement.iterate,
					queryStatement,
					params
				);
			},
      getFirstColumnValues: (...params: unknown[]): unknown[] => {
        queryStatement.pluck();
				return executeMethod(
					queryStatement.all,
					queryStatement,
					params
				);
      }
    };
  }

  /**
   * Runs a single write query
   * - changes: The total number of rows that were inserted, updated, or deleted by this operation
   * - lastInsertRowid: The rowid of the last row inserted into the database
   * @param sqlQuery - The SQL query to run
   * @param restParams - The parameters to pass to the query
   * @returns The result of the query
   */
  run(
		sqlQuery: string,
		...restParams: RestSQLParams
	): RunResult {
		const params = toSQLParams(restParams);

		try {
			const queryStatement = this.getQuery(sqlQuery);

			if (params === undefined)
				return queryStatement.run();

			return queryStatement.run(params);
		}
		catch (error) {
			if (!(error instanceof MultiStatementQueryError))
				throw error;

			if (params !== undefined)
				throw error;

			this.db.exec(sqlQuery);
			return {
				changes: -1,
				lastInsertRowid: -1
			}
		}
  }

	/**
	 * Runs a single read query and returns the first value of the first row of the result set
	 * @param sqlQuery - The SQL query to run
	 * @param restParams - The parameters to pass to the query
	 * @returns The first value of the first row of the result set
	 * @throws {QueryUsageError} If the query does not return a row
	 */
	getValue(
		sqlQuery: string,
		...restParams: RestSQLParams
	): unknown {
		const params = toSQLParams(restParams);
		const queryStatement = this.getQuery(sqlQuery);
		let row;

		if (params === undefined) {
			row = queryStatement.getRow()
		}
		else {
			row = queryStatement.getRow(params)
		}

		if (isArray(row))
			return row[0];
		else if (isObject(row) && Object.keys(row).length !== 0) {
			return Object.values(row)[0];
		}
		else {
			return undefined;
		}
	}

  /**
   * Runs a single read query and returns a single row
   * @param sqlQuery - The SQL query to run
   * @param restParams - The parameters to pass to the query
   * @returns The first row of the result set or undefined if no row is found
   */
  getRow(
		sqlQuery: string,
		...restParams: RestSQLParams
	): unknown | undefined {
		const params = toSQLParams(restParams);

    const queryStatement = this.getQuery(sqlQuery);

		if (params === undefined)
			return queryStatement.getRow();

    return queryStatement.getRow(params);
  }

  /**
   * Runs a single read query and returns all rows of the result set
   * @param sqlQuery - The SQL query to run
   * @param restParams - The parameters to pass to the query
   * @returns An Array of all rows of the result set
   */
  getRows(
		sqlQuery: string,
		...restParams: RestSQLParams
	): unknown[] {
		const params = toSQLParams(restParams);
    const queryStatement = this.getQuery(sqlQuery);

		if (params === undefined)
			return queryStatement.getRows();

    return queryStatement.getRows(params);
  }

  /**
   * Runs a single read query and returns an iterator over the result set
   * @param sqlQuery - The SQL query to run
   * @param restParams - The parameters to pass to the query
   * @returns An iterator over all rows of the result set
   */
  getIterator(
		sqlQuery: string,
		...restParams: RestSQLParams
	): Iterator<unknown> {
		const params = toSQLParams(restParams);
    const queryStatement = this.getQuery(sqlQuery);

		if (params === undefined)
			return queryStatement.getIterator();

    return queryStatement.getIterator(params);
  }

  /**
   * Creates a transaction of multiple queries and returns a function that starts the transaction when called
   * @param  multiQueryFunction - A function that takes no arguments and runs a series of queries
   * @returns A function that starts the transaction when called
   */
  getTransaction(multiQueryFunction: AnyFunction): Transaction<AnyFunction> {
    const transactionFunction = this.db.transaction(multiQueryFunction);
    return transactionFunction;
  }

  /**
   * Runs a transaction of multiple queries and returns the result of the transaction
   * @param multiQueryFunction - A function that takes no arguments and runs a series of queries
   * @param params - Parameters to pass to the transaction function
   * @returns The result of the transaction
   */
  runTransaction(
		multiQueryFunction: AnyFunction,
		...params: unknown[]
	): unknown {
    const transactionFunction = this.getTransaction(multiQueryFunction);
    return transactionFunction(...params);
  }


	/**
	 * Calls the underlying database's exec function with the given arguments
	 * @see https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#dbexec
	 * @param source - The SQL query to execute
	 * @returns e result of the query
	 */
	exec(source: string): Database {
		return this.db.exec(source);
	}

	/**
	 * Calls the underlying database's transaction function with the given arguments
	 * @see https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#dbtransaction
	 * @param transactionFunction - A function that takes no arguments and runs a series of queries
	 * @returns The result of the transaction
	 */
	transaction(transactionFunction: AnyFunction): Transaction<AnyFunction> {
		return this.db.transaction(transactionFunction);
	}

	/**
	 * Calls the underlying database's prepare function with the given arguments
	 * @see https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#dbprepare
	 * @param source - The SQL query to prepare
	 * @returns The prepared statement
	 */
	prepare(source: string): Statement {
		return this.db.prepare(source);
	}

	/**
	 * Calls the underlying database's PRAGMA function with the given arguments
	 * @see https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#dbpragma
	 * @param source - The PRAGMA command to run
	 * @param options - Optional parameters to pass to the PRAGMA command
	 * @returns The result of the PRAGMA command
	 */
	pragma(source: string, options?: PragmaOptions): unknown {
		return this.db.pragma(source, options);
	}

	/**
	 * Closes the database connection.
	 * @returns The database object after closing the connection
	 */
	close(): Database {
		return this.db.close();
	}

	/**
	 * Inserts a new row into a table in the database
	 * @param tableName - The name of the table to insert into
	 * @param insertedFieldToValue - An object of column/field names to the values to insert
	 * @returns The id of the inserted row
	 */
	insertIntoTable(
		tableName: string,
		insertedFieldToValue: Record<string, unknown>
	): number {
		const runResult = this.run(
			`INSERT INTO ${tableName} ${toParameterInsertClause(insertedFieldToValue)}`,
			insertedFieldToValue
		);

		return Number(runResult.lastInsertRowid);
	}

	/**
	 * Updates a row in a table in the database
	 * @param tableName - The name of the table to update
	 * @param parameters - An object containing the following parameters:
	 * @param parameters.fieldsUpdating - An object of column/field names to the updated values
	 * @param parameters.identifiers - An object of column/field names to the values to use as identifiers in the WHERE clause
	 * @returns The result of the update query
	 */
	updateInTable(
		tableName: string,
		{fieldsUpdating, identifiers}: {
			fieldsUpdating: Record<string, unknown>,
			identifiers: Record<string, unknown>,
		}
	): RunResult {
		return this.run(
			`UPDATE ${tableName} ${toParameterUpdateClause({
				updatingFields: fieldsUpdating,
				identifiers: identifiers
			})}`,
			{...identifiers, ...fieldsUpdating}
		);
	}

	/**
	 * Deletes a row from a table in the database
	 * @param tableName - The name of the table to delete from
	 * @param identifiers - An object of column/field names to the values to use as identifiers in the WHERE clause
	 * @returns The result of the delete query
	 */
	deleteFromTable(
		tableName: string,
		identifiers: Record<string, unknown>
	): RunResult {
		return this.run(
			`DELETE FROM ${tableName}
			WHERE ${toParameterORWhereClause(identifiers)}`,
			identifiers
		);
	}

	/**
	 * Determines whether a row exists in the given table that has one of the given identifier values
	 * @param tableName - The name of the table to check
	 * @param identifiers - An object of column/field names to the values to use as identifiers in the WHERE clause
	 * @returns True if the row exists, false otherwise
	 */
	doesExistInTable(
		tableName: string,
		identifiers: Record<string, unknown>
	): boolean {
		return this.getValue(
			`SELECT 1
			FROM ${tableName}
			WHERE ${toParameterORWhereClause(identifiers)}
			LIMIT 1`,
			identifiers
		) === 1;
	}
}