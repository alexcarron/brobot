# Namesmith Hidden Quest Mechanic
Each day has a hidden quest not shown to the players until they complete all the shown daily quests for that day. Once completed, they are shown the hidden quest and are able to complete it for rewards, working as a normal quest
# Interface
Will be shown as a message in the \#hidden-quest channel
- At the start of the day the channel is hidden from all players, and the hidden quest message is sent there, including a quick blurb about how hidden quests work
- Once a player has completed all daily quests,
	- Their feedback message tells them they unlocked a hidden quest it links the channel
	- They are given view access to the channel
- The hidden quest message is the same as a normal quest meesage with a complete button
## Example
```
# Hidden Quest
You unlocked today’s hidden quest by completing all daily quests. Read the objective, perform the required actions, and click the "Complete Quest" button to claim your reward
_ _
## Experienced Craftsman
Craft characters at least five times using at least three different recipes
- :coin: +100 Tokens
[COMPLETE QUEST]
```
# Workflow Logic
- A user that is not a player cannot complete a hidden quest
- A player cannot complete a hidden quest that does not exist
- A player cannot complete a hidden quest when they have not completed all current shown non-hidden daily quests
- A player cannot complete a hidden quest who's quest they already completed
- A player cannot complete a hidden quest when they have not met the criteria
- A player will recieve the rewards for a quest if the meet the criteria of the hidden quest and complete it
- Each day has a 50% chance of having 3 or 4 quests total for the day
- If we have 3 total quests for today, there's always one hidden quest (2 shown quests)
- If we have 4 total quests for today, there's a 50% chance we have 1 hidden quest and a 50% chance we have 2 hidden quests
- The total quests are randomly chosen out of all available quests to choose from
- The hidden quests are randomly chosen out of the total quests
- The tokens recieved for hidden quests are multiplied by 1.5
# Questions Code Will Need to Answer
- What quests have been shown before (Reset when all quests have been shown)
	- Use `canShow` on `quest` table
	- When a quest is picked to be used as a quest for the day, set `canShow` to false
	- By defualt `canShow` is true
	- `canShow` for all quests should reset to true once all quests are used up
- What quests are for today
	- Use `timeShown` on `dailyQuest` table with today's day start date from `gameStateService`
	- When a quest is picked to be used for today, add it to `dailyQuest` table with today's day start date from `gameStateService`
- What quests are being shown for today that are not hidden
	- Use `isHidden` on `dailyQuest` table with today's day start date from `gameStateService`
	- When a quest is picked to be used for today, add it to `dailyQuest` table with today's day start date from `gameStateService`, marking `isHidden` as false if its a normal daily quest
- What quests are the hidden quests for today
	- Use `isHidden` on `dailyQuest` table with today's day start date from `gameStateService`
	- When a quest is picked to be used for today, add it to `dailyQuest` table with today's day start date from `gameStateService`, marking `isHidden` as true if its a hidden daily quest
- What quest do we choose as the hidden quest
	- Pick a random one out of the available quest
- What the augmented rewards are for a hidden quest
	- Multiply the `tokenRewards` from the `quest` table by 1.5
- What quests a player completed today?
	- Use the `activityLogService` to find the completeQuest logs for today
# Proposed Data Models
- quest(**id**, name, description, tokenRewards, charactersRewards, canShow)
- dailyQuest(**timeShown, questID**, isHidden)