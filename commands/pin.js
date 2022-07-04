// ? SAND ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Players ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
module.exports = {
	name: 'pin',
    description: 'DMs a certain user',
    guildOnly: true,
    args: true,
    requiredServer: ['698178798759444531'],
    requiredRole: ['Players'],
    requiredCategory: ['You Room', 'You Rooms', 'Alliances', 'Alliance', 'More Alliances', 'More Alliance', 'Even More Alliances'],
	usage: '<message id> [<unpin a message if there\'s too many pins]',
	execute(message, args) {
        if (message.channel.id === '807020607555895307') {
            return message.channel.send('Not in this alliance.')
        }


		if (args.length != 1) {
            return message.channel.send('I only need one argument.');
        }

        message.channel.messages.fetch(args[0]).then(message => message.pin()).catch(console.log(`I can't see the message or the pin limit was reached.`))
    }
};