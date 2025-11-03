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
	description TEXT NOT NULL,
	wasOffered BOOLEAN NOT NULL DEFAULT 0
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
	role INTEGER REFERENCES role(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS currentlyOfferedPerk (
	id INTEGER NOT NULL REFERENCES perk(id) ON DELETE CASCADE,
	PRIMARY KEY (id)
);

-- Mystery Box Character Odds
CREATE INDEX IF NOT EXISTS characterOdds_mysteryBoxID_index ON mysteryBoxCharacterOdds(mysteryBoxID);
CREATE INDEX IF NOT EXISTS characterOdds_characterID_index ON mysteryBoxCharacterOdds(characterID);

-- Role Perks
CREATE INDEX IF NOT EXISTS rolePerk_roleID_index ON rolePerk(roleID);
CREATE INDEX IF NOT EXISTS rolePerk_perkID_index ON rolePerk(perkID);

-- Players
CREATE INDEX IF NOT EXISTS player_role_index ON player(role);

-- Player Perks
CREATE INDEX IF NOT EXISTS playerPerk_playerID_index ON playerPerk(playerID);
CREATE INDEX IF NOT EXISTS playerPerk_perkID_index ON playerPerk(perkID);

-- Votes
CREATE INDEX IF NOT EXISTS vote_playerVotedForID_index ON vote(playerVotedForID);

-- Trades
CREATE INDEX IF NOT EXISTS trade_initiatingPlayerID_index ON trade(initiatingPlayerID);
CREATE INDEX IF NOT EXISTS trade_recipientPlayerID_index ON trade(recipientPlayerID);

-- Recipe input/output search
-- Recipe input/output search
CREATE INDEX IF NOT EXISTS recipe_inputCharacters_index ON recipe(inputCharacters);
CREATE INDEX IF NOT EXISTS recipe_outputCharacters_index ON recipe(outputCharacters);

-- Character search by value
CREATE INDEX IF NOT EXISTS character_value_index ON character(value);
