// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');

module.exports = {
    name: 'viewshop',
    description: 'Shows you what the shop at your current location is selling',
    aliases: ['vs'],
    guildOnly: true,
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        let players = JSON.parse(fs.readFileSync('players.json'));
        let locations = JSON.parse(fs.readFileSync('locations.json'));
        let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase();
        let theMessage = [];
        
        if (locations[players[userName]['location'].join(', ')]['layers']) {
            Object.entries(locations[players[userName]['location'].join(', ')]['layers']).forEach((entry, num) => {
                console.log(`Location ${num}`)

                if (entry[1]['information']['type'] === 'shop') {
                    Object.entries(locations[players[userName]['location'].join(', ')]['layers'][entry[0]]['selling']).forEach((item, num2) => {
                        console.log(`Selling ${num2}`)
                        let itemName = item[1]['name']
                        let itemType = item[1]['type']
                        let itemAmount = item[1]['amount']
                        let itemPrice = item[1]['price']

                        theMessage.push(`__**${itemName}**__\n    **Type**: \`${itemType}\`\n    **Amount Selling**: \`${itemAmount}\`\n    **Price**: \`${itemPrice}\``)
                        console.log({itemName, itemType, itemAmount, itemPrice})
                    })
                }
            })
        }
        message.channel.send(theMessage)
	},
};