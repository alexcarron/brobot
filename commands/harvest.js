// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
const fs = require('fs');
let jimp = require('jimp');

module.exports = {
    name: 'harvest',
    description: 'Gets food from the plant at your current location and puts it in your inventory',
    guildOnly: true,
    args: true,
    aliases: ['h', 'gather', 'collect'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: '<plant-name>',
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
		let commaArgs = args.join(' ').split(', ')
        let objects = JSON.parse(fs.readFileSync('objects.json'))
        let players = JSON.parse(fs.readFileSync('players.json'))
        let locations = JSON.parse(fs.readFileSync('locations.json'))
        let items = JSON.parse(fs.readFileSync('items.json'))
        let harvest_info = JSON.parse(fs.readFileSync('harvest info.json'))
        let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        let currentLocationText = players[userName]['location'].join(', ')
        let plantName = args.join(' ').toLowerCase()
        let items_harvested_message = []
		let rand_exp_value = Math.floor( Math.random() * 2 )
		let num_of_items_harvested = 0
		let player_inv = players[userName]['inventory']
		let inv_space_of_player = player_inv['space'];
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}
		function giveWeightedRandNum(outcome_table) {
			let sum = 0, 
				rand_num = Math.random();
				
			for (let outcome in outcome_table) {
				let chance_of_outcome = outcome_table[outcome];
					
				sum += chance_of_outcome;
				
				if (rand_num <= sum) {
					console.log(outcome)
					return outcome
				}
			}
		}
        function addImageToImage(coords, previous_mineral_img_url, new_mineral_img, filename, og_location_img_url)  {    
            console.log({coords, previous_mineral_img_url, new_mineral_img, filename, og_location_img_url})

            let rgba = jimp.intToRGBA(Number(`0x00ffffFF`))

            return jimp.read(og_location_img_url)
                .then((image) => {
                        return jimp.read(previous_mineral_img_url)
                            .then((lastImage) => {
                                lastImage.color([
                                    { apply: 'red', params: [-255] },
                                    { apply: 'green', params: [-255] },
                                    { apply: 'blue', params: [-255] }
                                ])
                                lastImage.color([
                                    { apply: 'red', params: [rgba.r] },
                                    { apply: 'green', params: [rgba.g] },
                                    { apply: 'blue', params: [rgba.b] }
                                ])

                                let x = coords[0]
                                let y = coords[1]
                                image.composite(lastImage, x, y)

                                return jimp.read(new_mineral_img)
                                    .then((addedImage) => {
                                        let x = coords[0]
										let y = coords[1]
                                        image.composite(addedImage, x, y)

                                            image.write(`${filename}.png`)
                                            let theURL = message.channel.send('',{
                                                files:[`${filename}.png`]
                                            }).then(msg => {
                                                return msg.attachments.array()[0].url
                                            })
                                            return theURL
                                        })
                            })
                })
        }

        // Processing
        message.channel.send(`Processing...`) 

        // Is the location claimed
            if (
				locations[currentLocationText]['owner'] && 
				locations[currentLocationText]['owner'] != 'Little Luigi' && 
				locations[currentLocationText]['owner'] != userName
			) {
                return message.channel.send(`Sorry, someone owns this location. You can't harvest here.`)
            }

        // Is there that plant?
        let stopCommand = true
        if (locations[currentLocationText]['layers']) {
            Object.entries(locations[currentLocationText]['layers']).forEach( (entry) => {
				let layer_name = entry[0];
				let layer_properties = entry[1];
				
                if (
					layer_properties['information']['type'] === 'plant' && 
					layer_name === plantName
				) {
                    stopCommand = false
                }
            })
        }
        if (stopCommand) {
            return message.channel.send(`There isn't a plant named, "**${toTitleCase(plantName)}**", in this location.`)
        }

        // Is it ready to be harvested
		let isInvSpaceFull = false;
		let plant_properties = locations[currentLocationText]['layers'][plantName]
        let plantState = plant_properties['information']['states']['state'].toString()
		let lowest_plant_state = '0'.repeat(plantState.length);
		let highest_plant_state = '1'.repeat(plantState.length);
		console.log({lowest_plant_state, highest_plant_state})
                if (plantState === highest_plant_state) {

                    locations[currentLocationText]['layers'][plantName]['information']['states']['state'] = lowest_plant_state
                    locations[currentLocationText]['layers'][plantName]['information']['states']['growth'][0] = 0
					
                    locations[currentLocationText]['layers'][plantName]['information']['width'][0] = 
						plant_properties['information']['states'][lowest_plant_state]['width']
						
                    locations[currentLocationText]['layers'][plantName]['information']['height'][0] = 
						plant_properties['information']['states'][lowest_plant_state]['height']

					Object.entries(harvest_info[plantName]).forEach(item => {
						let item_name = item[0];
						let item_amount_chance_table = item[1];
                        let item_amount = parseInt( giveWeightedRandNum(item_amount_chance_table) );
						console.log({item_name, item_amount})
						
						console.log(item_amount)
						
						if (item_amount > 0) {
							items_harvested_message.push( `**${toTitleCase(item_name)}**\`(x${item_amount})\`` );
							num_of_items_harvested += item_amount;
					
							if (inv_space_of_player[1] < inv_space_of_player[0] + 1) {
								isInvSpaceFull = true
							}
							
							console.log(player_inv[item_name])
							console.log(items[item_name])
							
							if (!player_inv[item_name]) {
								players[userName]['inventory'][item_name] = items[item_name]
								console.log(players[userName]['inventory'][item_name])
								players[userName]['inventory'][item_name]['amount'] = item_amount
							} else {
								players[userName]['inventory'][item_name]['amount'] += item_amount
							}
							players[userName]['inventory']['space'][0] += item_amount
						}
                    })
					
                } else {
                    return message.channel.send(`There is nothing to harvest currently.`)
                }
        
		if (isInvSpaceFull) {
			return message.channel.send(`You don't have enough space left in your inventory. You only have room for \`${inv_space_of_player[1] - inv_space_of_player[0]}\` items.`)
		}

        // Set state to 0
		let plant_coords = plant_properties['space']['coords']
        let previous_mineral_img_url = plant_properties['information']['states'][highest_plant_state]['image']
        let new_mineral_img = plant_properties['information']['states'][lowest_plant_state]['image']
        let file_name = currentLocationText
        let og_location_img_url = locations[players[userName]['location'].join(', ')]['image'][0]
		
        let createImage = addImageToImage(plant_coords, previous_mineral_img_url, new_mineral_img, file_name, og_location_img_url)
        createImage.then((result) => {
           
			let newPlantWidth = 
				locations[currentLocationText]['layers'][plantName]['information']['states'][lowest_plant_state]['width']
            
			let newPlantHeight = 
				locations[currentLocationText]['layers'][plantName]['information']['states'][lowest_plant_state]['height']
				
            locations[currentLocationText]['layers'][plantName]['information']['width'][0] = newPlantWidth
            locations[currentLocationText]['layers'][plantName]['information']['height'][0] = newPlantHeight
            locations[players[userName]['location'].join(', ')]['image'][0] = result
			
			let exp_gained = 1 * num_of_items_harvested + rand_exp_value
			players[userName]['experience'] += exp_gained
        
            // Overwrite JSON file
                fs.writeFileSync('locations.json', JSON.stringify(locations))
                fs.writeFileSync('objects.json', JSON.stringify(objects))
                fs.writeFileSync('players.json', JSON.stringify(players))

            // Confirmation Message
                message.channel.send(`You harvested the plant **${toTitleCase(plantName)}** at the location, \`${players[userName]['location'].join(', ')}\`.`)
                if (items_harvested_message) {
                    message.channel.send(`You got ${items_harvested_message.join(', ')}`)
                    message.channel.send(`\`+${exp_gained} XP\``)
                }
        })
	},
};