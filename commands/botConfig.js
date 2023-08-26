// ! ALL ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-empty */

module.exports = {
	name: 'botconfig',
    description: 'Changes the bot\'s properties',
    isServerOnly: true,
    args: true,
	isRestrictedToMe: true,
    required_permission: 'ADMINISTRATOR',
	usages: ['name/avatar/status/display <input>'],
	execute(message, args) {
        // Name Change
		if (args[0] === 'name') {
            if (args.slice(1).join(' ').length >= 2 && args.slice(1).join(' ').length <= 32) {
                return message.client.user.setUsername(args.slice(1).join(' '));
            } else {
                message.channel.send('Your username must be between 2-32 characters!')
            }
        }
        // Avatar Change
        if (args[0] === 'avatar') {
            console.log('avatar change')
            return message.client.user.setAvatar(args.slice(1).join(' '));
        }
        // Status Change
        if (args[0] === 'status') {
            if (args[1] != 'WATCHING' && args[1] != 'LISTENING' && args[1] != 'STREAMING') {
                console.log('status')
                return message.client.user.setActivity(args.slice(1).join(' '));
            } else {
                console.log('other status')
                return message.client.user.setActivity(args.slice(2).join(' '), { type: args[1] });
            }
        }
        // Display Status Change
        if (args[0] === 'display') {
            return message.client.user.setStatus(args[1]);
        }

        message.channel.send(`It didn't work. \nDisplays: online, idle, dnd, invisible`);
    }
};