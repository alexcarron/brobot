// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
const fs = require('fs');
var jimp = require('jimp');

module.exports = {
    name: 'createshop',
    description: 'Turns your unplaced house into a shop and sells the thing you put in the command for the amount of LL points you put in the price section',
    guildOnly: true,
    args: true,
    aliases: ['cs', 'makeshop'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    status: true,
    usage: [
        '<your-house-name>, object, <object-name>, 1, <price>',
        '<your-house-name>, house, <house-selling>, 1, <price>',
        '<your-house-name>, claimed location, <location-coordinates>, 1, <price>',
        '<your-house-name>, item, <item-name>, <how-many-selling>, <price-for-each-item>',
    ],
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
		let randExpPoints = 1 + Math.floor( Math.random() * 1.33 )

        var typesOfThingsYouCanSell = ['object', 'house', 'claimed location', 'item']

        // Processing
        message.channel.send(`Processing...`)

        // Makes Arguments Separated by Commas
            var commaArgs = args.join(' ').split(', ') 
        
        // Do they have 3+ arguments?
        if (commaArgs.length < 5) {
            return message.channel.send(`No no no. You do it like this \`<createshop <your house>, <type of thing selling>, <thing selling>, <amount>, <price for one of those things>\``)
        }

        var yourHouseName = commaArgs[0]
        var typeOfThing = commaArgs[1].toLowerCase()
        var thingSelling = commaArgs[2]
        var amount = commaArgs[3]
        var yourPrice = commaArgs[4]

        // Does the house exist?
            if (!Object.keys(objects).includes(yourHouseName) || objects[yourHouseName]['information']['owner'] != userName || objects[yourHouseName]['information']['type'] != 'house') { 
                return message.channel.send(`${yourHouseName} is not a house that you own and/or exists.`)
            } 

        // Was it placed?
            if (objects[yourHouseName]['information']['placed']) {
                return message.channel.send(`That house has been placed already.`)
            }
        
        // Correct Type?
            if (!typesOfThingsYouCanSell.includes(typeOfThing)) {
                return message.channel.send(`**${typeOfThing}** is not a type of thing you can sell.`)
            }

        // Object or House
            if (['object','house'].includes(typeOfThing)) {
                // Check if owns object/house
                    if (!Object.keys(objects).includes(thingSelling) || objects[thingSelling]['information']['owner'] != userName) { 
                        return message.channel.send(`${thingSelling} doesn't exist or you don't own it.`)
                    }
                    
                // Check if selling a shop or character
                    if (objects[thingSelling]['information'] === 'character' || objects[thingSelling]['information'] === 'shop' || thingSelling === yourHouseName) {
                        return message.channel.send(`You cannot sell a shop or a character or the house you're turning into a shop!`)
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
                    if (!parseFloat(yourPrice) || parseFloat(yourPrice) < 1 || parseFloat(yourPrice) % 1 != 0 ) {
                        return message.channel.send(`\`${yourPrice}\` is not a valid price. It must be a whole number greater than zero`)
                    }
        // Claims
            } else if (typeOfThing === 'claimed location') {
                var locationX = commaArgs[2]
                var locationY = commaArgs[3]
                thingSelling = `${commaArgs[2]}, ${commaArgs[3]}`
                amount = commaArgs[4]
                yourPrice = commaArgs[5]

                // Do they own the location
                if(!players[userName]['owns'].includes(`${locationX}, ${locationY}`)) {
                    return message.channel.send(`You don't own the location, **${locationX}, ${locationY}**`)
                }

                // Check if correct amount 
                if (amount != 1) {
                    return message.channel.send(`You can only sell one of these.`)
                }

                // Check if correct price
                if (!parseFloat(yourPrice) || parseFloat(yourPrice) < 1 || parseFloat(yourPrice) % 1 != 0 ) {
                    return message.channel.send(`\`${yourPrice}\` is not a valid price. It must be a whole number greater than zero`)
                }
        // Items
            } else if (['item'] === typeOfThing) {
                // Check if they have the item
                    if (!players[userName]['inventory'][thingSelling] || players[userName]['inventory'][thingSelling]['amount'] <= 0) {
                        return message.channel.send(`You don't have any **${thingSelling}**s. Check your inventory with \`<self\`.`)
                    }

                // Check if amount is the amount they have
                    if(players[userName]['inventory'][thingSelling]['amount'] < amount) {
                        return message.channel.send(`You only have \`${players[userName]['inventory'][thingSelling]['amount']}\` **${thingSelling}**s. You can't sell more than that`)
                    }

                // Valid Price
                    if (!parseFloat(yourPrice) || parseFloat(yourPrice) < 1 || parseFloat(yourPrice) % 1 != 0 ) {
                        return message.channel.send(`\`${yourPrice}\` is not a valid price. It must be a whole number greater than zero`)
                    }

                // Get rid of item
                    players[userName]['inventory'][thingSelling]['amount'] -= amount
		
					players[userName]['inventory']['space'][0] -= amount

                // Check if correct price
                if (!parseFloat(yourPrice) || parseFloat(yourPrice) < 1) {
                    return message.channel.send(`\`${yourPrice}\` is not a valid price. It must be greater than zero`)
                }
            }
        
        // Change into shop
        objects[yourHouseName]['information']['type'] = 'shop'
        objects[yourHouseName]['selling'] = {}
        objects[yourHouseName]['selling'][thingSelling] = {
                'name':thingSelling,
                'type':typeOfThing,
                'amount':parseFloat(amount),
                'price':parseFloat(yourPrice),
            }
			
		players[userName]['experience'] += randExpPoints

        fs.writeFileSync('objects.json', JSON.stringify(objects))
        fs.writeFileSync('players.json', JSON.stringify(players))
        fs.writeFileSync('locations.json', JSON.stringify(locations))

        message.channel.send(`You changed your house, **${yourHouseName}**, to a shop selling \`${amount}\` **${thingSelling}**${amount > 1 ? 's' : ''} for \`${yourPrice}\` LL Points each.`)
        let heyluigichannel = message.guild.channels.cache.get('850537726561353758')
        heyluigichannel.send(`<@276119804182659072> **${userName}** changed their house, **${yourHouseName}**, to a shop selling \`${amount}\` **${thingSelling}**${amount > 1 ? 's' : ''}  for \`${yourPrice}\` LL Points each.`)
		message.channel.send(`\`+${randExpPoints} XP\``)
	},
};