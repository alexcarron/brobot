// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
const fs = require('fs');
var jimp = require('jimp');

module.exports = {
    name: 'sell',
    description: 'Sells something you own at the shop you own at your current location',
    guildOnly: true,
    args: true,
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    status: true,
    usage: [
        'object, <thing-selling>, <amount>, <price>',
        'house, <thing-selling>, <amount>, <price>',
        'claimed location, <thing-selling>, <amount>, <price>',
        'item, <thing-selling>, <amount>, <price>'
        
    ],
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var objects = JSON.parse(fs.readFileSync('objects.json'))
        var players = JSON.parse(fs.readFileSync('players.json'))
        var locations = JSON.parse(fs.readFileSync('locations.json'))
        var limitations = JSON.parse(fs.readFileSync('limitations.json'))
        var userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()

        var typesOfThingsYouCanSell = ['object', 'house', 'claimed location', 'item']

        // Processing
        message.channel.send(`Processing...`)

        // Makes Arguments Separated by Commas
            var commaArgs = args.join(' ').split(', ') 
        
        // Do they have 3+ arguments?
        if (commaArgs.length < 4) {
            return message.channel.send(`No no no. You do it like this \`<sell <type of thing selling>, <thing selling>, <amount>, <price>\``)
        }

        var typeOfThing = commaArgs[0].toLowerCase()
        var thingSelling = commaArgs[1]
        var amount = commaArgs[2].toLowerCase()
        var yourPrice = commaArgs[3].toLowerCase()
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
        
        // Correct Type?
            if (!typesOfThingsYouCanSell.includes(typeOfThing)) {
                return message.channel.send(`**${typeOfThing}** is not a type of thing you can sell.`)
            }

        // Check if already selling
            if(Object.keys(objects[theShopName]['selling']).includes(thingSelling)) {
                return message.channel.send(`You're already selling, **${thingSelling}**.`)
            }

        // Object or House
            if (['object','house'].includes(typeOfThing)) {
                // Check if owns object/house
                    if (!Object.keys(objects).includes(thingSelling) || objects[thingSelling]['information']['owner'] != userName) { 
                        return message.channel.send(`${thingSelling} doesn't exist or you don't own it.`)
                    }
                    
                // Check if selling a shop or character
                    if (objects[thingSelling]['information'] === 'character' || objects[thingSelling]['information'] === 'shop') {
                        return message.channel.send(`You cannot sell a shop or a character`)
                    }

                // Is it object/house
                    if (objects[thingSelling]['information']['type'] != typeOfThing) {
                        return message.channel.send(`That's a **${objects[thingSelling]['information']['type']}** not a **${typeOfThing}**`)
                    }

                // Check if correct amount 
                    if (amount != 1) {
                        return message.channel.send(`You can only sell one of these.`)
                    }

                // Check if correct price
                    if (!parseFloat(yourPrice) || parseFloat(yourPrice) <= 0 ) {
                        return message.channel.send(`\`${yourPrice}\` is not a valid price. It must be greater than zero`)
                    }
        // Claims
            } else if (typeOfThing === 'claimed location') {
                var locationX = commaArgs[1].toLowerCase()
                var locationY = commaArgs[2].toLowerCase()
                thingSelling = `${commaArgs[1]}, ${commaArgs[2]}`
                amount = commaArgs[3].toLowerCase()
                yourPrice = commaArgs[4].toLowerCase()

                // Do they own the location
                if(!players[userName]['owns'].includes(`${locationX}, ${locationY}`)) {
                    return message.channel.send(`You don't own the location, **${locationX}, ${locationY}**`)
                }

                // Check if correct amount 
                if (amount != 1) {
                    return message.channel.send(`You can only sell one of these.`)
                }

                // Check if correct price
                if (!parseFloat(yourPrice) || parseFloat(yourPrice) <= 0) {
                    return message.channel.send(`\`${yourPrice}\` is not a valid price. It must be greater than zero`)
                }
        // Items
            } else if ('item' === typeOfThing) {
                // Check if they have the item
                    if (!players[userName]['inventory'][thingSelling] || players[userName]['inventory'][thingSelling]['amount'] <= 0) {
                        return message.channel.send(`You don't have any **${thingSelling}**s. Check your inventory with \`<self\`.`)
                    }

                // Check if amount is the amount they have
                    if(players[userName]['inventory'][thingSelling]['amount'] < amount) {
                        return message.channel.send(`You only have \`${players[userName]['inventory'][thingSelling]['amount']}\` **${thingSelling}**. You can't sell more than that`)
                    }

                // Valid Price
                    if (!parseFloat(yourPrice) || parseFloat(yourPrice) <= 0) {
                        return message.channel.send(`\`${yourPrice}\` is not a valid price. It must be greater than zero`)
                    }

                // Get rid of item
                    players[userName]['inventory'][thingSelling]['amount'] -= amount
			
					players[userName]['inventory']['space'][0] -= amount
            }
        
        // Add to selling
        objects[theShopName]['selling'][thingSelling] = {
                'name':thingSelling,
                'type':typeOfThing,
                'amount':parseFloat(amount),
                'price':parseFloat(yourPrice),
            }

            fs.writeFileSync('objects.json', JSON.stringify(objects))
            fs.writeFileSync('players.json', JSON.stringify(players))
            fs.writeFileSync('locations.json', JSON.stringify(locations))

            let landchannel = message.guild.channels.cache.get('851233573604032544')
            landchannel.send(`**${message.guild.members.cache.get(message.author.id).displayName}** is now selling \`${amount}\` **${thingSelling}**${amount > 1 ? 's' : ''} for \`${yourPrice}\` LL Points each, at the location, \`(${players[userName]['location'].join(', ')})\`.`, {
            files: [locations[players[userName]['location'].join(', ')]['image'][0]]
            })
    
            message.channel.send(`You're now selling \`${amount}\` **${thingSelling}**${amount > 1 ? 's' : ''} for \`${yourPrice}\` LL Points each.`)
            let heyluigichannel = message.guild.channels.cache.get('850537726561353758')
            heyluigichannel.send(`<@276119804182659072> **${userName}** is now selling \`${amount}\` **${thingSelling}**${amount > 1 ? 's' : ''} for \`${yourPrice}\` LL Points each.`)
	},
};