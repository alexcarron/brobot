// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
const fs = require('fs');
var jimp = require('jimp');

module.exports = {
    name: 'event',
    guildOnly: true,
    args: true,
    requiredServer: ['850167368101396520'],
    requiredRole:['God'],
    usage: '<event>, <parameters>',
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        var objects = JSON.parse(fs.readFileSync('objects.json'))
        var limitations = JSON.parse(fs.readFileSync('limitations.json'))
        var players = JSON.parse(fs.readFileSync('players.json'))
        var shop = JSON.parse(fs.readFileSync('shop.json'))
        var locations = JSON.parse(fs.readFileSync('locations.json'))
        var mainLandChannel = message.guild.channels.cache.get('850168521123430431')
        var events = ['flood']

        async function flood(locationImage, floodLevel, playerlocation, playerName) {
            return jimp.read(locationImage)
                    .then(
                        (image) => {
                            return jimp.read('https://cdn.discordapp.com/attachments/850491267095986237/860935708025815040/FloodWater.png')
                                .then((addedImage) => {
                                    addedImage.resize(1920, 108)
                                    image.composite(addedImage, 0, 1080-(108*floodLevel))

                                        image.write(`${playerlocation[0]}, ${playerlocation[1]}.png`)
                                        let playerChannel = message.guild.channels.cache.find(c => c.name === `${playerName.toLowerCase().replace(' ','-')}s-room`)
                                        var theUrl = playerChannel.send('',{
                                            files:[`${playerlocation[0]}, ${playerlocation[1]}.png`]
                                        })
                                            .then(msg => {
                                                return msg.attachments.array()[0].url
                                            })
                                        return theUrl
                                    }
                                )
                            })
        }

        // Processing
        message.channel.send(`Processing...`)

        // Makes Arguments Seperated by Commas
            var commaArgs = args.join(' ').split(', ') 

        // Is it an event?
            if (!events.includes(commaArgs[0])) {
                return message.channel.send(`That's not an event.`)
            }

        // FLOOD EVENT
            if (commaArgs[0] === 'flood') {
                let floodLevel = parseFloat(commaArgs[1])

                if (floodLevel === 1) {
                    mainLandChannel.send(`<@&850491869396860958> There's a flood coming. Prepare so you don't drown.`)
                }

                Object.entries(players).forEach( player => {
                    let playerName = player[0]
                    let playerlocation = player[1]['location']
                    let locationImage = locations[`${playerlocation[0]}, ${playerlocation[1]}`]['image'][0]


                    let floodFunction = flood(locationImage, floodLevel, playerlocation, playerName)
                    floodFunction.then((result) => {
                        locations[`${playerlocation[0]}, ${playerlocation[1]}`]['image'].unshift(result)
                        console.log(`check1`)
                        fs.writeFileSync('locations.json', JSON.stringify(locations))
                        console.log(`check2`)
                    })

                    
                })
            }
	},
};