import { logSetup } from "../../../../utilities/logging-utils";
import { getShuffledArray } from "../../../../utilities/data-structure-utils";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { regenerateInitialVotingMessage, sendInitialVotingMessage } from "./initial-voting-message";
import { regenerateNameEntryMessage, sendNameEntryMessage } from "./name-entry-message";

export async function sendVotingDisplay() {
	const { publishedNameService } = getNamesmithServices();
	const shuffledPublishedNames = getShuffledArray(publishedNameService.getPublishedNames());

	await sendInitialVotingMessage();

	for (const publishedName of shuffledPublishedNames) {
		await sendNameEntryMessage({ publishedName });
	}
}

export async function regenerateVotingDisplay() {
	const regeneratePromises = [
		logSetup('[INITIAL VOTING MESSAGE]', regenerateInitialVotingMessage())
	];

	const { publishedNameService } = getNamesmithServices();
	const publishedNames = publishedNameService.getPublishedNames();

	regeneratePromises.push(
		...publishedNames.map(publishedName =>
			logSetup(`[VOTE ENTRY] ${publishedName.name}`, regenerateNameEntryMessage({ publishedName }))
		)
	);

	await Promise.all(regeneratePromises);
}
