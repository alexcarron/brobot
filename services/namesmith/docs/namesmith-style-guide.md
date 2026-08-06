# Namesmith Style Guide

## Colors

**Vibrant Namesmith Purple Highlight**: \#5500ff

- Used for player names and highlights

**Pure White**: #ffffff

- Used for most things including text and neutral buttons

**Invisible Dark Gray**: #202024

- Used for player with no names meant to hide them

**Faded Gray** #d9d9d9

- A rarely used secondary color for Pure White

**Pure Black**: #010002

- A rarely used color for element we want very dark

**Dark Purple**: #260073

- A rarely used color for element we want to stand out while staying dark

## Plain-Text Message Conventions

All player-facing messages are sent as plain string content.

**Spacer line**: `_ _`

- Sent as the first line of a message to create empty vertical space above or below the content.

**Blockquotes**: `> `

- Used to set off a single key piece of content from the surrounding message, most often a published or submitted name.

**Bold**: `**text**`

- Used for player names and other content that should stand out or be clearly indicated as user-affected.

**Escaping player input**: `escapeDiscordMarkdown` (`utilities/string-manipulation-utils.ts`)

- Must be applied to any player-submitted free text (e.g. a custom name) before interpolating it into a message, so player-controlled text can't break or spoof message formatting.

**Footers**: `-# text`

- Used for trailing subtext, such as caveats or attribution (e.g. `-# Created by <@playerID>`).

## Character "Icons"

These are characters used as "icons" since this game is run through Discord

### Rotations

↻↺⟳⟲↶↷

### Typing Indicators

▍⎸⌶

### Swaps/Trades

⇋⇌⇆↹⇅⇵

### Flips

↔↕

### Undo

⤺

### Redo

⤻

### Arrows

→←↑↓↗↙➔↞

## Tone & Voice

- Always speak to the player with "you."
- Be all-Knowing: Speak with complete understanding of the game and its mechanics
- Be clear and direct: Everything stated should be immeiately understandable with players always knowing what their options are
- Be concise but complete: Give only necessary information; avoid filler or flowery language.
- Speak in present tense, second-person perspective
- No metaphors, similes, or figurative language
- Use simple, precise verbs
- Avoid adjectives unless they convey functional information
- Be instructional and factual
- Encourage players for completing challenges in a subtle, understated, minimal, and neutral way (i.e. Well done, Good job, Nicely done, Good work)
- Show progress and rewards visibly using numbers, counts, symbols, size, or repeated icons
- Suspense: Make spins, loot boxes, and choices feel tense only from visuals or these very minimal statements (i.e. Opening mystery box...)
