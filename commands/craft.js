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
    name: 'craft',
    description: 'Crafts an item using materials you have in your inventory. You need a workbench placed inside your house and you need to go inside it to craft',
    guildOnly: true,
    args: true,
    aliases: ['c', 'cr'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: '<item-crafting>',
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        var objects = JSON.parse(fs.readFileSync('objects.json'))
        var locations = JSON.parse(fs.readFileSync('locations.json'))
        var items = JSON.parse(fs.readFileSync('items.json'))
        var players = JSON.parse(fs.readFileSync('players.json'))
        var thePlayer = players[userName]
        var heyluigichannel = message.guild.channels.cache.get('850537726561353758')
        var itemCrafting = args.join(' ').toLowerCase()
        var playerLocation = players[userName]['location'].join(', ')
        var insideStatus = players[userName]['inside'] != "" 
        var insideLocation = players[userName]['inside']
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

        // Processing
        message.channel.send(`Processing...`)

        if (itemCrafting != 'workbench') {
            if (!insideStatus) {
                return message.channel.send(`You have to be inside your home to craft.`)
            }
            
            if (locations[playerLocation]['layers'][insideLocation]['information']['type'] != 'house') {
                return message.channel.send(`You have to be inside your home to craft. This is not a house.`)
            }
    
            if (locations[playerLocation]['layers'][insideLocation]['information']['owner'] != userName) {
                return message.channel.send(`You have to be inside your home to craft. You don't own this place`)
            }
    
            if (!Object.keys(locations[playerLocation]['layers'][insideLocation]['inside']['layers']).includes('workbench')) {
                return message.channel.send(`There needs to be a workbench in your house for you to craft`)
            }
    
            if(!Object.keys(items).includes(itemCrafting)) {
                return message.channel.send(`That's not something you can craft`)
            }
    
            if(!items[itemCrafting]['craftable']) {
                return message.channel.send(`That's not something you can craft`)
            }
        }

        let stopNeededToCraftCommand = false
        let stopRequiredItemsCommand = false
        let stopMessage
        let neededToCraft = items[itemCrafting]['craftable']
        let neededToCraftString = []
        let requiredItems
        if (items[itemCrafting]['required']) {
            requiredItems = items[itemCrafting]['required']
        }
        Object.entries(neededToCraft).forEach(entry => {
            if (stopNeededToCraftCommand) {return}
            let itemNeeded = entry[0]
            let amountNeeded = entry[1]

            if (!Object.keys(thePlayer['inventory']).includes(itemNeeded)) {
                stopMessage = `You don't have the items needed to craft. You need \`${Object.keys(neededToCraft).join('`, `')}\`.`
                return stopNeededToCraftCommand = true
            }

            if (thePlayer['inventory'][itemNeeded]['amount'] < amountNeeded) {
                stopMessage = `You don't have enough \`${itemNeeded}\`. You need \`${amountNeeded}\`, but only have \`${thePlayer['inventory'][itemNeeded]['amount']}\`.`
                return stopNeededToCraftCommand = true
            }

            neededToCraftString.push(`\`${amountNeeded}\` **${toTitleCase(itemNeeded)}**`)

            players[userName]['inventory'][itemNeeded]['amount'] -= amountNeeded
		
			players[userName]['inventory']['space'][0] -= amountNeeded
        })

        if (stopNeededToCraftCommand) {
            return message.channel.send(stopMessage)
        }

        if (requiredItems) {
            requiredItems.forEach(item => {
                if (stopRequiredItemsCommand) {return}
    
                if (!Object.keys(thePlayer['inventory']).includes(item)) {
                    stopMessage = `You don't have the items needed to craft. You need a \`${requiredItems.join('`, `')}\`.`
                    return stopRequiredItemsCommand = true
                }
    
                if (thePlayer['inventory'][item]['amount'] <= 0) {
                    stopMessage = `You don't have the items needed to craft. You need a \`${requiredItems.join('`, `')}\`..`
                    return stopRequiredItemsCommand = true
                }
            })
        }

        if (stopRequiredItemsCommand) {
            return message.channel.send(stopMessage)
        }
		
		let inv_space_of_player = players[userName]['inventory']['space']
				
		if (inv_space_of_player[1] < inv_space_of_player[0] + 1) {
			return message.channel.send(`You don't have enough space left in your inventory. You only have room for \`${inv_space_of_player[1] - inv_space_of_player[0]}\` items.`)
		}

        if(!players[userName]['inventory'][itemCrafting]) {
            players[userName]['inventory'][itemCrafting] = items[itemCrafting]
            players[userName]['inventory'][itemCrafting]['amount'] = 1
        } else {
            players[userName]['inventory'][itemCrafting]['amount'] += + 1
        }
		
		players[userName]['inventory']['space'][0] += 1
		
		let exp_gained = 0
		if (['chisel', 'hacksaw', 'car'].includes(itemCrafting)) {
			
			exp_gained = 5 + Math.floor( Math.random() * 3 )
			
		} else if (['smelter', 'stone hatchet', 'stone knife', 'bicycle'].includes(itemCrafting)) {
			
			exp_gained = 2 + Math.floor( Math.random() * 3 )
			
		} else if (['workbench', 'wooden hatchet', 'unicycle', 'ladder', 'donation basket'].includes(itemCrafting)) {
			
			exp_gained = 1 + Math.floor( Math.random() * 2 )
		}
		players[userName]['experience'] += exp_gained

        // Overwrite JSON file
            fs.writeFileSync('objects.json', JSON.stringify(objects))
            fs.writeFileSync('players.json', JSON.stringify(players))
        
        // Confirmation Message
            message.channel.send(`You've crafted a(n) **${toTitleCase(itemCrafting)}** with ${neededToCraftString.join(', ')}`)
			if (exp_gained) {
				message.channel.send(`\`+${exp_gained} XP\``)
			}

	},
};