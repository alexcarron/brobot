// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
const fs = require('fs');

module.exports = {
	name: 'follow',
	description: 'Follow an existing religion or stop following a religion',
	guildOnly: true,
	args: true,
	requiredServer: ['850167368101396520'],
	requiredCategory: ['Request Rooms'],
	requiredRole:['Character'],
	usage: [
		'<religion name>',
		'none'
	],
	status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
		let players = JSON.parse(fs.readFileSync('players.json'))
		let locations = JSON.parse(fs.readFileSync('locations.json'))
		let objects = JSON.parse(fs.readFileSync('objects.json'))
		let limitations = JSON.parse(fs.readFileSync('limitations.json'))
		let religions = JSON.parse(fs.readFileSync('religions.json'))
		let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
		let theReligion = args.join(' ').toLowerCase()
		let commaArgs = args.join(' ').split(', ');
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

		if (theReligion === 'none') {
			if (players[userName]['unfollowing']) {
				return message.channel.send(`You are already in the process in unfollowing a religion.`)
			}
			
			players[userName]['unfollowing'] = 7
				
			// Overwrite JSON file
				fs.writeFileSync('religions.json', JSON.stringify(religions))
				fs.writeFileSync('players.json', JSON.stringify(players))
	
			// Confirmation Message
				message.channel.send(`You will stop following a religion in 7 cycles`)
		} else {
			// In a religion already?
				if (players[userName]['following']) {
					return message.channel.send(`You are already following a religion. You need to stop following it to follow a new one.`)
				}
			
			// Does the religion exist?
				if (!Object.keys(religions).includes(theReligion)) {
					return message.channel.send(`That religion does not exist.`)
				}
	
			// Is the religion valid?
				if (!religions[theReligion]['is_it_valid']) {
					return message.channel.send(`That religion hasn't been validated yet. Please wait for the religious leader to fully validate their religion.`)
				}
			
			// Join the religion
				players[userName]['following'] = theReligion
				religions[theReligion]['followers'].push(userName)
				
			// Craft Message
				let donation_list_message = []
				Object.entries(religions[theReligion]['weekly donation']).forEach(entry => {
					let item_name = entry[0]
					let item_amount = entry[1]
					donation_list_message.push(`    **${toTitleCase(item_name)}**\`(x${item_amount})\``)
				})
				
			// Overwrite JSON file
				fs.writeFileSync('religions.json', JSON.stringify(religions))
				fs.writeFileSync('players.json', JSON.stringify(players))
	
			// Confirmation Message
				message.channel.send(`You are now following the religion, **${toTitleCase(theReligion)}**. You will receive this each week:\n${donation_list_message.join('\n')}`)
		}
	}
};