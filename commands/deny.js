// ^ SAND ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-empty */
module.exports = {
	name: 'deny',
    description: 'deny a player to an existing alliance',
    guildOnly: true,
    args: true,
    permissions: 'ADMINISTRATOR',
    usage: '<user>',
    requiredServer: ['698178798759444531'],
	execute(message, args) {
        for (let i = 1; i < args.length; i = i + 1) {
        let channel = message.guild.channels.cache.get(args[i].slice(2, -1))
        channel.updateOverwrite(args[0], { SEND_MESSAGES: null }) // SEND_MESSAGES or ADD_REACTIONS
        }
        message.channel.send(`Done`)
    }
};