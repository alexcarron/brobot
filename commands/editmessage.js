// ! ALL ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————


module.exports = {
	name: 'editmessage',
    aliases: ['editm', 'edit'],
    description: 'Edits a certain message',
    isServerOnly: true,
    args: true,
	isRestrictedToMe: true,
	arg_count: 3,
    required_permission: 'ADMINISTRATOR',
	usages: ['<channel> <message-id> <content>'],
	execute(message, args) {
		let channel_id = args[0].slice(2, -1);
		let message_id = args[1];
		let updated_message_content = args.slice(2).join(' ');
		const channel = message.guild.channels.cache.get(channel_id);

        channel.messages.fetch(message_id)
			.then(
				(msg) => {
					msg.edit(updated_message_content);
					message.channel.send("Message edited.");
				}
			);
    }
};