// ! ALL ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————


module.exports = {
	name: 'dm',
    description: 'DMs a certain user',
    isServerOnly: true,
    args: true,
	isRestrictedToMe: true,
    required_permission: 'ADMINISTRATOR',
	usages: ['<mentioned-user> <message>'],
	execute(message, args) {
		if (args.length <= 1) {
            return message.channel.send('Gonna need to see more arguments than that.');
        }

        let userId = args[0].slice(2, -1);
        if (userId.startsWith('!')) {
            userId = userId.slice(1);
        }
        console.log(userId)

        const user = message.client.users.cache.get(userId);
        user.send(args.slice(1).join(' '));
    }
};