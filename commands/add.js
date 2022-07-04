// ^ SAND ——————————————————————————————————————————————————————————————————————————————————————————————————————

// * Players ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-empty */
module.exports = {
	name: 'add',
    description: 'Adds a player to an existing alliance',
    guildOnly: true,
    args: true,
    requiredServer: ['698178798759444531'],
    requiredRole: ['Players'],
    requiredCategory: ['Alliances', 'Alliance', 'More Alliances', 'More Alliance', 'Even More Alliances'],
    usage: '<user>',
	execute(message, args) {

        // Doesn't work in #players-only-alliance
            if (message.channel.id === '807020607555895307') {
                return message.channel.send('Not in this alliance.')
            }

        // Only one argument allowed
            if (args.length > 1) {
                return message.channel.send(`Only 1 person please.`)
            }

        if (!args[0].startsWith('<@') && !message.guild.member(args[0])) {
            return message.channel.send(`You have to mention a User or give their ID.`)
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

        for (let i = 0; i < args.length; i++) {
            if (!getUserFromMention(args[i]).roles.cache.some(r => r.name === 'Players')) {
                return message.reply(`You may only have players in your alliance!`)
            }
        }

        message.channel.updateOverwrite(getUserFromMention(args[0]), { VIEW_CHANNEL: true })
        message.channel.send(`${message.author} added ${getUserFromMention(args[0]).displayName} to the alliance!`).then(message => message.pin())
        
        let overview = message.guild.channels.cache.get('807021090496577559')
        overview.send(`${message.author} added ${getUserFromMention(args[0]).displayName} to the **${message.channel.name}** alliance`)
    }
};