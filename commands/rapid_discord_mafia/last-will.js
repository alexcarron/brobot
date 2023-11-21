const Parameter = require("../../modules/commands/Paramater");
const ids = require("../../databases/ids.json");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { deferInteraction } = require("../../modules/functions");

const Subparameters = {
	Contents: new Parameter({
		type: "string",
		name: "contents",
		description: "The contents of your last will",
	}),
	AddedContents: new Parameter({
		type: "string",
		name: "added-contents",
		description: "The added contents of your last will",
		isAutocomplete: true,
	}),
}
const Parameters = {
	Create: new Parameter({
		type: "subcommand",
		name: "create",
		description: "Create a new last will",
		subparameters: [
			Subparameters.Contents
		]
	}),
	Add: new Parameter({
		type: "subcommand",
		name: "add",
		description: "Add to your existing last will",
		subparameters: [
			Subparameters.AddedContents
		]
	}),
	Remove: new Parameter({
		type: "subcommand",
		name: "remove",
		description: "Remove your existing last will"
	}),
}

const command = new SlashCommand({
	name: "last-will",
	description: "Edit your last will in Rapid Discord Mafia",
});
command.parameters = [
	Parameters.Create,
	Parameters.Add,
	Parameters.Remove,
];

command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_roles = [ids.rapid_discord_mafia.roles.living];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const player = global.Game.Players.getPlayerFromId(interaction.user.id);
	console.log({player})
	if (!player.isAlive) {
		return await interaction.editReply("Dead people can't write last wills");
	}

	if (interaction.options.getSubcommand() === Parameters.Create.name) {
		const contents = interaction.options.getString(Subparameters.Contents.name);

		if (contents.includes("`")) {
			return await interaction.editReply(`Your last will contents\n${contents}\nincludes a backtick (\`) which is illegal.`)
		}

		player.last_will = contents;
	}
	else if (interaction.options.getSubcommand() === Parameters.Add.name) {
		const added_contents = interaction.options.getString(Subparameters.AddedContents.name);

		if (added_contents.includes("`")) {
			return await interaction.editReply(`Your last will contents:\n${contents}\nincludes a backtick (\`) which is illegal.`)
		}

		player.last_will += added_contents;
	}
	else if (interaction.options.getSubcommand() === Parameters.Remove.name) {
		player.last_will = "";
	}

	global.Game.log(`**${player.name}** updated their last will to be \n\`\`\`\n${player.last_will}\n\`\`\``);
	return await interaction.editReply(`Your last will is now: \n\`\`\`\n${player.last_will}\n\`\`\``);
};
command.autocomplete = async function(interaction) {
	const focused_param = await interaction.options.getFocused(true);
	console.log({focused_param});

	const player = global.Game.Players.getPlayerFromId(interaction.user.id);

	if (!player || !player.isAlive) {
		return await interaction.respond(
			[{name: "Sorry, your not allowed to use this command", value: "N/A"}]
		);
	}

	let curr_last_will = player.last_will;

	autocomplete_values = [{name: curr_last_will + focused_param.value, value: focused_param.value}];

	if (autocomplete_values[0].name.length <= 0) {
		autocomplete_values = [{name: "Your last will is currently empty", value: ""}]
	}

	if (autocomplete_values[0].name.length >= 100) {
		autocomplete_values = [{name: autocomplete_values[0].name.substring(0, 96) + "...", value: ""}]
	}

	console.log({autocomplete_values});

	await interaction.respond(
		autocomplete_values
	);
};

module.exports = command;