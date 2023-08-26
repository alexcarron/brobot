const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, channelMention  } = require('discord.js');
const ProposedCreatoinRule = require('../../modules/sandbox/ProposedCreationRule');
const Host = require('../../modules/sandbox/Host');
const { confirmAction, getCurrentTimeCronExpression } = require('../../modules/functions');
const Sandbox = require('../../modules/sandbox/Sandbox');
const ProposedModificationRule = require('../../modules/sandbox/ProposedModificationRule');
const ProposedRemovalRule = require('../../modules/sandbox/ProposedRemovalRule');
const SlashCommand = require('../../modules/commands/SlashCommand');
const Parameter = require('../../modules/commands/Paramater');
const wait = require('node:timers/promises').setTimeout;




const Command = {
	name: "propose-rule",
	description: "",
	cooldown: 5*60,
}

const Parameters = {
	SubCommands: {
		NewRule: "creation",
		ModifiedRule: "modification",
		RuleRemoval: "removal",
	}
}

// module.exports = {
// 	required_roles: ["Host"],
// 	cooldown: Command.cooldown,
// 	data: new SlashCommandBuilder()
// 		.setName(Command.name)
// 		.setDescription(Command.description)
// 		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
// 		.setDMPermission(false)
// 		.addSubcommand(subcommand =>
// 			subcommand
// 				.setName(Parameters.SubCommands.NewRule) // You must use different names for each optoin
// 				.setDescription('Propose a new rule to be added.')
// 				.addStringOption( option =>
// 					option
// 						.setName('rule-description')
// 						.setDescription("A detailed, clear, and unambiguous description of your proposed new rule.")
// 						.setRequired(true)
// 				)
// 		)
		// .addSubcommand(subcommand =>
		// 	subcommand
		// 		.setName(Parameters.SubCommands.ModifiedRule)
		// 		.setDescription('Propose the modification of an existing official rule.')
		// 		.addIntegerOption(option =>
		// 			option
		// 				.setName('rule-number')
		// 				.setDescription('The identifying number of the offical rule you want modified.')
		// 				.setRequired(true)
		// 		)
		// 		.addStringOption( option =>
		// 			option
		// 				.setName('new-rule-description')
		// 				.setDescription("The NEW rule description you want to replace that official rule with.")
		// 				.setRequired(true)
		// 		)
		// )
// 		.addSubcommand(subcommand =>
// 			subcommand
// 				.setName(Parameters.SubCommands.RuleRemoval)
// 				.setDescription('Propose the removal of an existing official rule.')
// 				.addIntegerOption(option =>
// 					option
// 						.setName('rule-number')
// 						.setDescription('The identifying number of the offical rule you want removed.')
// 						.setRequired(true)
// 				)
// 				.addStringOption( option =>
// 					option
// 						.setName('removal-reason')
// 						.setDescription("A detailed reason why you want that official rule to be removed.")
// 						.setRequired(true)
// 				)
// 		),
// 	async execute(interaction) { // Bot must reply within 3 seconds unless deffered and cannot reply multiple times


// 		await interaction.deferReply({ephemeral: true});

// 		const user_id = interaction.user.id;
// 		const proposer = global.Sandbox.getHostByID(user_id);

// 		if (interaction.options.getSubcommand() === Parameters.SubCommands.NewRule) {
// 			const rule_description = interaction.options.getString('rule-description');

// 			if (
// 				!await confirmAction({
// 					interaction,
// 					message: `Are you sure want to propose the creation of the rule, \`${rule_description}\`?`,
// 					confirm_txt: "Confirm Proposal",
// 					cancel_txt: "Cancel",
// 					confirm_update_txt: "Proposal added.",
// 					cancel_update_txt: "Proposal canceled.",
// 				})
// 			) {
// 				return
// 			}

// 			const proposed_rule = new ProposedCreatoinRule({
// 				description: rule_description,
// 				proposer: proposer,
// 			})

// 			await global.Sandbox.addProposedRule(proposed_rule);
// 		}
// 		else if (interaction.options.getSubcommand() === Parameters.SubCommands.ModifiedRule) {
// 			const num_rule_modifying = interaction.options.getInteger('rule-number');
// 			const new_rule_description = interaction.options.getString('new-rule-description');

// 			console.log({num_rule_modifying, new_rule_description});

