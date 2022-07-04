// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');

module.exports = {
	name: 'self',
	description: 'Shows how many Little Luigi Points you have, what you own, where you are, your claims, HP, hunger, builds, inventory, and other things about yourself',
	guildOnly: true,
	aliases: ['me', 'myself'],
	requiredServer: ['850167368101396520'],
	requiredCategory: ['Request Rooms'],
	requiredRole:['Character'],
	status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
		let players = JSON.parse(fs.readFileSync('players.json'))
        let levels = JSON.parse(fs.readFileSync('levels.json'));
		let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
		let player_inventory = players[userName]['inventory']
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

		let theMessage = []

		let theirLevel = players[userName]['level']
		theMessage.push(`**Level**: \`${theirLevel}\``)

		let theirEXP = players[userName]['experience']
		theMessage.push(
			`**XP**: \`${theirEXP}\`\n` +
			`You need \`${levels[players[userName]['level'] + 1]['required xp'] - theirEXP}\` more XP to level up`
		)
		
		
        

		let currentLocation = players[userName]['location'].join(', ')
		theMessage.push(`**Location**: \`${currentLocation}\``)

		let theirClaims = players[userName]['claims']
		theMessage.push(`**Claims Left**: \`${theirClaims}\``) //

		let theirBuilds = players[userName]['builds']
		theMessage.push(`**Builds Left**: \`${theirBuilds}\``)

		let theirLLPoints = players[userName]['LL Points']
		theMessage.push(`**LL Points**: \`${theirLLPoints}\`. Your \`${theirLLPoints <= 150 ? 150 - theirLLPoints : 0}\` LL Points away from becoming a religious leader`)

		let theirHP = players[userName]['HP']
		theMessage.push(`**HP**: \`${theirHP}\``)

		let theirHunger = players[userName]['hunger']
		theMessage.push(`**Hunger Bars Left**: \`${theirHunger}\``)

		if (players[userName]['religion']) {
			let their_religion_name = players[userName]['religion']
			theMessage.push(`**Your Religion**: ${toTitleCase(their_religion_name)}`)
		}

		if (players[userName]['following']) {
			let religion_their_following = players[userName]['following']
			theMessage.push(`**Your Following The Religion**: ${toTitleCase(religion_their_following)}`)
		}

		if (players[userName]['owns']) {
			let whatTheyOwn = players[userName]['owns'].join(`\n	`)
			theMessage.push(`**You Own**:\n	${whatTheyOwn}`)
		}

		if (players[userName]['bought']) {
			let whatTheyBought = players[userName]['bought'].join(`\n   `)
			theMessage.push(`**You've Bought**:\n	${whatTheyBought}`)
		}
		
		if (players[userName]['inventory']) {
			let theirInventory = []
			Object.entries(players[userName]['inventory']).forEach((entry) => {
				if (entry[1]['amount'] > 0) {
					
					theirInventory.push(`**${ toTitleCase(entry[0]) }**(x${ entry[1]['amount'] })`)
				}
			})
			theMessage.push(`**Inventory**:\n    \`${player_inventory['space'][0]}\` out of \`${player_inventory['space'][1]}\` inventory space has been taken up\n    ${theirInventory.join('\n	')}`)
		}
		
		message.channel.send(theMessage)
	},
};