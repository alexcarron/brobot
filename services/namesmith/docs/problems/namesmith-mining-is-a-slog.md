# Mining Is a Slog

## Problem

Mining is the thing a player does when they have run out of tokens and want more right now. It should feel like a small game they chose to play. Instead it feels like spamming messages and waiting for a number go up.

The moment a player runs out of tokens, one way to get them back is the most tedious action in the game. Any fix has to keep mining always available with no cooldown or cap, keep every mine a discrete random logged event so the mining quests keep working, and must not come from cutting rewards or adding waiting.

## Goals

- Mining tokens is fun adn genuinely engaging in itself
- Players never have to wait or do nothing to recieve tokens from mining
- Players never see mining as a chore or tedious
- Players can actively choose to mine whenever the want
- Players can mine an unlimited number of times
- Casual players should be able to understand and enjoy the mechanic immediately
- Grinders should have uncapped earning potential and never be forced to stop mining
- Casual players should not be at a major disadvantage for not grinding mines

## Economy

Mining today gives an average of about 1.5 tokens per mine, minimum 1, with a very rare heavy tail. Spammed, a player can do about 20 mines a minute. 

Claiming a refill gives an average of 70 tokens (minimum 50) every 2 hours, so about 280 to 420 tokens a day for anyone who logs in a few times. Mining is a minor income source for a Casual and the dominant one for a Grinder, so any percentage change to mining income lands almost entirely on the heaviest miners.

### Tokens-per-day Estimate by Playstyle

**Casual**: ~30 to 90
**Creative Competitor**: ~150 to 450, 
**Hoarder** ~450 to 750, 
**Grinder** ~1,500 to 2,000, 
**Strategy Maximizer**: ~1,500 or more

## Solution

You run `/mine-tokens` to start digging. Brobot keeps one message updated the whole time. It never sends a second message or a follow up message.

Your first dig is always safe. It gives tokens using the normal mining odds, and the mine cannot collapse on the first dig.

After that first dig, the message shows how many tokens you have collected, how many layers deep you are, and roughly the risk of collapse (e.g. "-# There is a 1 in x chance of collapse if you dig deeper"). You get two choices: dig one layer deeper, or resurface. (Also auto-dig, see below)

Resurface should be the first option, then digging a layer deeper, then auto-digging. The first mine should not show layer or odds of collapsing information.

Resurface cashes out all your collected tokens and takes you back to the surface. It is always safe. To mine like normal, you dig once and resurface.

Digging deeper takes you down one more layer, which is one more mine. The deeper you go, the higher the average tokens each dig gives, and the better your chance to discover a character. Discovering a character is rare. It does not happen on most digs. The character you find uses the same odds as a mystery box.

Every dig past the first has a chance the mine collapses. The deeper you are, the higher that chance. If the mine collapses, you keep only 25 percent of your collected tokens, rounded down, and you go back to the surface.

You can also let Brobot automatically dig for you. It digs one layer deeper every few seconds and always shows a Stop button, giving you a beat to see what happened and decide whether to stop. It keeps digging until you press Stop or the mine collapses. When you press Stop, it stops and lets you dig deeper or resurface again.

Every dig is one separate, random, logged mine, so the mining quests still work. Letting Brobot dig fires mines quickly, so the fast mining quests are easier to hit.

## Terms

- Surface: Where you start. Resurfacing returns you here.
- Layer: How deep you are. You go one layer deeper with each mine, or button press to dig one layer deeper.
- Dig deeper: Go down any amount of layers.
- Resurface: Cashing out all your collected tokens and go back to the surface.
- Collapse: The mine caving in. You keep only 25 percent of your collected tokens, rounded down.
- Mining Session: A set of mines from the first mine at the surface to the mine that led to a collapse.
- Layer Number: The number of layeres deep a player is.