const Database = require("better-sqlite3");
const DatabaseQuerier = require("./database-querier");
const { insertCharactersToDB, insertMysteryBoxesToDB } = require("./db-inserters");
const { applySchemaToDB } = require("./queries/apply-scheme");
const { getIDfromCharacterValue } = require("../utilities/character.utility");

const astrickID = getIDfromCharacterValue('*');
const bracketID = getIDfromCharacterValue(']');

describe('db-inserters.js', () => {
	/**
	 * @type {DatabaseQuerier}
	 */
	let db;
  let characters;
  let mysteryBoxes;

  beforeEach(() => {
		db = new DatabaseQuerier(new Database(':memory:'));
		applySchemaToDB(db);

    characters = [
      {
        id: astrickID,
        value: '*',
        rarity: 3,
        tags: ['tag1', 'tag2']
      },
      {
        id: bracketID,
        value: ']',
        rarity: 12,
        tags: ['tag3', 'tag4']
      }
    ];
    mysteryBoxes = [
      {
        name: 'mysteryBox1',
        tokenCost: 10,
        characterOdds: {
          '*': 0.5,
          ']': 0.3
        }
      },
      {
        name: 'mysteryBox2',
        tokenCost: 20,
        characterOdds: {
					']': 0.4,
					'*': 0.6
        }
      }
    ];
  });

  describe('insertCharactersToDB()', () => {
    it('inserts characters into the database', async () => {
      insertCharactersToDB(db, characters);
      const result = db.getRows('SELECT * FROM character');
      expect(result).toEqual([
				{ id: astrickID, value: '*', rarity: 3 },
				{ id: bracketID, value: ']', rarity: 12 }
      ]);
    });

    it('inserts tags into the database', async () => {
      insertCharactersToDB(db, characters);
      const result = db.getRows('SELECT * FROM characterTag');
      expect(result).toEqual([
				{ characterID: astrickID, tag: 'tag1' },
				{ characterID: astrickID, tag: 'tag2' },
				{ characterID: bracketID, tag: 'tag3' },
				{ characterID: bracketID, tag: 'tag4' }
      ]);
    });

		it('throws an error if given characters is not an array', async () => {
			expect(() => insertCharactersToDB(db, {})).toThrow(TypeError);
		});

		it('throws an error if given characters do not match the character schema', async () => {
			expect(() => insertCharactersToDB(db, [{}])).toThrow(TypeError);
		});
  });

  describe('insertMysteryBoxesToDB()', () => {
		beforeEach(() => {
      insertCharactersToDB(db, characters);
		});

    it('inserts mystery boxes into the database', async () => {
      insertMysteryBoxesToDB(db, mysteryBoxes);
      const result = db.getRows('SELECT * FROM mysteryBox');
      expect(result).toEqual([
				{ id: 1, name: 'mysteryBox1', tokenCost: 10 },
				{ id: 2, name: 'mysteryBox2', tokenCost: 20 }
      ]);
    });

    it('inserts character odds into the database', async () => {
      insertMysteryBoxesToDB(db, mysteryBoxes);
      const result = db.getRows('SELECT * FROM mysteryBoxCharacterOdds');
      expect(result).toEqual([
				{ mysteryBoxID: 1, characterID: astrickID, weight: 0.5 },
				{ mysteryBoxID: 1, characterID: bracketID, weight: 0.3 },
				{ mysteryBoxID: 2, characterID: bracketID, weight: 0.4 },
				{ mysteryBoxID: 2, characterID: astrickID, weight: 0.6 }
      ]);
    });

		it('throws an error if given mystery boxes is not an array', async () => {
			expect(() => insertMysteryBoxesToDB(db, {})).toThrow(TypeError);
		});

		it('throws an error if given mystery boxes do not match the mystery box schema', async () => {
			expect(() => insertMysteryBoxesToDB(db, [{}])).toThrow(TypeError);
		});
  });
});