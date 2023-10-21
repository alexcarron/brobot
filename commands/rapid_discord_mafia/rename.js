const validator = require('../../utilities/validator.js');
const { rdm_server_id } = require("../../databases/ids.json"),
	ids = require("../../databases/ids.json"),
	{ RDMRoles, GameStates } = require("../../modules/enums.js");
const SlashCommand = require('../../modules/commands/SlashCommand.js');
const Parameter = require('../../modules/commands/Paramater.js');


const command = new SlashCommand({
	name: "rename",
	description: "Change your name while still in sign-ups",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_categories = [ids.rapid_discord_mafia.category.player_action];
command.required_roles = [RDMRoles.Living];
command.parameters = [
	new Parameter({
		type: "string",
		name: "name",
		description: "The name you want to replace your orignial name with"
	}),
];
command.execute = async function execute(interaction) {
	await interaction.deferReply({ephemeral: true});

	let player_id = interaction.user.id,
		old_player_name = global.Game.Players.getPlayerFromId(player_id).name,
		new_player_name = interaction.options.getString(command.parameters[0].name);


	if ( global.Game.state !== GameStates.SignUp ) {
		return await interaction.editReply(`Sorry, you can only change your name during sign-ups.`);
	}

	if ( this.Players && this.Players.get(new_player_name) ) {
		return await interaction.editReply(`The name, **${new_player_name}**, already exists.`)
	}

	const validator_result = validator.validateName(new_player_name);
	if (validator_result !== true)
		return await interaction.editReply(validator_result);

	await global.Game.Players.renamePlayer(old_player_name, new_player_name);

	await interaction.editReply(`You, **${old_player_name}**, changed your name to **${new_player_name}**.`);
	await global.Game.announceMessages(`**${old_player_name}** changed their name to **${new_player_name}**.`);
}

module.exports = command;