// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');

module.exports = {
    name: 'birth',
    description:'Gets you out of the beforelife and makes you a character in Little Luigi Land.',
    guildOnly: true,
    args: true,
    requiredServer: ['850167368101396520'],
    requiredChannel: ['birth-your-character'],
    requiredRole:['In The Beforelife'],
    usage: '<your-name>',
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var players = JSON.parse(fs.readFileSync('players.json'))
        var characterRole = message.guild.roles.cache.find(r => r.name === "Character");
        var beforeLifeRole = message.guild.roles.cache.find(r => r.name === "In The Beforelife");
        var user = message.guild.members.cache.get(message.author.id)
        var userName = user.displayName.toLowerCase()
        var player_name = args.join(' ')


        // Check if name is under 33 characters
        if(player_name.length > 32) {
                return message.channel.send(`That's not under 33 characters!`)
            }

        // Checks if username has letters
        if (player_name.replace(/[^a-zA-Z0-9]/g,"") === '') {
            return message.channel.send(`Your name must have letters in it`)
        }

        // Checks if name exists already
        if (Object.keys(players).includes( player_name.toLowerCase() )) {
            return message.channel.send(`The name, **${player_name}**, already exists. Try again.`)
        }
        
        // Creates channel name
		let channelName = player_name.toLowerCase().split(' ').join('-');
		channelName = `${channelName.replace(/[^a-zA-Z0-9 -]/g, "")}s-room`
        
        // Adds & Removes Roles and Sets Nickname to name
        user.roles.add(characterRole).catch(console.error);
        user.roles.remove(beforeLifeRole).catch(console.error);
        user.setNickname(player_name).catch(console.error);
        
        // Creates object in player.json for player
        players[player_name.toLowerCase()] = {
            "location": [
               0,
               0
            ],
            "inside": "",
            "owns": [
            ],
            "claims": 1,
            "builds": 5,
            "LL Points": 0,
            "bought": [],
            "inventory": {
            },
            "hunger": 5,
            "HP": 5,
			"level": 0,
			"experience": 0
        }

        fs.writeFileSync('players.json', JSON.stringify(players))

        // Create Channel
            message.guild.channels.create(channelName, {
                type: 'text',
                permissionOverwrites: [
                {
                    id: message.guild.roles.everyone,
                    deny: ['VIEW_CHANNEL'],
                },
                {
                    id: message.author.id,
                    allow: ['VIEW_CHANNEL'],
                }
                ],
                parent: '850485465835896865', // Request Rooms
            }).then(newChannel => {
                newChannel.send(`Hello!`).then(message => message.pin())
            
                let heyluigichannel = message.guild.channels.cache.get('850537726561353758')
                heyluigichannel.send(`<@276119804182659072> **${userName}** became a character called, "**${player_name}**".`)
          })  
	},
};