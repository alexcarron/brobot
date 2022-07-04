// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
const fs = require('fs');
var jimp = require('jimp');

module.exports = {
    name: 'donate',
    description: 'Donates chosen items to another player if you have a Donation Basket',
    guildOnly: true,
    args: true,
    aliases: ['give'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: '<player-donating-to>, <item-name>, <amount>',
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var commaArgs = args.join(' ').split(', ') 
        var objects = JSON.parse(fs.readFileSync('objects.json'))
        var players = JSON.parse(fs.readFileSync('players.json'))
        var locations = JSON.parse(fs.readFileSync('locations.json'))
        var items = JSON.parse(fs.readFileSync('items.json'))
        var userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        var balance = players[userName]['LL Points']
        var currentLocationText = players[userName]['location'].join(', ')
        var allObjects = Object.keys(objects)
        var plantName = args.join(' ')
        var otherPlayerName = commaArgs[0].toLowerCase()
        var itemName = commaArgs[1].toLowerCase()
        var amount = commaArgs[2]

        // Processing
        message.channel.send(`Processing...`)

        // Have the donation basket
        if (!players[userName]['inventory']['donation basket']) {
            return message.channel.send(`You need a Donation Basket`)
        } else if (players[userName]['inventory']['Donation Basket']['amount'] <= 0) {
            return message.channel.send(`You need a Donation Basket`)
        }

        // Have the items?
        if (!players[userName]['inventory'][itemName]) {
            return message.channel.send(`You don't have the item, **${itemName}**`)
        } else if (players[userName]['inventory'][itemName]['amount'] < amount) {
            return message.channel.send(`You only have \`${amount}\` **${itemName}**`)
        }

        if (!players[otherPlayerName]) {
            return message.channel.send(`**${otherPlayerName}** is not a player that exists`)
        }
		
		let inv_space_of_other_player = players[otherPlayerName]['inventory']['space']
				
		if (inv_space_of_other_player[1] < inv_space_of_other_player[0] + amount) {
			return message.channel.send(`They don't have enough space left in their inventory to get that many items.`)
		}
            
        players[userName]['inventory'][itemName]['amount'] = players[userName]['inventory'][itemName]['amount'] - amount
		
		players[userName]['inventory']['space'][0] -= amount
		
        if (!players[otherPlayerName]['inventory'][itemName]) {
            players[otherPlayerName]['inventory'][itemName] = items[itemName]
            players[otherPlayerName]['inventory'][itemName]['amount'] = amount
        } else {
            players[otherPlayerName]['inventory'][itemName]['amount'] = players[otherPlayerName]['inventory'][itemName]['amount'] + amount
        }
		
		players[otherPlayerName]['inventory']['space'][0] += amount

        
        fs.writeFileSync('players.json', JSON.stringify(players))
        
        let channelName = otherPlayerName.toLowerCase()
        channelName = channelName.replace(/[^a-zA-Z0-9 ]/g,"")
        channelName = `${channelName.replace(' ','-')}s-room`
        let youRoom = message.guild.channels.cache.find(c => c.name === channelName)
        youRoom.send(`You were donated \`${amount}\` **${itemName}** from **${userName}**`)

        // Confirmation Message
            message.channel.send(`You donated \`${amount}\` **${itemName}** to **${otherPlayerName}**`)
	},
};