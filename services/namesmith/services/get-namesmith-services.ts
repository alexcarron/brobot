import { InitializationError } from "../../../utilities/error-utils";
import { NamesmithServiceClasses, NamesmithServices } from "../types/namesmith.types";

/**
 * Returns the Namesmith services that have been set up.
 * @returns The Namesmith services.
 * @throws {Error} If Namesmith, MysteryBoxService, PlayerService, GameStateService, or VoteService is not set up yet.
 */
export const getNamesmithServices = (): NamesmithServices => {
	if (!global.namesmith)
		throw new InitializationError("getNamesmithServices: Namesmith is not set up yet.");

	const globalServices: any = {};
	for (const [serviceName, Service] of Object.entries(NamesmithServiceClasses)) {
		const name = serviceName as keyof NamesmithServices;
		if (
			!global.namesmith[name] ||
			global.namesmith[name] instanceof Service === false
		) {
			throw new InitializationError(`getNamesmithServices: ${serviceName} is not set up yet.`);
		}

		globalServices[name] = global.namesmith[name];
	}

	return globalServices as NamesmithServices;
}