const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, channelMention  } = require('discord.js');
const ProposedCreatoinRule = require('../../modules/gameforge/ProposedCreationRule');
const { confirmAction, getCurrentTimeCronExpression } = require('../../modules/functions');
const ProposedModificationRule = require('../../modules/gameforge/ProposedModificationRule');
const ProposedRemovalRule = require('../../modules/gameforge/ProposedRemovalRule');
const SlashCommand = require('../../modules/commands/SlashCommand');
const Parameter = require('../../modules/commands/Paramater');
const ids = require(`../../databases/ids.json`);
const Rule = require('../../modules/gameforge/Rule');
const ProposedRule = require('../../modules/gameforge/ProposedRule');
const GameForge = require('../../modules/gameforge/gameforge');
const { GameForgePhases, XPTaskKeys, Subphases } = require('../../modules/enums');

const Parameters = {
	ProposalEditing: new Parameter({
		type: "string",
		name: "proposal-editing",
		description: "The proposal you want to edit",
		isAutocomplete: true,
	}),
	EditedProposal: new Parameter({
		type: "string",
		name: "edited-proposal",
		description: "The new contents of your proposal",
	})
}
const command = new SlashCommand({
	name: "edit-proposal",
	description:  "Edit a rule proposal you made.",
});
command.required_servers = [ids.servers.gameforge];
command.required_roles = ["Host"];
command.required_permissions = [PermissionFlagsBits.SendMessages];
command.parameters = [
	Parameters.ProposalEditing,
	Parameters.EditedProposal,
]
command.execute = async function(interaction) {
	await interaction.deferReply({ephemeral: true});

	const user_id = interaction.user.id;
	const num_proposal_editing = interaction.options.getString(Parameters.ProposalEditing.name);
	const edited_proposal_description = interaction.options.getString(Parameters.EditedProposal.name);

	if (global.GameForge.phase === GameForgePhases.Voting) {
		return await interaction.editReply("Sorry, we're in the voting phase, so you can't edit your proposals.")
	}

	if (num_proposal_editing === "N/A") {
		return await interaction.editReply("Sorry, you have no proposals to edit.")
	}

	const proposal_editing_index = global.GameForge.proposed_rules.findIndex(proposed_rule => proposed_rule.number === parseInt(num_proposal_editing));
	let proposal_editing = global.GameForge.proposed_rules[proposal_editing_index];

	const confirm_message = `Are you sure want to edit your proposal from \`${proposal_editing.description}\` to \`${edited_proposal_description}\`?` + "\n" + ProposedRule.HELP_MESSAGE;

	if (confirm_message.length >= 2000) {
		confirm_message = `Are you sure want to edit your proposal to \`${edited_proposal_description}\`?` + "\n" + ProposedRule.HELP_MESSAG;
	}

	if (confirm_message.length >= 2000) {
		confirm_message = `Are you sure want to edit your proposal?` + "\n" + ProposedRule.HELP_MESSAG;
	}

	if (
		!await confirmAction({
			interaction,
			message: confirm_message,
			confirm_txt: "Confirm Edit of Proposal",
			cancel_txt: "Cancel",
			confirm_update_txt: "Proposal edited.",
			cancel_update_txt: "Edit canceled.",
		})
	) {
		return
	}

	if (proposal_editing instanceof ProposedRule) {
		proposal_editing.description = edited_proposal_description;
		await proposal_editing.updateMessage();
		await global.GameForge.announceMessage(
			`Proposed Rule **#${proposal_editing.number}** has edited their proposal description.\n` +
			`https://discord.com/channels/${ids.servers.gameforge}/${ids.gameforge.channels.proposed_rules}/${proposal_editing.message}`
		);
	}
}
command.autocomplete = async function(interaction) {
	let autocomplete_values = [];
	const focused_param = interaction.options.getFocused(true);
	console.log({focused_param});
	if (!focused_param) return;

	const host = global.GameForge.getHostByID(interaction.user.id);

	if (!host) {
		return await interaction.respond(
			[{name: "Sorry, your not allowed to use this command", value: "N/A"}]
		);
	}

	autocomplete_values = global.GameForge.proposed_rules
		.filter(rule => rule.proposer.id === host.id)
		.map(rule => {
			let rule_description = rule.description;
			let min_description_length = 100 - (`${rule.number}: `).length;

			if (rule_description.length > min_description_length) {
				rule_description = rule_description.substring(0, min_description_length-4) + "...";
			}

			return {name: `${rule.number}: ${rule_description}`, value: `${rule.number}`}
		})
		.filter(autocomplete_entry => autocomplete_entry.name.toLowerCase().startsWith(focused_param.value.toLowerCase()));

	if (Object.values(autocomplete_values).length <= 0) {
		autocomplete_values = [{name: "Sorry, you have no proposals to choose from", value: "N/A"}];
	}
	else if (Object.values(autocomplete_values).length > 25) {
		autocomplete_values.splice(25);
	}

	await interaction.respond(
		autocomplete_values
	);

}

module.exports = command;