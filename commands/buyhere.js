// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
const fs = require('fs');
const jimp = require('jimp');

module.exports = {
    name: 'buyhere',
    description:'Buys something at the shop at your current location',
    guildOnly: true,
    args: true,
    aliases: ['bh', 'buyh'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: '<thing-buying>, <amount>',
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var objects = JSON.parse(fs.readFileSync('objects.json'))
        var players = JSON.parse(fs.readFileSync('players.json'))
        var locations = JSON.parse(fs.readFileSync('locations.json'))
        var items = JSON.parse(fs.readFileSync('items.json'))
        var userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        var balance = players[userName]['LL Points']
        var currentLocation = players[userName]['location']
        var limitations = JSON.parse(fs.readFileSync('limitations.json'))
        var shapes = limitations['shapes']
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
        
        // Do they have 3+ arguments?
        if (commaArgs.length < 2) {
            return message.channel.send(`No no no. You do it like this \`<buyhere <Thing Buying> <amount>\``)
        }

        let thingBuying = commaArgs[0]
        let amount = commaArgs[1]
        let theShopName
        let shopIsSelling

        // Are you at a shop?
        let stopCommand = true
        if (locations[players[userName]['location'].join(', ')]['layers']) {
            Object.entries(locations[players[userName]['location'].join(', ')]['layers']).forEach( (entry) => {
                if (['shop'].includes(entry[1]['information']['type'])) {
                    theShopName = entry[0]
                    shopIsSelling = objects[theShopName]['selling']
                    stopCommand = false
                }
            })
        }
        if (stopCommand) {
            return message.channel.send(`There isn't a shop here`)
        }

        // Does the item exist
            if (!Object.keys(shopIsSelling).includes(thingBuying)) { 
                return message.channel.send(`${thingBuying} is not being sold at the shop`)
            } 

        if (shopIsSelling[thingBuying]['type'] === 'claimed location') {
            thingBuying = `${commaArgs[0]}, ${commaArgs[1]}`
            amount = parseFloat(commaArgs[2])
        }

        // Is it out of stock
            if (shopIsSelling[thingBuying][amount] < amount) {
                return message.channel.send(`Sorry there's not enough in stock.`)
            }

        // Correct Amount?
            if (['object','house', 'claimed location'].includes(shopIsSelling[thingBuying]['type'])) {
                if (amount != 1) {
                    return message.channel.send(`You can only buy one of those`)
                }
            }

        // Do you have enough money
            if(balance < shopIsSelling[thingBuying]['price']*amount) {
                return message.channel.send(`You don't have enough LL Points for that. You need \`${shopIsSelling[thingBuying]['price']*amount}\``)
            }
        
        let theShopOwner = locations[players[userName]['location'].join(', ')]['layers'][theShopName]['information']['owner']

        // Transaction
        // Object
            if (['object','house'].includes(shopIsSelling[thingBuying]['type'])) {
                let newObjectName = shopIsSelling[thingBuying]['name']
            // Checks if object already exists
                allObjects.forEach(
                    (objname) => {
                        if (newObjectName === objname) {
                            message.channel.send(`The name, **${newObjectName}**, already exists. So it was renamed to **${newObjectName}${allObjects.length}**.`)
                            newObjectName = `${newObjectName}${allObjects.length}`
                        }
                    })
                objects[newObjectName] = objects[shopIsSelling[thingBuying]['name']]
                objects[newObjectName]['information']['owner'] = userName

            // Change balance
                players[userName]['LL Points'] = balance - shopIsSelling[thingBuying]['price']*amount
                players[theShopOwner]['LL Points'] = players[theShopOwner]['LL Points'] + shopIsSelling[thingBuying]['price']*amount

        
        // Claim
            } else if (shopIsSelling[thingBuying]['type'] === 'claimed location') {
                locations[thingBuying]['owner'] = userName

                // Change balance
                  players[userName]['LL Points'] = balance - shopIsSelling[thingBuying]['price']*amount
                  players[theShopOwner]['LL Points'] = players[theShopOwner]['LL Points'] + shopIsSelling[thingBuying]['price']*amount

                // Change stock
                    objects[theShopName]['selling'][thingBuying]['amount'] = 0
            
        // Items
            } else if (shopIsSelling[thingBuying]['type'] === 'item') {
                // Puts Item in Inventory
				let inv_space_of_player = players[userName]['inventory']['space']
				
				if (inv_space_of_player[1] <= inv_space_of_player[0] + amount) {
					return message.channel.send(`You don't have enough space left in your inventory. You only have room for \`${inv_space_of_player[1] - inv_space_of_player[0]}\` items.`)
				}
				
                if (players[userName]['inventory'][thingBuying]) {
                    players[userName]['inventory'][thingBuying]['amount'] = players[userName]['inventory'][thingBuying]['amount'] + amount
                } else {
                    players[userName]['inventory'][thingBuying] = items[thingBuying]
                    players[userName]['inventory'][thingBuying]['amount'] = amount
                }
				
				players[userName]['inventory']['space'][0] += amount
                console.log(players[userName]['inventory'])

                // Change balance
                players[userName]['LL Points'] = balance - shopIsSelling[thingBuying]['price']*amount
                players[theShopOwner]['LL Points'] = players[theShopOwner]['LL Points'] + shopIsSelling[thingBuying]['price']*amount

                // Change stock
                    objects[theShopName]['selling'][thingBuying]['amount'] = objects[theShopName]['selling'][thingBuying]['amount'] - amount
            }

        fs.writeFileSync('objects.json', JSON.stringify(objects))
        fs.writeFileSync('players.json', JSON.stringify(players))
        fs.writeFileSync('locations.json', JSON.stringify(locations))

        message.channel.send(`You just bought ${amount} ${thingBuying}. You now have \`${players[userName]['LL Points']}\` LL Points`)
	},
};