import { sendPickAPerkMessage } from "../interfaces/pick-a-perk-message";
import { getNamesmithServices } from "../services/get-namesmith-services";

/**
 * Sends a message to the 'Pick A Perk' channel asking the user to choose one of the given perks.
 * @returns A promise that resolves once the message has been sent.
 */
export async function onPickAPerk() {
	const {playerService, perkService} = getNamesmithServices();
	const threePerks = perkService.offerThreeRandomNewPerks();
	playerService.resetAllHasPickedPerk();
	await sendPickAPerkMessage(threePerks);
}