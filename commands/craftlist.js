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
    name: 'craftlist',
    description: 'Lists every item you can currently craft and smelt',
    guildOnly: true,
    aliases: ['crl'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        var objects = JSON.parse(fs.readFileSync('objects.json'))
        var limitations = JSON.parse(fs.readFileSync('limitations.json'))
        var locations = JSON.parse(fs.readFileSync('locations.json'))
        var items = JSON.parse(fs.readFileSync('items.json'))
        var players = JSON.parse(fs.readFileSync('players.json'))
        var smeltList = JSON.parse(fs.readFileSync('smelt list.json'))
        var thePlayer = players[userName]
        var shapes = limitations['shapes']
        var allObjects = Object.keys(objects)
        var heyluigichannel = message.guild.channels.cache.get('850537726561353758')
        var playerLocation = players[userName]['location'].join(', ')
        var insideLocation = players[userName]['inside']
        var insideStatus = players[userName]['inside'] != "" 
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}
        
        var theMessage = []

        // Processing
        message.channel.send(`Processing...`)

        
        Object.entries(items).forEach(entry => {
            let item = entry[0]
            let itemProperties = entry[1]
            let canCraft = true
            let theItemsNeeded = []
            let requiredItems

            if(itemProperties['required']) {
                requiredItems = itemProperties['required']
            }


            if (itemProperties['craftable']){
                theItemsNeeded.push(`__**${toTitleCase(item)}**__`)

                Object.entries(itemProperties['craftable']).forEach(entry2 => {
                    let craftItem = entry2[0]
                    let craftItemAmount = entry2[1]

                    if (!Object.keys(thePlayer['inventory']).includes(craftItem)) {
                        return canCraft = false
                    }
                    
                    if (thePlayer['inventory'][craftItem]['amount'] < craftItemAmount) {
                        return canCraft = false
                    }   

                    theItemsNeeded.push(`\`${craftItemAmount}\` **${toTitleCase(craftItem)}**`)
                })

                if (requiredItems) {
					requiredItems = requiredItems.map(item => {
						return toTitleCase(item)
					})
					
                    theItemsNeeded.push(`**Required**: \`${requiredItems.join('`, `')}\``)
                }
            } else {
                canCraft = false
            }


            if (canCraft) {
                theMessage.push(`${theItemsNeeded.join('\n')}\n`)
            }
        })

        Object.entries(smeltList).forEach(entry => {
            let smeltsInto = entry[0]
            let recipe = entry[1]
            let canSmelt = true
            let theItemsNeededForSmelting = []

		theItemsNeededForSmelting.push(`__**${toTitleCase(smeltsInto)}**__ \nSmelt:`)

            Object.entries(recipe).forEach(entry => {
                let smeltItem = entry[0]
                let smeltItemAmount = entry[1]

                if (!Object.keys(thePlayer['inventory']).includes(smeltItem)) {
                    return canSmelt = false
                }
                
                if (thePlayer['inventory'][smeltItem]['amount'] < smeltItemAmount) {
                    return canSmelt = false
                }

                theItemsNeededForSmelting.push(`\`${smeltItemAmount}\` **${toTitleCase(smeltItem)}**`)
            })

            if (canSmelt) {
                theMessage.push(`${theItemsNeededForSmelting.join('\n')}\n`)
            }

        })
        
        // Confirmation Message
        console.log(theMessage)
        if (theMessage != []) {
            message.channel.send(theMessage)
        } else {
            return message.channel.send(`You can craft NOTHING`)
        }
	},
};