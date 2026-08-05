import { NamesmithEvents } from './namesmith-events';
import { onDayStart } from './on-day-start';
import { onNameChange } from './on-name-change';
import { onNamePublish } from './on-name-publish';
import { onPickAPerk } from './on-pick-a-perk';
import { onRefillReminder } from './on-refill-reminder';
import { onVotingEnd } from './on-voting-end';
import { onVotingStart } from './on-voting-start';
import { onVotingStartReminder } from './on-voting-start-reminder';
import { onWeekStart } from './on-week-start';

/**
 * Sets up the event listeners for Namesmith events, registering  all the event handlers.
 */
export function setupEventListeners() {
	NamesmithEvents.ChangeName.doWhenItOccurs(onNameChange);
	NamesmithEvents.PublishName.doWhenItOccurs(onNamePublish);
	NamesmithEvents.StartVoting.doWhenItOccurs(onVotingStart);
	NamesmithEvents.VotingStartReminder.doWhenItOccurs(onVotingStartReminder);
	NamesmithEvents.EndVoting.doWhenItOccurs(onVotingEnd);
	NamesmithEvents.PickAPerk.doWhenItOccurs(onPickAPerk);
	NamesmithEvents.DayStart.doWhenItOccurs(onDayStart);
	NamesmithEvents.WeekStart.doWhenItOccurs(onWeekStart);
	NamesmithEvents.RefillReminder.doWhenItOccurs(onRefillReminder);
}