const { ChannelType, Collection } = require("discord.js");
const ids = require("../bot-config/discord-ids");
const { botStatus } = require("../bot-config/bot-status");
const { logError, logInfo } = require("../utilities/logging-utils");

const onSlashCommandExecuted = async (interaction) => {
	const userName = interaction.user.username;
	logInfo(`${userName} executing command: ${interaction.commandName}`);

	const command = interaction.client.commands.get(interaction.commandName);

	if (command === undefined) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	const isUserLL = interaction.user.id === ids.users.LL;

	// Is the bot on?
	if (botStatus.isSleep && !isUserLL) {
		interaction.reply({
			content: "Someone turned me off, so you can't use me right now.",
			ephemeral: true
		});
		return;
	}

	// Is the command server-only?
	if (
		(command.isServerOnly || command.required_servers) && interaction.channel.type === ChannelType.DM
	)
		return interaction.reply({
			content: `You aren't allowed to use this command in DMs.`,
			ephemeral: true
		});

	// Does the user have the required permissions?
	if (command.required_permission) {
		const userPermissions = interaction.channel.permissionsFor(interaction.author);

		if (
			!userPermissions ||
			!userPermissions.has(command.required_permission)
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
		!command.required_servers.includes(interaction.guild.id)
	)
		return interaction.reply({
			content: `You aren't allowed to use this command in this server.`,
			ephemeral: true
		});

	// Is the command being executed in the required channel?
	if (
		command.required_channels &&
		!command.required_channels.includes(interaction.channel.id)
	) {
		return interaction.reply({
			content: `You aren't allowed to use this command in this channel.`,
			ephemeral: true
		});
	}

	// Is the command being executed in the required channel category?
	if (
		command.required_categories &&
		!command.required_categories.includes(interaction.channel.parent.id)
	)
		return interaction.reply({
			content: `You aren't allowed to use this command in this channel category.`,
			ephemeral: true
		});

	// Does the user have the required role(s) to execute the command?
	if (command.required_roles) {
		const userRoleNames = interaction.member.roles.cache.map(role => role.name);
		const userRoleIDs = interaction.member.roles.cache.map(role => role.id);

		if (
			!command.required_roles.every( role =>
				userRoleNames.includes(role) ||
				userRoleIDs.includes(role)
			)
		) {
			return interaction.reply({
				content: `You don't have the roles required to use this command.`,
				ephemeral: true
			});
		}
	}

	// Does the command have a cooldown?
	const { cooldowns } = client;
	if (!cooldowns.has(command.data.name)) {
		cooldowns.set(command.data.name, new Collection());
	}

	// Is the command on cooldown?
	const now = Date.now();
	const timestamps = cooldowns.get(command.data.name);
	const defaultCooldownSeconds = 1;
	const cooldownSeconds = (command.cooldown ?? defaultCooldownSeconds) * 1000;

	if (timestamps.has(interaction.user.id)) {
		const cooldownExpirationTime =
			timestamps.get(interaction.user.id) + cooldownSeconds;

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
		logError(`There was an error while running the command ${command.name}`, error);

		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: 'There was an error while executing this command!',
				ephemeral: true
			});
		}
		else {
			await interaction.channel.send({
				content: 'There was an error while executing this command!',
				ephemeral: true
			});
		}
	}
}

module.exports = { onSlashCommandExecuted };