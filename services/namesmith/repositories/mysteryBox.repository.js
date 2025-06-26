const { loadObjectFromJsonInGitHub } = require("../../../utilities/github-json-storage-utils");

/**
 * Provides access to the static mystery box data.
 */
class MysteryBoxRepository {
	static REPO_NAME = "namesmith-mystery-boxes";
	mysteryBoxes = [];

	async load() {
		if (this.mysteryBoxes.length > 0) return;

		this.mysteryBoxes = await loadObjectFromJsonInGitHub(MysteryBoxRepository.REPO_NAME);
	}

	async save() {
		await saveObjectToJsonInGitHub(
			this.mysteryBoxes,
			MysteryBoxRepository.REPO_NAME
		);
	}

	/**
	 * Returns a list of all mystery box objects in the game.
	 * @returns {Promise<Array<{
	 * 	id: number,
	 * 	name: string,
	 * 	characterOdds: Record<string, number>,
	 *  tokenCost: number,
	 *  unlockCondition: string | null
	 * }>>} An array of mystery box objects.
	 */
	async getMysteryBoxes() {
		await this.load();
		return this.mysteryBoxes;
	}

	/**
	 * Given a mystery box id, returns the corresponding mystery box object.
	 * @param {number} id - The id of the mystery box to return.
	 * @returns {Promise<{
	 * 	id: number,
	 * 	name: string,
	 * 	characterOdds: Record<string, number>,
	 *  tokenCost: number,
	 *  unlockCondition: string | null
	 * } | undefined>} The mystery box object with the given id or undefined if no such object exists.
	 */
	async getMysteryBoxById(id) {
		const mysteryBoxes = await this.getMysteryBoxes();
		return mysteryBoxes.find(mysteryBox =>
			mysteryBox.id === id
		);
	}
}

module.exports = MysteryBoxRepository;