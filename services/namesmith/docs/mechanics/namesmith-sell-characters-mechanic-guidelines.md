# Sell Characters Mechanic Guidelines
## When Players Can Sell
Players are allowed to sell characters in their inventory or current name at any time.
## Tokens Sell Value Principles
- **Rarity-Based Pricing:** Sell value should correlate directly with the character’s rarity.. The rarer or harder to obtain a character is, the higher its token value.
- **Avoid Overpricing:** No character should sell for equal to or more than a mystery box, except in the case of exceptionally rare characters, you likely wouldn't get by opening that mystery box with the money you just got.
- **Avoid Underpricing:** Selling should always feel meaningful. No character should sell for such a low amount that the action feels pointless. The minimum sale value is 10% of the cheapest mystery box. (Roughly 2 tokens as of now)
- **Expected Box Value Reference:** The expected value of a mystery box should be roughly 20% of its cost, which serves as a guide for character sale values.
### Suggested Sale Value Formula
Let:
- `Rarity` = rarity value of the character
- `Max Rarity` = highest rarity value of a character in the game
- `CheapestBoxCost` = cost in tokens of the cheapest mystery box
- `AmountOfCharacters` = number of characters in the set (if using a group reference)
- `TotalRarity` = sum of rarities of all characters in the set
```python
SellValue = (MaxRarity / Rarity) * (
    0.2 * CheapestBoxCost / (
        AmountOfCharacters * MaxRarity / TotalRarity
    )
)
```
## How to Sell
- Use the `/sell-characters` command with inputs specifying which character(s) to sell.
- Include a confirmation prompt to prevent accidental selling of essential characters.
- Support both single-character sales and bulk sales
## Why Players Sell Characters
- **Acquire Tokens:** Primary resource for buying mystery boxes or crafting characters.
- **Inventory Management:** Reduce clutter and focus on high-priority characters.
- **Fund Key Purchases:** Use tokens from less-needed characters to obtain desired characters.
- **Immediate Rewards:** Quick access to tokens without waiting for tasks or refills.
## Possible Quality-of-Life Features
1. **Bulk Selling**
    - Sell multiple of the same character at once.
    - Sell different characters simultaneously.
2. **Preset Filters**
    - Quickly select characters to sell based on:
        - Duplicates only
        - Low-value characters (e.g., under $5)
        - Characters not in current name
3. **Confirmation Prompts**
    - Warn before selling rare or high-value characters.
4. **Token Preview**
    - Show the exact token yield **before selling**.
5. **Undo Last Sale**
    - Allow players to revert a recent sell within a limited timeframe.
6. **Autocomplete & Sorting**
    - Suggest characters with **highest sell value first**.
7. **Post-Sell Inventory Preview**
    - Display how the inventory and token balance will look **after selling**.