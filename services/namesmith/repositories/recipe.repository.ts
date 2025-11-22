import { InvalidArgumentError } from "../../../utilities/error-utils";
import { WithRequiredAndOneOther } from "../../../utilities/types/generic-types";
import { isNumber, isObject } from "../../../utilities/types/type-guards";
import { DatabaseQuerier, toParameterSetClause } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { DBRecipe, Recipe, RecipeDefinition, RecipeID, RecipeResolvable } from "../types/recipe.types";
import { RecipeAlreadyExistsError, RecipeNotFoundError } from "../utilities/error.utility";

/**
 * Provides access to all static recipe data.
 */
export class RecipeRepository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(
		public db: DatabaseQuerier,
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new RecipeRepository(db);
	}

	static asMock() {
		const db = createMockDB();
		return RecipeRepository.fromDB(db);
	}

	/**
	 * Retrieves all recipes from the database.
	 * @returns An array of all recipe objects stored in the database.
	 */
	getRecipes(): Recipe[] {
		const query = "SELECT * FROM recipe";
		return this.db.getRows(query) as DBRecipe[];
	}

	/**
	 * Retrieves a recipe by its ID.
	 * @param id - The unique identifier of the recipe to retrieve.
	 * @returns The recipe object with the specified ID, or null if no such recipe exists.
	 */
	getRecipeByID(id: RecipeID): Recipe | null {
		const query = "SELECT * FROM recipe WHERE id = @id";
		const recipe = this.db.getRow(query, { id }) as DBRecipe | undefined;
		return recipe ?? null;
	}

	/**
	 * Retrieves a recipe by its ID, or throws an error if no such recipe exists.
	 * @param id - The unique identifier of the recipe to retrieve.
	 * @returns The recipe object with the specified ID.
	 * @throws {RecipeNotFoundError} If no recipe with the given ID exists.
	 */
	getRecipeOrThrow(id: RecipeID): Recipe {
		const recipe = this.getRecipeByID(id);

		if (recipe === null)
			throw new RecipeNotFoundError(id);

		return recipe;
	}

	/**
	 * Retrieves all recipes that have the specified input characters.
	 * @param inputCharacters - The input characters to filter recipes by.
	 * @returns An array of recipe objects with the given input characters.
	 */
	getRecipesWithInputs(inputCharacters: string): Recipe[] {
		if (inputCharacters === '')
			throw new InvalidArgumentError('getRecipesWithInputs: inputCharacters cannot be empty.');

		const query = "SELECT * FROM recipe WHERE inputCharacters = @inputCharacters";
		return this.db.getRows(query, { inputCharacters }) as DBRecipe[];
	}

	/**
	 * Retrieves all recipes that output the given characters.
	 * @param outputCharacters - The output characters to filter recipes by.
	 * @returns An array of recipe objects with the given output characters.
	 */
	getRecipesWithOutputs(outputCharacters: string): Recipe[] {
		const query = "SELECT * FROM recipe WHERE outputCharacters = @outputCharacters";
		return this.db.getRows(query, { outputCharacters }) as DBRecipe[];
	}

	/**
	 * Checks if a recipe exists by its ID.
	 * @param id - The unique identifier of the recipe to check for existence.
	 * @returns A boolean indicating if the recipe exists.
	 */
	doesRecipeExist(id: RecipeID): boolean {
		const recipeID = this.db.getValue(
			`SELECT id FROM recipe
			WHERE id = @id`,
			{ id }
		) as number | undefined;

		return recipeID !== undefined;
	}

	/**
	 * Resolves a recipe resolvable to a recipe object.
	 * @param recipeResolvable - The recipe resolvable to resolve.
	 * @returns The resolved recipe object.
	 * @throws {RecipeNotFoundError} If the recipe with the given ID is not found.
	 */
	resolveRecipe(recipeResolvable: RecipeResolvable): Recipe {
		const recipeID =
			isObject(recipeResolvable)
				? recipeResolvable.id
				: recipeResolvable;

		return this.getRecipeOrThrow(recipeID);
	}

	/**
	 * Resolves a recipe resolvable to a recipe ID.
	 * @param recipeResolvable - The recipe resolvable to resolve.
	 * @returns The resolved recipe ID.
	 */
	resolveID(recipeResolvable: RecipeResolvable): RecipeID {
		let recipeID;
		if (isNumber(recipeResolvable))
			recipeID = recipeResolvable;
		else
			recipeID = recipeResolvable.id;

		if (!this.doesRecipeExist(recipeID)) {
			throw new RecipeNotFoundError(recipeID);
		}

		return recipeID;
	}

	/**
	 * Adds a recipe to the database with the given ID, input characters, and output characters.
	 * @param recipeDefintion - The recipe definition containing the ID, input characters, and output characters.
	 * @param recipeDefintion.id - The unique identifier of the recipe.
	 * @param recipeDefintion.inputCharacters - The input characters for the recipe.
	 * @param recipeDefintion.outputCharacters - The output characters for the recipe.
	 * @returns The recipe object that was added to the database.
	 */
	addRecipe({ id, inputCharacters, outputCharacters }: RecipeDefinition): Recipe {
		if (id !== undefined) {
			if (this.doesRecipeExist(id))
				throw new RecipeAlreadyExistsError(id);

			this.db.run(
				`INSERT INTO recipe (id, inputCharacters, outputCharacters)
				VALUES (@id, @inputCharacters, @outputCharacters)`,
				{ id, inputCharacters, outputCharacters }
			);
		}
		else {
			const result = this.db.run(
				`INSERT INTO recipe (inputCharacters, outputCharacters)
				VALUES (@inputCharacters, @outputCharacters)`,
				{ inputCharacters, outputCharacters }
			);

			id = Number(result.lastInsertRowid);
		}

		return { id, inputCharacters, outputCharacters };
	}

	/**
	 * Updates a recipe in the database with the given ID, input characters, and output characters.
	 * @param recipeDefintion - The recipe definition containing the ID, input characters, and output characters.
	 * @param recipeDefintion.id - The unique identifier of the recipe.
	 * @param recipeDefintion.inputCharacters - The input characters for the recipe.
	 * @param recipeDefintion.outputCharacters - The output characters for the recipe.
	 * @returns The recipe object that was updated in the database.
	 */
	updateRecipe({ id, inputCharacters, outputCharacters }:
		WithRequiredAndOneOther<RecipeDefinition, 'id'>
	) {
		if (!this.doesRecipeExist(id))
			throw new RecipeNotFoundError(id);

		this.db.run(
			`UPDATE recipe
			SET ${toParameterSetClause({ inputCharacters, outputCharacters })}
			WHERE id = @id`,
			{ id, inputCharacters, outputCharacters }
		);

		return this.getRecipeOrThrow(id);
	}

	/**
	 * Removes a recipe by its ID.
	 * @param id - The unique identifier of the recipe to remove.
	 * @throws {RecipeNotFoundError} If no recipe with the given ID exists.
	 */
	removeRecipe(id: RecipeID) {
		const result = this.db.run(
			'DELETE FROM recipe WHERE id = ?', id
		);

		if (result.changes === 0)
			throw new RecipeNotFoundError(id);
	}
}