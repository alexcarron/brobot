import { toEnumFromStrings, ValuesOf } from "../../../utilities/enum-utilts";

/**
 * The kind of event a telemetry record describes.
 */
export const EventType = toEnumFromStrings(
	"commandInvoked",
	"namePublished",
	"voteCast",
	"perkWindowOpened",
	"perkPicked",
	"reminderSent",
	"actionBlocked",
	"mineSessionStarted",
	"mineLayer",
	"mineSessionEnded",
	"boxOpened",
	"craftCompleted",
	"craftBlocked",
	"tradeInitiated",
	"tradeResponded",
	"questShown",
	"questCompleted",
);

export type EventTypeValue = ValuesOf<typeof EventType>;

/**
 * The game phase an event happened in.
 */
export type GamePhase = "build" | "vote" | "ended";

/**
 * The extra fields carried by each event type.
 */
export type TelemetryDetailsByType = {
	commandInvoked: { commandName: string };
	namePublished: { slotNumber: number; nameLength: number };
	voteCast: { ranksFilled: number };
	perkWindowOpened: Record<never, never>;
	perkPicked: { tokensAtPick: number };
	reminderSent: { reminderKind: "finalizeName" | "refillReady" };
	actionBlocked: { blockedAction: string; blockReason: string; tokensShortBy?: number };
	mineSessionStarted: { miningSessionID: string };
	mineLayer: { miningSessionID: string; layerNumber: number; tokensGained: number; characterGained: string | null };
	mineSessionEnded: { miningSessionID: string; layersDug: number; outcome: "collapsed" | "resurfaced"; tokensKept: number; tokensLostToCollapse: number };
	boxOpened: { mysteryBoxID: number; characterReceived: string; wasDuplicate: boolean };
	craftCompleted: { recipeID: number; inputCharacters: string; outputCharacters: string };
	craftBlocked: { blockReason: string };
	tradeInitiated: { tradeID: number; offeredCharacterCount: number; requestedCharacterCount: number };
	tradeResponded: { tradeID: number; outcome: "accepted" | "declined" | "modified" };
	questShown: { questID: number; isHiddenQuest: boolean };
	questCompleted: { questID: number };
};

/**
 * The arguments passed to telemetry.track.
 * A missing playerID means the event came from the game itself and not a single player.
 */
export type TelemetryTrackingDetails = {
	[EventName in EventTypeValue]: { eventType: EventName; playerID?: string } & TelemetryDetailsByType[EventName]
}[EventTypeValue];

/**
 * Where in the game an event happened, filled in when the event is recorded.
 */
export type TelemetryGameContext = {
	gameID: string | null;
	currentGameDay: number | null;
	currentPhase: GamePhase | null;
	hoursIntoBuildPhase: number | null;
	hoursIntoVotePhase: number | null;
};

/**
 * One stored telemetry event with its tracking details, game context, and time.
 */
export type TelemetryRecord = TelemetryTrackingDetails & TelemetryGameContext & { currentTime: number };
