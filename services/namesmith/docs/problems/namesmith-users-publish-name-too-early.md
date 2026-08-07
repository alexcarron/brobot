# Users Publish Their Name Too Early

## Problem

The core creative action of the game, forming a clever name, can be completed very early. Once a player publishes a name they feel good about, there is no strong incentive to keep playing for the remainder of the game's duration. Publishing is easy, reversible, and feels like a finish line rather than a strategic decision. As a result, players disengage even though the game still has days left and systems meant to support longer-term play.

- Players emotionally lock onto a first good idea and stop iterating.
- Players feel that improving a name past "good enough" has little payoff.
- After publishing, there are no meaningful decisions left to make.
- Publishing has low commitment and no real consequences.

## Status: Implemented

Shipped as: players can publish up to four names per game (`MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER`), filling slots in order. The first published name is free; the 2nd, 3rd, and 4th cost 250, 500, and 1000 tokens respectively (`PUBLISHED_NAME_SLOT_COSTS`). Once a slot is filled it is permanent and uneditable - there is no player-facing unpublish command, only a developer-only `/set-published-name` override. Voting was reworked so each published name is a separate anonymous entry (not attributed to its player), so a player with multiple published names can have multiple entries in the running independently.

See `services/published-name.service.ts`, `constants/name-publishing.constants.ts`, and `workflows/publish-name.workflow.ts` for the implementation.

## Solutions considered

- **Publishing a name removes its characters from your inventory**: Not implemented. This is a small tweak that makes publishing feel a little bit more valuable and encourages you to try something different once you have a name you are happy with.
- ~~**Allow multiple published names, with each published name acting as a separate anonymous entry in voting**~~ **(Implemented)**: This gives players a reason to keep playing after they finish their first name. Instead of replacing a finished idea, players can create additional ideas. It shifts engagement from perfecting one name to exploring multiple concepts.
- ~~**Make the first publish free, with later publishes costing tokens and increasing in cost**~~ **(Implemented)**: This turns publishing into a deliberate decision instead of a casual action. It creates long-term goals tied to token generation and prevents players from flooding the system with entries.
- ~~**Cap the number of published names at four, requiring replacement once the cap is reached**~~ **(Implemented, without requiring replacement)**: This prevents spam and forces meaningful choices about which ideas are worth keeping. It maintains quality while still allowing creative breadth. Shipped without the "requiring replacement" part - once all four slots are used, publishing is simply blocked rather than prompting a swap.
- ~~**Make published names permanent and uneditable, with clear warnings at publish time**~~ **(Implemented)**: This increases commitment and reduces impulsive publishing. Publishing becomes a point of no return for that entry, which restores tension. Shipped as: no unpublish/edit path exists for players, and `/publish-name` asks for confirmation (including the token cost) before publishing.
- **Allow unpublishing without refunds**: Not implemented. This reduces emotional regret without undermining commitment or the economy. Players can clean up mistakes without exploiting the system.
- ~~**Anonymous voting with all published names treated as separate entries**~~ **(Implemented)**: This keeps voting fair, avoids popularity bias, and allows multiple entries per player without social distortion.
