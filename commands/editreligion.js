// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
const fs = require('fs');

module.exports = {
	name: 'editreligion',
	description: 'Edit your religion\'s name, symbol, or weekly donation. You can replace `<item name>` with "LL Points"" if you want donate LL Points.',
	guildOnly: true,
	args: true,
	requiredServer: ['850167368101396520'],
	requiredCategory: ['Request Rooms'],
	requiredRole:['Character'],
	aliases: ['er', 'editrel'],
	usage: [
		'name, <new-name>',
		'symbol, <object that represents new symbol>',
		'weekly donation, <item name>, <num of that item>, <other item name>, <num of that other item>, etc...'
	],
	status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
		let objects = JSON.parse(fs.readFileSync('objects.json'))
		let players = JSON.parse(fs.readFileSync('players.json'))
		let items = JSON.parse(fs.readFileSync('items.json'))
		let religions = JSON.parse(fs.readFileSync('religions.json'))
		let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
		let commaArgs = args.join(' ').split(', ');
		let property_their_changing = commaArgs[0].toLowerCase()
		let other_land_channel = message.guild.channels.cache.get('851233573604032544')
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}
		function is_object_empty(obj) {
			return Object.keys(obj).length === 0;
		}

		// Do they own a religion
			if ( !players[userName]['religion'] ) {
				return message.channel.send(`You don't own a religion`)
			}
			
		let their_religion = players[userName]['religion']
			
		// Arg Check
			if (commaArgs.length < 2) {
				return message.channel.send(`You need at least 2 arguments.`)
			}

		// name
			if (property_their_changing === 'name') {
				let religion_new_name = commaArgs[1].toLowerCase();
				
				
				religions[their_religion]['name'] = religion_new_name
				religions[religion_new_name] = religions[their_religion]
				delete religions[their_religion]
				players[userName]['religion'] = religion_new_name
				their_religion = religion_new_name
				
				message.channel.send(`You have change your religion's name to **${toTitleCase(religion_new_name)}**`)
			}

		// symbol
			if (property_their_changing === 'symbol') {
				let religion_new_symbol = commaArgs[1].toLowerCase();
				
				if (!Object.keys(objects).includes(religion_new_symbol)) {
					return message.channel.send(`That object does not exist.`)
				}
				if (objects[religion_new_symbol]['information']['owner'] != userName) {
					return message.channel.send(`You don't own that object.`)
				}
				
				religions[their_religion]['symbol'] = religion_new_symbol
				
				message.channel.send(`You have change your religion's symbol to **${toTitleCase(religion_new_symbol)}**. This symbol must be place ony our church.`)
			}

		// donation
			if (property_their_changing === 'weekly donation') {
				let list_of_weekly_donations = commaArgs.slice(1);
				let weekly_donation_obj = {};
				
				for (let i = 0; i < list_of_weekly_donations.length; i += 2) {
					
					let item_name = list_of_weekly_donations[i]
					let item_amount = list_of_weekly_donations[i + 1]
					
					if (
						item_name.toLowerCase() != 'll points' && 
						!Object.keys(items).includes(item_name.toLowerCase())
					) {
						return message.channel.send(`**${item_name}** is not an item that exists.`)
					}
					
					if (!parseFloat(item_amount) || parseFloat(item_amount) <= 0) {
						return message.channel.send(`\`${item_amount}\` is not a valid amount of items.`)
					}
					
					weekly_donation_obj[item_name.toLowerCase()] = item_amount
				}
				
				religions[their_religion]['weekly donation'] = weekly_donation_obj
				
				// Craft Message
					let donation_list_message = []
					Object.entries(religions[their_religion]['weekly donation']).forEach(entry => {
						let item_name = entry[0]
						let item_amount = entry[1]
						donation_list_message.push(`    **${toTitleCase(item_name)}**\`(x${item_amount})\``)
					})
				
				message.channel.send(`Every sunday your followers will now get a donation from you. You have changed your religion's weekly donation to:\n${donation_list_message.join('\n')}\n\nIf you can't provide these donations, you will lose HP and possibly die.`)
			}
			
		console.log(religions[their_religion]['symbol'])
		console.log(religions[their_religion]['weekly donation'])
		console.log(!!religions[their_religion]['symbol'])
		console.log(!is_object_empty(religions[their_religion]['weekly donation']))
		console.log(!religions[their_religion]['is_it_valid'])
		console.log(religions[their_religion]['symbol'] && !is_object_empty(religions[their_religion]['weekly donation']))
		console.log(religions[their_religion]['symbol'] && !is_object_empty(religions[their_religion]['weekly donation']) && !religions[their_religion]['is_it_valid'])
			
		if (
			religions[their_religion]['symbol'] && !is_object_empty(religions[their_religion]['weekly donation']) && !religions[their_religion]['is_it_valid']
		) {
			religions[their_religion]['is_it_valid'] = true
			
			let donation_list_message = []
				Object.entries(religions[their_religion]['weekly donation']).forEach(entry => {
					let item_name = entry[0]
					let item_amount = entry[1]
					donation_list_message.push(`    **${toTitleCase(item_name)}**\`(x${item_amount})\``)
				})
			
			message.channel.send(`Your religion is now valid. You can now use the \`<build\` command to create a church for your religion.`)
			other_land_channel.send(`**${toTitleCase(userName)}** now is the leader of the religion, **${toTitleCase(their_religion)}**. Their weekly donation to their followers include:\n${donation_list_message.join('\n')}`)
		}
		
		// Overwrite JSON file
			fs.writeFileSync('religions.json', JSON.stringify(religions))
			fs.writeFileSync('players.json', JSON.stringify(players))
		}
};