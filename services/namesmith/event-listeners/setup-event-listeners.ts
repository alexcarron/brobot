import { NamesmithEvents } from './namesmith-events';
import { onNameChange } from './on-name-change';

/**
 * Sets up the event listeners for Namesmith events, registering  all the event handlers.
 */
export function setupEventListeners() {
	NamesmithEvents.NameChange.doWhenItOccurs(onNameChange);
}