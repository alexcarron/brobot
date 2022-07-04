// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
const fs = require('fs');

module.exports = {
    name: 'buy',
    description:'Buys an item in the #universal-shop and instantly uses it',
    guildOnly: true,
    args: true,
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: [
		'<thing-buying>',
		'Become a Religious Leader, <name of religion>'
	],
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        let players = JSON.parse(fs.readFileSync('players.json'))
        let locations = JSON.parse(fs.readFileSync('locations.json'))
        let objects = JSON.parse(fs.readFileSync('objects.json'))
        let limitations = JSON.parse(fs.readFileSync('limitations.json'))
        let shop = JSON.parse(fs.readFileSync('shop.json'))
        let religions = JSON.parse(fs.readFileSync('religions.json'))
		let commaArgs = args.join(' ').split(', ');
        let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        let shopItems = Object.keys(shop)
        let item_name = commaArgs[0].toLowerCase()
        let playerBalance = players[userName]['LL Points']
        let itemsBought = players[userName]['bought']
        function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

        // Does the item exist?
            if (!shopItems.includes(item_name)) {
                return message.channel.send(`**${item_name}** is not something you can buy. You can only buy \`${shopItems.slice(0,-1).join(`\`, \``)}\`, or \`${shopItems[shopItems.length-1]}\``)
            }

        // Can they afford it
            if (playerBalance - shop[item_name]['cost'] < 0) {
                return message.channel.send(`You can't afford this. You only have \`${playerBalance}\` LL Points and the item costs \`${shop[item_name]['cost']}\` LL Points.`)
            }
        
        // Did they buy it already?
        if (!['another claim','another build','bigger pockets'].includes(item_name)) {
            if (itemsBought.includes(item_name)) {
                return message.channel.send(`You already bought the item, \`${toTitleCase(item_name)}\`. You can't buy it again.`)
            }
        }

		if(item_name === 'become a religious leader') {
			if (commaArgs.length <= 1) {
				return message.channel.send(`You need to include a name for the religion \`<buy Become a Religious Leader, [name of religion]\``)
			}
			let religion_name = commaArgs[1].toLowerCase()
			
			players[userName]['religion'] = religion_name
			religions[religion_name] = {
				'name': religion_name,
				'leader': userName,
				'symbol': '',
				'followers': [],
				'weekly donation': {},
				'sacrifices': {},
				'is_it_valid': false
			}
			
			message.channel.send(`You have created a religion, however it's not valid yet. You need to use the \`<editreligion\` command to add a symbol to the religion and a weekly donation to the followers of it.`)
		} else {
			// Execute function
			eval(shop[item_name]['function'])
		}
		
        // Spend LL Points
        players[userName]['LL Points'] -= shop[item_name]['cost']

        // Add to "inventory"
            if (!['another claim','another build'].includes(item_name)) {
                if (itemsBought) {
                    players[userName]['bought'].push(item_name)
                } else {
                    players[userName]['bought'] = [item_name]
                }
            }        
        // Overwrite JSON file
            fs.writeFileSync('objects.json', JSON.stringify(objects))
            fs.writeFileSync('limitations.json', JSON.stringify(limitations))
            fs.writeFileSync('locations.json', JSON.stringify(locations))
            fs.writeFileSync('players.json', JSON.stringify(players))
            fs.writeFileSync('shop.json', JSON.stringify(shop))
            fs.writeFileSync('religions.json', JSON.stringify(religions))

        // Confirmation Message
            message.channel.send(`You bought the item, \`${toTitleCase(item_name)}\` for \`${shop[item_name]['cost']}\` LL Points.`)
        }
};