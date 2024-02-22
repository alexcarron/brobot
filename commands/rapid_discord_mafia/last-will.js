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
	}),
	NewLine: new Parameter({
		type: "boolean",
		name: "on-new-line",
		description: "Whether the added contents will be on a new line",
		isRequired: false,
	}),
}
const Parameters = {
	Create: new Parameter({
		type: "subcommand",
		name: "create",
		description: "Create a new last will",
		subparameters: [
			Subparameters.Contents,
		]
	}),
	Add: new Parameter({
		type: "subcommand",
		name: "add",
		description: "Add to your existing last will",
		subparameters: [
			Subparameters.AddedContents,
			Subparameters.NewLine,
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

	if (!player.isAlive) {
		return await interaction.editReply("Dead people can't write last wills");
	}

	if (interaction.options.getSubcommand() === Parameters.Create.name) {
		const contents = interaction.options.getString(Subparameters.Contents.name);

		console.log({contents});

		if (contents.includes("`")) {
			return await interaction.editReply(`Your last will contents\n${contents}\nincludes a backtick (\`) which is illegal.`)
		}

		player.last_will = contents;
	}
	else if (interaction.options.getSubcommand() === Parameters.Add.name) {
		let added_contents = interaction.options.getString(Subparameters.AddedContents.name);
		let isOnNewLine = interaction.options.getBoolean(Subparameters.NewLine.name);

		if (added_contents.includes("`")) {
			return await interaction.editReply(`Your last will contents:\n${contents}\nincludes a backtick (\`) which is illegal.`)
		}

		if (isOnNewLine) {
			added_contents = "\n" + added_contents;
		}
		player.last_will += added_contents;
	}
	else if (interaction.options.getSubcommand() === Parameters.Remove.name) {
		player.last_will = "";
	}

	await global.Game.log(`**${player.name}** updated their last will to be \n\`\`\`\n${player.last_will}\n\`\`\``);
	return await interaction.editReply(`Your last will is now: \n\`\`\`\n${player.last_will}\n\`\`\``);
};
module.exports = command;