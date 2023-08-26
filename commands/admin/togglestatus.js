const fs = require('node:fs/promises');


module.exports = {
    name: 'togglestatus',
    isRestrictedToMe: true,

	execute(message, args) {
        let config = JSON.parse(fs.readFile(`${global.paths.utilities_dir}/config.json`))

        if (config.isSleep) {
            config.isSleep = false
        } else {
            config.isSleep = true
        }

        fs.writeFileSync(`${global.paths.utilities_dir}/config.json`, JSON.stringify(config))

        message.channel.send(`Done.`)
	},
};