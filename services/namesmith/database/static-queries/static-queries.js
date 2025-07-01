
const fs = require('fs');
const path = require('path');

const currDir = __dirname;
const schemaPath = path.join(currDir, 'schema.sql');
const insertDataPath = path.join(currDir, 'insert-initial-data.sql');

const schema = fs.readFileSync(schemaPath, 'utf8');
const insertData = fs.readFileSync(insertDataPath, 'utf8');

const addSchemaToDB = (db) => {
	db.exec(schema);
}

const addInitialDataToDB = (db) => {
	db.exec(insertData);
}

module.exports = { addSchemaToDB, addInitialDataToDB };