// 			const min_rule_num = Sandbox.NUM_STARTING_RULES;
// 			const max_rule_num = global.Sandbox.official_rules.length;
// 			if (num_rule_modifying <= min_rule_num || num_rule_modifying > max_rule_num) {
// 				return interaction.editReply(
// 					`\`${num_rule_modifying}\` is not the number of an official rule that can be modified. You may only modify rules \`${min_rule_num+1}\`-\`${max_rule_num}\``
// 				);
// 			}

// 			const rule_modifying = await global.Sandbox.getOfficialRuleFromNum(num_rule_modifying);

// 			console.log({rule_modifying});

// 			if (
// 				!await confirmAction({
// 					interaction,
// 					message: `Are you sure want to propose to modify the rule \`${num_rule_modifying}) ${rule_modifying.description}\`, to become, \`${new_rule_description}\`?`,
// 					confirm_txt: "Confirm Modification Proposal",
// 					cancel_txt: "Cancel",
// 					confirm_update_txt: "Proposal added.",
// 					cancel_update_txt: "Proposal canceled.",
// 				})
// 			) {
// 				return
// 			}

// 			const proposed_rule = new ProposedModificationRule({
// 				description: new_rule_description,
// 				proposer: proposer,
// 				num_rule_modifying: num_rule_modifying,
// 			});

// 			await global.Sandbox.addProposedRule(proposed_rule);
// 		}
// 		else if (interaction.options.getSubcommand() === Parameters.SubCommands.RuleRemoval) {
// 			const num_rule_removing = interaction.options.getInteger('rule-number');
// 			const removal_reason = interaction.options.getString('removal-reason');

// 			console.log({num_rule_removing, removal_reason});

// 			const min_rule_num = Sandbox.NUM_STARTING_RULES;
// 			const max_rule_num = global.Sandbox.official_rules.length;
// 			if (num_rule_removing <= min_rule_num || num_rule_removing > max_rule_num) {
// 				return interaction.editReply(
// 					`\`${num_rule_removing}\` is not the number of an official rule that can be removed. You may only remove rules \`${min_rule_num+1}-${max_rule_num}\``
// 				);
// 			}

// 			const rule_removing = await global.Sandbox.getOfficialRuleFromNum(num_rule_removing);

// 			console.log({rule_removing});

// 			if (
// 				!await confirmAction({
// 					interaction,
// 					message: `Are you sure want to propose to remove the rule \`${num_rule_removing}) ${rule_removing.description}\``,
// 					confirm_txt: "Confirm Removal Proposal",
// 					cancel_txt: "Cancel",
// 					confirm_update_txt: "Proposal added.",
// 					cancel_update_txt: "Proposal canceled.",
// 				})
// 			) {
// 				return
// 			}

// 			const proposed_rule = new ProposedRemovalRule({
// 				description: removal_reason,
// 				proposer: proposer,
// 				num_rule_removing: num_rule_removing,
// 			});

// 			await global.Sandbox.addProposedRule(proposed_rule);

// 		}
// 	},
// };

const command = new SlashCommand({
	name: "propose-rules",
	description:  "Propose a new, modified, or removed rule.",
});
command.required_roles = ["Host"];
command.required_permissions = [PermissionFlagsBits.SendMessages];
command.cooldown = 5*60;
command.parameters = [
	new Parameter({
		type: "subcommand",
		name: "creation",
		description: "Propose a new rule to be added.",
		subparameters: [
			new Parameter({
				type: "string",
				name: "rule-description",
				description: "A detailed, clear, and unambiguous description of your proposed new rule."
			}),
		],
	}),
	new Parameter({
		type: "subcommand",
		name: "modification",
		description: "Propose the modification of an existing official rule.",
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
		description: "Propose the removal of an existing official rule.",
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
]
command.execute = async function(interaction) {
	await interaction.deferReply({ephemeral: true});

	const user_id = interaction.user.id;
	const proposer = global.Sandbox.getHostByID(user_id);

	if (interaction.options.getSubcommand() === Parameters.SubCommands.NewRule) {
		const rule_description = interaction.options.getString('rule-description');

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

		const proposed_rule = new ProposedCreatoinRule({
			description: rule_description,
			proposer: proposer,
		})

		await global.Sandbox.addProposedRule(proposed_rule);
	}
	else if (interaction.options.getSubcommand() === Parameters.SubCommands.ModifiedRule) {
		const num_rule_modifying = interaction.options.getInteger('rule-number');
		const new_rule_description = interaction.options.getString('new-rule-description');

		console.log({num_rule_modifying, new_rule_description});

		const min_rule_num = Sandbox.NUM_STARTING_RULES;
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

		const min_rule_num = Sandbox.NUM_STARTING_RULES;
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
}

module.exports = command;