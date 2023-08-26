// ! ALL ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————


module.exports = {
	name: 'send',
    description: 'Sends a message to a certain channel',
    isServerOnly: true,
    args: true,
    isRestrictedToMe: true,
	usages: ['<channel> <message>'],
	execute(message, args) {
		if (args.length <= 1) {
            return message.channel.send('Gonna need to see more arguments than that.');
        }

        const channel = message.guild.channels.cache.get(args[0].slice(2, -1))
        channel.send(args.slice(1).join(' '));
    }
};