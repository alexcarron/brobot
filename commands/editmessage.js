// ! ALL ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
module.exports = {
	name: 'editmessage',
    description: 'Edits a certain message',
    guildOnly: true,
    args: true,
    permissions: 'ADMINISTRATOR',
	usage: '<channel> <message id> <contents>',
	execute(message, args) {
		if (args.length <= 1) {
            return message.channel.send('Gonna need to see more arguments than that.');
        }

        const channel = message.guild.channels.cache.get(args[0].slice(2, -1))
        const msg = channel.messages.fetch(args[1]).then(msg => {
            msg.edit(args.slice(2).join(' '))
        });
    }
};