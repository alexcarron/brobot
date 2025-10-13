import { NamesmithDependencies } from "../types/namesmith.types";
import { createAllMocks } from "./all-mocks";

/**
 * Sets up a mock Namesmith server with mock repositories and services. This is
 * used by the event listeners to simulate the game state and player state
 * during testing.
 * This function should be called before any of the event listeners are set up
 * and before any tests are run.
 * @returns An object containing all the mock services and repositories.
 */
export const setupMockNamesmith = (): NamesmithDependencies => {
	const allMocks = createAllMocks();
	global.namesmith = allMocks;
	return allMocks;
}