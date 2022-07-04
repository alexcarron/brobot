// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
/* 
        ! Red
        TODO Orange
        ^ Yellow
        * Lime
        ? Blue
        ~ Purple
        & Pink
*/
const fs = require('fs');
var jimp = require('jimp');

module.exports = {
    name: 'smelt',
    description: 'Smelts item(s) you have in your inventory into something else. You need a Smelter in order to smelt and you must place it in your house and go inside it to smelt',
    guildOnly: true,
    args: true,
    aliases: ['s', 'sm'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: '<item-smelting>, <other-item-smelting>, etc...',
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        var objects = JSON.parse(fs.readFileSync('objects.json'))
        var limitations = JSON.parse(fs.readFileSync('limitations.json'))
        var locations = JSON.parse(fs.readFileSync('locations.json'))
        var items = JSON.parse(fs.readFileSync('items.json'))
        var smeltList = JSON.parse(fs.readFileSync('smelt list.json'))
        var players = JSON.parse(fs.readFileSync('players.json'))
        var thePlayer = players[userName]
        var shapes = limitations['shapes']
        var allObjects = Object.keys(objects)
        var heyluigichannel = message.guild.channels.cache.get('850537726561353758')
        var itemSmelting = args.join(' ').toLowerCase()
        var playerLocation = players[userName]['location'].join(', ')
        var insideLocation = players[userName]['inside']
        var insideStatus = players[userName]['inside'] != "" 
        var commaArgs = args.join(' ').toLowerCase().split(', ') 
        var stopMessage = false
        var smeltRecipe = {}
        var itemSmeltingInto
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

        // Processing
        message.channel.send(`Processing...`)

            // Not Inside?
            if (!insideStatus) {
                return message.channel.send(`You have to be inside your home to smelt.`)
            }
            
            // Inside a Shop instead?
            if (locations[playerLocation]['layers'][insideLocation]['information']['type'] != 'house') {
                return message.channel.send(`You have to be inside your home to smelt. This is not a house.`)
            }
            
            // Doesn't Own House?
            if (locations[playerLocation]['layers'][insideLocation]['information']['owner'] != userName) {
                return message.channel.send(`You have to be inside your home to smelt. You don't own this place`)
            }
            
            // Smelter Not Inside House?
            if (!Object.keys(locations[playerLocation]['layers'][insideLocation]['inside']['layers']).includes('smelter')) {
                return message.channel.send(`There needs to be a Smelter in your house for you to smelt`)
            }

            // Smelter Not Plugged In?
            if (!Object.keys(players[userName]['inventory']).includes('plug')) {
                return message.channel.send(`Your Smelter isn't plugged in. You need to make a plug before you can use it.`)
            }

            // Smelter Not Plugged In?
            if (players[userName]['inventory']['plug']['amount'] <= 0) {
                return message.channel.send(`Your Smelter isn't plugged in. You need to make a plug before you can use it.`)
            }

            // Not Smeltable?
            var notSmeltable = true

            Object.entries(smeltList).forEach(entry => {
                let smeltsInto = entry[0]
                let recipe = entry[1]
				
                if (
					Object.keys(recipe).length === commaArgs.length && 
					Object.keys(recipe).every(item => commaArgs.includes(item.toLowerCase()))
				) {
                    notSmeltable = false
                    itemSmeltingInto = smeltsInto
                    smeltRecipe = recipe
                }
            })

            if(notSmeltable) {
                return message.channel.send(`That's not something you can smelt`)
            }

            // Item Not In Their Inventory?
            Object.keys(smeltRecipe).forEach( recipeItem => {
                if(!Object.keys(players[userName]['inventory']).includes(recipeItem)) {
                    stopMessage = `**${recipeItem}** is not in your inventory`
                }
            } )

            if (stopMessage) {
                return message.channel.send(stopMessage)
            }
            
            // Have enough of that Item?
            Object.entries(smeltRecipe).forEach( entry => {
                var recipeItem = entry[0]
                var amountOfRecipeItem = entry[1]
                if(players[userName]['inventory'][recipeItem]['amount'] < amountOfRecipeItem) {
                    return stopMessage = `You don't have enough **${recipeItem}**`
                }
            } )
            
            if (stopMessage) {
                return message.channel.send(stopMessage)
            }

        let stopNeededToSmeltCommand = false
        let errorMessage = ''
        let itemsNeededToSmelt = smeltRecipe
        let itemsNeededToSmeltString = []
        
        // Check Items Needed To Smelt
        Object.entries(itemsNeededToSmelt).forEach(item => {
            if (stopNeededToSmeltCommand) {return}
            let itemNeeded = item[0]
            let amountNeeded = item[1]

            // Is the Item in their inventory
            if (!Object.keys(thePlayer['inventory']).includes(itemNeeded)) {
                errorMessage = `You don't have the items needed to smelt this. You need \`${Object.keys(itemsNeededToSmelt).join('`, `')}\`.`
                return stopNeededToSmeltCommand = true
            }

            // Do they have the amount they need?
            if (thePlayer['inventory'][itemNeeded]['amount'] < amountNeeded) {
                errorMessage = `You don't have enough \`${itemNeeded}\`. You need \`${amountNeeded}\`, but only have \`${thePlayer['inventory'][itemNeeded]['amount']}\`.`
                return stopNeededToSmeltCommand = true
            }

            itemsNeededToSmeltString.push(`\`${amountNeeded}\` **${itemNeeded}**`)

            players[userName]['inventory'][itemNeeded]['amount'] -= amountNeeded
			
			players[userName]['inventory']['space'][0] -= amountNeeded
        })

        if (stopNeededToSmeltCommand) {
            return message.channel.send(errorMessage)
        }

		let inv_space_of_player = players[userName]['inventory']['space']
				
		if (inv_space_of_player[1] <= inv_space_of_player[0] + 1) {
			return message.channel.send(`You don't have enough space left in your inventory. You only have room for \`${inv_space_of_player[1] - inv_space_of_player[0]}\` items.`)
		}
		
        if(!players[userName]['inventory'][itemSmeltingInto]) {
            players[userName]['inventory'][itemSmeltingInto] = items[itemSmeltingInto]
            players[userName]['inventory'][itemSmeltingInto]['amount'] = 1
        } else {
            players[userName]['inventory'][itemSmeltingInto]['amount'] = players[userName]['inventory'][itemSmeltingInto]['amount'] + 1
        }
		
		players[userName]['inventory']['space'][0] += 1
		
		let exp_gained
		if (['steel'].includes(itemSmeltingInto)) {
			exp_gained = 5 + Math.floor( Math.random() * 3 )
		} else {
			exp_gained = 1 + Math.floor( Math.random() * 2 )
		}
		players[userName]['experience'] += exp_gained

        var requestRoomMessage = `You've smelted **${toTitleCase(itemSmelting)}** into **${toTitleCase(itemSmeltingInto)}**`

        // Overwrite JSON file
            fs.writeFileSync('objects.json', JSON.stringify(objects))
            fs.writeFileSync('players.json', JSON.stringify(players))
        
        // Confirmation Message
            message.channel.send(requestRoomMessage)

	},
};