# Namesmith Workflow Result Pattern
# What is this pattern?
This is a **TypeScript workflow result pattern** designed to handle complex success and failure outcomes in a **type-safe** way. Instead of returning plain objects or throwing errors, workflows return structured results that clearly differentiate **success** and various **failure cases** with maximum discoverability and clean code.
It provides
- A **typed success object**.
- **Typed failure objects** for each failure scenario.
- **Convenient guard methods** (`isX`) to check which failure occurred.
- **Factory functions** to create success or failure results in a clean, consistent way.
# Why was it made?
- To **replace ad-hoc error handling** (like `null`, `undefined`, or `throw`).
- To avoid clunky, tedious creation of error or failure types
- To ensure **type safety** for all workflow outcomes, including complex nested data.
- To simplify **workflow result handling** in interfaces and downstream logic.
- To make it easier to **add new failure types** without rewriting conditional logic.
# How to use it
## 1. Define the workflow result factory
```ts
const result = getWorkflowResultCreator({
  success: provides<{
    player: { name: string; id: number };
    characters: string;
  }>(),
  nonPlayerInitiatedTrade: null,
  nonPlayerReceivedTrade: provides<{ recipientPlayerID: number }>(),
  tradeBetweenSamePlayers: null,
  missingOfferedCharacters: provides<{ missingCharacters: string }>(),
  missingRequestedCharacters: provides<{ missingCharacters: string }>(),
});
```
- Use `provides<T>()` for failures or success that have structured data.
- Use `null` for failures that have no additional data.
## 2. Create workflow results
```ts
function initiateTrade() {
  if (/* some failure condition */) {
    return result.failure.nonPlayerInitiatedTrade();
  }

  return result.success({
    player: { name: 'bob', id: 5 },
    characters: 'abc'
  });
}
```
## 3. Check workflow results safely
```ts
const result = initiateTrade();

if (result.isNonPlayerInitiatedTrade()) {
  console.log('Cannot initiate trade as a non-player.');
}
else if (result.isNonPlayerReceivedTrade()) {
  console.log(`Cannot trade with player ${result.recipientPlayerID}.`);
}
else {
  console.log(`Trade initiated with ${result.player.name} for ${result.characters}`);
}
```
- Guard methods like `isNonPlayerReceivedTrade()` let you **narrow types** automatically.
- Success results automatically include all failure guard methods.
# Benefits
- **Type-safe** handling of success and failure.
- **Scalable**: Add new failures without changing existing code.
- **Readable**: Clear separation of success vs. failure logic.
- **Ergonomic**: Minimal boilerplate using `provides<T>()` and `null`.
# Relevant Data Helper
```ts
function provides<T = {}>(): T {
  return {} as T;
}
```
- Returns a typed empty object for use in factory definitions.
- Keeps the TypeScript type system fully aware of all result shapes.