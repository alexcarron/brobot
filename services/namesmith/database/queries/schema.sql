-- Game State table
CREATE TABLE IF NOT EXISTS gameState (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	timeStarted TEXT,
	timeEnding TEXT,
	timeVoteIsEnding TEXT
);

-- Characters table
CREATE TABLE IF NOT EXISTS character (
	id INTEGER PRIMARY KEY,
	value TEXT NOT NULL,
	rarity INTEGER NOT NULL
);

-- Character Tags table
CREATE TABLE IF NOT EXISTS characterTag (
	characterID INTEGER NOT NULL REFERENCES character(id) ON DELETE CASCADE,
	tag TEXT NOT NULL,
	PRIMARY KEY (characterID, tag)
);

-- Mystery Boxes table
CREATE TABLE IF NOT EXISTS mysteryBox (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	tokenCost INTEGER NOT NULL
);

-- Mystery Box Characters table
CREATE TABLE IF NOT EXISTS mysteryBoxCharacterOdds (
	mysteryBoxID INTEGER NOT NULL REFERENCES mysteryBox(id) ON DELETE CASCADE,
	characterID INTEGER NOT NULL REFERENCES character(id) ON DELETE CASCADE,
	weight INTEGER NOT NULL,
	PRIMARY KEY (mysteryBoxID, characterID)
);

-- Perks table
CREATE TABLE IF NOT EXISTS perk (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL UNIQUE,
	description TEXT NOT NULL
);

-- Role table
CREATE TABLE IF NOT EXISTS role (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL UNIQUE,
	description TEXT NOT NULL
);

-- Role Perks table
CREATE TABLE IF NOT EXISTS rolePerk (
	roleID INTEGER NOT NULL REFERENCES role(id) ON DELETE CASCADE,
	perkID INTEGER NOT NULL REFERENCES perk(id) ON DELETE CASCADE,
	PRIMARY KEY (roleID, perkID)
);

-- Players table
CREATE TABLE IF NOT EXISTS player (
	id TEXT PRIMARY KEY,
	currentName TEXT NOT NULL,
	publishedName TEXT,
	tokens INTEGER NOT NULL,
	role INTEGER REFERENCES role(id),
	inventory TEXT,
	lastClaimedRefillTime TEXT
);

-- Player Perks table
CREATE TABLE IF NOT EXISTS playerPerk (
	playerID TEXT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
	perkID INTEGER NOT NULL REFERENCES perk(id) ON DELETE CASCADE,
	PRIMARY KEY (playerID, perkID)
);

-- Votes table
CREATE TABLE IF NOT EXISTS vote (
	voterID TEXT PRIMARY KEY,
	playerVotedForID TEXT NOT NULL REFERENCES player(id)
		ON DELETE CASCADE
);

-- Recipes table
CREATE TABLE IF NOT EXISTS recipe (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	inputCharacters TEXT NOT NULL,
	outputCharacters TEXT NOT NULL
);

-- Trades table
CREATE TABLE IF NOT EXISTS trade (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	initiatingPlayerID TEXT NOT NULL REFERENCES player(id)
		ON DELETE CASCADE,
	recipientPlayerID TEXT NOT NULL REFERENCES player(id)
		ON DELETE CASCADE,
	offeredCharacters TEXT NOT NULL,
	requestedCharacters TEXT NOT NULL,
	status TEXT NOT NULL CHECK(status IN
		('awaitingRecipient', 'awaitingInitiator', 'accepted', 'declined', 'ignored')
	) DEFAULT 'awaitingRecipient'
);

-- Optional index for performance
CREATE INDEX IF NOT EXISTS characterIDIndex ON character (id);
CREATE INDEX IF NOT EXISTS characterValueIndex ON character (value);
CREATE INDEX IF NOT EXISTS characterTagIDIndex ON characterTag (characterID);
CREATE INDEX IF NOT EXISTS characterTagTagIndex ON characterTag (tag);
CREATE INDEX IF NOT EXISTS mysteryBoxIDIndex ON mysteryBoxCharacterOdds (mysteryBoxID);
CREATE INDEX IF NOT EXISTS mysteryBoxCharacterIDIndex ON mysteryBoxCharacterOdds (characterID);
CREATE INDEX IF NOT EXISTS playerIDIndex ON vote (playerVotedForID);
CREATE INDEX IF NOT EXISTS voterIDIndex ON vote (voterID);
CREATE INDEX IF NOT EXISTS recipeIDIndex ON recipe (id);
CREATE INDEX IF NOT EXISTS recipeOutputIndex ON recipe (outputCharacters);
CREATE INDEX IF NOT EXISTS recipeInputIndex ON recipe (inputCharacters);