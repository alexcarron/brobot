// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');

module.exports = {
    name: 'llpoint',
    guildOnly: true,
    args: true,
    requiredServer: ['850167368101396520'],
    requiredRole:['God'],
    usage: '<object>',
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var players = JSON.parse(fs.readFileSync('players.json'))

        if (message.author.id != '276119804182659072') {return}

                // Makes Arguments Separated by Commas
                var commaArgs = args.join(' ').split(', ') 

                var player = commaArgs[0]

                if(!Object.keys(players).includes(player)) {
                        return message.channel.send(`Ain't a player`)
                }
    
        players[player]["LL Points"] = players[player]["LL Points"] + parseFloat(commaArgs[1])
        console.log(players)

        fs.writeFileSync('players.json', JSON.stringify(players))

        message.channel.send(`k`)
	},
};