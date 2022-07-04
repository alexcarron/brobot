// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');

module.exports = {
    name: 'inventory',
    description: 'Shows what you have in your inventory',
    guildOnly: true,
    aliases: ['inv'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        let players = JSON.parse(fs.readFileSync('players.json'))
        let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
		let player_inventory = players[userName]['inventory']
        function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

        let theMessage = []

        if (players[userName]['inventory']) {
            let theirInventory = []
            Object.entries(player_inventory).forEach((entry) => {
				
                if (entry[1]['amount'] > 0) {
                    theirInventory.push(`**${ toTitleCase(entry[0]) }**(x${ entry[1]['amount'] })`)
                }
            })
            theMessage.push(`**Inventory**:\n    \`${player_inventory['space'][0]}\` out of \`${player_inventory['space'][1]}\` inventory space is has been taken up`)
			theMessage.push(`    ${theirInventory.join('\n    ')}`)
        } else {
            theMessage.push(`You have nothing...`)
        }
        
        message.channel.send(theMessage)
	},
};