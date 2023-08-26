// ! ALL ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————

module.exports = {
    name: 'purge',
    isServerOnly: true,
    args: true,
	isRestrictedToMe: true,
    required_permission: 'ADMINISTRATOR',
	async execute(message, args) {
        let amount = parseInt(args[0]) + 1;
        let times = parseInt(args[1]);

        if (isNaN(amount) || isNaN(times)) {
            return message.channel.send('that doesn\'t seem to be a valid number.');
        }


		for (let i = 0; i < times; i++) {
			try {
				await message.channel.bulkDelete(amount);
			}
			catch {
				message.channel.send("Couldn't bulk delete");
			}
		}
	},
};