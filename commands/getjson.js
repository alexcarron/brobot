// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————

// eslint-disable-next-line no-unused-vars
const fs = require('fs');
module.exports = {
    name: 'getjson',
    guildOnly: true,
    permissions: 'ADMINISTRATOR',
    usage: '',
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        message.channel.send({
            files: ['objects.json', 'locations.json', 'players.json', 'limitations.json', 'religions.json']
          })
	},
};