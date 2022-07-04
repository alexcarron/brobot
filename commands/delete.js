// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');

module.exports = {
    name: 'delete',
    description: 'Deletes an object that you own. You can even delete your character in case you want to remake it',
    guildOnly: true,
    args: true,
    aliases: ['del'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: '<your-object>',
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var objects = JSON.parse(fs.readFileSync('objects.json'))
        var players = JSON.parse(fs.readFileSync('players.json'))
        var userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()

        // Checks if you own the object you are editing and if it exists
            if (!Object.keys(objects).includes(args.join(' ')) || objects[args.join(' ')]['information']['owner'] != message.guild.members.cache.get(message.author.id).displayName) { 
                return message.channel.send(`${args.join(' ')} is not an object that you own and/or exists. `)
            } 

            delete objects[args.join(' ')]

            players[userName]['builds'] = players[userName]['builds'] + 1

            fs.writeFileSync('objects.json', JSON.stringify(objects))
            fs.writeFileSync('players.json', JSON.stringify(players))
                    
            let heyluigichannel = message.guild.channels.cache.get('850537726561353758')
            heyluigichannel.send(`<@276119804182659072> **${message.guild.members.cache.get(message.author.id).displayName}** deleted **${args.join(' ')}**.`)
            message.channel.send(`You deleted your object, **${args.join(' ')}**.`)
        }
};