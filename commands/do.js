// ^ SAND ——————————————————————————————————————————————————————————————————————————————————————————————————————

// * Players ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
module.exports = {
	name: 'do',
    description: 'Do something in a challenge',
    guildOnly: true,
    args: true,
    requiredServer: ['698178798759444531'],
    requiredRole: ['Players'],
    requiredCategory: ['You Room', 'You Rooms', 'Action Rooms'],	
    usage: '[Thing you do in challenge]',
	execute(message, args) {
		if (args.length === 0) {
            return message.channel.send('You didn\'t do anything!');
        }

        const channel = message.guild.channels.cache.get('807021090496577559')
        channel.send(`<@276119804182659072>\n**${message.guild.members.cache.get(message.author.id).displayName}** did:\n\`${args.join(' ')}\``);
        message.channel.send(`Got it`)
        console.log(`${message.author.username} did ${args.join(' ')}`)
    } 
};