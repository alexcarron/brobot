const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder  } = require('discord.js');
const ProposedCreatoinRule = require('../../modules/sandbox/ProposedCreationRule');
const Host = require('../../modules/sandbox/Host');
const { confirmAction } = require('../../modules/functions');
const ProposedModificationRule = require('../../modules/sandbox/ProposedModificationRule');
const ProposedRemovalRule = require('../../modules/sandbox/ProposedRemovalRule');
const wait = require('node:timers/promises').setTimeout;

const Parameters = {
	Name: {
		Name: "name",
		Description: "The name you will forever go by. (You cannot change this, so choose wisely)"
	}
}



module.exports = {
	required_roles: ["Outsider"],
	data: new SlashCommandBuilder()
		.setName('become-host')
		.setDescription('(Outsiders Only) Agree to become a host of Sandbox and follow all official rules.')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.setDMPermission(false)
		.addStringOption( option =>
			option
				.setName(Parameters.Name.Name)
				.setDescription(Parameters.Name.Description)
				.setRequired(true)
				.setMaxLength(32)
		),
	async execute(interaction) {
		await interaction.deferReply({ephemeral: true});

		const user_id = interaction.user.id;
		const name = interaction.options.getString(Parameters.Name.Name);

		if (global.Sandbox.hosts.some(host => host.id === user_id)) {
			return interaction.editReply("You're already a host...");
		}

		if (
			!await confirmAction({
				interaction,
				message: `Are you sure want to become a host, be called **${name}** forever, and be forced to follow the official rules?`,
				confirm_txt: "Become a Host!",
				cancel_txt: "Cancel",
				confirm_update_txt: "You have officially become a host!",
				cancel_update_txt: "Action canceled.",
			})
		) {
			return
		}

		const host = new Host({
			name: name,
			id: user_id,
		});

		await global.Sandbox.addHost(host);
	},
};