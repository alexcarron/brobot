module.exports = {
  name: 'giveviewersroles',
	aliases: ['llpointroles', 'tierroles', 'givetiers'],
	description: "Gives all viewers their tier roles.",
	isRestrictedToMe: true,
	// eslint-disable-next-line no-unused-vars
	async execute(message, args) {
		await global.LLPointManager.giveTiersToViewers()
	},
};

