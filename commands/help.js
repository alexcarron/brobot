// ! ALL ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————

const { prefix } = require('../config.json');
module.exports = {
	name: 'help',
	description: 'List all of the Little Luigi Land commands and gives info about a specific command.',
	aliases: ['commands', '?'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
	usage: '<command-name>',
	execute(message, args) {
		const data = [];
		const { commands } = message.client;

		if (!args.length) {

			// Gets all commands for LLL
			let lll_commands = commands.filter(command => {

				if ( 
					( 
						command.requiredServer &&
						command.requiredServer.includes('850167368101396520')
					) && 
					( 
						!command.requiredRole || 
						!command.requiredRole.includes('God') 
					) 
				) {
					return true
				} else {
					return false
				}

			})


			// Makes the commands readable
			let command_array = lll_commands.map(command => {
				
				return `${command.name}\` ${command.aliases ? ` - *${command.aliases.join(`* - *`)}*` : ``}`

			})


			data.push(`**Here's a list of all my commands:**`);
			data.push(`\`${ prefix }${ command_array.join( `\n\`${ prefix }` ) }`); 
			data.push(`You can send \`${prefix}help <command name>\` to get info on a specific command!`);

			message.channel.send(data, { split: true });

		} else {

			const name = args[0].toLowerCase();
			const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));
	
			if (!command) {
				return message.reply('that\'s not a valid command!');
			}

			// Make Command Aliases Message
			let command_aliases_message = '';
			
			console.log(command.aliases)
			if (command.aliases)  {

				command_aliases_message = ` - *${prefix}${command.aliases.join(`* - *${prefix}`)}*`;

			}
			console.log(command_aliases_message)
			
			// Make Command Usage
			let command_usage_message = ['']
			
			if (command.usage) {
				if (typeof command.usage === 'string') { // Check if parameters branch out
					command_usage_message = [`\`${command.usage}\``]
				} else {
					command_usage_message = command.usage.map((usage, num) => {
						if (num === 0) {
							return `\`${usage}\`${command_aliases_message}`
						}
						command_aliases_message = '';

						return `**${prefix}${command.name}** \`${usage}\``
					})
				}
			}
			data.push(`**${prefix}${command.name}** ${command_usage_message.join('\n')}${command_aliases_message}`);
			
			if (command.description) data.push(`_ _\n${command.description}`);
		
			message.channel.send(data, { split: true });

		}



	},
};
