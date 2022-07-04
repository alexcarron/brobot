// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');

module.exports = {
    name: 'currentlocation',
    description: 'Tells you your current location',
    guildOnly: true,
    aliases: ['cl', 'mylocation', 'ml'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
            var players = JSON.parse(fs.readFileSync('players.json'))
            var userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
            var locations = JSON.parse(fs.readFileSync('locations.json'))
            var playerLocation = players[userName]['location']
            var insideLocation = players[userName]['inside'].toLowerCase()
            var insideStatus = players[userName]['inside'] != "" 
			function toTitleCase(string) { // Magic Function DO NOT TOUCH
				return string.replace(/\w\S*/g, function(txt){
					return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
				});
			}

        if (insideStatus) { // ? Inside
            message.channel.send(`Inside: **${toTitleCase(insideLocation)}**`, {
                files: [locations[playerLocation.join(', ')]['layers'][insideLocation]['inside']['information']['image'][0]]
            })
        } else { // ? Outside
            message.channel.send(`\`${(players[userName]['location'])}\``, {
                files: [locations[`${players[userName]['location'][0]}, ${players[userName]['location'][1]}`]['image'][0]]
            })
        }
	},
};