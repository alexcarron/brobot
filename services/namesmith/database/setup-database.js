const fs = require('fs');
const path = require('path');
const getDatabase = require('./get-database');

const currDir = __dirname;
const schemaPath = path.join(currDir, 'schema.sql');

const db = getDatabase();

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);
