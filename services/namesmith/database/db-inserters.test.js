const { insertCharactersToDB, insertMysteryBoxesToDB } = require("./db-inserters");
const { createMockDB } = require("./mock-database");

describe('db-inserters.js', () => {
	let db;
  let characters;
  let mysteryBoxes;

  beforeEach(() => {
		db = createMockDB();
    characters = [
      {
        id: 1234567890,
        value: '*',
        rarity: 3,
        tags: ['tag1', 'tag2']
      },
      {
        id: 1234567891,
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
          'A': 0.5,
          'B': 0.3
        }
      },
      {
        name: 'mysteryBox2',
        tokenCost: 20,
        characterOdds: {
					'C': 0.4,
					'D': 0.6
        }
      }
    ];
  });

  describe('insertCharactersToDB()', () => {
    it('inserts characters into the database', async () => {
      await insertCharactersToDB(db, characters);
      const result = await db.all('SELECT * FROM character');
      expect(result).toEqual([
				{ id: 1234567890, value: '*', rarity: 3 },
				{ id: 1234567891, value: ']', rarity: 12 }
      ]);
    });

    it('inserts tags into the database', async () => {
      await insertCharactersToDB(db, characters);
      const result = await db.exec('SELECT * FROM characterTag').all();
      expect(result).toEqual([
				{ characterID: 1234567890, tag: 'tag1' },
				{ characterID: 1234567890, tag: 'tag2' },
				{ characterID: 1234567891, tag: 'tag3' },
				{ characterID: 1234567891, tag: 'tag4' }
      ]);
    });
  });

  describe('insertMysteryBoxesToDB()', () => {
    it('inserts mystery boxes into the database', async () => {
      await insertMysteryBoxesToDB(db, mysteryBoxes);
      const result = await db.exec('SELECT * FROM mysteryBox').all();
      expect(result).toEqual([
				{ id: 1, name: 'mysteryBox1', tokenCost: 10 },
				{ id: 2, name: 'mysteryBox2', tokenCost: 20 }
      ]);
    });

    it('inserts character odds into the database', async () => {
      await insertMysteryBoxesToDB(db, mysteryBoxes);
      const result = await db.exec('SELECT * FROM mysteryBoxCharacterOdds').all();
      expect(result).toEqual([
				{ mysteryBoxID: 1, characterID: 1234567890, weight: 0.5 },
				{ mysteryBoxID: 1, characterID: 1234567891, weight: 0.3 },
				{ mysteryBoxID: 2, characterID: 1234567890, weight: 0.4 },
				{ mysteryBoxID: 2, characterID: 1234567891, weight: 0.6 }
      ]);
    });
  });
});