# Sell Characters Mechanic Guidelines

## When Players Can Sell
Players are allowed to sell characters in their inventory at any time, in any game phase, via the `/sell-characters` command.

## Sell Value Formula
Sell value is comes from a character's rarity, normalized so the most common character has a rarity of 1. The "All Characters" mystery box's odds are derived from rarity.

For a character `C`:
- `sellValue(C) = max(minimumSellValue, floor(sellValueScale * rarity(C)))`.
- `minimumSellValue = 1`
- `sellValueScale` is a single factor computed from the "All Characters" box so that the expected sell value of a character gotten from that box equals 0.5 times the box's price.

## How to Sell
- Use the `/sell-characters` command with `characters-selling` (autocomplete restricted to characters actually in the player's inventory) and an optional `amount` to sell multiples of a single character without retyping it.
- No confirmation prompt is shown before selling (matches `/mine-tokens`/`/claim-refill`). An **Undo** button is attached to the reply instead, valid until the reversal is no longer possible (e.g. the player has since spent the tokens earned).
- Replies are ephemeral. Whether sales are also announced publicly is deferred to a future pass on which player actions get public messages.

## Why Players Sell Characters
- **Acquire Tokens:** Primary resource for buying mystery boxes or crafting characters.
- **Inventory Management:** Reduce clutter and focus on high-priority characters.
- **Fund Key Purchases:** Use tokens from less-needed characters to obtain desired characters.
- **Immediate Rewards:** Quick access to tokens without waiting for tasks or refills.

## Deferred Quality-of-Life Ideas (Not In R1)
- Preset filters (duplicates only, low-value only, characters not in current name).
- Sorting autocomplete suggestions by highest sell value first.
- Post-sell inventory preview before confirming.
- Recursive recipe-cost tracing for recipe-only characters (currently just floored at the minimum sell value).
