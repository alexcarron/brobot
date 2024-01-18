const Parameter = require('../../modules/commands/Paramater.js');
const SlashCommand = require('../../modules/commands/SlashCommand.js');
const { LLPointAccomplishments } = require('../../modules/enums.js')
const { deferInteraction, confirmAction, getUser } = require("../../modules/functions.js");
const ids = require(`../../databases/ids.json`)

const command = new SlashCommand({
	name: "host-event",
	description: "Host your own custom event on your own",
});
command.allowsDMs = true;
command.required_servers = [];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	if (interaction.channel.type !== 'dm')
		return interaction.editReply("You may only use this command in my DMs.");

		if (
			!await confirmAction({
				interaction,
				message:
					`Are you absolutely sure you want to host an event?\n` +
					`You will be responsible for\n` +
					`- Determining the rules of the event and how it will exactly play out\n` +
					`- Writing instructions for how to participate in the event\n` `- Being present during the time you choose and hosting the event yourself`,
				confirm_txt: `I'm Sure`,
				cancel_txt: `I Don't Want To Host An Event`,
				confirm_update_txt: `Confirmed. You will now start the process of creating the event`,
				cancel_update_txt: `Canceled.`
			})
		) {
			return
		}

		interaction.followUp()
}
module.exports = command;