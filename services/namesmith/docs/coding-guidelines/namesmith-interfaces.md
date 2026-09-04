# Namesmith Interface Coding Guidelines

## Extract String Literals to Top-Level Constants

Extract the player-facing string literals into named constants or constant-like arrow functions for dynamic messages at the top of the file. This lets developers open an interface file and see everything it sends to a player in one place.

### Do Not Extract
- Custom IDs (`undo-sell-characters-${playerID}` )
- Colors/styles (`ButtonStyle.Secondary`)
- Values that are not displayed text

### Naming Convention

Add a suffix the constant name based on the purpose of the text:

- **`_FEEDBACK`**: A reply to a specific player action (e.g. `NOT_A_PLAYER_FEEDBACK`, `SELL_CHARACTERS_CONFIRMATION_FEEDBACK`)
- **`_LABEL`** A UI label like a button label, select menu placeholder, or modal/field label (e.g. `UNDO_SELL_CHARACTERS_BUTTON_LABEL`)
- **`_TEXT`** Any other player-facing text (e.g. `VOTING_START_REMINDER_TEXT`)
