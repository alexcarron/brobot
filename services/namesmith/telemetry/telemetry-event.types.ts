import { toEnumFromStrings, ValuesOf } from "../../../utilities/enum-utilts";

/**
 * The kind of event a telemetry record describes.
 */
export const EventType = toEnumFromStrings(
	"commandInvoked",
	"namePublished",
	"voteCast",
	"roleChosen",
	"perkWindowOpened",
	"perkPicked",
	"refillClaimed",
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
	"charactersSold",
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
	namePublished: { slotNumber: number; nameLength: number; uniqueCharacterCount: number; tokenCost: number };
	voteCast: { ranksFilled: number; votedPublishedNameID: number; rank: number };
	roleChosen: { roleID: number; roleName: string };
	perkWindowOpened: { offeredPerkIDs: number[]; offeredPerkNames: string[] };
	perkPicked: { tokensAtPick: number; perkID: number; perkName: string };
	refillClaimed: { baseTokensEarned: number; totalTokensEarned: number };
	reminderSent: { reminderKind: "finalizeName" | "refillReady" };
	actionBlocked: { blockedAction: string; blockReason: string; tokensShortBy?: number };
	mineSessionStarted: { miningSessionID: string };
	mineLayer: { miningSessionID: string; layerNumber: number; tokensGained: number; characterGained: string | null };
	mineSessionEnded: { miningSessionID: string; layersDug: number; outcome: "collapsed" | "resurfaced"; tokensKept: number; tokensLostToCollapse: number };
	boxOpened: { mysteryBoxID: number; characterReceived: string; wasDuplicate: boolean };
	craftCompleted: { recipeID: number; inputCharacters: string; outputCharacters: string };
	craftBlocked: { blockReason: string };
	tradeInitiated: { tradeID: number; offeredCharacterCount: number; requestedCharacterCount: number; offeredCharacters: string; requestedCharacters: string };
	tradeResponded: { tradeID: number; outcome: "accepted" | "declined" | "modified" };
	questShown: { questID: number; isHiddenQuest: boolean };
	questCompleted: { questID: number };
	charactersSold: { charactersSold: string; tokensEarned: number };
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
