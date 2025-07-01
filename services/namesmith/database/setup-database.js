const getDatabase = require('./get-database');
const { addSchemaToDB, addInitialDataToDB } = require('./static-queries/static-queries');

const db = getDatabase();
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
addSchemaToDB(db);
addInitialDataToDB(db);
