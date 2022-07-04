// ! ALL ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
module.exports = {
	name: 'dm',
    description: 'DMs a certain user',
    guildOnly: true,
    args: true,
    permissions: 'ADMINISTRATOR',
	usage: '<user> <message>',
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