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

-- Players table
CREATE TABLE IF NOT EXISTS player (
	id INTEGER PRIMARY KEY,
	currentName TEXT NOT NULL,
	publishedName TEXT,
	tokens INTEGER NOT NULL,
	role TEXT,
	inventory TEXT
);

-- Player Perks table
CREATE TABLE IF NOT EXISTS playerPerk (
	playerID INTEGER NOT NULL REFERENCES player(id) ON DELETE CASCADE,
	perk TEXT NOT NULL,
	PRIMARY KEY (playerID, perk)
);

-- Votes table
CREATE TABLE IF NOT EXISTS vote (
	voterID INTEGER PRIMARY KEY,
	playerVotedForID INTEGER NOT NULL REFERENCES player(id) ON DELETE CASCADE
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