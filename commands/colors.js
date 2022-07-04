// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

module.exports = {
    name: 'colors',
    description: 'See the current color pallet and which number corresponds to which color',
    guildOnly: true,
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {

        return message.channel.send({
            files: ["https://cdn.discordapp.com/attachments/850491267095986237/850491423127109672/LLL_Color_Pallete_1.png", 'https://cdn.discordapp.com/attachments/850491267095986237/850491425812119572/LLL_Color_Pallete_with_Numbers_1.png']
          })
	},
};