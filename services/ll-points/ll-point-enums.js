
/**
 * Enum of possible LL Point tiers and their names
 */
const LLPointTier = Object.freeze({
	WORSHIPER: "LL Worshiper!",
	DEVOTEE: "LL Devotee!",
	ADDICT: "LL Addict!",
	FANATIC: "LL Fanatic!",
	ENTHUSIAST: "LL Enthusiast!",
	FOLLOWER: "LL Follower!",
	FAN: "LL Fan!",
	VIEWER: "LL Viewer!",
});

/**
 * Enum of thresholds for the amount of LL Points needed to reach an LL Point Tier
 */
const LLPointThreshold = Object.freeze({
	WORSHIPER: 50000,
	DEVOTEE: 10000,
	ADDICT: 5000,
	FANATIC: 1000,
	ENTHUSIAST: 100,
	FOLLOWER: 50,
	FAN: 10,
	VIEWER: 0,
});

/**
 * Enum of number of LL Points rewarded for accomplishments
 */
const LLPointReward = Object.freeze({
	SUBSCRIBE: 1,
	DO_UNDERTALE_QUIZ: 1,
	DO_DELTARUNE_QUIZ: 1,
	DO_HOLLOW_KNIGHT_QUIZ: 1,
	PARTICIPATE_IN_GAME: 1,
	PARTICIPATE_IN_EVENT: 1,
	DRAW_ASSET: 2,
	VOICE_ACT: 3,
});

/**
 * Enum of possible accomplishments to earn LL Points with
 */
const LLPointAccomplishment = Object.freeze({
	SUBSCRIBE: "Subscribing",
	DO_UNDERTALE_QUIZ: "Getting 15+ on the Undertale Quiz",
	DO_DELTARUNE_QUIZ: "Getting 15+ on the Deltarune Quiz",
	DO_HOLLOW_KNIGHT_QUIZ: "Getting 15+ on the Hollow Knight Quiz",
	PARTICIPATE_IN_GAME: "Participating in a Game Show",
	PARTICIPATE_IN_EVENT: "Participating in an Event",
	DRAW_ASSET: "Drawing An Asset",
	VOICE_ACT: "Voice Acting",
});

/**
 * Enum of possible perks to earn from reaching an LL Point tier
 */
const LLPointPerk = Object.freeze({
	DRAW_ASSET: "Draw an asset for a YouTube video",
	VOICE_ACT: "Voice act for a YouTube video",
	CUSTOM_ROLE_COLOR: "Get custom Discord role color",
	CUSTOM_PERSONIFICATION: "Get a custom personification drawing",
	ADD_EMOTE: "Add a custom emote to the server",
});

module.exports = { LLPointTier, LLPointThreshold, LLPointReward, LLPointAccomplishment, LLPointPerk };