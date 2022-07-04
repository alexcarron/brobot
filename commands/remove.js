// ^ SAND ——————————————————————————————————————————————————————————————————————————————————————————————————————

// * Players ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-empty */
module.exports = {
	name: 'remove',
    description: 'Removes a player from an existing alliance',
    guildOnly: true,
    args: true,
    requiredServer: ['698178798759444531'],
    requiredRole: ['Players'],
    requiredCategory: ['Alliances', 'Alliance', 'More Alliances', 'More Alliance', 'Even More Alliances'],
    usage: '<user>',
	execute(message, args) {
        if (message.channel.id === '807020607555895307' && message.author.id != '276119804182659072') {
            return message.channel.send('Not in this alliance.')
        }

        if (args.length > 1) {
            message.channel.send(`Only 1 person please.`)
        }

        if (!args[0].startsWith('<@') && !message.guild.member(args[0])) {
            message.channel.send(`You have to mention a User or give their ID.`)
        }
        
        function getUserFromMention(mention) {
            if (!mention) return;
            
            if (mention.startsWith('<@') && mention.endsWith('>')) {
                mention = mention.slice(2, -1);
        
                if (mention.startsWith('!')) {
                    mention = mention.slice(1);
                }
                
            }

            return message.guild.members.cache.get(mention);
        }

        for (let i = 1; i < args.length; i++) {
            if (!getUserFromMention(args[i]).roles.cache.some(r => r.name === 'Players')) {
                return message.reply(`You may only remove players!`)
            }
        }

        message.channel.updateOverwrite(getUserFromMention(args[0]), { VIEW_CHANNEL: false })
        message.channel.send(`${message.author} removed ${getUserFromMention(args[0]).displayName} from the alliance!`).then(message => message.pin())
        
        const user = getUserFromMention(args[0])
        user.send(`Someone removed you from the **${message.channel.name}** alliance`);

        let overview = message.guild.channels.cache.get('807021090496577559')
        overview.send(`${message.author} removed ${getUserFromMention(args[0]).displayName} from the **${message.channel.name}** alliance`)
    }
};