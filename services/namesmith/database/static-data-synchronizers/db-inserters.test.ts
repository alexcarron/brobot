import { DatabaseQuerier } from "../database-querier";
import { applySchemaToDB } from "../queries/apply-schema";
import { getIDfromCharacterValue } from "../../utilities/character.utility";
import { Character } from "../../types/character.types";
import { MysteryBox } from "../../types/mystery-box.types";
import { Recipe } from "../../types/recipe.types";
import { WithOptional } from '../../../../utilities/types/generic-types';
import { syncCharactersToDB } from "./sync-characters";
import { syncMysteryBoxesToDB } from "./sync-mystery-boxes";
import { syncRecipesToDB } from "./sync-recipes";

const astrickID = getIDfromCharacterValue('*');
const bracketID = getIDfromCharacterValue(']');

describe('db-inserters.js', () => {
	let db: DatabaseQuerier;
  let characters: Character[];
  let mysteryBoxes: MysteryBox[];
	let recipes: WithOptional<Recipe, "id">[];

  beforeEach(() => {
		db = new DatabaseQuerier({ inMemory: true });
		applySchemaToDB(db);

    characters = [
      {
        id: astrickID,
        value: '*',
        rarity: 3
      },
      {
        id: bracketID,
        value: ']',
        rarity: 12
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
		recipes = [
			{
				inputCharacters: 'oo',
				outputCharacters: '∞'
			},
			{
				id: 1234567890,
				inputCharacters: 'x',
				outputCharacters: '×'
			}
		]
  });

  describe('insertCharactersToDB()', () => {
    it('inserts characters into the database', () => {
      syncCharactersToDB(db, characters);
      const result = db.getRows('SELECT * FROM character');
      expect(result).toEqual([
				{ id: astrickID, value: '*', rarity: 3 },
				{ id: bracketID, value: ']', rarity: 12 }
      ]);
    });
  });

  describe('insertMysteryBoxesToDB()', () => {
		beforeEach(() => {
      syncCharactersToDB(db, characters);
		});

    it('inserts mystery boxes into the database', () => {
      syncMysteryBoxesToDB(db, mysteryBoxes);
      const result = db.getRows('SELECT * FROM mysteryBox');
      expect(result).toEqual([
				{ id: 1, name: 'mysteryBox1', tokenCost: 10 },
				{ id: 2, name: 'mysteryBox2', tokenCost: 20 }
      ]);
    });

    it('inserts character odds into the database', () => {
      syncMysteryBoxesToDB(db, mysteryBoxes);
      const result = db.getRows('SELECT * FROM mysteryBoxCharacterOdds');
      expect(result).toEqual([
				{ mysteryBoxID: 1, characterID: astrickID, weight: 0.5 },
				{ mysteryBoxID: 1, characterID: bracketID, weight: 0.3 },
				{ mysteryBoxID: 2, characterID: bracketID, weight: 0.4 },
				{ mysteryBoxID: 2, characterID: astrickID, weight: 0.6 }
      ]);
    });
  });

	describe('insertRecipesToDB()', () => {
		it('inserts recipes with and without IDs into the database', () => {
			syncRecipesToDB(db, recipes);
			const result = db.getRows('SELECT * FROM recipe');
			expect(result).toEqual([
				{ id: 1, inputCharacters: 'oo', outputCharacters: '∞' },
				{ id: 1234567890, inputCharacters: 'x', outputCharacters: '×' }
			]);
		});
	});
});