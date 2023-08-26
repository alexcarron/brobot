// ! ALL ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————

module.exports = {
    name: 'kick',
    description: 'Kicks someone',
    isServerOnly: true,
    args: true,
	isRestrictedToMe: true,
    required_permission: 'KICK_MEMBERS',
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
		if (!message.mentions.users.size) {
            return message.channel.send('You didn\'t tag anyone');
        }

        function getUserFromMention(mention) {
            if (!mention) return;

            if (mention.startsWith('<@') && mention.endsWith('>')) {
                mention = mention.slice(2, -1);

                if (mention.startsWith('!')) {
                    mention = mention.slice(1);
                }

                return message.guild.members.cache.get(mention);
            }
        }

        // grab the "first" mentioned user from the message
        // this will return a `User` object, just like `message.author`
        const member = message.mentions.users.first();

        getUserFromMention(args[0]).kick();
        message.channel.send(`You kicked ${member.username}`);
	},
};