// ! ALL ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
module.exports = {
	name: 'unban',
    description: 'Unban someone',
    guildOnly: true,
    args: true,
    permissions: 'ADMINISTRATOR',
	usage: '<user id/mention user>',
	execute(message, args) {
        // grab the "first" mentioned user from the message
        // this will return a `User` object, just like `message.author`
        const id = args[0];
        
        message.guild.members.unban(id);
        message.channel.send(`You unbanned ${id.username}`);
    }
};