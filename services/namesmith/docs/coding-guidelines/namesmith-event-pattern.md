# Namesmith Event Pattern
Namesmith uses a centralized, strongly-typed event system for communication. This pattern ensures **readability**, **discoverability**, and **type safety** for all events.
# Top-Level Object
All events live under the `NamesmithEvents` object.
```ts
NamesmithEvents.EventName.addHandler(handler)
NamesmithEvents.EventName.doWhenItOccurs(handler)

NamesmithEvents.EventName.addOneTimeHandler(handler)
NamesmithEvents.EventName.doOneTimeWhenItOccurs(handler)

NamesmithEvents.EventName.runHandlers(relevantData)
NamesmithEvents.EventName.triggerEvent(relevantData)
```
- `EventName` is PascalCase and describes the event clearly (e.g., `NameChange`).
- `addHandler(handler)` / `doWhenItOccurs(handler)` adds a function that is executed every time the event is announced. Returns a function to unsubscribe.
- `addOneTimeHandler(handler)` / `doOneTimeWhenItOccurs(handler)` adds a handler that is executed **once**, then automatically removed.
- `runHandlers(relevantData)` / `triggerEvent(relevantData)` triggers all subscribed handlers with the given payload.
## Example: NameChange Event
```ts
// Top-level event object
export const NamesmithEvents = {
  NameChange: createEventHandler<{
    playerID: string;
    oldName: string;
    newName: string;
  }>(),
};

// Subscribe to the event (repeating subscription)
const stopLoggingOnNameChange = NamesmithEvents.NameChange.addHandler(
  ({ oldName, newName }) => {
    console.log(`Name changed: ${oldName} → ${newName}`);
  }
);

// Subscribe to the event (one-time subscription)
NamesmithEvents.NameChange.doOnceWhenItOccurs(
  ({ oldName, newName }) => {
    console.log(`This logs only once: ${oldName} → ${newName}`);
  }
);

// Announce / trigger the event
await NamesmithEvents.NameChange.runHandlers({
  playerID: '1',
  oldName: 'Alice',
  newName: 'Bob',
});

// Unsubscribe when no longer needed
stopLoggingOnNameChange();
```
# Recommended Developer Workflow
## 1. Create a handler function in a dedicated file for the event
```ts
// namesmith/event-listeners/on-name-change.ts
export async function onNameChange(
  {playerID, newName}: RelevantDataOf<typeof NamesmithEvents.NameChange>
) {
  await changeDiscordNameOfPlayer(playerID, newName);
}
```
## 2. Register handlers in the centralized setup function

```ts
// namesmith/event=listeners=/setup-event-listeners.ts

/**
 * Sets up all the event listeners for Namesmith events.
 * Developers add new event handlers here.
 */
export function setupEventListeners() {
  NamesmithEvents.NameChange.doWhenItOccurs(onNameChange);

  // Add more event handlers here as needed:
  // NamesmithEvents.PlayerJoin.doWhenItOccurs(onPlayerJoin);
}
```
## 3. Call the setup function at application startup

```ts
// namesmith/event-listeners/on-setup.ts
export const setupNamesmith = async () => {
  // ...

  // Centralized registration of all event handlers
  setupEventListeners();

  // ...

  logSuccess("Namesmith set up");
};
```
## 4. Emit events from services
```ts
// src/services/player.service.ts
export class PlayerService {
  changeCurrentName(playerResolvable: PlayerResolvable, newName: string) {
    const playerID = this.resolveID(playerResolvable);
    const oldName = this.getCurrentName(playerResolvable);

    // ...

    this.playerRepository.changeCurrentName(playerID, newName);

    // Notify all subscribers
    NamesmithEvents.NameChange.triggerEvent({ playerID, oldName, newName });
  }
}
```
# Benefits of This Approach
## 1. **Decoupling**
Services only emit events; they do not handle side effects like Discord or logging.
## 2. **Centralized, discoverable subscriptions**
Developers know to put new event handlers in `setup-event-listeners.ts` or related files.
## 3. **Scalable**
Adding a new handler = create function + register in `setupEventListeners()`. No need to modify core services.
## 4. **Type-safe**
All events are strongly-typed; payloads are checked by TypeScript.