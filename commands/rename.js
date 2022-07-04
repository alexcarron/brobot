// ^ SAND ——————————————————————————————————————————————————————————————————————————————————————————————————————

// * Players ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-empty */
module.exports = {
	name: 'rename',
    description: 'Rename an existing alliance',
    guildOnly: true,
    args: true,
    requiredServer: ['698178798759444531'],
    requiredRole: ['Players'],
    requiredCategory: ['Alliances', 'Alliance', 'More Alliances', 'More Alliance', 'Even More Alliances'],
    usage: '<new-channel-name>',
	execute(message, args) {
        if (message.channel.id === '807020607555895307') {
            return message.channel.send('Not in this alliance.')
        }

        let oldName = message.channel.name

        if (args.length > 1) {
            return message.channel.send(`Text channels can't have spaces :(`)
        }

        message.channel.setName(args[0])

        message.channel.send(`${message.author} renamed **${oldName}** to **${args[0]}**`).then(message => message.pin())
        
        let overview = message.guild.channels.cache.get('807021090496577559')
        overview.send(`${message.author} renamed **${oldName}** to **${args[0]}**`)
    }
};