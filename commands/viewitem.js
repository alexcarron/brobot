// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');

module.exports = {
    name: 'viewitem',
    description: 'Tells you ALL the specifics of an item',
    guildOnly: true,
    args: true,
    aliases: ['vi', 'item'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: '<item-name>',
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var items = JSON.parse(fs.readFileSync('items.json'))
        var theItem = args.join(' ').toLowerCase()
        var theMessage = []
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

        if(!Object.keys(items).includes(theItem)) {
                return message.channel.send(`**${theItem}}** is not an item that exists.`)
            } 
        
        theMessage.push(`__**${theItem}**__`)

        if (items[theItem]['description']) {
            let itemDescription = items[theItem]['description']
            theMessage.push(`**Description**: ${itemDescription}`)
        }
        if (items[theItem]['type']) {
            let itemType = items[theItem]['type']
            itemType = `${itemType.charAt(0).toUpperCase()}${itemType.slice(1)}`
            theMessage.push(`**Type**: ${toTitleCase(itemType)}`)
        }
        if (items[theItem]['restore']) {
            let itemRestore = items[theItem]['restore']
            theMessage.push(`**Restores**: ${itemRestore} HP`)
        }
        if (items[theItem]['mines']) {
            let itemMines = items[theItem]['mines']
            theMessage.push(`**Mines**:`)
            itemMines.forEach(mineral => {
                theMessage.push(`    ${toTitleCase(mineral)}`)
            })
        }
        if (items[theItem]['durability']) {
            let itemDurability = items[theItem]['durability']
            theMessage.push(`**Durability**: ${itemDurability}`)
        }
        if (items[theItem]['craftable']) {
            let itemCraftable = items[theItem]['craftable']
            theMessage.push(`**Craft With**:`)
            Object.entries(itemCraftable).forEach(entry => {
                let craftItem = entry[0]
                let craftItemAmount = entry[1]
                theMessage.push(`    \`${craftItemAmount}\` **${toTitleCase(craftItem)}**`)
            })
        }

        message.channel.send(theMessage)
	},
};