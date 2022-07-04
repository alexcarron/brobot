// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
const fs = require('fs');
let jimp = require('jimp');

module.exports = {
	name: 'mine',
	description: 'Uses your tool to mine a mineral at your current location if there is one',
	guildOnly: true,
	args: true,
	aliases: ['m'],
	requiredServer: ['850167368101396520'],
	requiredCategory: ['Request Rooms'],
	requiredRole:['Character'],
	usage: '<mineral-name>, <tool-name>',
	status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
		let objects = JSON.parse(fs.readFileSync('objects.json'))
		let players = JSON.parse(fs.readFileSync('players.json'))
		let locations = JSON.parse(fs.readFileSync('locations.json'))
		let items = JSON.parse(fs.readFileSync('items.json'))
		let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
		let player_location_str = players[userName]['location'].join(', ')
		let player_inventory = players[userName]['inventory'];
		let commaArgs = args.join(' ').split(', ') 
		let NotEnoughSpaceLeft = false
		let list_of_minerals_obtained = []
		let mineral_name_with_num,
			mineral_name_arg,
			tool_name_arg,
			mineral_name,
			mineralOfThatTypeExists,
			tool_properties,
			new_state_of_mineral,
			states_of_mineral,
			state_of_mineral,
			player_location_layers,
			amount_of_states_for_mineral;
			function toTitleCase(string) { // Magic Function DO NOT TOUCH
				return string.replace(/\w\S*/g, function(txt){
					return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
				});
			}

		function addImageToImageMultipleStates(coords, previous_mineral_img_url, new_mineral_img, filename, og_location_img_url)  {	
			console.log({coords, previous_mineral_img_url, new_mineral_img, filename, og_location_img_url});

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
		
		function addImageToImageOnce(coords, previous_mineral_img_url, new_mineral_img, filename, og_location_img_url)  {	
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

								let x = coords[0];
								let y = coords[1];
								image.composite(lastImage, x, y)

								image.write(`${filename}.png`)
								let theURL = message.channel.send('',{
									files:[`${filename}.png`]
								}).then(msg => {
									return msg.attachments.array()[0].url
								})
								return theURL
							})
				})
		}
		

		// Processing
		message.channel.send(`Processing...`)

		// Do they have enough arguments?
		if (commaArgs.length < 2) {
			return message.channel.send(`No you need to type it like this: \`<mine <material name>, <tool using>\``)
		}
		
		mineral_name_arg = commaArgs[0].toLowerCase();
		tool_name_arg = commaArgs[1].toLowerCase();

		// Is the location claimed
			if (
				locations[player_location_str]['owner'] && 
				locations[player_location_str]['owner'] != 'Little Luigi' && 
				locations[player_location_str]['owner'] != userName
			) {
				return message.channel.send(`Sorry, someone owns this location. You can't harvest here.`)
			}
		
		// Is there that type of mineral?
		mineralOfThatTypeExists = false
		
		if (locations[player_location_str]['layers']) {
			
			player_location_layers = locations[player_location_str]['layers']
			
			Object.entries(player_location_layers).forEach(layer => {
				let layer_name = layer[0];
				let layer_properties = layer[1];
				
				if (mineralOfThatTypeExists) {return}
				
				if (
					layer_properties['information']['type'] === 'mineral' &&
					layer_properties['information']['name'] != 'bottom rock' && 
					layer_properties['information']['name'] === mineral_name_arg
				) {
					mineral_name = mineral_name_arg
					mineral_name_with_num = layer_name
					mineralOfThatTypeExists = true
				} else if (
					layer_properties['information']['type'] === 'mineral' && 
					layer_properties['information']['name'] === 'bottom rock' && 
					layer_properties['information']['random mineral'] === mineral_name_arg && 
					layer_properties['information']['states']['state'] != 0
				) {
					mineral_name = 'bottom rock'
					mineral_name_with_num = layer_name
					mineralOfThatTypeExists = true
				}
			})
			
		}
		
		if (!mineralOfThatTypeExists) {
			return message.channel.send(`There isn't a mineral named, "**${toTitleCase(mineral_name_arg)}**", in this location.`)
		}

		// Is that the next mineral on the list
		// @ TODO Fix this system
		if ( 
			(
				locations[player_location_str]['layers'][mineral_name_with_num]['information']['name'] != mineral_name_arg &&
				!locations[player_location_str]['layers'][mineral_name_with_num]['information']['random mineral']
			) ||
			(
				locations[player_location_str]['layers'][mineral_name_with_num]['information']['random mineral'] && 
				locations[player_location_str]['layers'][mineral_name_with_num]['information']['random mineral'] != mineral_name_arg
			)
		) {
			return message.channel.send(`You can't reach the mineral named, "**${toTitleCase(mineral_name_arg)}**", in this location.`)
		}

		// Do they have the tool
		if (
			!Object.keys(player_inventory).includes(tool_name_arg) || 
			player_inventory[tool_name_arg]['amount'] <= 0
		) {
			return message.channel.send(`You don't have that tool`)
		} else {
			tool_properties = player_inventory[tool_name_arg]
		}

		// Can the tool mine the mineral
		if (
			!tool_properties['mines'].includes(mineral_name_arg)
		) {
			return message.channel.send(`A **${toTitleCase(tool_name_arg)}** can't mine **${toTitleCase(mineral_name_arg)}**`)
		}

		// Does it have durability
		if ( tool_properties['durability'] <= 0 ) {
			return message.channel.send(`Your **${toTitleCase(tool_name_arg)}** doesn't have any durability left`)
		}

		console.log(locations[player_location_str]['layers'][mineral_name_with_num]['information']['states'])
		
		// Is it ready to be harvested
		states_of_mineral = player_location_layers[mineral_name_with_num]['information']['states'];
		state_of_mineral = player_location_layers[mineral_name_with_num]['information']['states']['state'];
		amount_of_states_for_mineral = Object.keys(states_of_mineral).length - 2;
		
		if (state_of_mineral != 0) {

			new_state_of_mineral = state_of_mineral - 1
			locations[player_location_str]['layers'][mineral_name_with_num]['information']['states']['state'] = new_state_of_mineral
			
			locations[player_location_str]['layers'][mineral_name_with_num]['information']['width'][0] = states_of_mineral[new_state_of_mineral]['width']
			
			locations[player_location_str]['layers'][mineral_name_with_num]['information']['height'][0] = states_of_mineral[new_state_of_mineral]['height']

			if (new_state_of_mineral === 0) {
				locations[player_location_str]['layers'][mineral_name_with_num]['information']['minerals'].forEach((mineral, num) => {
					list_of_minerals_obtained.push(toTitleCase(mineral))
					
					let inv_space_of_player = players[userName]['inventory']['space']
		
					if (inv_space_of_player[1] < inv_space_of_player[0] + 1) {
						NotEnoughSpaceLeft = true;
						return message.channel.send(`You don't have enough space left in your inventory. You only have room for \`${inv_space_of_player[1] - inv_space_of_player[0]}\` items.`)
					}
					
					if (!players[userName]['inventory'][mineral]) {
						players[userName]['inventory'][mineral] = items[mineral]
						players[userName]['inventory'][mineral]['amount'] = 1
					} else {
						players[userName]['inventory'][mineral]['amount'] += 1
					}
					
					players[userName]['inventory']['space'][0] += 1
				})
				
				if (mineral_name === 'bottom rock') {
					if (Math.ceil(Math.random() * 20) === 1) {
						locations[player_location_str]['layers'][mineral_name_with_num]['information']['random mineral'] = 
							'iron ore'
						locations[player_location_str]['layers'][mineral_name_with_num]['information']['minerals'] = 
							['iron ore']
						locations[player_location_str]['layers'][mineral_name_with_num]['information']['states']['1'] = 
							{
								"image": "https://cdn.discordapp.com/attachments/850491267095986237/884944462365720596/Little_Luigi_Land_LLL_Object_Iron_Ore.png",
								"width": [
									450,
									550
								],
								"height": [
									450,
									550
								]
							}
					} else {
						locations[player_location_str]['layers'][mineral_name_with_num]['information']['random mineral'] = 
							'stone'
						locations[player_location_str]['layers'][mineral_name_with_num]['information']['minerals'] = 
							['stone']
						locations[player_location_str]['layers'][mineral_name_with_num]['information']['states']['1'] = 
							{
								"image": "https://cdn.discordapp.com/attachments/850491267095986237/875187483615322123/LLL_Object_Stone.png",
								"width": [
									450,
									550
								],
								"height": [
									450,
									550
								]
							}
					}
					
					locations[player_location_str]['layers'][mineral_name_with_num]['information']['states']['growth'][0] -= 1;
				}
			}
			
			if (NotEnoughSpaceLeft) {return}
			
		} else {
			message.channel.send(`There is nothing to harvest currently.`)
		}
		console.log(locations[player_location_str]['layers'][mineral_name_with_num]['information']['states'])
				
		
		// Set state to 0
		let mineral_coordinates = player_location_layers[mineral_name_with_num]['space']['coords']
		let previous_mineral_img_url = locations[player_location_str]['layers'][mineral_name_with_num]['information']['states'][state_of_mineral]['image']
		let new_mineral_img = 
			locations[player_location_str]['layers'][mineral_name_with_num]['information']['states'][new_state_of_mineral]['image'];
			
		let fileName = player_location_str
		let og_location_img_url = locations[players[userName]['location'].join(', ')]['image'][0]
		let createImage
		if (['stone', 'iron ore'].includes(mineral_name)) {
			createImage = addImageToImageOnce(mineral_coordinates, previous_mineral_img_url, new_mineral_img, fileName, og_location_img_url)
		} else {
			createImage = addImageToImageMultipleStates(mineral_coordinates, previous_mineral_img_url, new_mineral_img, fileName, og_location_img_url)
		}
		createImage.then((result) => {
			let new_mineral_width = locations[player_location_str]['layers'][mineral_name_with_num]['information']['states'][new_state_of_mineral]['width']
			let new_mineral_height = locations[player_location_str]['layers'][mineral_name_with_num]['information']['states'][new_state_of_mineral]['height']
			locations[player_location_str]['layers'][mineral_name_with_num]['information']['width'][0] = new_mineral_width
			locations[player_location_str]['layers'][mineral_name_with_num]['information']['height'][0] = new_mineral_height
			locations[players[userName]['location'].join(', ')]['image'][0] = result

			if (
				new_state_of_mineral === 0 &&
				mineral_name != 'bottom rock'
			) {
				delete locations[player_location_str]['layers'][mineral_name_with_num]
			}

			// Tool loses durability
			players[userName]['inventory'][tool_name_arg]['durability'] = players[userName]['inventory'][tool_name_arg]['durability'] - 1

			// Tool breaks
			let newDurability = players[userName]['inventory'][tool_name_arg]['durability']
			if (newDurability <= 0) {
				players[userName]['inventory'][tool_name_arg]['amount'] = players[userName]['inventory'][tool_name_arg]['amount'] - 1
				players[userName]['inventory'][tool_name_arg]['durability'] = items[tool_name_arg]['durability']
				newDurability = 0
				
				players[userName]['inventory']['space'][0] -= 1
				message.channel.send(`Your **${toTitleCase(tool_name_arg)}** has broken!`)
			}
			
			// XP Calculation
			let exp_gained
			if ( mineral_name_arg === "stone" ) {
				exp_gained = Math.round( Math.random() * 2 )
			} else {
				exp_gained = 12 + Math.floor( Math.random() * 5 )
			}
			players[userName]['experience'] += exp_gained
		
			// Overwrite JSON file
				fs.writeFileSync('locations.json', JSON.stringify(locations))
				fs.writeFileSync('objects.json', JSON.stringify(objects))
				fs.writeFileSync('players.json', JSON.stringify(players))

			// Confirmation Message
				message.channel.send(`You mined **${toTitleCase(mineral_name_arg)}**. Your **${toTitleCase(tool_name_arg)}** is now at \`${newDurability}\` durability.\n\`+${exp_gained} XP\``)
				if (list_of_minerals_obtained) {
					message.channel.send(`You got \`${list_of_minerals_obtained.join('`, `')}\``)
				}
		})
	},
};