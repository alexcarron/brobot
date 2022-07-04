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
let jimp = require('jimp');

module.exports = {
    name: 'sacrifice',
    description: 'Sacrifice items or LL Points at a church of the religion your following in order to have Little Luigi Land\'s limitations be removed. You can replace `<item-name>` with "LL Points" if you want sacrifice LL Points.',
    guildOnly: true,
    args: true,
    aliases: ['sac', 'offer'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: '<item-name>, <amount-of-item>',
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        let commaArgs = args.join(' ').split(', ')
        let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        let objects = JSON.parse(fs.readFileSync('objects.json'))
        let locations = JSON.parse(fs.readFileSync('locations.json'))
        let items = JSON.parse(fs.readFileSync('items.json'))
        let players = JSON.parse(fs.readFileSync('players.json'))
        let religions = JSON.parse(fs.readFileSync('religions.json'))
        let thePlayer = players[userName]
        let other_land_channel = message.guild.channels.cache.get('851233573604032544')
		let item_name = commaArgs[0].toLowerCase();
		let item_amount = commaArgs[1];
        let playerLocation = players[userName]['location'].join(', ')
        let insideLocation = players[userName]['inside'].toLowerCase()
        let insideStatus = players[userName]['inside'] != ""
		let building_properties,
			religion_of_church,
			exp_gained,
			requestRoomMessage,
			other_land_message;
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

        // Processing
        message.channel.send(`Processing...`)

		
		// Checks
		if (!insideStatus) {
			return message.channel.send(`You have to be inside a church to sacrifice items or LL Points for a religion.`)
		}
		building_properties = locations[playerLocation]['layers'][insideLocation]
		
		if (building_properties['information']['type'] != 'church') {
			return message.channel.send(`You have to be inside a church to sacrifice items or LL Points for a religion.`)
		}
		religion_of_church = building_properties['information']['religion']

		if (players[userName]['following'] != religion_of_church) {
			return message.channel.send(`You need to be following the religion of **${religion_of_church}** in order to sacrifice here.`)
		}

		if(!Object.keys(items).includes(item_name) && item_name != 'll points') {
			return message.channel.send(`That's not a real item.`)
		}

		if (item_name != 'll points') {
			if (!Object.keys(thePlayer['inventory']).includes(item_name)) {
				return message.channel.send(`You don't have any **${item_name}**`)
			}
	
			if (thePlayer['inventory'][item_name]['amount'] < item_amount) {
				return message.channel.send(`You don't have enough **${item_name}**. You only have \`${thePlayer['inventory'][item_name]['amount']}\``)
			}
	
			players[userName]['inventory'][item_name]['amount'] -= item_amount
			
			players[userName]['inventory']['space'][0] -= item_amount
			
			religions[religion_of_church]['sacrifices'][item_name] = item_amount
		} else {
			if (players[userName]['LL Points'] < item_amount) {
				return message.channel.send(`You don't have enough LL Points. You only have \`${players[userName]['LL Points']}\``)
			}
			
			players[userName]['LL Points'] -= item_amount
			
			religions[religion_of_church]['sacrifices'][item_name] = item_amount
		}
		
		exp_gained = 2 + Math.floor( Math.random() * 4 )
		players[userName]['experience'] += exp_gained

        requestRoomMessage = `You've sacrificed **${toTitleCase(item_name)}**\`(x${item_amount})\` to the religion, **${toTitleCase(religion_of_church)}**`
        other_land_message = `**${userName}** sacrificed **${toTitleCase(item_name)}**\`(x${item_amount})\` to the religion, **${toTitleCase(religion_of_church)}**`

        // Overwrite JSON file
            fs.writeFileSync('objects.json', JSON.stringify(objects))
            fs.writeFileSync('players.json', JSON.stringify(players))
            fs.writeFileSync('religions.json', JSON.stringify(religions))
            fs.writeFileSync('locations.json', JSON.stringify(locations))
        
        // Confirmation Message
            message.channel.send(requestRoomMessage)
            other_land_channel.send(other_land_message)
			if (exp_gained) {
				message.channel.send(`\`+${exp_gained} XP\``)
			}

	},
};