/* eslint-disable no-empty */

const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

const cooldowns = new Discord.Collection();

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
    console.log('Ready!');
    client.user.setPresence({
        status: 'online',
        activity: {
            name: "How to Cook Spaghetti",
            type: 'STREAMING',
            url: "https://www.twitch.tv/jackofalltrade5"
        }
    })
});

// Message Reader
client.on('message', message => {
    if (message.channel.type === 'dm') {
        let itemFeudServer = client.guilds.cache.get('609117468694151168');
        let dmChannel = itemFeudServer.channels.cache.get('826099128072667136');
        if (message.author.id === '803333218614116392') {
            dmChannel.send (`_ _\n<@276119804182659072> > <@${message.channel.recipient.id}> [${message.channel.id} ${message.id}]\n\`\`\`${message.content}\`\`\`\n_ _`)
        } else {
            dmChannel.send (`_ _\n**${message.channel.recipient.username}** <@276119804182659072> ||[${message.channel.id} ${message.id}]||\n\`\`\`${message.content}\`\`\`\n_ _`)
        }
    }

    // Check if message starts with prefix or is from a bot
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    // Gets arguments and makes them an array
    const args = message.content.slice(prefix.length).trim().split(/ +/);

    // Gets name of command
    const commandName = args.shift().toLowerCase();

    // Checks if command or aliases exists
    const command = client.commands.get(commandName)
        || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    
    if (!command) {
        return;
    }

    console.log(message.content)
    
    // Turned off
        var status = JSON.parse(fs.readFileSync('status.json'))
        if (!status['status'] && commandName != 'togglestatus' && command.status && message.author.id != '276119804182659072') {
            return message.channel.send(`Someone's messing with my code. Hold on a moment.`)
        }


    // Server-Only Command Check
    if (command.guildOnly && message.channel.type === 'dm') {
        return message.reply('I can\'t do that in DMs!');
    }
    const blockedUsers = [ 'id1' ];
    client.on('message', message => {
        if (blockedUsers.includes(message.author.id)) return;
    });


    // Permission Check
    /* https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS */
    if (command.permissions) {
        const authorPerms = message.channel.permissionsFor(message.author);
        if (!authorPerms || !authorPerms.has(command.permissions)) {
            return message.reply('Nice try peasant. You don\'t have the permission(s) to do this.');
        }
    }

    // Server Check
    if(command.requiredServer) {
        let serverCheck = false
        for (let i = 0; i < command.requiredServer.length; i++) {
            if (message.guild.id === command.requiredServer[i]) {
                serverCheck = true;
                break;
            }
        }
        if (!serverCheck) {
            return message.channel.send('I think you meant to do this in another server.')
        }
    }

    // Channel Check
    if(command.requiredChannel) {
        let channelCheck = false
        for (let i = 0; i < command.requiredChannel.length; i++) {
            if (message.channel.name.toLowerCase() === command.requiredChannel[i]) {
                channelCheck = true;
                break;
            }
        }
        if (!channelCheck) {
            return message.channel.send('Wrong channel, silly goose')
        }
    }

    // Category Check
    if(command.requiredCategory) {
        let categoryCheck = false
        for (let i = 0; i < command.requiredCategory.length; i++) {
            if (message.channel.parent.name === command.requiredCategory[i]) {
                categoryCheck = true;
                break;
            }
        }
        if (!categoryCheck) {
            return message.reply('You\'re in the wrong category!');
        }
    }

    // Role Check
    if (command.requiredRole) {
        let roleCheckFailed = false
        for (let i = 0; i < command.requiredRole.length; i++) {

            if (!message.member.roles.cache.some(r => r.name === command.requiredRole[i]) && message.author.id != '276119804182659072') {
                roleCheckFailed = true;
                break;
            }
        }
        if (roleCheckFailed) {
            return message.reply('Nice try peasant. You don\'t have the role(s) to do this!');
        }
    }
    // Argument Check
    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, silly!`;

        if (command.noArgsMessage) {
            reply = command.noArgsMessage;
        }

        if (command.usage) {
            reply += `\nYou gotta do this: \`${prefix}${command.name} ${command.usage}\``;
        }

        return message.reply(reply);
    }

    // Cooldown
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }
    
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
    
    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
    
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`WAIT ${timeLeft.toFixed(1)} MORE SECOND(s)! You have no patience when using the \`${command.name}\` command.`);
        }

        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    }

    // Executing Command
    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
		if (Array.isArray(command.usage)) {
			message.reply(`it didn't work...\nYou gotta do this: \`${prefix}${command.name} ${command.usage.join('\n')}\``);
		} else {
			message.reply(`it didn't work...\nYou gotta do this: \`${prefix}${command.name} ${command.usage}\``);
		}
    }
});

// login to Discord with your app's token
client.login(token);
