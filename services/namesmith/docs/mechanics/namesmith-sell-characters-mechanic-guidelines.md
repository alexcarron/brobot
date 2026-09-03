# Sell Characters Mechanic Guidelines

## When Players Can Sell
Players are allowed to sell characters in their inventory at any time, in any game phase, via the `/sell-characters` command.

## Implemented Sell Value Formula
The original suggested formula in this doc (rarity-ratio based) was superseded during implementation by a formula based on each character's actual cheapest acquisition cost, so the no-profit-loop guarantee holds by construction instead of by tuning. See `utilities/character-economy.utility.ts` for the implementation and `docs/namesmith-final-update-requirements.local.md` for the full design rationale.

For a character `C`:
- `cheapestBoxCost(C)` = the lowest expected token cost to obtain `C` by repeatedly buying any single mystery box that offers it, computed from that box's token cost and `C`'s share of the box's total character weight.
- `miningCost(C)` = the expected token cost to obtain `C` via mining, derived from the long-run expected tokens and characters discovered per mining session, scaled by `C`'s weight in the "All Characters" mystery box (mining draws from the same odds table).
- `cheapestCost(C) = min(cheapestBoxCost(C), miningCost(C))`.
- `sellValue(C) = clamp(floor(0.5 * cheapestCost(C)), minSellValue, ∞)`.
- `minSellValue = floor(0.1 * cheapestMysteryBoxCost)` (still ~2 tokens today).
- Characters that only exist as recipe outputs (never obtainable via a box or mining) sell for `minSellValue`, since no real acquisition cost can be computed for them.

The `0.5` fraction (`SELL_VALUE_FRACTION_OF_CHEAPEST_COST` in `constants/sell-characters.constants.ts`) is what guarantees selling is never as profitable as obtaining a character, for both the box-buying and mining paths at once. A dedicated test (`character-economy.utility.test.ts`) asserts this holds for every character in static data.

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
