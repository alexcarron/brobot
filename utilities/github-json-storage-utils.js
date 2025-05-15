const { GITHUB_TOKEN } = require('../bot-config/token');

constaxios = require('axios');
const REPO_OWNER = "alexcarron";
const REPO_NAME = "brobot-database";

/**
 * Saves an object to a specified file in the GitHub repository
 * @param {Object} object - The object to save
 * @param {string} jsonFileName - The name of the json file to save to
 */
const saveObjectToJsonInGitHub = async (object, jsonFileName) => {
	const path = `${jsonFileName}.json`;
	const jsonObjectString = JSON.stringify(object);


	try {
		// Get the current file data to obtain sha
		// This is needed because the update endpoint requires the sha of the file
		// https://docs.github.com/en/rest/reference/repos#update-a-file
		const {data: current_file} =
			await axios.get(
				`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
				{
					headers: {
						'Authorization': `Token ${GITHUB_TOKEN}`
					}
				}
			);

		// Update the file content
		// The `put` endpoint will update the file if it already exists or create a new file if it doesn't
		// https://docs.github.com/en/rest/reference/repos#create-or-update-file-contents
		await axios.put(
			`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
			{
				// The message will be used to create a commit in the GitHub repository
				message: `Update ${jsonFileName}`,
				// The content needs to be base64 encoded
				// https://docs.github.com/en/rest/reference/repos#create-or-update-file-contents
				content: new Buffer.from(jsonObjectString).toString(`base64`),
				// The sha of the current file is needed to update the file
				// https://docs.github.com/en/rest/reference/repos#update-a-file
				sha: current_file.sha
			},
			{
				headers: {
					'Authorization': `Token ${GITHUB_TOKEN}`
				}
			}
		);
	}
	catch (error) {
		console.error(error);
	}
};

/**
 * Loads an object from a specified file in the GitHub repository
 * @param {string} jsonFileName - The name of the json file to load from
 * @returns {Object} The object loaded from the file
 */
const loadObjectFromJsonInGitHub = async (jsonFileName) => {
	const path = `${jsonFileName}.json`;

	// Get the file data from GitHub
	const {data: file} =
		await axios.get(
			`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
			{
				headers: {
					'Authorization': `Token ${GITHUB_TOKEN}`
				}
			}
		)
		.catch(err => {
			console.error(err);
		});

	// Convert the base64 encoded string to a normal string
	// https://docs.github.com/en/rest/reference/repos#get-repository-content
	let objectString = Buffer.from(file.content, 'base64').toString();

	// Parse the string into an object
	let object = JSON.parse(objectString);

	return object;
};

module.exports = {saveObjectToJsonInGitHub, loadObjectFromJsonInGitHub};