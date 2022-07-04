// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
const fs = require('fs');
var jimp = require('jimp');

module.exports = {
    name: 'sellmore',
    description: 'Sells more of an existing item your selling at the shop you own at your current location',
    guildOnly: true,
    args: true,
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    status: true,
    usage: '<item-name>, <amount>',
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var objects = JSON.parse(fs.readFileSync('objects.json'))
        var players = JSON.parse(fs.readFileSync('players.json'))
        var locations = JSON.parse(fs.readFileSync('locations.json'))
        var limitations = JSON.parse(fs.readFileSync('limitations.json'))
        var shapes = limitations['shapes']
        var userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        var colors = limitations['colors']
        var builds = ['character', 'object', 'house']
        var allObjects = Object.keys(objects)
        var widthAndHeightRange = limitations['width/height']['range']
        var widthAndHeightMultiple = limitations['width/height']['multiple']

        var typesOfThingsYouCanSell = ['object', 'house', 'claimed location', 'item']

        // Processing
        message.channel.send(`Processing...`)

        // Makes Arguments Separated by Commas
            var commaArgs = args.join(' ').split(', ') 
        
        // Do they have 2+ arguments?
        if (commaArgs.length < 2) {
            return message.channel.send(`No no no. You do it like this \`<sell <type of thing selling>, <thing selling>, <amount>, <price>\``)
        }

        var thingSelling = commaArgs[0].toLowerCase()
        var amount = parseFloat(commaArgs[1].toLowerCase())
        var theShopName

        // Are you at a shop?
        var stopCommand = true
        if (locations[players[userName]['location'].join(', ')]['layers']) {
            Object.entries(locations[players[userName]['location'].join(', ')]['layers']).forEach( (entry) => {
                if (['shop'].includes(entry[1]['information']['type'])) {
                    theShopName = entry[0]
                    stopCommand = false
                }
            })
        }
        if (stopCommand) {
            return message.channel.send(`There isn't a shop here`)
        }

        // Do you own the shop?
            if(objects[theShopName]['information']['owner'] != userName) {
                return message.channel.send(`You don't own the shop here`)
            }


        // Check if selling it
            if(!Object.keys(objects[theShopName]['selling']).includes(thingSelling)) {
                return message.channel.send(`You're not selling, **${thingSelling}**.`)
            }

        // Make sure it's an item
            if(objects[theShopName]['selling'][thingSelling]['type'] != 'item') {
                return message.channel.send(`You can only <sellmore items`)
            }

        // Check if they have the item
            if (!players[userName]['inventory'][thingSelling] || players[userName]['inventory'][thingSelling]['amount'] <= 0) {
                return message.channel.send(`You don't have any **${thingSelling}**s. Check your inventory with \`<self\`.`)
            }

        // Check if amount is the amount they have
            if(players[userName]['inventory'][thingSelling]['amount'] < amount) {
                return message.channel.send(`You only have \`${players[userName]['inventory'][thingSelling]['amount']}\` **${thingSelling}**s. You can't sell more than that`)
            }

        // Get rid of item
            players[userName]['inventory'][thingSelling]['amount'] -= amount
			
			players[userName]['inventory']['space'][0] -= amount
        
        // Change into shop
        objects[theShopName]['selling'][thingSelling]['amount'] = objects[theShopName]['selling'][thingSelling]['amount'] + amount

            fs.writeFileSync('objects.json', JSON.stringify(objects))
            fs.writeFileSync('players.json', JSON.stringify(players))
            fs.writeFileSync('locations.json', JSON.stringify(locations))

            message.channel.send(`You're now selling \`${amount}\` more **${thingSelling}**${amount > 1 ? 's' : ''}.`)
            let heyluigichannel = message.guild.channels.cache.get('850537726561353758')
            heyluigichannel.send(`<@276119804182659072> **${userName}** is now selling \`${amount}\` more **${thingSelling}**${amount > 1 ? 's' : ''}.`)
	},
};