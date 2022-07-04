// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
const fs = require('fs');
let jimp = require('jimp');
const { remove } = require('winston');

module.exports = {
	name: 'cycle',
	guildOnly: true,
	requiredServer: ['850167368101396520'],
	requiredRole:['God'],
	status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
		let objects = JSON.parse(fs.readFileSync('objects.json'))
		let players = JSON.parse(fs.readFileSync('players.json'))
		let locations = JSON.parse(fs.readFileSync('locations.json'))
		let items = JSON.parse(fs.readFileSync('items.json'))
		let religions = JSON.parse(fs.readFileSync('religions.json'))
		let characterRole = message.guild.roles.cache.find(r => r.name === "Character");
		let afterLifeRole = message.guild.roles.cache.find(r => r.name === "In The Afterlife");
		let user = message.guild.members.cache.get(message.author.id)
		let userName = user.displayName.toLowerCase()
		let allObjects = Object.keys(objects)
		let commaArgs = args.join(' ').split(', ') 
		let createImageArray = []
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}
		function give_items(player_name, item_name, amount) {
			if (item_name === 'll points') {
				players[player_name]['LL Points'] += amount
			} else {
				if (!players[player_name]['inventory'][item_name]) {
					players[player_name]['inventory'][item_name] = items[item_name]
					players[player_name]['inventory'][item_name]['amount'] = amount
				} else {
					players[player_name]['inventory'][item_name]['amount'] += amount
				}	
		
				players[userName]['inventory']['space'][0] += amount
			}
		}
		function remove_items(player_name, item_name, amount) {
			
			if (item_name === 'll points') {
				players[player_name]['LL Points'] -= amount
			} else {
				if (!players[player_name]['inventory'][item_name]) {
					players[player_name]['inventory'][item_name] = items[item_name]
					players[player_name]['inventory'][item_name]['amount'] = 0 - amount
					
					players[player_name]['HP'] -= 0.5
					message.channel.send(`You could not provide for one of your players. Your gods will strike you\n\`-0.5 HP\``)
				} else {
					players[player_name]['inventory'][item_name]['amount'] -= amount
					
					if (players[player_name]['inventory'][item_name]['amount'] < 0) {
						players[player_name]['HP'] -= 0.5
						message.channel.send(`You could not provide for one of your players. Your gods will strike you\n\`-0.5 HP\``)
					}
				}
		
				players[userName]['inventory']['space'][0] -= amount
			}
		}
		function addImageToImage(coords, previous_mineral_img_url, new_mineral_img, filename, og_location_img_url)  {	
			console.log({coords, previous_mineral_img_url, new_mineral_img, filename, og_location_img_url})

			let rgba = jimp.intToRGBA(Number(`0x00ffffFF`))

			return jimp.read(og_location_img_url)
				.then(
					(image) => {
						return jimp.read(previous_mineral_img_url)
							.then((sky_jimp) => {
								sky_jimp.color([
									{ apply: 'red', params: [-255] },
									{ apply: 'green', params: [-255] },
									{ apply: 'blue', params: [-255] }
								])
								sky_jimp.color([
									{ apply: 'red', params: [rgba.r] },
									{ apply: 'green', params: [rgba.g] },
									{ apply: 'blue', params: [rgba.b] }
								])

								let x = coords[0]
								let y = coords[1]
								image.composite(sky_jimp, x, y)

								return jimp.read(new_mineral_img)
									.then((new_img_jimp) => {
										let x = coords[0]
										let y = coords[1]
										image.composite(new_img_jimp, x, y)

											image.write(`${filename}.png`);
											let theURL = message.channel.send('',{
												files:[`${filename}.png`]
											}).then(msg => {
												return msg.attachments.array()[0].url
											});
											return theURL
										})
							})
						})
		}

		// Processing
		message.channel.send(`Processing...`)

		// ~ Hunger
			if (commaArgs[0] != 'donate' && commaArgs[0] != 'test') {
				Object.entries(players).forEach((entry, num) => {
					if (players[entry[0]]['hunger'] > 0) {
						if (Number.isInteger(entry[1]['hunger'] - 1)) {
							players[entry[0]]['hunger'] = parseInt((players[entry[0]]['hunger'] - 1).toFixed(0))
						} else {
							players[entry[0]]['hunger'] = parseFloat((players[entry[0]]['hunger'] - 1).toFixed(1))
						}
						
					}
					let channelName = entry[0].toLowerCase()
					channelName = channelName.replace(/[^a-zA-Z0-9 ]/g,"")
					channelName = `${channelName.replace(' ','-')}s-room`

					let youRoom = message.guild.channels.cache.find(c => c.name === channelName)
					youRoom.send(`Your hunger level is at \`${players[entry[0]]['hunger']}\`. If it reaches 0, you'll start starving.`)
				})
			}

		// ~ Replant
		if (commaArgs[0] != 'donate') {

			Object.entries(locations).forEach((location) => {
				let location_name = location[0];
				let location_properties = location[1];
				
				if (location_properties['layers']) {
					Object.entries(location_properties['layers']).forEach((layer) => {
						let layer_name = layer[0];
						let layer_properties = layer[1];
						

						if (
							layer_properties['information']['type'] && 
							(
								layer_properties['information']['type'] === 'plant' ||
								(
									layer_properties['information']['type'] === 'mineral' &&
									layer_properties['information']['states'] &&
									layer_properties['information']['states']['state'] === 0
								)
							)
						) {
						
							let oldState = layer_properties['information']['states']['state'].toString()
							
							if (oldState === '1'.repeat(oldState.length)) {
								return
							}
						
							locations[location_name]['layers'][layer_name]['information']['states']['growth'][0] += 1
							let plant_growth = locations[location_name]['layers'][layer_name]['information']['states']['growth']

							if (plant_growth[0] < plant_growth[1]) {
								return
							}

							locations[location_name]['layers'][layer_name]['information']['states']['state'] = 
								'1'.repeat(oldState.length)
								
							locations[location_name]['layers'][layer_name]['information']['width'][0] = 
								layer_properties['information']['states']['1'.repeat(oldState.length)]['width'];
							locations[location_name]['layers'][layer_name]['information']['height'][0] = 
								layer_properties['information']['states']['1'.repeat(oldState.length)]['height'];
							
							let newState = locations[location_name]['layers'][layer_name]['information']['states']['state']

							let coords = locations[location_name]['layers'][layer_name]['space']['coords']
							let previous_mineral_img_url = locations[location_name]['layers'][layer_name]['information']['states'][oldState]['image']
							let new_mineral_img = locations[location_name]['layers'][layer_name]['information']['states'][newState]['image']
							let file_name = location_name
							let og_location_img_url = locations[location_name]['image'][0]
							
							createImageArray.push([coords, previous_mineral_img_url, new_mineral_img, file_name, og_location_img_url]);
						}
					})
				}
			});
			
			(async function() {
				let num = 0
				if (createImageArray.length > 0) {
					for (let image of createImageArray) {
						
						let result = await addImageToImage(image[0], image[1], image[2], image[3], locations[image[3]]['image'][0])
						
						console.log(locations[image[3]]['image'][0])
						
						locations[image[3]]['image'][0] = result

						console.log(locations[image[3]]['image'][0])
						
						num = num + 1 
					}
				}
				
				fs.writeFileSync('locations.json', JSON.stringify(locations)) 
			})();
		}
		
		// Unfollowing a religion
		if (commaArgs[0] != 'test') {
			Object.entries(players).forEach((entry, num) => {
				let player_name = entry[0];
				let player_properties = entry[1];
				
				if (player_properties['unfollowing']) {
					players[player_name]['unfollowing'] -= 1;
					
					if (players[player_name]['unfollowing'] <= 0) {
						delete players[player_name]['unfollowing']
						delete players[player_name]['following']
						
						let player_channel_name = `${player_name.toLowerCase().replace(/[^a-zA-Z0-9 ]/g,"").replace(' ','-')}s-room`
						let player_you_room = message.guild.channels.cache.find(c => c.name === player_channel_name)
						player_you_room.send(`You are no longer following a religion`)
					}
				} else {
					return
				}
			})
		}
		
		// Religious Donations
		if (commaArgs[0] != 'test') {
			let today = new Date();
			if(today.getDay() == 0 || commaArgs[0] === 'donate') {
				
				Object.entries(religions).forEach(religion => {
					
					let religion_obj = religion[1]
					let religious_leader = religion_obj['leader'].toLowerCase()
					
					Object.entries(religion_obj['weekly donation']).forEach(donation => {
							
						let item_name = donation[0]
						let item_amount = donation[1]
						
						remove_items(religious_leader, item_name, item_amount)

						let leader_channel_name = `${religious_leader.toLowerCase().replace(/[^a-zA-Z0-9 ]/g,"").replace(' ','-')}s-room`
						let leader_you_room = message.guild.channels.cache.find(c => c.name === leader_channel_name)
						leader_you_room.send(`You have donated **${toTitleCase(item_name)}**\`(x${item_amount * religion_obj['followers'].length})\` to your followers`)
						
						religion_obj['followers'].forEach(follower => {							
							give_items(follower.toLowerCase(), item_name, item_amount)

							let follower_channel_name = `${follower.toLowerCase().replace(/[^a-zA-Z0-9 ]/g,"").replace(' ','-')}s-room`
							let follower_you_room = message.guild.channels.cache.find(c => c.name === follower_channel_name)
							follower_you_room.send(`You were donated **${toTitleCase(item_name)}**\`(x${item_amount})\` by your religious leader.`)
						})
					})
				})
			}	
		}
			
		// ~ Health
		if (commaArgs[0] != 'donate' && commaArgs[0] != 'test') {
			Object.entries(players).forEach((player, num) => {
				let player_name = player[0]
				
				if (players[player_name]['hunger'] <= 0) {
				
				players[player_name]['HP'] = player[1]['HP']-1

				let channelName = player_name.toLowerCase()
				channelName = channelName.replace(/[^a-zA-Z0-9 ]/g,"")
				channelName = `${channelName.replace(' ','-')}s-room`
				let youRoom = message.guild.channels.cache.find(c => c.name === channelName)
				
				youRoom.send(`You starved today. You have \`${players[player_name]['HP']}\` health points left. If it reaches 0, you'll die!`)

				if (players[player_name]['HP'] <= 0) {
					let character = message.guild.members.cache.find(m => {
						return m.displayName.toLowerCase() === player_name
					})
					character.roles.add(afterLifeRole).catch(console.error);
					character.roles.remove(characterRole).catch(console.error);

					let player_channel_name = player[0].toLowerCase()
					player_channel_name = player_channel_name.replace(/[^a-zA-Z0-9 ]/g,"")
					player_channel_name = `${player_channel_name.replace(' ','-')}s-room`
					let youRoom2 = message.guild.channels.cache.find(c => c.name === player_channel_name)
					youRoom2.send(`You starved to death. You are joining the afterlife...`)
					delete players[player[0]]
				}
				}
			});	
		}
		
		console.log(locations['-7, -1']['image'])
		
		// Overwrite JSON file
		fs.writeFileSync('players.json', JSON.stringify(players))
		fs.writeFileSync('locations.json', JSON.stringify(locations))
		fs.writeFileSync('objects.json', JSON.stringify(objects))

		// Confirmation Message
		message.channel.send(`Done.`)
	},
};