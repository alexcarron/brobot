# Problem
1. Since everyone only gets one vote, they all vote for the funniest name they see, leaving many names without any votes or consideration at all, making players feel sad or cheated
2. When we don't get many voters the winner is decided by a very small amount of votes or off by one differences making wins not feel earned
3. When there's many names to choose from, only being able to vote on one feels insigificant
# Solution
Allow players to vote on up to three different names ranking them from best to worst, still allowing them to vote only one name the best, but also giving the option to rank two other names 2nd and 3rd
# Player Experience
The published names will still be shown in `#names-to-vote-on` but instead of one "Vote as favorite" button there will be three buttons, the first being to rank it #1 in a primary color, and the other two being to ranked it #2 or #3 in secondary colors. Users will only be allowed to vote in order of 1st then 2nd then 3rd.
## Initial Message
The initial message will explain the system and the ability to vote for 3 names. It should encourage you to vote for your top 3 but allow just voting on one or two. It will also include buttons to see what you votes are and to clear all of your votes with a confirmation
```
The game has ended. Now you can vote on the players' final names.

Select your top three favorite names using the buttons below each name:
🥇 **Vote 1st** (Your favorite)
🥈 **Vote 2nd** (Your next favorite)
🥉 **Vote 3rd** (Your third next favorite)

You can vote for 1 or 2 names, but we recommend voting for all 3.

-# Voting ends `in 12 hours`
[See My Votes] [Clear My Votes]
```
## Name Message
```
Someone's Name Here
[🥇 Vote 1st] [🥈 Vote 2nd] [🥉Vote 3rd]
```
## See My Votes Message
### Full Vote
```
Your current votes are the following:
🥇 1st – Example Name
🥈 2nd – Sample Name Here
🥉 3rd – thisNameIsAnExample
```
### Partial Vote
```
Your current votes are the following:
🥇 1st – Example Name
```
### No Votes
```
You have not voted yet.
```
## Clear Votes Message
### Confirmation Message
```
Are you sure you want to delete your current votes:
🥇 1st – Example Name
🥈 2nd – Sample Name Here
🥉 3rd – thisNameIsAnExample
[Keep Votes] [Delete Votes]
```
### Feedback Message
```
You have deleted all your votes.
[Undo]
```
### Undo Clear Votes
```
You have recovered your previously deleted votes:
🥇 1st – Example Name
🥈 2nd – Sample Name Here
🥉 3rd – thisNameIsAnExample
```
## Voting Feedback Message
### 1st Place Vote
```
You voted this name as 1st place:
> 🥇 Example Name Here

-# Vote your 2nd and 3rd favorite names to make your vote more effective.
```
### 2nd Place Vote
```
You voted this name as 2nd place:
> 🥈 Example Name Here

-# Your 1st place vote is 🥇 Example Name Here
-# Vote your 3rd favorite name to make your vote more effective.
```
### 3rd Place Vote
```
You voted this name as 3rd place:
> 🥉 Example Name Here

-# Your 1st place vote is 🥇 Example Name Here
-# Your 2nd place vote is 🥈 Example Name Here
```
### Replaced Vote
```
You replaced your previous [RANK] place vote with a [RANK] place vote for this name:
> 🥇 Example Name Here

-# Your 1st place vote is 🥇 Example Name Here
-# Your 2nd place vote is 🥈 Example Name Here
-# Your 3rd place vote is 🥉 Example Name Here
[Undo]
```
### Undo Replaced Vote
```
You restored your previous [RANK] place vote on this name:
> 🥇 Example Name Here

-# Your 1st place vote is 🥇 Example Name Here
-# Your 2nd place vote is 🥈 Example Name Here
-# Your 3rd place vote is 🥉 Example Name Here
```
### Repeated Vote
```
You already voted this name as [Rank] place.

-# Your 1st place vote is 🥇 Example Name Here
-# Your 2nd place vote is 🥈 Example Name Here
-# Your 3rd place vote is 🥉 Example Name Here
```
### Voted Out of Order
```
You must vote a name as 1st place before making your 2nd and 3rd place votes.
```

```
You must vote a name as 2nd place before making your 3rd place vote.
```
### Valid Switching Rank of Name
```
You switched this name's vote from 2nd place to 1st place:
> 🥇 Example Name Here

-# Your 1st place vote was originally Example Name Here
-# Your 2nd place vote is now *empty*.
[Undo]
```

```
You switched this name's vote from 3rd place to 2nd place:
> 🥈 Example Name Here

-# Your 1st place vote is 🥇 Example Name Here
-# Your 2nd place vote was originally Example Name Here
-# Your 3rd place vote is now *empty*.
[Undo]
```

```
You switched this name's vote from 3rd place to 1st place:
> 🥇 Example Name Here

-# Your 1st place vote was originally Example Name Here
-# Your 2nd place vote is 🥈 Example Name Here
-# Your 3rd place vote is now empty.
[Undo]
```
### Undo Switching Rank of Name
```
You switched this name's vote back to [RANK] place
> 🥈 Example Name Here

-# Your 1st place vote is 🥇 Example Name Here
-# Your 2nd place vote is 🥈 Example Name Here
-# Your 3rd place vote is 🥉 Example Name Here
```
### Invalid Switching Rank of Name
```
You cannot switch a name's vote to a lower rank.
You must choose a new [RANK] place vote first.
```
### After Voting Ended
```
Voting has ended. You can no longer vote on names.
```
# Rules and Constraints
- Any user can cast a vote
- All users are allowed to have no votes, just a 1st place vote, a 1st and 2nd place vote, or a 1st, 2nd, or 3rd place vote
- Users must vote in order of 1st, then 2nd, then 3rd. You cannot have a gap in your vote. For example, you cannot have a 1st and 3rd place vote but no 2nd place.
- help me fill out the rest
- A user can only vote for a given name once. The same name cannot occupy more than one rank for the same voter.
- A user can only have one vote per rank. Casting a vote for a rank that is already occupied replaces the previous vote for that rank.
# Data 
## Data Models Used
```sql
CREATE TABLE IF NOT EXISTS vote (
	voterID TEXT PRIMARY KEY, -- The Discord ID of the user who voted
	playerVotedAsFirst TEXT REFERENCES player(id)
		ON DELETE CASCADE ON UPDATE CASCADE,
	playerVotedAsSecond TEXT REFERENCES player(id)
		ON DELETE CASCADE ON UPDATE CASCADE,
	playerVotedAsThird TEXT REFERENCES player(id)
		ON DELETE CASCADE ON UPDATE CASCADE
);
```
## Data Logic
- Whenver a user interacts with the voting system at all a row is created with their discord id as `voterID`
- If the player has not made any votes all `playerVotedAs` fields will be null
- When a player votes a name as 1st, the ID of the player who created that name is put in the `playerVotedAsFirst` field
- The above statement applies to second and third place votes as well
- This vote table will be used to view every user's current votes
- Clearing your votes will set all `playerVotedAs` fields to null