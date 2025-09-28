const { ChannelType, Collection, ChatInputCommandInteraction, InteractionResponse, TextChannel } = require("discord.js");
const { ids } = require("../bot-config/discord-ids");
const { logError, logInfo } = require("../utilities/logging-utils");
const { replyToInteraction } = require("../utilities/discord-action-utils");

/**
 * Handles the execution of a slash command.
 * @param {ChatInputCommandInteraction} interaction - The interaction object.
 * @returns {Promise<InteractionResponse | undefined>} A promise that resolves when the command is executed.
 */
const onSlashCommandExecuted = async (interaction) => {
	const userName = interaction.user.username;
	logInfo(`${userName} executed this command: /${interaction.commandName}`);

	const command = global.commands.get(interaction.commandName);

	if (command === undefined) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	const isUserLL = interaction.user.id === ids.users.LL;
	const isUserADeveloper = global.botStatus.testUsersAndDevelopers.includes(interaction.user.id) || isUserLL;

	// Is the bot on?
	if (global.botStatus.isSleep && !isUserLL) {
		interaction.reply({
			content: "Someone turned me off, so you can't use me right now.",
			ephemeral: true
		});
		return;
	}

	// Is the command server-only?
	if (
		(
			command.isServerBasedCommand() ||
			command.required_servers && command.required_servers.length > 0
		) &&
		interaction.channel?.type === ChannelType.DM
	)
		return interaction.reply({
			content: `You aren't allowed to use this command in DMs.`,
			ephemeral: true
		});

	// Is the command in development
	if (command.isInDevelopment && !isUserADeveloper) {
		return interaction.reply({
			content: `You aren't allowed to use this command since it's in development and you aren't a developer.`,
			ephemeral: true
		});
	}

	// Does the user have the required permissions?
	if (
		command.required_permissions &&
		command.required_permissions.length > 0
	) {
		if (
			interaction.channel === null ||
			interaction.channel.type === ChannelType.DM ||
			interaction.channel instanceof TextChannel === false
		)
			return interaction.reply({
				content: `You aren't allowed to use this command here.`,
				ephemeral: true
			});

		const userPermissions = interaction.channel.permissionsFor(interaction.user);

		if (
			!userPermissions ||
			!userPermissions.has(command.required_permissions)
		) {
			return interaction.reply({
				content: `You don't have the permissions required to use this command.`,
				ephemeral: true
			});
		}
	}

	// Is the command being executed in the required server?
	if (
		command.required_servers &&
		command.required_servers.length > 0 &&
		(
			interaction.guild === null ||
			interaction.guild.id === null ||
			!command.required_servers.includes(interaction.guild.id)
		)
	)
		return interaction.reply({
			content: `You aren't allowed to use this command in this server.`,
			ephemeral: true
		});

	// Is the command being executed in the required channel?
	if (
		command.required_channels &&
		command.required_channels.length > 0 &&
		(
			interaction.channel === null ||
			interaction.channel.type === ChannelType.DM ||
			!command.required_channels.includes(interaction.channel.id)
		)
	) {
		return interaction.reply({
			content: `You aren't allowed to use this command in this channel.`,
			ephemeral: true
		});
	}

	// Is the command being executed in the required channel category?
	if (
		command.required_categories &&
		command.required_categories.length > 0 &&
		(
			interaction.channel === null ||
			interaction.channel.type === ChannelType.DM ||
			interaction.channel instanceof TextChannel === false ||
			interaction.channel.parent === null ||
			!command.required_categories.includes(interaction.channel.parent.id)
		)
	)
		return interaction.reply({
			content: `You aren't allowed to use this command in this channel category.`,
			ephemeral: true
		});

	// Does the user have the required role(s) to execute the command?
	if (
		command.required_roles &&
		command.required_roles.length > 0
	) {
		if (
			interaction.member === null ||
			interaction.member.roles === null ||
			'cache' in interaction.member.roles === false
		) {
			return interaction.reply({
				content: `You don't have the roles required to use this command.`,
				ephemeral: true
			});
		}

		const userRoleNames = interaction.member.roles.cache.map(role => role.name);
		const userRoleIDs = interaction.member.roles.cache.map(role => role.id);

		if (
			!command.required_roles.every( role => {
				if (Array.isArray(role)) {
					return role.some(role =>
						userRoleNames.includes(role) ||
						userRoleIDs.includes(role)
					);
				}
				else {
					return (
						userRoleNames.includes(role) ||
						userRoleIDs.includes(role)
					);
				}
			})
		) {
			return interaction.reply({
				content: `You don't have the roles required to use this command.`,
				ephemeral: true
			});
		}
	}

	// Does the command have a cooldown?
	const cooldowns = global.cooldowns;

	// Is the command on cooldown?
	const now = Date.now();
	const timestamps = cooldowns.get(command.data.name)
		?? new Collection();

	const defaultCooldownSeconds = 0;
	const cooldownSeconds = (command.cooldown ?? defaultCooldownSeconds) * 1000;

	const timestamp = timestamps.get(interaction.user.id);
	if (timestamp !== undefined) {
		const cooldownExpirationTime = timestamp + cooldownSeconds;

		if (now < cooldownExpirationTime && !isUserLL) {
			const expired_timestamp =
				Math.round(cooldownExpirationTime / 1000);

			return interaction.reply({
				content: `Please wait, you are on a cooldown for \`/${command.data.name}\`. You can use it again <t:${expired_timestamp}:R>.`,
				ephemeral: true
			});
		}
	}

	// Reset cooldown
	timestamps.set(interaction.user.id, now);
	setTimeout(() => timestamps.delete(interaction.user.id), cooldownSeconds);

	// Execute the command
	try {
		await command.execute(interaction);
	}
	catch (error) {
		if (error instanceof Error === false)
			throw error;

		logError(`There was an error while running the command ${command.name}`, error);

		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: 'There was an error while executing this command!',
				ephemeral: true
			});
		}
		else {
			await replyToInteraction(interaction, 'There was an error while executing this command!');
		}
	}
}

module.exports = { onSlashCommandExecuted };