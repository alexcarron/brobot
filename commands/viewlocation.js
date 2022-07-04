/* eslint-disable no-unused-vars */
// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');

module.exports = {
    name: 'viewlocation',
    description: 'Shows you your current location, all the plants in the location, all the houses in the locations, all the shops in the location and what the shops are the selling. You can put plants, houses, or shops in the argument of the command to only view those things',
    usage: 'plants/minerals/houses/churches/shops (Optional)',
    guildOnly: true,
    aliases: ['vl', 'location'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        let objects = JSON.parse(fs.readFileSync('objects.json'))
        let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        let locations = JSON.parse(fs.readFileSync('locations.json'))
        let players = JSON.parse(fs.readFileSync('players.json'))
        let playerLocation = players[userName]['location']
        let player_location_str = players[userName]['location'].join(', ')
        let colors = JSON.parse(fs.readFileSync('limitations.json'))['colors']
        let insideStatus = players[userName]['inside'] != "" 
        let theMessage = [];
        let minerals = []
		let object_type = args.join(' ').toLowerCase()
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

        message.channel.send(`Processing...`)

        if (insideStatus) {
            return message.channel.send(`There's nothing to see inside`)
        }

        Object.entries(locations[player_location_str]['layers']).forEach(
            (layer, num) => {
				let layer_name = layer[0]
				let layer_properties = layer[1];
				
                if ( ['plant', 'mineral', 'house', 'church', 'shop'].includes(layer_properties['information']['type']) ) {
					
                    if (layer_properties['information']['type'] === 'house') {
                        if ( ['plants', 'minerals', 'churches', 'shops'].includes(object_type) ) {
                            return
                        }
                        let houseOwner = layer_properties['information']['owner']
                        let houseImage = layer_properties['information']['image'][0]

                        theMessage.push([`There's a house owned by **${toTitleCase(houseOwner)}** called, **${toTitleCase(layer_name)}**, here:`, houseImage])
                        console.log({layer_name, houseOwner, houseImage})
						
                    } else if (layer_properties['information']['type'] === 'church') {
                        if ( ['plants', 'minerals', 'houses', 'shops'].includes(object_type) ) {
                            return
                        }

                        let churchOwner = layer_properties['information']['owner']
                        let church_religion = layer_properties['information']['religion']
                        let churchImage = layer_properties['information']['image'][0]

                        theMessage.push([`There's a **${toTitleCase(church_religion)}** church owned by **${toTitleCase(churchOwner)}** called, **${toTitleCase(layer_name)}**, here:`, churchImage])
                        console.log({layer_name, churchOwner, church_religion, churchImage})
						
                    } else if (layer_properties['information']['type'] === 'shop') {
                        if ( ['plants', 'minerals', 'houses', 'churches'].includes(object_type) ) {
                            return
                        }

						let shopOwner = layer_properties['information']['owner']
                        let shopImage = layer_properties['information']['image'][0]
                        let shopSelling = []

                        Object.entries(layer_properties['selling']).forEach((item, itemNum) => {
                            let itemName = item[1]['name']
                            let itemType = item[1]['type']
                            let itemAmount = item[1]['amount']
                            let itemPrice = item[1]['price']

                            shopSelling.push(
								`__**${toTitleCase(itemName)}**__\`(x${itemAmount})\` (${toTitleCase(itemType)})\n` +
								`    \`${itemPrice} LL Points\``
							)
                            console.log({itemName, itemType, itemAmount, itemPrice, shopSelling})
                        })

                        theMessage.push([`There's a shop owned by **${toTitleCase(shopOwner)}** called, **${toTitleCase(layer_name)}**, here. It sells:\n` + 
						`${shopSelling.join('\n')}`, shopImage])
						
                        console.log({layer_name, shopOwner, shopImage})
						
                    } else if (layer_properties['information']['type'] === 'plant') {
                        if ( ['minerals', 'houses', 'churches', 'shops'].includes(object_type) ) {
                            return
                        }

						let plantImage = layer_properties['information']['image'][0]

                        theMessage.push([`There's a **${toTitleCase(layer_name)}** plant here:`, plantImage])
						
                        console.log({layer_name, plantImage})
						
                    } else if (layer_properties['information']['type'] === 'mineral') {
                        if ( ['plants', 'houses', 'churches', 'shops'].includes(object_type) ) {
                            return
                        }
						
                        let mineralName = layer_properties['information']['name']
                        let mineralImage = layer_properties['information']['image'][0]

                        if (minerals.includes(mineralName)) {
                            return
                        }

                        minerals.push(mineralName)
                        theMessage.push([`There's **${toTitleCase(mineralName)}** here:`, mineralImage])
						
                        console.log({mineralName, mineralImage, minerals})
                    }
                    
                }
            });

            (async function() {
                let num = 0;

                await message.channel.send(`\`${playerLocation.join(', ')}\``, {
                    files: [locations[playerLocation.join(', ')]['image'][0]]
                });

                    for (let message_ of theMessage) {
                        
                        await message.channel.send(message_[0], {
                            files: [message_[1]]
                        })

                        if (theMessage.length-1 === num) {
                            
                            message.channel.send(`That's it`)
                        }
                    }
                num = num + 1
            })();        
	},
};