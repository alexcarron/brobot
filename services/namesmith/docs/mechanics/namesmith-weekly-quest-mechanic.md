# Namesmith Weekly Quest Mechanic
Every week, 3-4 weekly quests are randomly chosen and shown to the players to complete. They are harder and take much longer than daily quests, but give much more rewards. 
# Interface
Will be shown as messages in the `#weekly-quests` channel
- At the start of each week decided by what day and time Namesmith started
	- All the messages are deleted from the channel 
	- The introduction to weekly quests with a blurb about how it works is re-sent
	- All players are pinged with a role mention
	- The one or two weekly quests are sent as normal quest message with a complete button for each
- The quest message and complete button work the exact same as daily quests
## Example Messages
```
# Weekly Quests
Every week, 1-2 weekly quests are shown here for you to complete. These quests take longer and require more effort than daily quests, but they grant higher rewards. Do what the quest asks and click the "Complete Quest" button to claim your reward
_ _
## Named After My Perk
Have your current name contain the name of one of the perk's you have
- :coin: +800 Tokens
- :symbols: +10 Characters: `🧩` `P` `e` `r` `k` `s` `R` `u` `l` `e`
[COMPLETE QUEST]
```
# Workflow Logic
- If a non-player user clicks the "Complete Quest" button, do not give them the rewards
- If a player clicks the "Complete Quest" button on a quest that no longer exists, do not give them the rewards
- If a player clicks the "Complete Quest" button on a quest that is no longer a shown quest for today/this week, do not give them the rewards
- If a player clicks the "Complete Quest" button on a quest they already compelted, do not give them the rewards
- If a player clicks the "Complete Quest" button on a quest they have not met the criteria for, do not give them the rewards
- If a player clicks the "Complete Quest" button on a quest they completed the criteria for, give them the rewards
# Game Logic
- There is a 66% chance of there being only three weekly quest and a 33% chance of there being four weekly quests
- Quests are explicitly defined as daily or weekly quests. A daily or hidden quest can NOT be a weekly quest and vice versa
- Weekly quests names, descriptions, and rewards are hardcoded static data
- There will exists at least 28 different defined weekly quests
- Most weekly quests are just harder versions of existing daily quests
- Chosen weekly quests will not repeat unless all weekly quests have been chosen
# New Questions System Needs to Answer
- Which quests are weekly quests?
	- Mark defined weekly quests as `'weekly'` in the `recurrence` field
	- Check the `recurrence` field on a quest object to see if it is `'weekly'`
- Which weekly quests are available to be chosen?
	- Set `wasShown` to true on a quest when it is chosen as a weekly quest
	- Check the `wasShown` field on a quest object to see if it is `false`
- When do we reuse weekly quests to be shown?
	- Check every single weekly quest object to see if all have `wasShown` as `true`
	- Reset all quest objects to have `wasShown` as false when all quests have been shown
	- Check `isShown` field to know what quests you already picked for this week you cant pick again
	- Reset `isShown` to false for all weekly quests when picking weekly quests
- Is this quest being current shown today?
	- Set the `isShown` field to true when you've picked that quest for this week's weekly quest
	- Check the `isShown` field on the quest object
# Proposed Data Models
## Quest
```sql
CREATE TABLE IF NOT EXISTS quest (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL UNIQUE,
	description TEXT NOT NULL,
	recurrence TEXT NOT NULL CHECK(status IN
		('daily', 'weekly')
	) DEFAULT 'daily',
	tokensReward INTEGER NOT NULL DEFAULT 0,
	charactersReward TEXT NOT NULL DEFAULT '',
	wasShown BOOLEAN NOT NULL DEFAULT 0,
	isShown BOOLEAN NOT NULL DEFAULT 0
);
```
## Shown Weekly Quest
```sql
CREATE TABLE IF NOT EXISTS shownWeeklyQuest (
	timeShown NUMBER NOT NULL,
	questID INTEGER NOT NULL REFERENCES quest(id)
		ON DELETE CASCADE ON UPDATE CASCADE,
	PRIMARY KEY (timeShown, questID)
);
```