#!/usr/bin/env node

/**
 * Usage: npm run reset-namesmith-db
 *
 * Deletes the Namesmith database so the next boot recreates it from the current schema. Run this once after making a schema change. See docs/coding-guidelines/namesmith-database-schema-migration.md.
 */

import { logSuccess } from '../../../utilities/logging-utils';
import { resetDatabase } from '../database/reset-database';

resetDatabase();
logSuccess('Namesmith database reset. It will be recreated from the current schema and static data on the next boot.');
