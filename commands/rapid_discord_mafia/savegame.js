module.exports = {
	name: 'savegame',
    aliases: ['save'],
    description: 'Save Rapid Discord Mafia game data.',
	isRestrictedToMe: true,
	async execute(message) {

		await global.Game.saveGameDataToDatabase();
		message.channel.send("Game succesfully saved.");
		global.Game.logGame();

    }
};