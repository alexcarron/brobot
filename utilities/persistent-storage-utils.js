const axios = require('axios');
const { GITHUB_TOKEN } = require('../bot-config/token');
const { logError, logWarning } = require('./logging-utils');
const path = require('path');
const Database = require('better-sqlite3');
const REPO_OWNER = "alexcarron";
const REPO_NAME = "brobot-database";

/**
 * Enum of URLs to thpe json files in the GitHub repository
 */
const GitHubJsonURL = Object.freeze({
	VIEWERS: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/viewers.json`,
	MESSAGES: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/messages.json`,
});

/**
 * Saves an object to a specified json file path in the GitHub repository
 * If the file already exists, it will be updated, otherwise it will be created
 * @param {Record<string, unknown>} object - The object to save
 * @param {string} jsonFileName - The name of the json file to save to
 */
const saveObjectToJsonInGitHub = async (object, jsonFileName) => {
	const path = `${jsonFileName}.json`;
	const jsonObjectString = JSON.stringify(object);
	const jsonContentBase64 = Buffer.from(jsonObjectString).toString('base64');
  const githubJsonFileURL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  let sha = undefined;

	// Try to get the existing file to obtain its SHA
	// https://docs.github.com/en/rest/reference/repos#update-a-file
	try {
		const {data: currentFile} =
			// @ts-ignore
			await axios.get(
				githubJsonFileURL,
				{ headers: {
					'Authorization': `Token ${GITHUB_TOKEN}`,
					'Accept': 'application/vnd.github+json'
				} }
			);

		sha = currentFile.sha;
	}
	catch (error) {
		logWarning(`File ${jsonFileName} does not exist in GitHub, creating new file`);
	}

	/**
	 * The request body to send to the GitHub API
	 * @type {{
	 *   message: string,
	 *   content: string,
	 *   sha?: string
	 * }}
	 */
	const requestBody = {
		// The message will be used to create a commit in the GitHub repository
		message: `Update ${jsonFileName}`,

		// The content needs to be base64 encoded
		// https://docs.github.com/en/rest/reference/repos#create-or-update-file-contents
		content: jsonContentBase64,
	}

	// The sha of the current file is needed to update the file
	// https://docs.github.com/en/rest/reference/repos#update-a-file
	if (sha !== undefined) {
		requestBody.sha = sha;
	}


	// Create or update the file content
	// The `put` endpoint will update the file if it already exists or create a new file if it doesn't
	// https://docs.github.com/en/rest/reference/repos#create-or-update-file-contents
	try {
		// @ts-ignore
		await axios.put(
			githubJsonFileURL,
			requestBody,
			{ headers: {
				'Authorization': `Token ${GITHUB_TOKEN}`,
				'accept': 'application/vnd.github+json'
			} }
		);
	}
	catch (error) {
		if (error instanceof Error) {
			logError("Error saving object to GitHub", error);
		}
		throw error;
	}
};

/**
 * Loads an object from a specified json file path in the GitHub repository
 * If the file does not exist, it will be created and an empty object will be returned
 * @param {string} jsonFileName - The name of the json file to load from
 * @returns {Promise<Record<string, unknown>>} The object loaded from the file
 */
const loadObjectFromJsonInGitHub = async (jsonFileName) => {
	const path = `${jsonFileName}.json`;
	let file = undefined;

	// Get the file data from GitHub, or create it if it doesn't exist
	try {
		const response =
			// @ts-ignore
			await axios.get(
				`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
				{
					headers: {
						'Authorization': `Token ${GITHUB_TOKEN}`
					}
				}
			);

		file = response.data;
	}
	catch (error) {
		if (error instanceof Error === false) {
			throw error;
		}

		if (
			'response' in error &&
			typeof error.response === 'object' &&
			error.response !== null &&
			'status' in error.response &&
			typeof error.response.status === 'number' &&
			error.response.status === 404
		) {
			// If the file doesn't exist, create it with an empty object
			await saveObjectToJsonInGitHub({}, jsonFileName);
			return {};
		}
		else {
			logError("Error loading object from GitHub", error);
			throw error;
		}
	}

	// Convert the base64 encoded string to a normal string
	// https://docs.github.com/en/rest/reference/repos#get-repository-content
	let objectString = Buffer.from(file.content, 'base64').toString();

	// Parse the string into an object
	let object = JSON.parse(objectString);

	return object;
};

/**
 * Creates the database file if it does not exist and returns a database instance for it
 * @returns {import("better-sqlite3").Database} The database instance
 */
const createDBIfDoesNotExist = () => {
	const currDirectory = __dirname;
	const dbPath = path.join(currDirectory, 'db', 'brobot-database.db');
	const database = new Database(dbPath);
	createTableIfDoesNotExist(database);
	return database;
};

/**
 * Creates the `unique_values` table if it does not exist in the database
 * @param {import("better-sqlite3").Database} database - The database instance
 */
const createTableIfDoesNotExist = (database) => {
	database.prepare(`CREATE TABLE IF NOT EXISTS unique_values (unique_key TEXT PRIMARY KEY, value TEXT)`).run();
}

/**
 * Saves a unique key-value pair to the database
 * @param {{uniqueKey: string, value: string}} options - The key-value pair to save
 * @throws {Error} If the unique key already exists in the database
 */
const saveStringValueInDB = ({uniqueKey, value}) => {
	const database = createDBIfDoesNotExist();

	// Check if unique key already exists
	const uniqueKeyExists = database.prepare(`SELECT * FROM unique_values WHERE unique_key = ?`).get(uniqueKey);
	if (uniqueKeyExists) {
		throw new Error(
			`Unique key already exists in the database: ${uniqueKey}`
		)
	}

	database.prepare(`INSERT INTO unique_values (unique_key, value) VALUES (?, ?)`).run(uniqueKey, value);
}

/**
 * Loads a value from the database with a unique key
 * @param {string} uniqueKey - The key to load the value by
 * @returns {string|null} The value associated with the unique key, or null if the key does not exist
 */
const loadStringValueFromDB = (uniqueKey) => {
	const database = createDBIfDoesNotExist();
	const result = database.prepare(`SELECT value FROM unique_values WHERE unique_key = ?`).get(uniqueKey);
	if (
		typeof result !== 'object' ||
		result === null ||
		'value' in result === false ||
		typeof result.value !== 'string'
	) {
		return null;
	}
	return result.value;
}

module.exports = {
	saveObjectToJsonInGitHub,
	loadObjectFromJsonInGitHub,
	GitHubJsonURL,
	saveStringValueInDB,
	loadStringValueFromDB
};