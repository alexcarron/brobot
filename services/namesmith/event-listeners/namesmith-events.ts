import { Player } from "../types/player.types";

export const NamesmithEvents = {
  NameChange: createEventHandler<{
    playerID: string;
    oldName: string;
    newName: string;
  }>(),

	NamePublish: createEventHandler<{
		player: Player;
	}>(),
};

export type RelevantDataOf<
  EventType extends { addHandler: (...args: any[]) => any }
> = Parameters<Parameters<EventType['addHandler']>[0]>[0];

type EventHandler<
	RelevantData extends Record<string, unknown>
> = (relevantData: RelevantData) => Promise<void> | void;

/**
 * Creates an event handler instance that manages multiple handlers for a specific event type.
 * @returns An event handler instance.
 * @template RelevantData - The type of the relevant data object passed to the event handlers.
 */
function createEventHandler<
	RelevantData extends Record<string, unknown>
>() {
	let handlers: EventHandler<RelevantData>[] = [];

	const addHandler = (handler: EventHandler<RelevantData>): () => void => {
		handlers.push(handler);

		// Return "removeHandler" function
		return () => {
			handlers = handlers.filter((someHandler) => someHandler !== handler);
		};
	};

	const addOneTimeHandler = (handler: EventHandler<RelevantData>): void => {
		const oneTimeHandler = async (relevantData: RelevantData) => {
      await handler(relevantData);
      handlers = handlers.filter(someHandler =>
				someHandler !== oneTimeHandler
			);
    };
    handlers.push(oneTimeHandler);
	};

	const runHandlers = (relevantData: RelevantData) => {
		for (const handler of handlers) {
			const result = handler(relevantData)
			if (result instanceof Promise)
				result.catch(console.error);
		}
	};

	return {
		addHandler: addHandler,
		doWhenItOccurs: addHandler,

		addOneTimeHandler: addOneTimeHandler,
		doOnceWhenItOccurs: addOneTimeHandler,

		runHandlers: runHandlers,
		announce: runHandlers,
	}
}