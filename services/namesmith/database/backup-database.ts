import { logError, logInfo, logSuccess } from "../../../utilities/logging-utils";

import * as fs from 'fs-extra';
import * as path from 'path';
import Database from 'better-sqlite3';
import { dbPath } from './get-database';
import * as cron from 'node-cron';

const backupDirectory = path.join(__dirname, 'backups');

/**
 * Returns a timestamp string that can be used for file names.
 * The returned string is in the format "YYYY-MM-DD-HH-mm-ss".
 * This is safe to use as a filename as it does not contain any special characters.
 * @returns {string} A timestamp string that can be used as a filename.
 */
const createTimestamp = () =>
	new Date().toISOString().replace(/[:.]/g, '-');

/**
 * Returns a string that can be used as a filename for a database backup.
 * The returned string is of the form "namesmith-backup-<timestamp>.db".
 * The timestamp is in the format "YYYY-MM-DD-HH-mm-ss".
 * This is safe to use as a filename as it does not contain any special characters.
 * @returns {string} A string that can be used as a filename for a database backup.
 */
const createBackupFileName = () =>
	`namesmith-backup-${createTimestamp()}.db`;

/**
 * Returns the path to the backup file that will be created when calling createBackup.
 * The path is of the form "<backupDirectory>/namesmith-backup-<timestamp>.db".
 * @returns {string} The path to the backup file.
 */
const createPathToBackup = () =>
	path.join(backupDirectory, createBackupFileName());

/**
 * Creates a backup of the database.
 * This function will create a backup of the database in the "backups" directory.
 * The backup will be named "namesmith-backup-<timestamp>.db".
 * If the backup fails, an error will be logged.
 */
export const createBackup = async (): Promise<void> => {
  try {
    // Ensure the backup directory exists
    fs.ensureDirSync(backupDirectory);

    // Open the database in read-only mode
    const db = new Database(dbPath, { readonly: true });
		const backupPath = createPathToBackup();

    // Use the SQLite .backup command to create a backup
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    await db.backup(backupPath);

    logSuccess(`Backup completed successfully: ${backupPath}`);
  }
	catch (error: unknown) {
    if (error instanceof Error) {
      logError('Backup failed', error);
    } else {
      logError('Backup failed with unknown error');
    }
  }
};

/**
 * Starts a cron job that runs the backup every hour.
 * @returns The scheduled cron job instance.
 */
export async function startBackupCronJob() {
  logInfo('Starting hourly backup cron job...');

  // Schedule: At minute 0 past every hour
<<<<<<< HEAD
  const task = cron.schedule('6 * * * *', async () => {
    await createBackup();
=======
  const task = cron.schedule('6 * * * *', () => {
    createBackup();
>>>>>>> e0d0546 (Fix backup script to use new timestamp everytime)
  });

  // Start the cron job immediately
  await task.start();

  return task;
}