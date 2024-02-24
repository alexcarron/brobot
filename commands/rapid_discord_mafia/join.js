const Parameter = require("../../modules/commands/Paramater");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { GameStates } = require("../../modules/enums");
const { deferInteraction } = require("../../modules/functions");
const
	ids = require(`../../data/ids.json`);



const command = new SlashCommand({
	name: "join",
	description: "Join a game of Rapid Discord Mafia and choose your name",
});

command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_roles = ['Spectators'];
command.parameters = [
	new Parameter({
		type: "string",
		name: "name",
		description: "What you want to be called during the game"
	})
]
command.execute = async function execute(interaction, args, isTest) {
	await deferInteraction(interaction);

	global.Game.logPlayers();

	let player_id, player_name, isFakeUser;

	if (!isTest) {
		player_id = interaction.user.id;
		player_name = interaction.options.getString(command.parameters[0].name);
		isFakeUser = false;
	}
	else {
		player_id = interaction.options.getString("player-id") ?? args[0];
		player_name = interaction.options.getString("player-name") ?? args[1];
		isFakeUser = interaction.options.getBoolean("fake-user") ?? args[2];

		if (isFakeUser) {
			isFakeUser = true;
			player_id = ids.users.LL;
		}
		else
			isFakeUser = false;

		// global.Game.state = GameStates.ReadyToBegin;
	}

	if (global.Game.state !== GameStates.SignUp) {
		return await interaction.editReply("We're not in sign-ups so you can't join just yet.");
	}

	global.Game.addPlayerToGame(player_name, player_id, interaction, isFakeUser);

	await interaction.editReply(`**${player_name}** has been added to the game`);
}


module.exports = command;
// module.exports = command.getSlashCommand();