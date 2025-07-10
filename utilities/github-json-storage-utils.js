const axios = require('axios');
const { GITHUB_TOKEN } = require('../bot-config/token');
const { logError, logWarning, logInfo } = require('./logging-utils');
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
 * @param {Object} object - The object to save
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
		logError("Error saving object to GitHub", error);
		throw error;
	}
};

/**
 * Loads an object from a specified json file path in the GitHub repository
 * If the file does not exist, it will be created and an empty object will be returned
 * @param {string} jsonFileName - The name of the json file to load from
 * @returns {Object} The object loaded from the file
 */
const loadObjectFromJsonInGitHub = async (jsonFileName) => {
	const path = `${jsonFileName}.json`;
	let file = undefined;

	// Get the file data from GitHub, or create it if it doesn't exist
	try {
		const response =
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
		if (error.response.status === 404) {
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

module.exports = {saveObjectToJsonInGitHub, loadObjectFromJsonInGitHub, GitHubJsonURL};