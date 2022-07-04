// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');


module.exports = {
    name: 'conflict',
    description: 'Starts a conflict with someone so that you can settle a disagreement with the opinions of others',
    guildOnly: true,
    args: true,
    aliases: ['con', 'fight'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: '<with-who>, <reason>, <what-the-winner-receives>',
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        let user = message.guild.members.cache.get(message.author.id)
        let userName = user.displayName.toLowerCase()
        let players = JSON.parse(fs.readFileSync('players.json'))
        let conflictRole = message.guild.roles.cache.find(r => r.name === "Conflict");

        // Processing
        message.channel.send(`Processing...`)

        // Makes Arguments Separated by Commas
            let commaArgs = args.join(' ').split(', ') 

        if (commaArgs.length < 3) {
            return message.channel.send(`No no no! You do it like this \`<conflict <with who>, <reason>, <what the winner gets>\``)
        }

        if (!message.mentions.members.first()) {
            return message.channel.send(`You must mention someone`)
        }

        let otherUser = message.guild.members.cache.get(message.mentions.users.first().id)
        let otherPlayerName = otherUser.displayName.toLowerCase()
        let reason = commaArgs[1]
        let rewards = commaArgs[2]

        if (commaArgs[0] === userName) {
            return message.channel.send(`You can't have a conflict with yourself`)
        }

        if (!Object.keys(players).includes(otherPlayerName)) {
            return message.channel.send(`**${otherPlayerName}** is not someone that exists`)
        }

        message.channel.send(`You started a conflict with **${otherPlayerName}** because \`${reason}\`.`)
        let conflictChannel = message.guild.channels.cache.get('851588389849268285')
        conflictChannel.send(`<@276119804182659072> **${userName}** started a conflict with **${otherPlayerName}** because \`${reason}\`.\n
        If **${userName}** or **${otherPlayerName}** wins then they get: \`${rewards} as well as 10 XP\`\n
        <@${user.id}> and <@${otherUser.id}> you may give your arguments now. Whoever has the most votes in 24 hours wins.`)
            
        user.roles.add(conflictRole).catch(console.error);
        otherUser.roles.add(conflictRole).catch(console.error);

        conflictChannel.send(`React to this message with :arrow_left: if you think **${userName}** made the better argument`).then(msg => {
            msg.react('⬅️')
        })
        conflictChannel.send(`React to this message with :arrow_right: if you think **${otherPlayerName}** made the better argument`).then(msg => {
            msg.react('➡️')
        })
	},
};