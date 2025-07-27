const { PermissionFlagsBits } = require("discord.js");
const ids = require("../../bot-config/discord-ids");
const { ParameterType, Parameter } = require("../../services/command-creation/parameter");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { deferInteraction, createChannel, editReplyToInteraction, createEveryoneDenyViewPermission, addPermissionToChannel, memberHasRole } = require("../../utilities/discord-action-utils");
const { fetchGuild, getUserParamValue, fetchGuildMember, fetchTextChannel, getRequiredStringParam } = require("../../utilities/discord-fetch-utils");
const { createListFromWords } = require("../../utilities/text-formatting-utils");

const Parameters = {
	Name: new Parameter({
		type: ParameterType.STRING,
		name: "name",
		description: "The name of the alliance",
		isRequired: true,
	}),
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
	Contestant4: new Parameter({
		type: ParameterType.USER,
		name: "contestant-4",
		description: "A contestant to be included in the alliance",
		isRequired: false,
	}),
}

module.exports = new SlashCommand({
	name: "create-alliance",
	description: "Create an alliance with given contestants",
	required_roles: [ids.sandSeason3.roles.contestant],
	required_servers: [ids.sandSeason3.guild],
	parameters: [
		Parameters.Name,
		Parameters.Contestant1,
		Parameters.Contestant2,
		Parameters.Contestant3,
		Parameters.Contestant4,
	],
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const sandSeason3Guild = await fetchGuild(ids.sandSeason3.guild);
		const commandUser = interaction.user;
		let contestantIDs = [commandUser.id];
		const allianceName = getRequiredStringParam(interaction, Parameters.Name.name);

		const userParameters = Object.values(Parameters).filter(parameter => parameter.type === ParameterType.USER);
		for (const parameter of userParameters) {
			const contestant = getUserParamValue(interaction, parameter.name);
			if (!contestant) {
				continue;
			}

			contestantIDs.push(contestant.id);
		}

		// Filter duplicate IDs
		contestantIDs = [...new Set(contestantIDs)];

		// Filter IDs without Contestant role
		for (const index in contestantIDs) {
			const contestantID = contestantIDs[index];
			const member = await fetchGuildMember(sandSeason3Guild, contestantID);
			const isContestant = await memberHasRole(member, ids.sandSeason3.roles.contestant, true);

			if (!isContestant) {
				editReplyToInteraction(interaction,
					`User <@${contestantID}> is not a valid contestant. Please provide valid contestants.`
				)
				return;
      }
		}

		// Stop if no contestant IDs
		if (contestantIDs.length < 2) {
      await editReplyToInteraction(interaction,
				'You must specify at least one contestant to make an alliance with.'
			);
      return;
    }

		const newChannel = await createChannel({
			guild: sandSeason3Guild,
			name: allianceName,
			permissions: [
				createEveryoneDenyViewPermission(sandSeason3Guild),
			],
			parentCategory: ids.sandSeason3.categories.alliance,
		});

		for (const contestantID of contestantIDs) {
			await addPermissionToChannel({
				channel: newChannel,
				userOrRoleID: contestantID,
				allowedPermissions: [PermissionFlagsBits.ViewChannel],
			})
		}

		const logChannel = await fetchTextChannel(sandSeason3Guild, ids.sandSeason3.channels.log);
		logChannel.send(`${commandUser} made an alliance ${newChannel} with: ${
			createListFromWords(contestantIDs.map(id => `<@${id}>`))
		}`);

		newChannel.send(
			`${commandUser} created this alliance with ${
				createListFromWords(contestantIDs.map(id => `<@${id}>`))
			}`
		);

		await editReplyToInteraction(interaction,
			`Alliance ${newChannel} created with contestants: ${contestantIDs.map(id => `<@${id}>`).join(', ')}`
		);
	},
});