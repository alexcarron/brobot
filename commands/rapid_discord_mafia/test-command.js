const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../modules/commands/SlashCommand.js");
const Parameter = require("../../modules/commands/Paramater.js");

const ids = require(`${global.paths.databases_dir}/ids.json`);

const command = new SlashCommand({
	name: "test-command",
	description: "Test a command at any point as any person",
});
command.required_permissions = [PermissionFlagsBits.AddReactions];
command.parameters = [
	new Parameter({
		type: "subcommand",
		name: "join",
		description: "Test the /join command",
		subparameters: [
			new Parameter({
				type: "string",
				name: "player-name",
				description: "The name you want the player to join with",
				isRequired: true
			}),
			new Parameter({
				type: "string",
				name: "player-id",
				description: "ID of the user joining if not a fake user",
				isRequired: false
			}),
			new Parameter({
				type: "boolean",
				name: "fake-user",
				description: "If the user joining is a fake test user",
				isRequired: false
			}),
		]
	}),
	new Parameter({
		type: "subcommand",
		name: "use",
		description: "Test the /use command",
		subparameters: [
			new Parameter({
				type: "string",
				name: "player-name",
				description: "The name of the player you want to do the action",
			}),
			new Parameter({
				type: "string",
				name: "ability-name",
				description: "Name of the ability being performed",
			}),
			new Parameter({
				type: "string",
				name: "ability-arguments",
				description: "The arguments of the ability your performing. (Ex: \"player-killing: Dave, player-eating: Bob\") ",
				isRequired: false
			}),
		]
	}),
	new Parameter({
		type: "subcommand",
		name: "vote",
		description: "Test the /vote command",
		subparameters: [
			new Parameter({
				type: "string",
				name: "player-name",
				description: "The name of the player you want to vote",
			}),
			new Parameter({
				type: "string",
				name: "vote",
				description: "The vote you want the player to make",
			}),
		]
	}),
	new Parameter({
		type: "subcommand",
		name: "fake-joins",
		description: "Add a bunch of fake test users at once",
		subparameters: [
			new Parameter({
				type: "string",
				name: "player-names",
				description: "All the names of test users you want to fake join (Seperated by spaces)",
			}),
		]
	}),
];
command.execute = async function execute(interaction) {
	if (interaction) {
		try {
			await interaction.deferReply({ephemeral: true});
		}
		catch {
			console.log("Failed Defer: Reply Already Exists");
			await interaction.editReply({ content: "Sending Command...", ephemeral: true});
		}
	}

	const subcommand = interaction.options.getSubcommand();
	const FakeJoinSubcommand = command.parameters[3];

	// Fake Joins
	if (subcommand === FakeJoinSubcommand.name) {
		const player_names_str = await interaction.options.getString(
			FakeJoinSubcommand.subparameters[0].name
		);


		const player_names = player_names_str.split(" ");

		const join_command = require(`./join.js`);
		// const delete_chnls_command = require(`../admin/deletechannels.js`);

		// await delete_chnls_command.execute(interaction, ["1031365761320624132"], true);

		console.log({player_names_str, player_names});

		for (let player_name of player_names) {
			join_command.execute(interaction, [ids.users.LL, player_name, true], true);
		}
	}
	else {
		let command;

		try {
			command = require(`./${subcommand}.js`);
		}
		catch {
			return interaction.editReply(`\`${subcommand}\` is an invalid command name.`)
		}

		command.execute(interaction, true);
	}

};

module.exports = command;