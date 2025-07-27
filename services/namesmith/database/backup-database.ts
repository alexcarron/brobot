import { logError, logInfo, logSuccess } from "../../../utilities/logging-utils";

import * as fs from 'fs-extra';
import * as path from 'path';
import Database from 'better-sqlite3';
import { dbPath } from './get-database';
import * as cron from 'node-cron';

const backupDirectory = path.join(__dirname, 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDirectory, `namesmith-backup-${timestamp}.db`);

/**
 * Creates a backup of the database.
 * This function will create a backup of the database in the "backups" directory.
 * The backup will be named "namesmith-backup-<timestamp>.db".
 * If the backup fails, an error will be logged.
 */
export const createBackup = (): void => {
  try {
    logInfo('Starting database backup...');

    // Ensure the backup directory exists
    fs.ensureDirSync(backupDirectory);

    // Open the database in read-only mode
    const db = new Database(dbPath, { readonly: true });

    // Use the SQLite .backup command to create a backup
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.backup(backupPath);

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
export function startBackupCronJob() {
  logInfo('Starting hourly backup cron job...');

  // Schedule: At minute 0 past every hour
  const task = cron.schedule('6 * * * *', () => {
    logInfo('Running scheduled backup...');
    createBackup();
  });

  // Start the cron job immediately
  task.start();

  return task;
};