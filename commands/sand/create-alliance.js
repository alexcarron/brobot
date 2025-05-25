const { CommandInteraction, ChannelType, PermissionFlagsBits } = require("discord.js");
const ids = require("../../bot-config/discord-ids");
const { ParameterType, Parameter } = require("../../services/command-creation/parameter");
const SlashCommand = require("../../services/command-creation/slash-command");
const { deferInteraction, createChannel, createPermission: createPermissionOverwrites, editReplyToInteraction, createEveryoneDenyViewPermission, addPermissionToChannel } = require("../../utilities/discord-action-utils");
const { fetchChannel, fetchGuild, fetchUser, getUserParamValue, getEveryoneRole } = require("../../utilities/discord-fetch-utils");

const Parameters = {
	Contestant1: new Parameter({
		type: ParameterType.USER,
		name: "contestant-1",
		description: "A contestant to be included in the alliance",
		isRequired: false,
	}),
	Contestant2: new Parameter({
		type: ParameterType.USER,
		name: "contestant-2",
		description: "A contestant to be included in the alliance",
		isRequired: false,
	}),
	Contestant3: new Parameter({
		type: ParameterType.USER,
		name: "contestant-3",
		description: "A contestant to be included in the alliance",
		isRequired: false,
	}),
}

module.exports = new SlashCommand({
	name: "create-alliance",
	description: "Create an alliance with given contestants",
	required_roles: ['Contestant'],
	required_serveres: [ids.sandSeason3.guild],
	parameters: [
		Parameters.Contestant1,
		Parameters.Contestant2,
		Parameters.Contestant3
	],
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const commandUser = interaction.user;
		const contestantIDs = [commandUser.id];
		const allianceName = 'alliance';

		for (const parameter of Object.values(Parameters)) {
			const contestant = getUserParamValue(interaction, parameter.name);
			if (!contestant) {
				continue;
			}

			contestantIDs.push(contestant.id);
		}

		const sandSeason3Guild = await fetchGuild(ids.sandSeason3.guild);

		const newChannel = await createChannel({
			guild: sandSeason3Guild,
			name: allianceName,
			permissions: [
				createEveryoneDenyViewPermission(sandSeason3Guild),
			],
			parentCategory: ids.sandSeason3.categories.alliance,
		});

		for (const contestantID of contestantIDs) {
			addPermissionToChannel({
				channel: newChannel,
				userOrRoleID: contestantID,
				allowedPermissions: [PermissionFlagsBits.ViewChannel],
			})
		}

		const logChannel = await fetchChannel(sandSeason3Guild, ids.sandSeason3.channels.log);
		logChannel.send(`${commandUser} made an alliance`);

		await editReplyToInteraction(interaction,
			`Alliance "${allianceName}" created with contestants: ${contestantIDs.map(id => `<@${id}>`).join(', ')}`
		);
	},
});