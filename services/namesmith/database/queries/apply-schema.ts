import { DatabaseQuerier } from "../database-querier";

import * as fs from 'fs';
import * as path from 'path';

const currDir = __dirname;
const schemaPath = path.join(currDir, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

export const applySchemaToDB = (db: DatabaseQuerier) => {
	db.run(schema);
}