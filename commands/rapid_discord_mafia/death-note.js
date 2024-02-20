const Parameter = require("../../modules/commands/Paramater");
const ids = require("../../data/ids.json");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { deferInteraction } = require("../../modules/functions");
const { autocomplete } = require("./use");

const Subparameters = {
	Contents: new Parameter({
		type: "string",
		name: "contents",
		description: "The contents of your death note",
	}),
	AddedContents: new Parameter({
		type: "string",
		name: "added-contents",
		description: "The added contents of your death note",
		isAutocomplete: true,
	}),
}
const Parameters = {
	Create: new Parameter({
		type: "subcommand",
		name: "create",
		description: "Create a new death note",
		subparameters: [
			Subparameters.Contents
		]
	}),
	Add: new Parameter({
		type: "subcommand",
		name: "add",
		description: "Add to your existing death note",
		subparameters: [
			Subparameters.AddedContents
		]
	}),
	Remove: new Parameter({
		type: "subcommand",
		name: "remove",
		description: "Remove your existing death note"
	}),
}

const command = new SlashCommand({
	name: "death-note",
	description: "Edit your death note in Rapid Discord Mafia",
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
		return await interaction.editReply("Dead people can't write death notes");
	}

	if (interaction.options.getSubcommand() === Parameters.Create.name) {
		const contents = interaction.options.getString(Subparameters.Contents.name);

		if (contents.includes("`")) {
			return await interaction.editReply(`Your death note contents\n${contents}\nincludes a backtick (\`) which is illegal.`)
		}

		player.death_note = contents;
	}
	else if (interaction.options.getSubcommand() === Parameters.Add.name) {
		const added_contents = interaction.options.getString(Subparameters.AddedContents.name);

		if (added_contents.includes("`")) {
			return await interaction.editReply(`Your death note contents:\n${contents}\nincludes a backtick (\`) which is illegal.`)
		}

		player.death_note += added_contents;
	}
	else if (interaction.options.getSubcommand() === Parameters.Remove.name) {
		player.death_note = "";
	}

	return await interaction.editReply(`Your death note is now: \n\`\`\`\n${player.death_note}\n\`\`\``);
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

	let curr_death_note = player.death_note;

	autocomplete_values = [{name: curr_death_note + focused_param.value, value: focused_param.value}];

	if (autocomplete_values[0].name.length <= 0) {
		autocomplete_values = [{name: "Your death note is currently empty", value: ""}]
	}

	console.log({autocomplete_values});

	await interaction.respond(
		autocomplete_values
	);
};

module.exports = command;