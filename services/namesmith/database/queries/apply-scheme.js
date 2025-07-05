const fs = require('fs');
const path = require('path');

const currDir = __dirname;
const schemaPath = path.join(currDir, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

const applySchemaToDB = (db) => {
	db.exec(schema);
}

module.exports = { applySchemaToDB };