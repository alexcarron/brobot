# Namesmith Tips Mechanic

## What Tips Are

Tips are just-in-time onboarding hints that teach a new player how to play without a tutorial or wall of text. Each tip is a single line appended to a reply the player is already receiving, right when the concept it teaches becomes relevant.

## How Tips Work

Each tip has a key and is attached to a trigger. The trigger is almost always an action the player just took, so the tip is added to the action's existing reply rather than being sent as a separate message.

A tip is shown to a player at most 3 times (`MAX_TIP_VIEW_COUNT` in `constants/tip.constants.ts`), then no longer shows permanently for that player. The count is tracked per player and per tip in the `playerTipViewCount` table, read through `TipService.shouldPlayerSeeTip` and advanced through `TipService.incrementTipViewCountForPlayer`. Tip keys are defined in `constants/tip.constants.ts`.

## Message Style

Every tip follows `docs/namesmith-style-guide.md`: second person, present tense, plain verbs, no metaphors, concise, one line. Every tip names or links the exact command, channel, or message it points to so the player knows precisely what to do next.

## The Tips

Keys `howToBuyMysteryBox` and `howToPublishName` already exist in `constants/tip.constants.ts`. The other keys below are proposed and added as static data in task 4.3. Channel references are shown as `<#CONSTANT>`, standing for `ids.namesmith.channels.CONSTANT`, resolved to a real channel mention at implementation time.

### Core Loop

| Key | Trigger and where it attaches | Tip message |
|---|---|---|
| `howToBuyMysteryBox` | First `/mine-tokens`, on its success reply | You can spend your tokens on a mystery box in `<#OPEN_MYSTERY_BOXES>` with `/buy-mystery-box` to get characters for your name. |
| `howToRearrangeName` | First mystery box opened, on the box-open reply | You can add characters you own to your name and order them however you like with `/rearrange-name`. |
| `howToPublishName` | First `/rearrange-name` success, on its reply | If you're happy with your current name, you can lock it in as an entry for the final vote with `/publish-name`. |

### Earning Tokens

| Key | Trigger and where it attaches | Tip message |
|---|---|---|
| `howToClaimRefillForMoreTokens` | A later `/mine-tokens` reply after `howToBuyMysteryBox` is no longer shown, for a player who has not claimed a refill yet | You can earn far more tokens at once by claiming a refill every 2 hours in `<#CLAIM_REFILL>` with `/claim-refill`. |
| `howToEnableRefillReminders` | First `/claim-refill`, on its reply | You can get DM reminders whenever your next refill is ready expires by pressing the button below. |
| `whatAreDailyQuests` | First quest completed, on the Complete Quest reply | Every day, you can compelte new quests that appear in `<#DAILY_QUESTS>` to earn rewards. |
| `whatAreWeeklyQuests` | First weekly quest completed, on the Complete Quest reply, or on any quest completion when whatAreDailyQuests expires | Each week, you can also complete longer, more challenging quests in `<#WEEKLY_QUESTS>` for bigger rewards. |
| `whatAreHiddenQuests` | Completing a quest, after whatAreDailyQuests and whatAreWeeklyQuests tip is no longer shown | Each day, you can unlock hidden quests for bigger rewards if you complete all daily quests in `<#DAILY_QUESTS>` |

### Depth

| Key | Trigger and where it attaches | Tip message |
|---|---|---|
| `howToCraftCharacters` | First utility character acquired, on the reply that awards it | Utility characters are used in crafting recipes. You can turn characters you own into new ones in `<#CRAFT_CHARACTERS>`  with `/craft-characters`. |
| `howToTrade` | The player's next command reply that gives them characters once a second player has joined and no other tip is shown | You can trade characters with other players using `/trade` in `<#TRADE_CHARACTERS>`. |
| `howToSeePerks` | First perk window, after picking a perk | You can review your perks anytime with `/see-perks`. |

### Endgame

| Key | Trigger and where it attaches | Tip message |
|---|---|---|
| `whatIsThePublishCapAndCost` | First `/publish-name` success, on its reply | You can publish up to 4 names in total. Your next one costs 250 tokens, then 500, then 1000. |

### Mining

Mining teaches its own mechanics only after the player's action has already revealed them, never before, so a curious first click into a new mechanic is rewarded with the explanation rather than spoiled by it. Implemented in `interfaces/mining/mining-tip-lines.ts`, called from `mine-deeper-button.ts`, `auto-mine-button.ts`, and nowhere on the very first mine message.

| Key | Trigger and where it attaches | Tip message |
|---|---|---|
| `howMiningRiskWorks` | The first few successful "mine deeper" results, manual or auto-mine (competes with `characterOddsImproveWithDepth` for the same line; character discovery wins) | Press "Resurface" anytime to keep the tokens you've mined so far safe. If the mine collapses, you will lose most of them. |
| `characterOddsImproveWithDepth` | Any mine result where a character was just discovered (first mine, manual deeper mine, or auto-mine) | Your chance to discover a character while mining increases the deeper you go. |
| `miningHasNoCooldown` | The collapse message, manual or auto-mine (on an auto-mine collapse, competes with `autoMiningRiskKeepsClimbing`, which wins) | Run `/mine-tokens` again anytime to start a new mining session. |
| `autoMiningRiskKeepsClimbing` | After an auto-mine session ends, either by the player pressing "Stop" or by a collapse during auto-mining — never during the live loop itself, to avoid interrupting it | Auto-mining keeps mining deeper every few seconds, increasing the risk of collapse the longer you let it run. Press "Stop" to stop it. |