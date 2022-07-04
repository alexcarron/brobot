// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
const fs = require('fs');
let jimp = require('jimp');

module.exports = {
    name: 'store',
    description: 'Store your items inside a storage appliance',
    guildOnly: true,
    args: true,
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: '<item-name> <item-amount>, <storage-device>',
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        let commaArgs = args.join(' ').split(', ')
        let objects = JSON.parse(fs.readFileSync('objects.json'))
        let players = JSON.parse(fs.readFileSync('players.json'))
        let locations = JSON.parse(fs.readFileSync('locations.json'))
        let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        let player_location_str = players[userName]['location'].join(', ')
		let isPlayerInside = players[userName]['inside'] != "" 
		let player_inside_location = players[userName]['inside']
		let item_name,
			item_amount,
			storage_device_name,
			location_layers,
			isThereThatStorageDevice = false,
			storage_space;
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

        // Processing
        message.channel.send(`Processing...`)

		if (commaArgs.length < 3) {
			return message.channel.send(`You need to type the command like this <store <item-name> <item-amount>, <storage-device>`)
		}
		
		item_name = commaArgs[0].toLowerCase()
		item_amount = commaArgs[1]
		storage_device_name = commaArgs[2].toLowerCase()
		
        // Do you have the item
		if (!Object.keys(players[userName]['inventory']).includes(item_name)) {
			return message.channel.send(`You don't have the **${item_name}** item`)
		}
		
		if (
			!Number.isInteger(parseFloat(item_amount)) || 
			parseInt(item_amount) <= 0
		) {
			return message.channel.send(`\`${item_amount}\` is not a positive whole number`)
		}
		
		item_amount = parseInt(item_amount)

        // Check if they have the amount
        if (players[userName]['inventory'][item_name]['amount'] <= item_amount) {
            return message.channel.send(`You don't have \`${item_amount}\` **${item_amount}**`)
        }
		
		if (isPlayerInside) {
			location_layers = locations[player_location_str]['layers'][player_inside_location]['inside']['layers']
		} else {
			location_layers = locations[player_location_str]['layers']
		}
		
		Object.entries(location_layers).forEach(layer => {
			let layer_name = layer[0];
			let layer_properties = layer[1];
			
			console.log(layer_properties['type'])
			console.log(layer_name)
			
			if (
				layer_properties['information'] &&
				layer_properties['information']['type'] &&
				layer_properties['information']['type'] === 'storage device' && 
				layer_name === storage_device_name
			) {
				isThereThatStorageDevice = true;
			}
		})
		
		if (!isThereThatStorageDevice) {
			return message.channel.send(`There isn't the storage device, **${storage_device_name}**, in this location`)
		}
		
		storage_space = locations[player_location_str]['layers'][player_inside_location]['inside']['layers'][storage_device_name]['information']['space']
		
		if ((storage_space[0] + item_amount) > storage_space[1]) {
			return message.channel.send(`There's not enough space in the storage device for that`)
		}

        // Subtract amount
        players[userName]['inventory'][item_name]['amount'] -= item_amount
		players[userName]['inventory']['space'][0] -= item_amount

		if (!location_layers[storage_device_name]['stored']) {
			if (isPlayerInside) {
				locations[player_location_str]['layers'][player_inside_location]['inside']['layers'][storage_device_name]['stored'] = {[item_name]: item_amount}
				
				locations[player_location_str]['layers'][player_inside_location]['inside']['layers'][storage_device_name]['information']['space'][0] += item_amount
			} else {
				locations[player_location_str]['layers'][storage_device_name]['stored'] = {[item_name]: item_amount}
				
				locations[player_location_str]['layers'][storage_device_name]['information']['space'][0] += item_amount
			}
		} else {
			if (isPlayerInside) {
				locations[player_location_str]['layers'][player_inside_location]['inside']['layers'][storage_device_name]['stored'][item_name] += item_amount;
				
				locations[player_location_str]['layers'][player_inside_location]['inside']['layers'][storage_device_name]['information']['space'][0] += item_amount
			} else {
				locations[player_location_str]['layers'][storage_device_name]['stored'][item_name] += 
					item_amount;
					
				locations[player_location_str]['layers'][storage_device_name]['information']['space'][0] += item_amount
			}
			
		}
		
		console.log(location_layers[storage_device_name])

        // Overwrite JSON file
            fs.writeFileSync('players.json', JSON.stringify(players))
            fs.writeFileSync('locations.json', JSON.stringify(locations))

        // Confirmation Message
            message.channel.send(`You stored \`${item_amount}\` **${toTitleCase(item_name)}** in your **${toTitleCase(storage_device_name)}**`)
	},
};