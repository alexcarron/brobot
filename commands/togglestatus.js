// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');

module.exports = {
    name: 'togglestatus',
    permissions: 'ADMINISTRATOR',
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var status = JSON.parse(fs.readFileSync('status.json'))
    
        if (status['status']) {
            status['status'] = false
        } else {
            status['status'] = true
        }

        fs.writeFileSync('status.json', JSON.stringify(status))

        message.channel.send(`Done.`)
	},
};