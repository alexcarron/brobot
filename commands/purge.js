// ! ALL ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————

module.exports = {
    name: 'purge',
    guildOnly: true,
    args: true,
    permissions: 'ADMINISTRATOR',
	execute(message, args) {
        let amount = parseInt(args[0]);
        amount = amount + 1
    
        if (isNaN(amount)) {
            return message.reply('that doesn\'t seem to be a valid number.');
        } else if (amount < 2 || amount > 100) {
            return message.reply('you need to input a number between 1 and 99.');
        }
        
    message.channel.bulkDelete(amount);
	},
};