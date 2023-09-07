const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder  } = require('discord.js');
const Parameter = require('../../modules/commands/Paramater');
const wait = require('node:timers/promises').setTimeout;


// const Parameters = {
// 	Name: new Parameter({}),
// }
//
// const command = new SlashCommand({
// 	name: "join",
// 	description: "Join a game of Rapid Discord Mafia and choose your name",
// });
// command.parameters = [
// 	Parameters.Name,
// ]
// module.exports = command;

// Move command properties out
// Copy Paste Enums & command
// SlashCommand Module
// Set properties from command porperties
// Set parameters
// Move execute
// message -> interaction
// await deferInteraction(interaction);
// interaction.author -> interaciton.user
// interaction.channel.send -> interaction.editReply
// Get args by
// interaction.options.getString(Parameters.Phase.name);


const Command = {
	name: "slash-test",
	description: "A slash command to test SlashCommand features.",
	cooldown: 5*60,
}

const Parameters = {
	One: {
		name: "one",
		description: "Info about a user",
	},
	Two: {
		name: "two",
		description: "Info about a user",
	},
	SubCommandOne: "one",
	SubCommandTwo: "two",
	AutocompleteStrOne: "query",
	AutocompleteStrTwo: "version",
}


module.exports = {
	cooldown: Command.cooldown,
	data: new SlashCommandBuilder()
		.setName('slash-test')
		.setDescription('(Admin Only) A slash command which tests slash command features.') // Description must be 100 characters or less
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator | PermissionFlagsBits.KickMembers) // Sets what permission people need
		.setDMPermission(false) // Sets whether or not the command is avaiable in DMs
		// .addStringOption( option =>
		// 	option
		// 		.setName("Invalid Option")
		// 		.setDescription("An invalid option because there is subcommand options")
		// )
		.addSubcommand(subcommand =>
			subcommand
				.setName(Parameters.SubCommandOne) // You must use different names for each optoin
				.setDescription('Info about a user')
				.addStringOption( option =>
					option
						.setName('input')
						.setDescription("description")
						.addChoices(
							{ name: 'Funny', value: 'gif_funny' },
							{ name: 'Meme', value: 'gif_meme' },
							{ name: 'Movie', value: 'gif_movie' },
						)
						.setRequired(true) // Required options must be placed before non-required ones
				)
				.addStringOption( option =>
					option
						.setName(Parameters.AutocompleteStrOne)
						.setDescription("description")
						.setAutocomplete(true) // Autocompletes input
						.setMinLength(2)
						.setMaxLength(2000)
						.setRequired(true) // Required options must be placed before non-required ones
				)
				.addStringOption( option =>
					option
						.setName(Parameters.AutocompleteStrTwo)
						.setDescription("version")
						.setAutocomplete(true) // Autocompletes input
						.setRequired(true) // Required options must be placed before non-required ones
				)
				.addChannelOption(option =>
					option
						.setName('channel')
						.setDescription('The channel to echo into')
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true) // Required options must be placed before non-required ones
				)
				.addAttachmentOption(option =>
					option
						.setName('attachment')
						.setDescription('The attachment to echo into')
				)
				.addBooleanOption(option =>
					option
						.setName('boolean')
						.setDescription('The boolean to echo into')
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName(Parameters.AutocompleteStrTwo)
				.setDescription('Info about the server')
				.addIntegerOption(option =>
					option
						.setName('integer')
						.setDescription('The integer to echo into')
						.setMinValue(10)
				)
				.addMentionableOption(option => // Any mentionable user, role, everyone, etc.
					option
						.setName('mentionable')
						.setDescription('The mentionable to echo into')
				)
				.addNumberOption(option =>
					option
						.setName('number')
						.setDescription('The number to echo into')
						.setMaxValue(100)
				)
				.addRoleOption(option =>
					option
						.setName('role')
						.setDescription('The role to echo into')
				)
				.addUserOption(option =>
					option
						.setName('user')
						.setDescription('The user to echo into')
				)
		),
	async execute(interaction) { // Bot must reply within 3 seconds unless deffered and cannot reply multiple times


		await interaction.deferReply({ephemeral: false}); // Shows Brobot is thinging...
		// Ephemeral hides response from other members when true

		await wait(4000);

		await interaction.editReply('Pong!');

		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild

		await interaction.channel.send( // Sends message to same channel as slash command but does not count as a response
			`This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`
		);


		await interaction.followUp({ // .followUp must be used to send a second reply
			content: 'Secret Pong!', // message contents
			ephemeral: true // Hides response from other members only if true
		}).then(msg => {
			console.log(msg.id)
			// Cannot edit ephemeral messages
			// Cannot edit followUp with .editReply()
			// msg.edit("Edited the follow up message");
	});


		await wait(1000); // Waits 2 seconds

		await interaction.editReply('Pong again!'); // Edits reply

		await wait(3000);

		const message = await interaction.fetchReply(); // Fetches the message of the reply. Can be used to add reactions
		console.log(message.id)

		await interaction.deleteReply(); // Removes the initial reply
		// Ephemeral responses cannot be deleted.

		if (interaction.options.getSubcommand() === 'one') { // Checks which subcommand was used
			const input = interaction.options.getString('input'); // Get paramaters from slash command by name
			const auto_input = interaction.options.getString(Parameters.AutocompleteStrOne);
			const channel = interaction.options.getChannel('channel');
			const attachment = interaction.options.getAttachment('attachment');

			interaction.channel.send(`${input} ${auto_input} ${channel} ${attachment}`);
		}
		else if (interaction.options.getSubcommand() === 'two') {
			const mentionable = interaction.options.getMentionable('mentionable'); // Get paramaters from slash command by name
			const integer = interaction.options.getInteger('integer');
			const number = interaction.options.getNumber('number');
			const role = interaction.options.getRole('role');

			interaction.channel.send(`${mentionable} ${integer} ${number} ${role}`);
		}



		const confirm_button = new ButtonBuilder() // Create buttons under your message
			.setCustomId('confirm') // Unique identifier
			.setLabel('Confirm Ban') // Name shown on button
			.setStyle(ButtonStyle.Danger);

		const cancel_button = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Secondary);

		const link_button = new ButtonBuilder()
			// Not custom id when URL
			.setLabel('Link')
			.setURL('https://youtube.com/LLGameShows') // Link button goes to
			.setStyle(ButtonStyle.Link);

		const primary_button = new ButtonBuilder()
			.setCustomId('primary')
			.setLabel('Primary')
			.setStyle(ButtonStyle.Primary)
			.setEmoji('1139255979943407626'); // Adds custom emoji to button. Type \EMOJI to get emoji ID

		const disabled_button = new ButtonBuilder()
			.setCustomId('disbaled')
			.setLabel('Disabled')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(true); // Grays out button, preventing it from being used

		const success_button = new ButtonBuilder()
			.setCustomId('success')
			.setLabel('Success')
			.setStyle(ButtonStyle.Success);

		const action_row = new ActionRowBuilder()
			.addComponents(cancel_button, confirm_button);

		const action_row2 = new ActionRowBuilder()
			.addComponents(link_button, primary_button, success_button, disabled_button);

		await wait(3000);

		interaction.followUp({
			content: `Are you sure you want to run this test slash command?`,
			components: [action_row, action_row2],
		})
	},
	async autocomplete(interaction) { // Runs before slash command is sent when autocompleting options
		// Must receive a response within 3 seconds
		// You cannot defer the response
		// Only 25 shown options maximum

		const focusedOption = interaction.options.getFocused(true);

		console.log(focusedOption);

		let choices;



		// if (interaction.options.getSubcommand() === 'one') { // Checks which subcommand was used
		// 	const string = interaction.options.getString('input') ?? null;
		// 	const boolean = interaction.options.getBoolean('boolean') ?? null;

		// 	const channel = interaction.options.get('channel') ? interaction.options.get('channel').value : null; // Can only get snowflake value before running slash command
		// 	const attachment = interaction.options.get('attachment') ? interaction.options.get('attachment').value : null; // Can only get snowflake value before running slash command

		// 	interaction.channel.send(`${string} ${boolean} ${channel} ${attachment}`);
		// }
		// else if (interaction.options.getSubcommand() === 'two') {
		// 	const mentionable = interaction.options.get('mentionable') ? interaction.options.get('mentionable').value : null;  // Can only get snowflake value before running slash command
		// 	const integer = interaction.options.getInteger('integer') ?? null;
		// 	const number = interaction.options.getNumber('number') ?? null;
		// 	const role = interaction.options.get('role') ? interaction.options.get('role').value : null; // Can only get snowflake value before running slash command

		// 	interaction.channel.send(`${mentionable} ${integer} ${number} ${role}`);
		// }


		if (focusedOption.name === Parameters.AutocompleteStrOne) {
			choices = ['Popular Topics: Threads', 'Sharding: Getting started', 'Library: Voice Connections', 'Interactions: Replying to slash commands', 'Popular Topics: Embed preview'];
		}

		if (focusedOption.name === Parameters.AutocompleteStrTwo) {
			choices = ['v9', 'v11', 'v12', 'v13', 'v14'];
		}

		const filtered = choices.filter(choice => choice.toLowerCase().startsWith(focusedOption.value.toLowerCase()));
		console.log(filtered);
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},
};