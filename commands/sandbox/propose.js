const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, channelMention  } = require('discord.js');
const ProposedCreatoinRule = require('../../modules/sandbox/ProposedCreationRule');
const { confirmAction, getCurrentTimeCronExpression } = require('../../modules/functions');
const ProposedModificationRule = require('../../modules/sandbox/ProposedModificationRule');
const ProposedRemovalRule = require('../../modules/sandbox/ProposedRemovalRule');
const SlashCommand = require('../../modules/commands/SlashCommand');
const Parameter = require('../../modules/commands/Paramater');
const ids = require(`../../databases/ids.json`);
const Rule = require('../../modules/sandbox/Rule');
const ProposedRule = require('../../modules/sandbox/ProposedRule');
const Sandbox = require('../../modules/sandbox/sandbox');

const Parameters = {
	SubCommands: {
		NewRule: "creation",
		ModifiedRule: "modification",
		RuleRemoval: "removal",
		FinalizeRules: "finalize-rules",
		Name: "name",
		Description: "description",
	}
}

const command = new SlashCommand({
	name: "propose-rules",
	description:  "Propose a new, modified, or removed rule.",
});
command.required_servers = [ids.servers.sandbox];
command.required_roles = ["Host"];
command.required_permissions = [PermissionFlagsBits.SendMessages];
command.cooldown = 1*60*60;
command.parameters = [
	new Parameter({
		type: "subcommand",
		name: "creation",
		description: "Propose a new rule for the game to be added.",
		subparameters: [
			new Parameter({
				type: "string",
				name: "rule-description",
				description: "A detailed, clear, and unambiguous description of your proposed new rule."
			}),
			new Parameter({
				type: "integer",
				name: "for-challenge-num",
				description: "The number of the challenge that this rule is for",
				isRequired: false,
				min_value: 1,
				max_value: Sandbox.NUM_CHALLENGES,
			}),
		],
	}),
	new Parameter({
		type: "subcommand",
		name: "modification",
		description: "Propose the modification of an existing official rule for the game.",
		subparameters: [
			new Parameter({
				type: "integer",
				name: "rule-number",
				description: "The identifying number of the offical rule you want modified."
			}),
			new Parameter({
				type: "string",
				name: "new-rule-description",
				description: "The NEW rule description you want to replace that official rule with."
			}),
		],
	}),
	new Parameter({
		type: "subcommand",
		name: "removal",
		description: "Propose the removal of an existing official rule of the game.",
		subparameters: [
			new Parameter({
				type: "integer",
				name: "rule-number",
				description: "The identifying number of the offical rule you want removed."
			}),
			new Parameter({
				type: "string",
				name: "removal-reason",
				description: "A detailed reason why you want that official rule to be removed.."
			}),
		],
	}),
	new Parameter({
		type: "subcommand",
		name: Parameters.SubCommands.Name,
		description: "Propose the name of the game your creating.",
		parameters: [
			new Parameter({
				type: "string",
				name: "game-name",
				description: "A clever name that represents the game."
			}),
		],
	}),
	new Parameter({
		type: "subcommand",
		name: Parameters.SubCommands.Description,
		description: "Propose the description of the game your creating.",
		parameters: [
			new Parameter({
				type: "string",
				name: "game-description",
				description: "A description that gives an overview of how the game works and what will happen."
			}),
		],
	}),
	new Parameter({
		type: "subcommand",
		name: Parameters.SubCommands.FinalizeRules,
		description: "Propose that the official rules of the game should be finalized."
	}),
]
command.execute = async function(interaction) {
	await interaction.deferReply({ephemeral: true});

	const user_id = interaction.user.id;
	const proposer = global.Sandbox.getHostByID(user_id);

	if (global.Sandbox.phase === Sandbox.Phases.Voting) {
		return await interaction.editReply("Sorry, we're in the voting phase. Please discuss your proposal and vote on existing ones.")
	}

	if (interaction.options.getSubcommand() === Parameters.SubCommands.NewRule) {
		let rule_description;

		if (interaction.options.getSubcommand() === Parameters.SubCommands.Name) {
			if (global.Sandbox.phase === Sandbox.Phases.Brainstorming) {
				game_name = interaction.options.getString('game-name')
				rule_description = ProposedRule.NAME_PHRASE + game_name;
			}
			else {
				return await interaction.editReply("We're past the brainstorming phase, so you cannot propose a new name.");
			}
		}
		else if (interaction.options.getSubcommand() === Parameters.SubCommands.Description) {
			if (global.Sandbox.phase === Sandbox.Phases.Brainstorming) {
				description_name = interaction.options.getString('game-description')
				rule_description = ProposedRule.DESCRIPTION_PHRASE + this.description_name;
			}
			else {
				return await interaction.editReply("We're past the brainstorming phase, so you cannot propose a new description.");
			}
		}
		else {
			if (global.Sandbox.phase !== Sandbox.Phases.Brainstorming) {
				rule_description = interaction.options.getString('rule-description');
			}
			else {
				return await interaction.editReply("We're in the brainstorming phase, so you cannot propose rules.");
			}
		}

		if (
			!await confirmAction({
				interaction,
				message: `Are you sure want to propose the creation of the rule, \`${rule_description}\`?`,
				confirm_txt: "Confirm Proposal",
				cancel_txt: "Cancel",
				confirm_update_txt: "Proposal added.",
				cancel_update_txt: "Proposal canceled.",
			})
		) {
			return
		}

		const for_challenge_num = interaction.options.getInteger("for-challenge-num");
		if (for_challenge_num) {
			rule_description = `For Challenge #${for_challenge_num}: ` + rule_description;
		}

		const proposed_rule = new ProposedCreatoinRule({
			description: rule_description,
			proposer: proposer,
		})

		const rule_validation = await proposed_rule.validate();
		if (rule_validation !== true) {
			return await interaction.editReply(rule_validation);
		}

		await global.Sandbox.addProposedRule(proposed_rule);
	}
	else if (interaction.options.getSubcommand() === Parameters.SubCommands.ModifiedRule) {
		const num_rule_modifying = interaction.options.getInteger('rule-number');
		const new_rule_description = interaction.options.getString('new-rule-description');

		console.log({num_rule_modifying, new_rule_description});

		const min_rule_num = Rule.NUM_STARTING_RULES;
		const max_rule_num = global.Sandbox.official_rules.length;
		if (num_rule_modifying <= min_rule_num || num_rule_modifying > max_rule_num) {
			return interaction.editReply(
				`\`${num_rule_modifying}\` is not the number of an official rule that can be modified. You may only modify rules \`${min_rule_num+1}\`-\`${max_rule_num}\``
			);
		}

		const rule_modifying = await global.Sandbox.getOfficialRuleFromNum(num_rule_modifying);

		console.log({rule_modifying});

		if (
			!await confirmAction({
				interaction,
				message: `Are you sure want to propose to modify the rule \`${num_rule_modifying}) ${rule_modifying.description}\`, to become, \`${new_rule_description}\`?`,
				confirm_txt: "Confirm Modification Proposal",
				cancel_txt: "Cancel",
				confirm_update_txt: "Proposal added.",
				cancel_update_txt: "Proposal canceled.",
			})
		) {
			return
		}

		const proposed_rule = new ProposedModificationRule({
			description: new_rule_description,
			proposer: proposer,
			num_rule_modifying: num_rule_modifying,
		});

		await global.Sandbox.addProposedRule(proposed_rule);
	}
	else if (interaction.options.getSubcommand() === Parameters.SubCommands.RuleRemoval) {
		const num_rule_removing = interaction.options.getInteger('rule-number');
		const removal_reason = interaction.options.getString('removal-reason');

		console.log({num_rule_removing, removal_reason});

		const min_rule_num = Rule.NUM_STARTING_RULES;
		const max_rule_num = global.Sandbox.official_rules.length;
		if (num_rule_removing <= min_rule_num || num_rule_removing > max_rule_num) {
			return interaction.editReply(
				`\`${num_rule_removing}\` is not the number of an official rule that can be removed. You may only remove rules \`${min_rule_num+1}-${max_rule_num}\``
			);
		}

		const rule_removing = await global.Sandbox.getOfficialRuleFromNum(num_rule_removing);

		console.log({rule_removing});

		if (
			!await confirmAction({
				interaction,
				message: `Are you sure want to propose to remove the rule \`${num_rule_removing}) ${rule_removing.description}\``,
				confirm_txt: "Confirm Removal Proposal",
				cancel_txt: "Cancel",
				confirm_update_txt: "Proposal added.",
				cancel_update_txt: "Proposal canceled.",
			})
		) {
			return
		}

		const proposed_rule = new ProposedRemovalRule({
			description: removal_reason,
			proposer: proposer,
			num_rule_removing: num_rule_removing,
		});

		await global.Sandbox.addProposedRule(proposed_rule);

	}
	else if (interaction.options.getSubcommand() === Parameters.SubCommands.FinalizeRules) {

		if (
			!await confirmAction({
				interaction,
				message: `Are you sure want to propose to FINALIZE the rules?`,
				confirm_txt: "Confirm Finalize Rules Proposal",
				cancel_txt: "Cancel",
				confirm_update_txt: "Proposal added.",
				cancel_update_txt: "Proposal canceled.",
			})
		) {
			return
		}

		const proposed_rule = new ProposedCreatoinRule({
			description: ProposedRule.FINALIZE_RULES_PHRASE,
			proposer: proposer,
		});

		await global.Sandbox.addProposedRule(proposed_rule);
	}
}

module.exports = command;