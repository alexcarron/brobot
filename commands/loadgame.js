module.exports = {
	name: 'loadgame',
    aliases: ['load'],
    description: 'Load Rapid Discord Mafia game from last save.',
	isRestrictedToMe: true,
	async execute(message) {

		await global.Game.loadGameDataFromDatabase();
		message.channel.send("Game succesfully loaded.");
		global.Game.logGame();

    }
};