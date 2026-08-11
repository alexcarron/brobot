# Namesmith Mine Tokens Mechanic
Running `/mine-tokens` starts a mining session. Brobot sends ephemeral follow-up messages for the whole session.
## How Often
Anytime. There is no cooldown or limit on mining or on the number of mining sessions a player can start.
## Terms
- **Surface**: Where a mining session starts. Resurfacing returns a player here and ends the session.
- **Layer**: How deep a player is in a mining session. The first mine is on layer 1. Mining deeper goes one layer further each time.
- **Mine Deeper**: Mining one more layer down, risking a collapse in exchange for better odds.
- **Resurface**: Cashing out all tokens mined this session and returning to the surface.
- **Collapse**: The mine caving in. The player keeps only a fraction of the tokens mined this session and returns to the surface.
- **Mining Session**: The set of mines from the first mine at the surface to whichever mine ends it, either a resurface or a collapse.
## First Mine
The first mine of a session always uses the normal odds and can never collapse. It only shows the tokens gained (and a character if one was discovered), with no layer or collapse-odds information, since there is nothing at risk yet.
## Mine Deeper
After the first mine, the message shows how many tokens have been mined this session and the player's current layer with the odds of collapse if they mine one more layer deeper (e.g. "1 in x chance of collapsing"). The player can mine deeper, resurface, or start auto-mining. Buttons are ordered Resurface, Mine Deeper, then auto-mine.
The deeper a player goes, the higher the expected tokens per mine and the better the chance of discovering a character. Character discovery is rare and uses the same odds as opening a mystery box.
## Collapse
Every mine past the first has a chance to collapse, and that chance increases with depth. If a mine collapses, the player keeps only a quarter of the tokens mined this session, rounded down, and returns to the surface. A collapse ends the session the same as a resurface, just with most of the session's tokens lost.
## Resurface
Resurfacing cashes out all tokens mined this session, is always safe, and ends the session. Mining once behaves the same as the old unlimited `/mine-tokens` command.
## Auto-Mine
A player can let Brobot mine automatically instead of pressing Mine Deeper each time. Auto-mine mines one layer deeper every few seconds and always shows a Stop button, giving the player a moment to see the result of each mine before the next one fires. It keeps going until the player presses Stop or the mine collapses. Pressing Stop returns to the normal Mine Deeper / Resurface choice.
## How Much
- Minimum of 1 token per mine
- Expected value starts at 1.5 tokens on layer 1 and grows with depth
- No maximum number of tokens per mine
- On collapse, only 25 percent of the session's mined tokens are kept, rounded down
