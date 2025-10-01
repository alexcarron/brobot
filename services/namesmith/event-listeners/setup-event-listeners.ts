import { NamesmithEvents } from './namesmith-events';
import { onNameChange } from './on-name-change';
import { onNamePublish } from './on-name-publish';

/**
 * Sets up the event listeners for Namesmith events, registering  all the event handlers.
 */
export function setupEventListeners() {
	NamesmithEvents.NameChange.doWhenItOccurs(onNameChange);
	NamesmithEvents.NamePublish.doWhenItOccurs(onNamePublish);
}