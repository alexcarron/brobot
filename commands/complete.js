// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
const fs = require('fs');

module.exports = {
    name: 'complete',
    description: 'Gives you the reward for completing a task if you actually completed it',
    guildOnly: true,
    args: true,
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: '<task>',
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        var tasks = JSON.parse(fs.readFileSync('tasks.json'))
        var players = JSON.parse(fs.readFileSync('players.json'))
        var task = args.join(' ').toLowerCase()
        var commaArgs = args.join(' ').split(', ') 

        if (message.author.id != '276119804182659072') {
            // Does the task exist?
                if (!Object.keys(tasks).includes(task)) {
                    return message.channel.send(`**${task}** is not a task.`)
                }
            
            message.channel.send(`<@276119804182659072>, **${userName}** thinks they completed the task, \`${task}\`\n> ${tasks[task]['description']}.`)
        } else {
            if (commaArgs.length < 2) {
                return message.channel.send(`Needs more arguments`)
            }

            let theTask = commaArgs[0].toLowerCase()
            let thePlayer = commaArgs[1].toLowerCase()

            if (!Object.keys(tasks).includes(theTask)) {
                return message.channel.send(`**${theTask}** is not a task.`)
            }
            
            if (!Object.keys(players).includes(thePlayer)) {
                return message.channel.send(`**${thePlayer}** is not a players.`)
            }

            players[thePlayer]['completed'].push(theTask)
            players[thePlayer]["LL Points"] += tasks[theTask]['reward']['LLPoints']
            players[thePlayer]["experience"] += tasks[theTask]['reward']['xp']

            message.channel.send(`**${thePlayer}** officially completed the task, **${theTask}**, and got \`${tasks[theTask]['reward']['LLPoints']}\` LL Point!`)
			if (tasks[theTask]['reward']['xp']) {
				message.channel.send(`\`+${tasks[theTask]['reward']['xp']} XP\``)
			}
        }

    }
};