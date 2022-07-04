// ^ SAND ——————————————————————————————————————————————————————————————————————————————————————————————————————

// * Players ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-empty */
const { prefix } = require('../config.json');
module.exports = {
	name: 'alliance',
    description: 'Creates an alliance',
    guildOnly: true,
    args: true,
    requiredServer: ['698178798759444531'],
    requiredRole: ['Players'],
    requiredCategory: ['You Room', 'You Rooms'],
    usage: '[name-with-no-spaces] [<@user1 id>] [<@user2 id>]... (Ping the players you want in your alliance. Do not ping yourself)',
	execute(message, args) {
        if (args.length <= 1) {
            return message.reply(`I need more arguments than that! \n\`${prefix}${this.name} ${this.usage}\``)
        }

        if (args.length > 5) {
            return message.reply(`You can't have an alliance with more than 4 players`)
        }

        function getUserFromMention(mention) {
            if (!mention) return;
            
            if (!mention.startsWith('<@')) {
                mention = `<@!${mention}>`
            }
            
            if (mention.startsWith('<@') && mention.endsWith('>')) {
                mention = mention.slice(2, -1);
             
                if (mention.startsWith('&') || mention.startsWith('!')) {
                    mention = mention.slice(1);
            
                }
            }

            return message.guild.members.cache.get(mention);
        }

        for (let i = 1; i < args.length; i++) {
            if (!getUserFromMention(args[i]).roles.cache.some(r => r.name === 'Players')) {
                return message.reply(`You may only have players in your alliance!`)
            }
        }

        var alliancesID = '824079248678977626' // More Alliance
        var overviewID = '807021090496577559' // #overview

        // If not in SAND Server
        if (message.guild.id != '698178798759444531') {
            overviewID = '813057800955625482'; // #overview [SAND Alliances]
            alliancesID = '812856134158909440'; // Alliances [SAND Alliances]
        } else { 
            const categoryChannels = message.guild.channels.cache.filter(channel => channel.type === "category"); // Look at categories

            categoryChannels.forEach(channel => {
                if (channel.name === 'More Alliance') { // Check More Alliance Category
                    console.log(channel.children.size)
                    if (channel.children.size > 49) { // If it has 50+ channels
                        console.log(`Category ${channel.name} has ${channel.children.size} channels`);
                        alliancesID = '846417728516522044'; // Even More Alliances
                    }
                }
            });
        }

        console.log('The alliance ID:' + alliancesID);

        message.guild.channels.create(args[0], {
            type: 'text',
            permissionOverwrites: [
               {
                 id: message.guild.roles.everyone,
                 deny: ['VIEW_CHANNEL'],
              }
            ],
            parent: alliancesID,
        }).then(newChannel => {
            args.push(`<@${message.author.id}>`)
            for (let i = 1; i < args.length; i++) {
                args[i] = getUserFromMention(args[i])
                newChannel.updateOverwrite(args[i], { VIEW_CHANNEL: true },);
                newChannel.updateOverwrite('698631347975094304', { SEND_MESSAGES: false },);
                newChannel.updateOverwrite('698631347975094304', { ADD_REACTIONS: false },);
            }
            newChannel.send(`${message.author} made the **${args[0]}** Alliance. It includes ${args.slice(1).join(', ')}`).then(message => message.pin())

            console.log(`${message.author} made the **${args[0]}** Alliance. It includes ${args.slice(1).join(', ')}`)
        
            let overview = message.guild.channels.cache.get(overviewID)
            overview.send(`${message.author} made the **${args[0]}** Alliance. It includes ${args.slice(1).join(', ')}`)

            if (message.guild.id === '698178798759444531') {
                let variableChannel = message.guild.channels.cache.find(c => c.name === 'variable')
                variableChannel.messages.fetch('816377100297961472').then(msg => {
                    let allianceCount = Number(msg.content.slice(msg.content.indexOf(':')+1))
                    msg.edit(`${msg.content.slice(0,msg.content.indexOf(':')+1)} ${allianceCount+1}`)
                })
            }
        })
        
        
    }
};