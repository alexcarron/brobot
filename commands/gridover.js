// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');
var jimp = require('jimp');


module.exports = {
    name: 'gridover',
    description: 'Puts a grid over an object or location so you can visualize the coordinates better',
    guildOnly: true,
    args: true,
    aliases: ['go', 'grid'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: [
        'object, <object name>, <grid type>',
        'location, <grid type>'
    ],
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var players = JSON.parse(fs.readFileSync('players.json'))
        var objects = JSON.parse(fs.readFileSync('objects.json'))
        var locations = JSON.parse(fs.readFileSync('locations.json'))
        var userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        var commaArgs = args.join(' ').split(', ') 
        var typeOfThing = commaArgs[0].toLowerCase()
        var playerLocation = players[userName]['location']
        var insideStatus = players[userName]['inside'] != "" 
        var insideLocation = players[userName]['inside']
        var grids = {
            'object':{
                '5x5':'https://cdn.discordapp.com/attachments/850491267095986237/874747134732279829/LLL_Object_Grid_5x5.png',
                '4x4':'https://cdn.discordapp.com/attachments/850491267095986237/874747133369122876/LLL_Object_Grid_4x4.png',
                '3x3':'https://cdn.discordapp.com/attachments/850491267095986237/874747131985035264/LLL_Object_Grid_3x3.png',
                '2x2':'https://cdn.discordapp.com/attachments/850491267095986237/874747130537996308/LLL_Object_Grid_2x2.png'
            },
            'location':{
                '5x5':'https://cdn.discordapp.com/attachments/850491267095986237/874747129485213727/LLL_Background_Grid_5x5.png',
                '4x4':'https://cdn.discordapp.com/attachments/850491267095986237/874747128222724146/LLL_Background_Grid_4x4.png',
                '3x3':'https://cdn.discordapp.com/attachments/850491267095986237/874747127262244984/LLL_Background_Grid_3x3.png',
                '2x2':'https://cdn.discordapp.com/attachments/850491267095986237/874747125836161104/LLL_Background_Grid_2x2.png'
            }
        }

        // Processing
        message.channel.send(`Processing...`)                

        function addImageToImage(addedImage, filename, oldPNG)  {    
            return jimp.read(oldPNG)
                .then(
                    (image) => {
                        return jimp.read(addedImage)
                            .then((addedImage) => {
                                image.composite(addedImage, 0, 0)

                                    image.write(`${filename}.png`)
                                    var theURL = message.channel.send('',{
                                        files:[`${filename}.png`]
                                    }).then(msg => {
                                        return msg.attachments.array()[0].url
                                    })
                                    return theURL
                                }
                            )
                        })
        }

        // Is the first argument correct?
            if (!['object', 'location'].includes(typeOfThing)) {
                return message.channel.send(`**${typeOfThing}** is not a type of thing you can out a grid on. Only objects & locations.`)
            }

        // ^ OBJECT
        if (typeOfThing === 'object') {
            let objectName = commaArgs[1].toLowerCase()
            let gridName = commaArgs[2].toLowerCase()

            // Checks if amount of arguments are 2+
            if (commaArgs.length < 3) {
                return message.channel.send(`No!!! It's like this: \`<gridover object, <objectName>, <grid>\``)
            }

            // Checks if you own the object you are editing and if it exists
            if (!Object.keys(objects).includes(objectName) || objects[objectName]['information']['owner'] != userName) { 
                return message.channel.send(`**${objectName}** is not an object that you own and/or exists.`)
            } 

            // Valid Grid?
            if (!Object.keys(grids['object']).includes(gridName)) {
                return message.channel.send(`**${gridName}** is not a type of grid. You can only do \`${Object.keys(grids['object']).join(`\`, \``)}\`.`)
            }
            
            let theGrid = grids['object'][gridName]
            let theFileName = objectName
            let theOldImage = objects[objectName]['information']['image'][0]

            let createImage = addImageToImage(theGrid, theFileName, theOldImage)
            // eslint-disable-next-line no-unused-vars
            createImage.then((result) => {
                message.channel.send(`Here you go`)
            })
        }

        // ^ LOCATION
        if (typeOfThing === 'location') {
			
			// Checks if amount of arguments are 2+
			if (commaArgs.length < 2) {
				return message.channel.send(`No!!! It's like this: \`<gridover location, <grid>\``)
			}
			
            let gridName = commaArgs[1].toLowerCase()

            // Valid Grid?
            if (!Object.keys(grids['location']).includes(gridName)) {
                return message.channel.send(`**${gridName}** is not a type of grid. You can only do \`${Object.keys(grids['object']).join(`\`, \``)}\`.`)
            }

            let theGrid = grids['location'][gridName]
            let theFileName = playerLocation.join(', ')
            let theOldImage
            if (insideStatus) { // ? Inside
                theOldImage = locations[playerLocation.join(', ')]['layers'][insideLocation]['inside']['information']['image'][0]
            } else { // ? Outside
                theOldImage = locations[playerLocation.join(', ')]['image'][0]
            }

            let createImage = addImageToImage(theGrid, theFileName, theOldImage)
            // eslint-disable-next-line no-unused-vars
            createImage.then((result) => {
                message.channel.send(`Here you go`)
            })
        }
	},
};