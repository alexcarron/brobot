// eslint-disable-next-line no-unused-vars
const fs = require('fs');
module.exports = {
    name: 'setgame',
    isServerOnly: true,
    required_permission: 'ADMINISTRATOR',
    usages: [''],
	isRestrictedToMe: true,
	// eslint-disable-next-line no-unused-vars
	async execute(message, args) {
		const comma_args = args.join(' ').split(', ');
		const property = comma_args[0];
		const value = comma_args[1];

		global.Game[property] = value;

		global.Game.logGame();
	},
};