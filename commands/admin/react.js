// ! ALL ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————


module.exports = {
	name: 'react',
    description: 'Reacts to a message with an emoji',
    isServerOnly: true,
    args: true,
    isRestrictedToMe: true,
	usages: ['<mentioned-user> <message>'],
	execute(message, args) {
		if (args.length <= 1) {
            return message.channel.send('Gonna need to see more arguments than that.');
        }

        let userId = args[0].slice(2, -1);
        if (userId.startsWith('!')) {
            userId = userId.slice(1);
        }

        let DMChannel = message.client.channels.cache.get(args[0])
        console.log(DMChannel.name)
        let DMmessage = DMChannel.messages.cache.get(args[1])
        console.log(message.contents)

        DMmessage.react(args[2]).catch(console.error)
    }
};