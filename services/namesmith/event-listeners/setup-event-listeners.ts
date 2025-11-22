import { NamesmithEvents } from './namesmith-events';
import { onNameChange } from './on-name-change';
import { onNamePublish } from './on-name-publish';
import { onVotingEnd } from './on-voting-end';
import { onVotingStart } from './on-voting-start';

/**
 * Sets up the event listeners for Namesmith events, registering  all the event handlers.
 */
export function setupEventListeners() {
	NamesmithEvents.NameChange.doWhenItOccurs(onNameChange);
	NamesmithEvents.NamePublish.doWhenItOccurs(onNamePublish);
	NamesmithEvents.VotingStart.doWhenItOccurs(onVotingStart);
	NamesmithEvents.VotingEnd.doWhenItOccurs(onVotingEnd);
}