import { toPropertyValues } from "../../../../utilities/data-structure-utils";
import { DeepReadonly } from "../../../../utilities/types/generic-types";
import { TipRepository } from "../../repositories/tip.repository";
import { asDBTips, TipDefinition } from "../../types/tip.types";
import { DatabaseQuerier, toPlaceholdersList } from "../database-querier";

/**
 * Syncronizes the database to match a list of tip data definitions without breaking existing data.
 * @param db - The database querier used to execute queries.
 * @param tipDefinitions - An array of tip objects to be inserted. Each tip is identified by its 'key'.
 */
export function syncTipsToDB(
	db: DatabaseQuerier,
	tipDefinitions: DeepReadonly<TipDefinition[]>
) {
	const tipRepository = TipRepository.fromDB(db);

	const tipKeys = toPropertyValues([...tipDefinitions], "key");

	const runTransaction = db.getTransaction((
		tipDefinitions: TipDefinition[]
	) => {
		const deleteTipsNotDefined = db.getQuery(`
			DELETE FROM tip
			WHERE key NOT IN ${toPlaceholdersList(tipKeys)}
		`);
		deleteTipsNotDefined.run(...tipKeys);

		const findExistingTips = db.getQuery(`
			SELECT * FROM tip
			WHERE key IN ${toPlaceholdersList(tipKeys)}
		`);
		const existingDBTips = asDBTips(
			findExistingTips.getRows(...tipKeys)
		);

		for (const existingDBTip of existingDBTips) {
			const tipDefinition = tipDefinitions.find(tip =>
				tip.key === existingDBTip.key
			);

			if (tipDefinition === undefined)
				continue;

			tipRepository.updateTip(tipDefinition);
		}

		const newTipDefinitions = tipDefinitions.filter(tip =>
			!existingDBTips.find(dbTip =>
				dbTip.key === tip.key
			)
		);

		for (const tipDefinition of newTipDefinitions) {
			tipRepository.addTip(tipDefinition);
		}
	});

	runTransaction(tipDefinitions);
}
