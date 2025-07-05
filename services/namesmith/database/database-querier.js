const Database = require("better-sqlite3");

/**
 * A utility class for preparing and executing SQL queries using a better-sqlite3 database instance.
 * Provides methods for running single queries, retrieving results, and performing transactions.
 */
class DatabaseQuerier {
  /**
   * @param {Database} db - better-sqlite3 Database instance
   */
  constructor(db) {
		if (!(db instanceof Database))
			throw new TypeError("DatabaseQuerier: db must be an instance of Database.");

    this.db = db;
  }

  /**
   * Prepare a SQL query and return a wrapper object with helpful methods:
   * - `run(params)`: Execute the query with the given parameters and return the result of `Database.RunResult`.
   * - `getRow(params)`: Execute the query with the given parameters and return a single row of the result set.
   * - `getRows(params)`: Execute the query with the given parameters and return all rows of the result set.
   * - `getIterator(params)`: Execute the query with the given parameters and return an iterator over the result set.
   * - `getFirstColumnValues()`: Execute the query with no parameters and return an array of the first column of all rows of the result set.
   * @param {string} sqlQuery - SQL query to prepare
   * @returns {{
   *  run: (params?: object|array) => { changes: number, lastInsertRowid: number },
   *  getRow: (params?: object|array) => object,
   *  getRows: (params?: object|array) => Array<object>,
   *  getIterator: (params?: object|array) => Iterator<object>,
   *  getFirstColumnValues: (params?: object|array) => Array
   * }} - Wrapper object with the above methods
   */
  getQuery(sqlQuery) {
    const queryStatement = this.db.prepare(sqlQuery);
    return {
      run: params => {
				if (params === undefined)
					return queryStatement.run();
				return queryStatement.run(params);
			},
      getRow: params => {
				if (params === undefined)
					return queryStatement.get();
				return queryStatement.get(params);
			},
      getRows: params => {
				if (params === undefined)
					return queryStatement.all();
				return queryStatement.all(params);
			},
      getIterator: params => {
				if (params === undefined)
					return queryStatement.iterate();
				return queryStatement.iterate(params);
			},
      getFirstColumnValues: params => {
        queryStatement.pluck();
				if (params === undefined)
					return queryStatement.all();
				return queryStatement.all(params);
      }
    };
  }

  /**
   * Runs a single write query
   * - changes: The total number of rows that were inserted, updated, or deleted by this operation
   * - lastInsertRowid: The rowid of the last row inserted into the database
   * @param {string} sqlQuery - The SQL query to run
   * @param {object|array} params - The parameters to pass to the query
   * @returns {{ changes: number, lastInsertRowid: number }} The result of the query
   */
  run(sqlQuery, params = undefined) {
		try {
			const queryStatement = this.getQuery(sqlQuery);
			return queryStatement.run(params);
		}
		catch (error) {
			if (
				error.message.includes("The supplied SQL string contains more than one statement")
			) {
				if (params !== undefined) {
					throw new Error("Parameters are not supported with multi-statement queries");
				}
				this.db.exec(sqlQuery);
				return { changes: -1, lastInsertRowid: -1 };
			}
			throw error;
		}
  }


  /**
   * Runs a single read query and returns a single row
   * @param {string} sqlQuery - The SQL query to run
   * @param {object|array} params - The parameters to pass to the query
   * @returns {object | undefined} The first row of the result set or undefined if no row is found
   */
  getRow(sqlQuery, params = undefined) {
    const queryStatement = this.getQuery(sqlQuery);
    return queryStatement.getRow(params);
  }

  /**
   * Runs a single read query and returns all rows of the result set
   * @param {string} sqlQuery - The SQL query to run
   * @param {object|array} params - The parameters to pass to the query
   * @returns {Array<object>} An array of all rows of the result set
   */
  getRows(sqlQuery, params = undefined) {
    const queryStatement = this.getQuery(sqlQuery);
    return queryStatement.getRows(params);
  }

  /**
   * Runs a single read query and returns an iterator over the result set
   * @param {string} sqlQuery - The SQL query to run
   * @param {object|array} params - The parameters to pass to the query
   * @returns {Iterator<object>} An iterator over all rows of the result set
   */
  getIterator(sqlQuery, params = undefined) {
    const queryStatement = this.getQuery(sqlQuery);
    return queryStatement.getIterator(params);
  }

  /**
   * Creates a transaction of multiple queries and returns a function that starts the transaction when called
   * @param {function} multiQueryFunction - A function that takes no arguments and runs a series of queries
   * @returns {function} A function that starts the transaction when called
   */
  getTransaction(multiQueryFunction) {
    const transactionFunction = this.db.transaction(multiQueryFunction);
    return transactionFunction;
  }

  /**
   * Runs a transaction of multiple queries and returns the result of the transaction
   * @param {function} multiQueryFunction - A function that takes no arguments and runs a series of queries
   * @param {...*} params - Parameters to pass to the transaction function
   * @returns {*} The result of the transaction
   */
  runTransaction(multiQueryFunction, ...params) {
    const transactionFunction = this.getTransaction(multiQueryFunction);
    return transactionFunction(...params);
  }

	exec(...args) {
		return this.db.exec(...args);
	}

	transaction(...args) {
		return this.db.transaction(...args);
	}

	prepare(...args) {
		return this.db.prepare(...args);
	}

	close() {
		return this.db.close();
	}
}

module.exports = DatabaseQuerier;
