// ! ALL ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————


module.exports = {
	name: 'updatetiers',
	description: 'Update LL [Point Tiers]',
	isServerOnly: true,
	isRestrictedToMe: true,
	execute(message, args) {
		global.LLPointManager.giveTiersToViewers();
	}
};