// ! ALL ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————


module.exports = {
	name: 'unban',
    description: 'Unban someone',
    isServerOnly: true,
    args: true,
	isRestrictedToMe: true,
    required_permission: 'ADMINISTRATOR',
	usages: ['<user id/mention user>'],
	execute(message, args) {
        // grab the "first" mentioned user from the message
        // this will return a `User` object, just like `message.author`
        const id = args[0];

        message.guild.members.unban(id);
        message.channel.send(`You unbanned ${id.username}`);
    }
};