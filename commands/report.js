// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

module.exports = {
	name: 'report',
	description: 'Reports something going wrong to Little Luigi',
	guildOnly: true,
	aliases: ['bug', 'rep'],
	requiredServer: ['850167368101396520'],
	requiredCategory: ['Request Rooms'],
	requiredRole:['Character'],
	status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
		let name_of_player = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
		let message_id = message.id;
		let channel_id = message.channel.id;
		let server_id = message.guild.id;
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

		if (args.length < 1) {
			return message.channel.send(`You need to report something....`)
		}
		
		let bugChannel = message.guild.channels.cache.get('928070346966446141')
        bugChannel.send(
			`<@276119804182659072> \n` +
			`\`${toTitleCase(name_of_player)}\` https://discord.com/channels/${server_id}/${channel_id}/${message_id}\n` +
			`${args.join(' ')}`
		)
	},
};