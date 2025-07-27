import Database from "better-sqlite3";
import { DatabaseQuerier } from "./database-querier";
import { insertCharactersToDB, insertMysteryBoxesToDB } from "./db-inserters";
import { applySchemaToDB } from "./queries/apply-schema";
import { getIDfromCharacterValue } from "../utilities/character.utility";
import { InvalidArgumentError } from "../../../utilities/error-utils";
import { Character, CharacterWithTags } from "../types/character.types";
import { MysteryBox, MysteryBoxWithOdds } from "../types/mystery-box.types";

const astrickID = getIDfromCharacterValue('*');
const bracketID = getIDfromCharacterValue(']');

describe('db-inserters.js', () => {
	let db: DatabaseQuerier;
  let characters: CharacterWithTags[];
  let mysteryBoxes: MysteryBoxWithOdds[];

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
				id: 1,
        name: 'mysteryBox1',
        tokenCost: 10,
        characterOdds: {
          '*': 0.5,
          ']': 0.3
        }
      },
      {
				id: 2,
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
    it('inserts characters into the database', () => {
      insertCharactersToDB(db, characters);
      const result = db.getRows('SELECT * FROM character');
      expect(result).toEqual([
				{ id: astrickID, value: '*', rarity: 3 },
				{ id: bracketID, value: ']', rarity: 12 }
      ]);
    });

    it('inserts tags into the database', () => {
      insertCharactersToDB(db, characters);
      const result = db.getRows('SELECT * FROM characterTag');
      expect(result).toEqual([
				{ characterID: astrickID, tag: 'tag1' },
				{ characterID: astrickID, tag: 'tag2' },
				{ characterID: bracketID, tag: 'tag3' },
				{ characterID: bracketID, tag: 'tag4' }
      ]);
    });
  });

  describe('insertMysteryBoxesToDB()', () => {
		beforeEach(() => {
      insertCharactersToDB(db, characters);
		});

    it('inserts mystery boxes into the database', () => {
      insertMysteryBoxesToDB(db, mysteryBoxes);
      const result = db.getRows('SELECT * FROM mysteryBox');
      expect(result).toEqual([
				{ id: 1, name: 'mysteryBox1', tokenCost: 10 },
				{ id: 2, name: 'mysteryBox2', tokenCost: 20 }
      ]);
    });

    it('inserts character odds into the database', () => {
      insertMysteryBoxesToDB(db, mysteryBoxes);
      const result = db.getRows('SELECT * FROM mysteryBoxCharacterOdds');
      expect(result).toEqual([
				{ mysteryBoxID: 1, characterID: astrickID, weight: 0.5 },
				{ mysteryBoxID: 1, characterID: bracketID, weight: 0.3 },
				{ mysteryBoxID: 2, characterID: bracketID, weight: 0.4 },
				{ mysteryBoxID: 2, characterID: astrickID, weight: 0.6 }
      ]);
    });
  });
});