const Parameter = require("../../services/command-creation/parameter.js");
const SlashCommand = require("../../services/command-creation/slash-command.js");
const { GameStates } = require("../../modules/enums");
const { deferInteraction } = require("../../utilities/discord-action-utils");
const
	ids = require(`../../bot-config/discord-ids.js`);



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

		// global.game_manager.state = GameStates.ReadyToBegin;
	}

	if (global.game_manager.state !== GameStates.SignUp) {
		return await interaction.editReply("We're not in sign-ups so you can't join just yet.");
	}

	global.game_manager.addPlayerToGame(player_name, player_id, interaction, isFakeUser);

	await interaction.editReply(`**${player_name}** has been added to the game`);
}


module.exports = command;
// module.exports = command.getSlashCommand();