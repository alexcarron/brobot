import DatabasePkg, { Database, PragmaOptions, RunResult, Statement, Transaction } from "better-sqlite3";
import { ForeignKeyConstraintError, MultiStatementQueryError, QueryUsageError } from "../utilities/error.utility";
import { AnyFunction } from "../../../utilities/types/generic-types";
import { attempt } from '../../../utilities/error-utils';
import { isArray, isObject } from "../../../utilities/types/type-guards";

/**
 * A utility class for preparing and executing SQL queries using a better-sqlite3 database instance.
 * Provides methods for running single queries, retrieving results, and performing transactions.
 */
export class DatabaseQuerier {
	db: Database;

	/**
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
   * @param params - The parameters to pass to the query
   * @returns The result of the query
   */
  run(sqlQuery: string, params?: object | unknown[]): RunResult {
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
	 * @param params - The parameters to pass to the query
	 * @returns The first value of the first row of the result set
	 * @throws {QueryUsageError} If the query does not return a row
	 */
	getValue(sqlQuery: string, params?: object | unknown[]): unknown {
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
   * @param params - The parameters to pass to the query
   * @returns The first row of the result set or undefined if no row is found
   */
  getRow(sqlQuery: string, params?: object | unknown[]): unknown | undefined {
    const queryStatement = this.getQuery(sqlQuery);

		if (params === undefined)
			return queryStatement.getRow();

    return queryStatement.getRow(params);
  }

  /**
   * Runs a single read query and returns all rows of the result set
   * @param sqlQuery - The SQL query to run
   * @param params - The parameters to pass to the query
   * @returns An Array of all rows of the result set
   */
  getRows(sqlQuery: string, params?: object | unknown[]): unknown[] {
    const queryStatement = this.getQuery(sqlQuery);

		if (params === undefined)
			return queryStatement.getRows();

    return queryStatement.getRows(params);
  }

  /**
   * Runs a single read query and returns an iterator over the result set
   * @param sqlQuery - The SQL query to run
   * @param params - The parameters to pass to the query
   * @returns An iterator over all rows of the result set
   */
  getIterator(sqlQuery: string, params?: object | unknown[]): Iterator<unknown> {
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
  runTransaction(multiQueryFunction: AnyFunction, ...params: unknown[]): unknown {
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
	 * Wrap a function in a single transaction to speed up multiple writes (for in-memory testing)
	 * @param fn - The function to wrap in a transaction
	 * @returns The wrapped function
	 */
  wrapInTransaction(fn: AnyFunction): AnyFunction {
    if (!this.db.inTransaction) {
      const txn = this.db.transaction(fn);
      return (...args: unknown[]) => txn(...args);
    }
    return fn;
  }
}