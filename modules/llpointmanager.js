const { DatabaseURLs, LLPointTiers, } = require("./enums");
const Viewer = require("./viewer");
const { github_token } =  require("../modules/token.js");
const ids = require("../databases/ids.json");
const { addRole, getGuildMember, getGuild, getRoleById } = require("./functions");

class LLPointManager {
	constructor() {
		this.viewers = new Map();
		this.sha = "";
	}

	async updateViewersFromDatabase() {
		const { promisify } = require('util');
		const request = promisify(require("request"));

		const options = {
			url: DatabaseURLs.Viewers,
			headers: {
				'Authorization': `Token ${github_token}`
			},
		};


		request(
			options,
			(error, response, body) => {
				if (!error && response.statusCode == 200) {
					let viewers = JSON.parse(body);
					this.setViewers(viewers);
				} else {
					console.error(error);
				}
			}
		)
		.catch(err => {
			console.error(err);
		});
	}

	async updateDatabase() {
		const
			axios = require('axios'),
			viewers = Object.fromEntries(this.viewers),
			viewers_str = JSON.stringify(viewers),
			owner = "alexcarron",
			repo = "brobot-database",
			path = "viewers.json";


		try {
			// Get the current file data
			const {data: file} =
				await axios.get(
					`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
					{
						headers: {
							'Authorization': `Token ${github_token}`
						}
					}
				);

			// Update the file content
			// eslint-disable-next-line no-unused-vars
			const {data: updated_file} =
				await axios.put(
					`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
					{
						message: 'Update file',
						content: new Buffer.from(viewers_str).toString(`base64`),
						sha: file.sha
					},
					{
						headers: {
							'Authorization': `Token ${github_token}`
						}
					}
				);
		} catch (error) {
			console.error(error);
		}
	}


	setViewers(viewers_obj) {
		for (let name in viewers_obj) {
			let viewer_properties = viewers_obj[name];
			this.addViewer(new Viewer(viewer_properties));
		}
	}


	getViewers() {
		return this.viewers;
	}

	getArrayOfViewers() {
		return Array.from(this.viewers.values());
	}

	getViewerNames() {
		return Array.from(this.viewers.values()).map(viewer => viewer.name);
	}

	getViewerById(user_id) {
		return this.getArrayOfViewers().find(viewer => viewer.user_id === user_id);
	}

	addViewer(viewer) {
		this.viewers.set(viewer.name, viewer);
	}

	removeViewer(viewer) {
		this.viewers.delete(viewer.name);
	}

	getViewerByName(name) {
		return this.viewers.get(name);
	}

	getNumViewers() {
		return this.viewers.size;
	}

	getRankOfViewer(name) {
		const sorted_viewers_array =
			this.getArrayOfViewers().sort(
				(viewer1, viewer2) => {
					return viewer2.ll_points - viewer1.ll_points;
				}
			)

		const rank = sorted_viewers_array.findIndex((viewer) => viewer.name === name) + 1;

		return rank;
	}

	async giveTiersToViewers() {
		const viewers_with_id = this.getArrayOfViewers().filter(viewer => viewer.user_id);

		for (const viewer of viewers_with_id) {
			let tier = viewer.tier;

			if (tier === LLPointTiers.LLViewer)
				continue

			const
				tier_role_id = ids.ll_game_shows.roles[tier],
				ll_game_shows_guild = await getGuild(ids.ll_game_shows.server_id);

			try {
				const
					viewer_guild_member = await getGuildMember(ll_game_shows_guild, viewer.user_id),
					tier_role = await getRoleById(ll_game_shows_guild, tier_role_id);
				await addRole(viewer_guild_member, tier_role);
			}
			catch (exception) {
				console.log("Member not found on Discord Server");
				continue
			}
		}
	}
}

module.exports = LLPointManager;