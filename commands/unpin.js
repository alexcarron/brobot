// ^ SAND ——————————————————————————————————————————————————————————————————————————————————————————————————————

// * Players ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
module.exports = {
	name: 'unpin',
    description: 'DMs a certain user',
    guildOnly: true,
    args: true,
    requiredServer: ['698178798759444531'],
    requiredRole: ['Players'],
    requiredCategory: ['You Room', 'You Rooms', 'Alliances', 'Alliance', 'More Alliances', 'More Alliance', 'Even More Alliances'],
	usage: '<message id>',
	execute(message, args) {
        if (message.channel.id === '807020607555895307') {
            return message.channel.send('Not in this alliance.')
        }

		if (args.length != 1) {
            return message.channel.send('I only need one argument.');
        }

        message.channel.messages.fetch(args[0]).then(message => message.unpin()).then(message.channel.send('I unpinned your message for you!'))
    }
};