// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');

module.exports = {
    name: 'explore',
    description: 'Moves you to another location or brings you inside or outside a house. The amount of steps is the amount of locations you go past',
    guildOnly: true,
    args: true,
    aliases: ['e', 'move'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: [
        'left/right/up/down, <amount of steps>',
        'inside, <house/shop-name>',
        'outside'
    ],
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        let locations = JSON.parse(fs.readFileSync('locations.json'))
        let players = JSON.parse(fs.readFileSync('players.json'))
        let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        let commaArgs = args.join(' ').split(', ') 
        let direction = commaArgs[0].toLowerCase()
        let stepsTaking = commaArgs[1];
        let player_location = players[userName]['location']
        let player_location_str = players[userName]['location'].join(', ')
        let new_location
        let directions = ['left', 'right', 'down', 'up', 'inside', 'outside']
        let is_the_player_inside = players[userName]['inside'] != ""
        let player_inventory = players[userName]['inventory']
		let new_location_str;
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

        message.channel.send(`Processing...`)
            
        // IF - Is the DIRECTION VALID?
        if (!['left', 'right', 'down', 'up', 'inside', 'outside', 'l', 'r', 'd', 'u', 'i', 'o'].includes(direction)) {

            return message.channel.send(`**${direction}** is not a direction you can go right now. You can only go \`${directions.slice(0,directions.length-1).join(`\`, \``)}\`, or \`${directions[directions.length-1]}\``)
    
        }
        

        // IF - WHICH DIRECTION?
        if (['left', 'right', 'l', 'r'].includes(direction)) {

            let distanceCanTravel = 1


            // IF - Set dealt steps
            if (!stepsTaking) {
                stepsTaking = 1 
            }

            stepsTaking = parseInt(stepsTaking)
            

            // IF - Check if they're inside
            if (is_the_player_inside) {
                return message.channel.send(`You have to be outside to explore`)
            }


            // IF - Check how far they can travel
            if (player_inventory['Car'] && player_inventory['Car']['amount'] > 0) {
                distanceCanTravel = 25
            } else if (player_inventory['Bicycle'] && player_inventory['Bicycle']['amount'] > 0) {
                distanceCanTravel = 10
            } else if (player_inventory['Unicycle'] && player_inventory['Unicycle']['amount'] > 0) {
                distanceCanTravel = 5
            }


            // IF - Check if they can go that far
            if (stepsTaking > distanceCanTravel) {
                return message.channel.send(`You can't go that far! Check what transportation devices you have`)
            }
			
			if (player_location[1] < 0) {
				return message.channel.send(`You're underground so you can't move horizontally`)
			}


            // Check if they going backwards or not moving
            if (stepsTaking <= 0) {
                return message.channel.send(`You can't take 0 or negative steps`)
            }


            // IF - Are they going left?
            if (['left', 'l'].includes(direction)) {
                new_location = [player_location[0]-stepsTaking, player_location[1]]
                new_location_str = new_location.join(', ')

                // IF - Check if location exists
                if (!locations[`${new_location[0]}, ${new_location[1]}`]) {
                    return message.channel.send (`Sorry, you can't go there yet.`)
                }
            }
        
            // Right
                if (['right', 'r'].includes(direction)) {
                    new_location = [player_location[0]+stepsTaking, player_location[1]]
					new_location_str = new_location.join(', ')
                   
                    console.log({stepsTaking, newLocation: new_location})

                    // IF - Check if location exists
                    if (!locations[`${new_location[0]}, ${new_location[1]}`]) {
                        return message.channel.send (`Sorry, you can't go there yet.`)
                    }
                }

                players[userName]['location'] = new_location
                fs.writeFileSync('players.json', JSON.stringify(players))

                // Confirmation Message
					let theMessage;
				
					if (!locations[new_location_str]['owner']) {
						theMessage = [`This location isn't owned so you can claim it with \`<claim\`.`];
					} else {
						theMessage = [`This location is owned by **${toTitleCase(locations[new_location_str]['owner'])}**.`];
					}
					
					theMessage.push(`You are at \`(${new_location[0]}, ${new_location[1]})\` now. Here's what it looks like:`)
				
                    message.channel.send(theMessage, {
                        files: [locations[`${new_location[0]}, ${new_location[1]}`]['image'][0]]
                    })
        
        } else if (['inside', 'i'].includes(direction)) {
            console.log( `%c Comma Args`, `color: blue; font-weight: bold;` )
            console.log(commaArgs)
            console.log( `%c Player Info`, `color: green; font-weight: bold;` )
            console.log(players[userName])
			let building_entering

            if (players[userName]['inside'] != "") {
                return message.channel.send(`You have to be outside to go inside...`)
            }

            if (commaArgs.length < 2) {
                return message.channel.send(`You need more arguments! \`<explore inside, [Building Name]\``)
            }
			
			building_entering = commaArgs[1].toLowerCase();

            let stopCommand = true
            if (locations[player_location_str]['layers']) {
                Object.entries(locations[player_location_str]['layers']).forEach( (entry) => {
					let layer_name = entry[0];
					let layer_properties = entry[1];
					let layer_type = layer_properties['information']['type']
					
                    if (['shop','house','church'].includes(layer_type)) {
                        if(layer_name === building_entering) {
                            stopCommand = false
                        }
                    }
                })
            }
            if (stopCommand) {
                return message.channel.send(`There isn't a building here called, **${building_entering}**. \`<explore inside, [Building Name]\``)
            }
			
			let building = locations[player_location_str]['layers'][building_entering]
			let building_type = building['information']['type']

			if (building_type === 'church') {
				if (!players[userName]['following'] || players[userName]['following'] !=  building['information']['religion']) {
					return message.channel.send(`You cannot enter this church as you are not following their religion.`)
				}
			}

            players[userName]['inside'] = `${building_entering}`
            fs.writeFileSync('players.json', JSON.stringify(players))

            // Confirmation Message
                message.channel.send(`You are inside of **${toTitleCase(building_entering)}**. Here's what it looks like:`, {
                    files: [locations[`${player_location[0]}, ${player_location[1]}`]['layers'][building_entering]['inside']['information']['image'][0]]
                })

        } else if (['outside', 'o'].includes(direction)) {
            if (players[userName]['inside'] === "") {
                return message.channel.send(`You have to be inside to go outside...`)
            }

            players[userName]['inside'] = ""
            fs.writeFileSync('players.json', JSON.stringify(players))

            // Confirmation Message
                message.channel.send(`You are now outside at the location, \`${player_location.join(', ')}\`. Here's what it looks like:`, {
                    files: [locations[`${player_location[0]}, ${player_location[1]}`]['image'][0]]
                })
        } else if (['up', 'u', 'down', 'd'].includes(direction)) {
            if (players[userName]['inside'] != "") {
                return message.channel.send(`You have to be outside to explore`)
            }

            

            // Up
            if (['up', 'u'].includes(direction)) {
                let noValidLadder = `There's no ladder here. So you can't go up`
				
				console.log(player_location[1])
				if (player_location[1] < 0) {
					noValidLadder = false
				} else {
					// Check for ladder
					if (locations[player_location.join(', ')]['layers']) {
					Object.entries(locations[player_location.join(', ')]['layers']).forEach((entry) => {
						
						if (entry[1]['information']['name'] === 'Ladder') {
							
							if (entry[1]['space']['height'][0] <= 0 && 0 <= entry[1]['space']['height'][1]) {
								noValidLadder = false
							} else {
								noValidLadder = `Your ladder needs to be touching the top of the location`
							}
						}
					})
					}
				}
				
                if (noValidLadder) {
                    return message.channel.send(noValidLadder)
                }

                new_location = [player_location[0], player_location[1]+1]
				new_location_str = `${new_location[0]}, ${new_location[1]}`

                if (!locations[`${new_location[0]}, ${new_location[1]}`]) {
                    return message.channel.send (`Sorry, you can't go there yet.`)
                }
            }
        
            // Down
                if (['down', 'd'].includes(direction)) {
                    let isThereStone = false
					
                    if(!locations[player_location.join(', ')]['mine']) {
                        return message.channel.send(`You can't explore down here`)
                    } else {
                        Object.entries(locations[player_location.join(', ')]['layers']).forEach((entry) => {
                            if (entry[1]['information']['type'] === 'mineral') {
                                isThereStone = true
                                return
                            }
                        })
                    }
                    if (isThereStone) {
                        return message.channel.send(`You need to mine ALL the minerals here first`)
                    }

                    new_location = [player_location[0], player_location[1]-1]
					new_location_str = `${new_location[0]}, ${new_location[1]}`

                    if (!locations[new_location_str]) {
                        return message.channel.send(`Sorry, you can't go there yet.`)
                    }
                }

			players[userName]['location'] = new_location
			fs.writeFileSync('players.json', JSON.stringify(players))

			// Confirmation Message
				let theMessage;
			
				if (!locations[new_location_str]['owner']) {
					theMessage = [`This location isn't owned so you can claim it with \`<claim\`.`];
				} else {
					theMessage = [`This location is owned by **${toTitleCase(locations[new_location_str]['owner'])}**.`];
				}
				
				theMessage.push(`You are at \`(${new_location[0]}, ${new_location[1]})\` now. Here's what it looks like:`)
				message.channel.send(theMessage.join('\n'), {
					files: [locations[new_location_str]['image'][0]]
				})
        }
    }
};