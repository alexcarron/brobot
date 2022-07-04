// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');

module.exports = {
    name: 'limits',
    description: 'Tells you all the limitations including placements, alignments, width/height, rotations, shapes, and colors',
    guildOnly: true,
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var limitations = JSON.parse(fs.readFileSync('limitations.json'))
        var theMessage = []

        if (limitations['placements']) {
            theMessage.push(`**Placements**: \`0\`, \`1\`, \`${limitations['placements'].slice(2).join(`\`, \``)}\``)
        }
        if (limitations['alignments']) {
            theMessage.push(`**Alignments**: \`${limitations['alignments'].join(`\`, \``)}\``)
        }
        if (limitations['width/height']) {
            let range = limitations['width/height']['range']
            let multiple = limitations['width/height']['multiple']
            theMessage.push(`**Width/Height**: \`${range[0]}\`-\`${range[1]}\` pixels [Multiple of \`${multiple}\`]`)
        }
        if (limitations['rotations']) {
            theMessage.push(`**Rotations**: \`${limitations['rotations'].join(`˚\`, \``)}˚\``)
        }
        if (limitations['shapes']) {
            theMessage.push(`**Shapes**: \`${limitations['shapes'].join(`\`, \``)}\``)
        }
        if (limitations['colors']) {
            theMessage.push(`**Colors**: \`${Object.keys(limitations['colors']).length}\` Colors`)
        }

        message.channel.send(theMessage, {
            files: [limitations['color palette']['numbered']]
          })
	},
};