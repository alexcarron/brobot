
const fs = require('fs');
const { autocomplete, deferInteraction, confirmAction } = require("../../modules/functions.js");
const Parameter = require("../../modules/commands/Paramater.js");
const SlashCommand = require("../../modules/commands/SlashCommand.js");
const { PermissionFlagsBits } = require('discord.js');
const LLPointManager = require('../../modules/llpointmanager.js');


const Parameters = {
	ViewerName: new Parameter({
		type: "string",
		name: "viewer-name",
		description: "The name of the person your making your valentine",
		isAutocomplete: true,
	}),
	LLPointAmount: new Parameter({
		type: "number",
		name: "ll-point-amount",
		description: "The amount of LL Points you're gifting to them",
	}),
	PersonalMessage: new Parameter({
		type: "string",
		name: "personal-message",
		description: "A heartfelt personal message to include with your gift",
	}),
	// Anonymous: new Parameter({
	// 	type: "boolean",
	// 	name: "anonymous",
	// 	description: "If you want your gift to not include your name",
	// 	isRequired: false,
	// }),
}

const command = new SlashCommand({
	name: "make-valentine",
	description: "Make someone your valentine and send them a valentine's day gift",
});
command.parameters = [
	Parameters.ViewerName,
	Parameters.LLPointAmount,
	Parameters.PersonalMessage,
	// Parameters.Anonymous,
];
// command.required_permissions = [ PermissionFlagsBits.Administrator ];
command.allowsDMs = true;
command.execute = async function(interaction) {
	await deferInteraction(interaction, "Adding LL Points...");

	getViewer = async function(id, name) {
		let gifter_viewer = await global.LLPointManager.getViewerById(interaction.user.id);

		if (gifter_viewer)
			return gifter_viewer

		gifter_viewer = await global.LLPointManager.getViewerByName(interaction.user.username);

		if (gifter_viewer)
			return gifter_viewer

		console.log(`No viewer with name ${name} or id ${id}`);
		return undefined;
	}

	let gifter_viewer = await getViewer(interaction.user.id, interaction.user.username);

	if (!gifter_viewer) {
		if (
			!await confirmAction({
				interaction,
				message: `You have not been added to the LL Point database yet, would you like to add yourself as **${interaction.user.username}**?`,
				confirm_txt: `Add Me to the Database`,
				cancel_txt: `Don't Add Me to the Database`,
				confirm_update_txt: `**${interaction.user.username}** has been added to the LL Point database!`,
				cancel_update_txt: `Canceled LL Point Valentine`
			})
		) {
			return
		}
		else {
			await global.LLPointManager.addViewerFromUser(interaction.user);
			await global.LLPointManager.updateDatabase();
			gifter_viewer = await global.LLPointManager.getViewerById(interaction.user.id);
		}

	}

	const
		viewer_name_arg = interaction.options.getString(Parameters.ViewerName.name),
		num_gifted_points = interaction.options.getNumber(Parameters.LLPointAmount.name),
		personal_message = interaction.options.getString(Parameters.PersonalMessage.name);
		// isAnonymous = interaction.options.getBoolean(Parameters.Anonymous.name);

	const isAnonymous = false;

	let gifted_viewer = await global.LLPointManager.getViewerByName(viewer_name_arg);
	let viewer_name = viewer_name_arg;

	if (!gifted_viewer) {
		const autocomplete_viewer_name = await autocomplete(viewer_name, global.LLPointManager.getViewerNames());

		if (autocomplete_viewer_name) {
			viewer_name = autocomplete_viewer_name;
			gifted_viewer = await global.LLPointManager.getViewerByName(viewer_name);
		}

		if (!gifted_viewer) {
			return await interaction.editReply(`The viewer, **${viewer_name}**, doesn't exist.`);
		}
	}

	if (gifter_viewer.valentine) {
		return await interaction.editReply(`You already have a valentine! It wouldn't be special if you chose multiple`);
	}

	console.log({gifted_viewer, gifter_viewer, viewer_name, num_gifted_points});

	if (gifted_viewer == gifter_viewer) {
		return await interaction.editReply(`You can't be your own valentine.`);
	}

	if (num_gifted_points <= 0) {
		return await interaction.editReply(`You can only give people postive amounts of LL Points, sorry.`);
	}

	if (num_gifted_points % 1 !== 0) {
		return await interaction.editReply(`You can only give people whole amounts of LL Points, sorry.`);
	}

	if (gifter_viewer.ll_points < num_gifted_points) {
		return await interaction.editReply(`You only have \`${gifter_viewer.ll_points}\` LL Points, you cannot gift \`${num_gifted_points}\` LL Points to someone!`);
	}

	if (personal_message.length <= 10) {
		return await interaction.editReply(`Your gift has to be thoughtful! Include a longer heartfelt personal message 💖`);
	}

	await gifter_viewer.addLLPoints(-num_gifted_points);
	await gifted_viewer.addLLPoints(num_gifted_points);
	await interaction.editReply(
		`Making **${gifted_viewer.name}** your valentine and gifting them \`${num_gifted_points}\` LL Point(s)...\n` +
		`You now have \`${gifter_viewer.ll_points}\` LL Point(s).`
	);
	console.log(gifted_viewer);
	await gifted_viewer.dm(
		`# 💖 Happy Valentines Day! 💞`
	);
	await gifted_viewer.dm(
		(
			gifter_viewer.user_id && !isAnonymous ?
			`<@${gifter_viewer.user_id}> ` :
			""
		) +
		(
			isAnonymous ?
				"Someone " :
				`**${gifter_viewer.name}** `
		) +
		`has made you their valentine! 🩷❤️🧡💛💚🩵💙💜` + "\n\n" +
		`They gifted you **${num_gifted_points}** LL Points with the following message:` + "\n" +
		`>>> ${personal_message}`
	);
	gifted_viewer.setValentine(gifted_viewer);
	await global.LLPointManager.updateDatabase();
}
command.autocomplete = LLPointManager.getViewersAutocompleteValues;

module.exports = command;