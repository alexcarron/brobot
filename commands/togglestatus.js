// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');

module.exports = {
    name: 'togglestatus',
    isRestrictedToMe: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        let config = JSON.parse(fs.readFileSync('config.json'))

        if (config.isSleep) {
            config.isSleep = false
        } else {
            config.isSleep = true
        }

        fs.writeFileSync('config.json', JSON.stringify(config))

        message.channel.send(`Done.`)
	},
};