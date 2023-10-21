const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder  } = require('discord.js');
const Host = require('../../modules/gameforge/Host');
const { confirmAction } = require('../../modules/functions');
const ids = require(`../../databases/ids.json`)

const Parameters = {
	Name: {
		Name: "name",
		Description: "The name you will forever go by. (You cannot change this, so choose wisely)"
	}
}



module.exports = {
	required_roles: ["Outsider"],
	required_servers: [ids.servers.gameforge],
	data: new SlashCommandBuilder()
		.setName('become-host')
		.setDescription('(Outsiders Only) Agree to become a host of GameForge and follow all official rules.')
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

		if (global.GameForge.hosts.some(host => host.id === user_id)) {
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

		await global.GameForge.addHost(host);
	},
};