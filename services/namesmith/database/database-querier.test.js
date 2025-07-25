const Database = require("better-sqlite3");
const DatabaseQuerier = require("./database-querier");

describe('DatabaseQuerier', () => {
	/**
	 * @type {DatabaseQuerier}
	 */
	let dbQuerier;

	beforeEach(() => {
		const db = new Database(':memory:');
		db.exec(`
			CREATE TABLE character (
				id INTEGER PRIMARY KEY,
				value TEXT NOT NULL,
				rarity TEXT NOT NULL
			);

			CREATE TABLE player (
				id INTEGER PRIMARY KEY,
				name TEXT NOT NULL
			);

			INSERT INTO character (value, rarity) VALUES ('character1', 'common'), ('character2', 'rare');
			INSERT INTO player (name) VALUES ('player1'), ('player2');
		`);
		dbQuerier = new DatabaseQuerier(db);
	});

  describe('.getQuery()', () => {
    it('prepares a SQL query and returns a wrapper object', () => {
      const query = 'SELECT * FROM character';
      const result = dbQuerier.getQuery(query);
      expect(result).toHaveProperty('run', expect.any(Function));
      expect(result).toHaveProperty('getRow', expect.any(Function));
      expect(result).toHaveProperty('getRows', expect.any(Function));
      expect(result).toHaveProperty('getIterator', expect.any(Function));
      expect(result).toHaveProperty('getFirstColumnValues', expect.any(Function));
    });

    it('throws an error if the query is invalid', () => {
      const query = 'INVALID QUERY';
      expect(() => dbQuerier.getQuery(query)).toThrow();
    });
  });

  describe('.run()', () => {
    it('runs a single write query and returns the result', () => {
      const query = 'INSERT INTO character (value, rarity) VALUES (?, ?)';
      const params = ['character3', 'legendary'];
      const result = dbQuerier.run(query, params);
      expect(result).toHaveProperty('changes', expect.any(Number));
      expect(result).toHaveProperty('lastInsertRowid', expect.any(Number));
    });

		it('runs multiple queries and returns the results with negative one', () => {
			const queries = `
				INSERT INTO character (value, rarity) VALUES ('character3', 'legendary');
				INSERT INTO character (value, rarity) VALUES ('character4', 'legendary');
			`;
			const result = dbQuerier.run(queries);
			expect(result).toHaveProperty('changes', -1);
			expect(result).toHaveProperty('lastInsertRowid', -1);
		});

		it('throws an error if running multiple queries with parameters', () => {
			const queries = `
				INSERT INTO character (value, rarity) VALUES (?, ?);
				INSERT INTO character (value, rarity) VALUES (?, ?);
			`;
			const params = ['character3', 'legendary', 'character4', 'legendary'];
			expect(() => dbQuerier.run(queries, params)).toThrow();
		});

    it('throws an error if the query is invalid', () => {
      const query = 'INVALID QUERY';
      const params = ['character3', 'legendary'];
      expect(() => dbQuerier.run(query, params)).toThrow();
    });
  });

  describe('.getRow()', () => {
    it('runs a single read query and returns a single row', () => {
      const query = 'SELECT * FROM character WHERE id = ?';
      const params = [1];
      const result = dbQuerier.getRow(query, params);
      expect(result).toEqual({ id: 1, value: 'character1', rarity: 'common' });
    });

    it('returns undefined if no row is found', () => {
      const query = 'SELECT * FROM character WHERE id = ?';
      const params = [999];
      const result = dbQuerier.getRow(query, params);
      expect(result).toBe(undefined);
    });
  });

  describe('.getRows()', () => {
    it('runs a single read query and returns all rows', () => {
      const query = 'SELECT * FROM character';
      const result = dbQuerier.getRows(query);
			expect(result).toEqual([
				{ id: 1, value: 'character1', rarity: 'common' },
				{ id: 2, value: 'character2', rarity: 'rare' }
			])
    });

    it('returns an empty array if no rows are found', () => {
      const query = 'SELECT * FROM character WHERE id = ?';
      const params = [999];
      const result = dbQuerier.getRows(query, params);
      expect(result).toEqual([]);
    });
  });

  describe('.getIterator()', () => {
    it('runs a single read query and returns an iterator over the result set', () => {
      const query = 'SELECT * FROM character';
      const result = dbQuerier.getIterator(query);
			expect(result.next()).toEqual({ value: { id: 1, value: 'character1', rarity: 'common' }, done: false });
			expect(result.next()).toEqual({ value: { id: 2, value: 'character2', rarity: 'rare' }, done: false });
			expect(result.next()).toEqual({ done: true });
    });
  });

  describe('.getFirstColumnValues()', () => {
    it('runs a single read query and returns an array of the first column of all rows', () => {
      const query = 'SELECT value FROM character';
      const result = dbQuerier.getQuery(query).getFirstColumnValues();
			expect(result).toEqual(['character1', 'character2']);
    });
  });

	describe('.getTransaction()', () => {
		it('creates a transaction of multiple queries and returns a function that starts the transaction when called', () => {
			const transaction = dbQuerier.getTransaction((queries, params) => {
				return queries.map((query, index) => {
					return dbQuerier.run(query, params[index]);
				});
			});
			expect(typeof transaction).toBe('function');

			const queries = [
				'INSERT INTO character (value, rarity) VALUES (?, ?)',
				'INSERT INTO character (value, rarity) VALUES (?, ?)'
			];
			const params = [
				['character1', 'common'],
				['character2', 'rare']
			];
			const result = transaction(queries, params);
			expect(result).toEqual([
				{ changes: 1, lastInsertRowid: 3 },
				{ changes: 1, lastInsertRowid: 4 }
			]);
		});
	});

	describe('.runTransaction()', () => {
		it('runs a transaction of multiple queries and returns the result of the transaction', () => {
			const queries = [
				'INSERT INTO character (value, rarity) VALUES (?, ?)',
				'INSERT INTO character (value, rarity) VALUES (?, ?)'
			]
			const params = [
				['character1', 'common'],
				['character2', 'rare']
			]

			const result = dbQuerier.runTransaction((queries, params) => {
				return queries.map((query, index) => {
					return dbQuerier.run(query, params[index]);
				});
			}, queries, params);

			expect(result).toEqual([
				{ changes: 1, lastInsertRowid: 3 },
				{ changes: 1, lastInsertRowid: 4 }
			]);
		})
	});
});
