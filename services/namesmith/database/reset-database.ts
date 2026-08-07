import * as fs from 'fs-extra';
import { logSuccess } from '../../../utilities/logging-utils';
import { dbPath } from './get-database';

/**
 * The sidecar files SQLite creates alongside the main database file when running in WAL mode. They must be deleted together with the main file, otherwise a stale write-ahead log can resurrect old data on the next boot.
 */
const DATABASE_FILE_SUFFIXES = ['', '-wal', '-shm'];

/**
 * Deletes the Namesmith database file and its write-ahead-log sidecars. The next boot recreates the database from the current schema and static data. The backups directory is never touched.
 */
export function resetDatabase(): void {
	for (const suffix of DATABASE_FILE_SUFFIXES) {
		const filePath = `${dbPath}${suffix}`;

		if (fs.existsSync(filePath)) {
			fs.removeSync(filePath);
			logSuccess(`Deleted ${filePath}`);
		}
	}
}
