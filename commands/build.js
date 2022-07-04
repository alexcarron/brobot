// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
/*
        ! Red
        @ Orange
        ^ Yellow
        * Lime
        ? Blue
        ~ Purple
        & Pink
*/

const fs = require('fs');
let jimp = require('jimp');

module.exports = {
    name: 'build',
    description:'Creates a character, object, or house by adding the first shape to it',
    guildOnly: true,
    args: true,
    aliases: ['b', 'create'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: [
            'character, <shape>, <color-number>, <width>, <height>,  <coordinates>',
            'house, box, <color-number>, <width>, <height>, <house-name>,  <coordinates>',
            'object, <shape>, <color-number>, <width>, <height>, <object-name>, <coordinates>'  ,
            'church, <shape>,  <color-number>, <width>, <height>, <house-name>,  <coordinates>'      
    ],
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        let commaArgs = args.join(' ').split(', ')
        let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        let objects = JSON.parse(fs.readFileSync('objects.json'))
        let limitations = JSON.parse(fs.readFileSync('limitations.json'))
        let players = JSON.parse(fs.readFileSync('players.json'))
        let religions = JSON.parse(fs.readFileSync('religions.json'))
        let thePlayer = players[userName]
        let theirBuilds = thePlayer['builds']
        let shapes = limitations['shapes']
        let listOfShapes = `${shapes.slice(0,shapes.length-1).join(`\`, \``)}\`, and \`${shapes[shapes.length-1]}`
        let colors = limitations['colors']
        let builds = ['character', 'object', 'house', 'church']
        let listOfBuilds = `${builds.slice(0,builds.length-1).join(`\`, \``)}\`, or \`${builds[builds.length-1]}`
        let allObjects = Object.keys(objects)
        let widthAndHeightRange = limitations['width/height']['range']
        let widthAndHeightMultiple = limitations['width/height']['multiple']
        let buildType = commaArgs[0].toLowerCase()
		let randExpPoints = 1 + Math.round( Math.random() * 2 )
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}
        
        async function createPNG(shape, colorNum, width, height, horizontalPlacement, verticalPlacement, horizontalAlignment, verticalAlignment, filename)  {
            let canvas = new jimp(1000, 1000, 0xFFFFFF00);
            let rgba = jimp.intToRGBA(Number(`0x${colors[colorNum]['code']}FF`))
    
            let imageURL
    
            if (shape === 'circle') {
                imageURL = 'https://cdn.discordapp.com/attachments/850491267095986237/851887179365089300/Red_Circle.png'
            } else if (shape === 'box') {
                imageURL = 'https://cdn.discordapp.com/attachments/850491267095986237/851884156199370852/Orange_Square.png'
            } else if (shape === 'triangle') {
                imageURL = 'https://cdn.discordapp.com/attachments/850491267095986237/851884437398355998/Yellow_Triangle.png'
            }
            
            return jimp.read(imageURL)
                .then(
                    (shape) => {
                        shape.color([
                            { apply: 'red', params: [-255] },
                            { apply: 'green', params: [-255] },
                            { apply: 'blue', params: [-255] }
                        ])
                        shape.color([
                            { apply: 'red', params: [rgba.r] },
                            { apply: 'green', params: [rgba.g] },
                            { apply: 'blue', params: [rgba.b] }
                        ])
                        shape.resize(width, height)
                        let x = ((1000/horizontalPlacement[1]) * horizontalPlacement[0]) - (width/2)
                        let y = ((1000/verticalPlacement[1]) * verticalPlacement[0]) - (height/2)
                        x = x + horizontalAlignment * (width/2)
                        y = y + verticalAlignment * (height/2)

                        canvas.composite(shape, x, y)

                        canvas.write(`${filename}.png`)

                        let theURL = message.channel.send('',{
                            files:[`${filename}.png`]
                        }).then(msg => {
                            return msg.attachments.array()[0].url
                        })
                        return theURL
                    }
                )
        }

        // Processing
        message.channel.send(`Processing...`)

        // Is the first argument correct?
            if (!builds.includes(buildType)) {
                return message.channel.send(`**${buildType}** is not something you can build. You can only do \`${listOfBuilds}\`. Make sure your arguments are separated by commas.`)
            }

        // Do they have builds
            if (theirBuilds < 1) {
                return message.channel.send(`You don't have any builds. You'll need to get more.`)
            }



        // ^ CHARACTER
        if (buildType === 'character') {

            // Easier Life
            let shapeArg = commaArgs[1].toLowerCase()
            let colorNumArg = commaArgs[2].toLowerCase()
            let widthArg = parseFloat(commaArgs[3])
            let heightArg = parseFloat(commaArgs[4])

            // Does their character already exist?
                if (allObjects.includes(userName)) {
                    return message.channel.send(`You already built your character.`)
                }
            
            // Do they have 3+ arguments?
                if (!shapeArg || !colorNumArg) {
                    return message.channel.send(`No no no. You do it like this \`<build character, <shape>, <color #>, <width>, <height>, <body name>, <coordinates>\``)
                }

            // Is the shape an actual shape?
                if (!shapes.includes(shapeArg)) {
                    return message.channel.send(`**${shapeArg}** is not a shape you can choose. There's only \`${listOfShapes}\``)
                }
            
            // Is their color # a valid color?
                if (parseFloat(colorNumArg) > Object.keys(colors).length || !Number.isInteger(parseFloat(colorNumArg))) { 
                    return message.channel.send(`**${colorNumArg}** is not an available color number. Currently there's only ${Object.keys(colors).length} colors. Check them by doing \`<colors\``)
                } 
            
            // Checks if valid width
                if (widthArg < widthAndHeightRange[0] || parseFloat(widthArg) > widthAndHeightRange[1] || parseFloat(widthArg) % widthAndHeightMultiple != 0) {
                    return message.channel.send(`**${widthArg}** is not a valid width. It must be between ${widthAndHeightRange[0]}-${widthAndHeightRange[1]} and be a multiple of ${widthAndHeightMultiple}.`)
                }

            // Checks if valid height
                if (heightArg < widthAndHeightRange[0] || parseFloat(heightArg) > widthAndHeightRange[1] || parseFloat(heightArg) % widthAndHeightMultiple != 0) {
                    return message.channel.send(`**${heightArg}** is not a valid height. It must be between ${widthAndHeightRange[0]}-${widthAndHeightRange[1]} and be a multiple of ${widthAndHeightMultiple}.`)
                }

            // Organizes coordinates into variables
                // Puts coordinate arguments into array and create placement variables
                    let coordinates = commaArgs.slice(5,commaArgs.length).join(', ').slice(1,-1)
                    let coordArgs = coordinates.split(', ')
                    let hp
                    let vp

                // Checks if you have 4+ coordinate arguments
                    if (coordArgs.length < 4) {
                        return message.channel.send(`You typed your coordinates (\`${coordinates}\`) incorrectly. Take a look at #guide-to-coordinates to see how to format it correctly.`)
                    }

                // Organizes Horizontal Placement
                    if (['0','1'].includes(coordArgs[0])) 
					{
                        hp = [parseFloat(coordArgs[0]), 1]
                    } 
					else 
					{
                        hp = [parseFloat( coordArgs[0].slice( 0,coordArgs[0].indexOf('/') ) ), parseFloat( coordArgs[0].slice(coordArgs[0].indexOf('/')+1,coordArgs[0].length) )]
                    }

                // Organizes Vertical Placement
                    if (['0','1'].includes(coordArgs[1])) {
                        vp = [parseFloat(coordArgs[1]), 1]
                    } else {
                        vp = [parseFloat( coordArgs[1].slice( 0,coordArgs[1].indexOf('/') ) ), parseFloat( coordArgs[1].slice(coordArgs[1].indexOf('/')+1,coordArgs[1].length) )]
                    }

                // Organizes Alignments
                    let ha = parseFloat( coordArgs[2] )
                    let va = parseFloat( coordArgs[3] )

                // Checks if coordinate arguments are valid
                    if(!limitations['placements'].includes(hp[1]) || hp[0] > hp[1] || (!hp[0] && hp[0] != 0) || !hp[1]) {
                        return message.channel.send(`**${coordArgs[0]}** is not a valid horizontal placement. Check your \`<limits\` or check #guide-to-coordinates to make sure you typed it right`)
                    }
                    
                    if(!limitations['placements'].includes(vp[1]) || vp[0] > vp[1] || (!vp[0] && vp[0] != 0) || !vp[1]) {
                        return message.channel.send(`**${coordArgs[1]}** is not a valid vertical placement. Check your \`<limits\` or check #guide-to-coordinates to make sure you typed it right`)
                    }

                    if(!limitations['alignments'].includes(parseFloat(ha))) {
                        return message.channel.send(`**${ha}** is not a valid horizontal alignment. It can only be -1 (left), 0 (center), or 1 (right)`)
                    } if(!limitations['alignments'].includes(parseFloat(va))) {
                        return message.channel.send(`**${va}** is not a valid vertical alignment. It can only be -1 (above), 0 (center), or 1 (below)`)
                    }
            
                let xPos = ((1000/hp[1]*hp[0])-(widthArg/2)) + (ha * (widthArg/2))
                let yPos = (1000/vp[1]*vp[0])-(heightArg/2) + (va * (heightArg/2))
            
            let createImage = createPNG(shapeArg, colorNumArg, widthArg, heightArg, hp, vp, ha, va, userName)
            createImage.then((result) => {
                // Add object to the objects json file
                objects[userName] = {
                    "information": {
                        "owner":userName,
                        "type":"character",
                        "image":[result],
                        'width':[[0,1000]],
                        'height':[[0,1000]]
                    }
                }
                
                // Decrease builds
                players[userName]['builds'] = theirBuilds - 1

                // Overwrite JSON file
                    fs.writeFileSync('objects.json', JSON.stringify(objects))
                    fs.writeFileSync('players.json', JSON.stringify(players))

                // Confirmation Message
                    message.channel.send(`You have made the body for your character. It's a **${colors[colorNumArg]['name']} ${toTitleCase(shapeArg)}**. You can add a face to it using \`<editobject\`.`)
            })

            
        }

        // ^ OBJECT
        if (buildType === 'object') {
            let shapeArg = commaArgs[1].toLowerCase()
            let colorNumArg = commaArgs[2].toLowerCase()
            let widthArg = parseFloat(commaArgs[3])
            let heightArg = parseFloat(commaArgs[4])
            let objectNameArg = commaArgs[5].toLowerCase()


            // Is there 7+ arguments?
                if (commaArgs.length < 7) {
                    return message.channel.send(`No no no. You do it like this \`<build object, <shape>, <color #>, <width>, <height>, <name>, <layer name>, <coordinates>\``)
                }

            // Is the shape an actual shape?
                if(!shapes.includes( shapeArg )) {
                    return message.channel.send(`**${shapeArg}** is not a shape you can choose. There's only \`${listOfShapes}\``)
                }

            // Is their color # a valid color?
                if(parseFloat(colorNumArg) > Object.keys(colors).length || !Number.isInteger(parseFloat(colorNumArg))) { 
                    return message.channel.send(`**${colorNumArg}** is not an available color number. Currently there's only ${Object.keys(colors).length} colors. Check them by doing \`<colors\``)
                }
            
            // Checks if valid width
                if(widthArg < widthAndHeightRange[0] || parseFloat(widthArg) > widthAndHeightRange[1] || parseFloat(widthArg) % widthAndHeightMultiple != 0) {
                    return message.channel.send(`**${widthArg}** is not a valid width. It must be between ${widthAndHeightRange[0]}-${widthAndHeightRange[1]} and be a multiple of ${widthAndHeightMultiple}.`)
                }

            // Checks if valid height
                if(heightArg < widthAndHeightRange[0] || parseFloat(heightArg) > widthAndHeightRange[1] || parseFloat(heightArg) % widthAndHeightMultiple != 0) {
                    return message.channel.send(`**${heightArg}** is not a valid height. It must be between ${widthAndHeightRange[0]}-${widthAndHeightRange[1]} and be a multiple of ${widthAndHeightMultiple}.`)
                }
            
            // Organizes coordinates into variables
                // Puts coordinate arguments into array and create placement variables
                    let coordinates = commaArgs.slice(6,commaArgs.length).join(', ').slice(1,-1)
                    let coordArgs = coordinates.split(', ')
                    let hp
                    let vp

                // Checks if you have 4+ coordinate arguments
                    if(coordArgs.length < 4) {
                        return message.channel.send(`You typed your coordinates (\`${coordinates}\`) incorrectly. Take a look at #guide-to-coordinates to see how to format it correctly.`)
                    }

                // Organizes Horizontal Placement
                    if (['0','1'].includes(coordArgs[0])) {
                        hp = [parseFloat(coordArgs[0]), 1]
                    } else {
                        hp = [parseFloat( coordArgs[0].slice( 0,coordArgs[0].indexOf('/') ) ), parseFloat( coordArgs[0].slice(coordArgs[0].indexOf('/')+1,coordArgs[0].length) )]
                    }

                // Organizes Vertical Placement
                    if (['0','1'].includes(coordArgs[1])) {
                        vp = [parseFloat(coordArgs[1]), 1]
                    } else {
                        vp = [parseFloat( coordArgs[1].slice( 0,coordArgs[1].indexOf('/') ) ), parseFloat( coordArgs[1].slice(coordArgs[1].indexOf('/')+1,coordArgs[1].length) )]
                    }

                // Organizes Alignments
                    let ha = parseFloat( coordArgs[2] )
                    let va = parseFloat( coordArgs[3] )

                // Checks if coordinate arguments are valid
                    if(!limitations['placements'].includes(hp[1]) || hp[0] > hp[1] || (!hp[0] && hp[0] != 0) || !hp[1]) {
                        return message.channel.send(`**${coordArgs[0]}** is not a valid horizontal placement. Check your \`<limits\` or check #guide-to-coordinates to make sure you typed it right`)
                    }
                    
                    if(!limitations['placements'].includes(vp[1]) || vp[0] > vp[1] || (!vp[0] && vp[0] != 0) || !vp[1]) {
                        return message.channel.send(`**${coordArgs[1]}** is not a valid vertical placement. Check your \`<limits\` or check #guide-to-coordinates to make sure you typed it right`)
                    }

                    if(!limitations['alignments'].includes(parseFloat(ha))) {
                        return message.channel.send(`**${ha}** is not a valid horizontal alignment. It can only be -1 (left), 0 (center), or 1 (right)`)
                    } if(!limitations['alignments'].includes(parseFloat(va))) {
                        return message.channel.send(`**${va}** is not a valid vertical alignment. It can only be -1 (above), 0 (center), or 1 (below)`)
                    }
            
            let xPos = ((1000/hp[1]*hp[0])-(widthArg/2)) + (ha * (widthArg/2))
            let yPos = (1000/vp[1]*vp[0])-(heightArg/2) + (va * (heightArg/2))
            
            // Make sure name isn't used
            let num_ = 0
            let tempName = objectNameArg

            while (allObjects.includes(tempName)) {
                tempName = `${objectNameArg}${num_}`
                num_ = num_ + 1
                if(!allObjects.includes(tempName)) {
                    message.channel.send(`That name already exists. Your object was renamed to **${toTitleCase(tempName)}**`)
                }
            }
            objectNameArg = tempName

            let createImage = createPNG(shapeArg, colorNumArg, widthArg, heightArg, hp, vp, ha, va, objectNameArg)
            createImage.then((result) => {
                // Add object to the objects json file
                objects[objectNameArg] = {
                    "information": {
                        "owner":userName,
                        "type":"object",
                        "image":[result],
                        "width":[[xPos,xPos+widthArg]],
                        "height":[[yPos,yPos+heightArg]],
                    }
                }
            
                // Increase builds
                players[userName]['builds'] -= 1
				players[userName]['experience'] += randExpPoints

                // Overwrite JSON file
                    fs.writeFileSync('objects.json', JSON.stringify(objects))
                    fs.writeFileSync('players.json', JSON.stringify(players))
                
                // Confirmation Message
                    message.channel.send(`You have made the first shape for your new object, **${toTitleCase(objectNameArg)}**. It's a **${widthArg} by ${heightArg} ${colors[colorNumArg]['name']} ${toTitleCase(shapeArg)}** at \`[${coordinates}]\`.`)
					message.channel.send(`\`+${randExpPoints} XP\``);
			})
        }

        // ^ HOUSE
        if (buildType === 'house') {

            let shapeArg = commaArgs[1].toLowerCase()
            let colorNumArg = commaArgs[2].toLowerCase()
            let widthArg = parseFloat(commaArgs[3])
            let heightArg = parseFloat(commaArgs[4])
            let objectNameArg = commaArgs[5].toLowerCase()

            // Is there 7+ arguments?
                if (commaArgs.length < 7) {
                    return message.channel.send(`No no no. You do it like this \`<build house, box, <color #>, <width>, <height>, <name>, <layer name>,  <coordinates>\``)
                }

            //  Did they say box?
                if(shapeArg != 'box') {
                    return message.channel.send(`**${shapeArg}** is not a shape you can choose. You need to make a box`)
                }

            // Is their color # a valid color?
                if(parseFloat(colorNumArg) > Object.keys(colors).length || !Number.isInteger(parseFloat(colorNumArg))) { 
                    return message.channel.send(`**${colorNumArg}** is not an available color number. Currently there's only ${Object.keys(colors).length} colors. Check them by doing \`<colors\``)
                }
            
            // Checks if valid width
            if(widthArg < widthAndHeightRange[0] || parseFloat(widthArg) > widthAndHeightRange[1] || parseFloat(widthArg) % widthAndHeightMultiple != 0) {
                return message.channel.send(`**${widthArg}** is not a valid width. It must be between ${widthAndHeightRange[0]}-${widthAndHeightRange[1]} and be a multiple of ${widthAndHeightMultiple}.`)
            }

            // Checks if valid height
            if(heightArg < widthAndHeightRange[0] || parseFloat(heightArg) > widthAndHeightRange[1] || parseFloat(heightArg) % widthAndHeightMultiple != 0) {
                return message.channel.send(`**${heightArg}** is not a valid height. It must be between ${widthAndHeightRange[0]}-${widthAndHeightRange[1]} and be a multiple of ${widthAndHeightMultiple}.`)
            }
            
            let num_ = 0
            let tempName = objectNameArg

            while (allObjects.includes(tempName)) {
                tempName = `${objectNameArg}${num_}`
                num_ = num_ + 1
                if(!allObjects.includes(tempName)) {
                    message.channel.send(`That name already exists. Your house was renamed to **${toTitleCase(tempName)}**`)
                }
            }
            objectNameArg = tempName

            // Organizes coordinates into variables
                // Puts coordinate arguments into array and create placement variables
                let coordinates = commaArgs.slice(6,commaArgs.length).join(', ').slice(1,-1)
                let coordArgs = coordinates.split(', ')
                let hp
                let vp

            // Checks if you have 4+ coordinate arguments
                if(coordArgs.length < 4) {
                    return message.channel.send(`You typed your coordinates (\`${coordinates}\`) incorrectly. Take a look at #guide-to-coordinates to see how to format it correctly.`)
                }

            // Organizes Horizontal Placement
                if (['0','1'].includes(coordArgs[0])) {
                    hp = [parseFloat(coordArgs[0]), 1]
                } else {
                    hp = [parseFloat( coordArgs[0].slice( 0,coordArgs[0].indexOf('/') ) ), parseFloat( coordArgs[0].slice(coordArgs[0].indexOf('/')+1,coordArgs[0].length) )]
                }

            // Organizes Vertical Placement
                if (['0','1'].includes(coordArgs[1])) {
                    vp = [parseFloat(coordArgs[1]), 1]
                } else {
                    vp = [parseFloat( coordArgs[1].slice( 0,coordArgs[1].indexOf('/') ) ), parseFloat( coordArgs[1].slice(coordArgs[1].indexOf('/')+1,coordArgs[1].length) )]
                }
            
            // Organizes Alignments
                let ha = parseFloat( coordArgs[2] )
                let va = parseFloat( coordArgs[3] )

            // Checks if coordinate arguments are valid
                if(!limitations['placements'].includes(hp[1]) || hp[0] > hp[1] || (!hp[0] && hp[0] != 0) || !hp[1]) {
                    return message.channel.send(`**${coordArgs[0]}** is not a valid horizontal placement. Check your \`<limits\` or check #guide-to-coordinates to make sure you typed it right`)
                }
                
                if(!limitations['placements'].includes(vp[1]) || vp[0] > vp[1] || (!vp[0] && vp[0] != 0) || !vp[1]) {
                    return message.channel.send(`**${coordArgs[1]}** is not a valid vertical placement. Check your \`<limits\` or check #guide-to-coordinates to make sure you typed it right`)
                }

                if(!limitations['alignments'].includes(parseFloat(ha))) {
                    return message.channel.send(`**${ha}** is not a valid horizontal alignment. It can only be -1 (left), 0 (center), or 1 (right)`)
                } if(!limitations['alignments'].includes(parseFloat(va))) {
                    return message.channel.send(`**${va}** is not a valid vertical alignment. It can only be -1 (above), 0 (center), or 1 (below)`)
                }
            
            let xPos = ((1000/hp[1]*hp[0])-(widthArg/2)) + (ha * (widthArg/2))
            let yPos = (1000/vp[1]*vp[0])-(heightArg/2) + (va * (heightArg/2))
            let createImage = createPNG(shapeArg, colorNumArg, widthArg, heightArg, hp, vp, ha, va, objectNameArg)
            createImage.then((result) => {
                // Add house to the objects json file
                objects[objectNameArg] = {
                    "information": {
                        "owner":userName,
                        "type":"house",
                        "image":[result],
                        "width":[[xPos,xPos+widthArg]],
                        "height":[[yPos,yPos+heightArg]],
                    }
                }

                // Increase builds
                    players[userName]['builds'] = theirBuilds - 1
					players[userName]['experience'] += randExpPoints + 1

                // Overwrite JSON file
                    fs.writeFileSync('objects.json', JSON.stringify(objects))
                    fs.writeFileSync('players.json', JSON.stringify(players))

                // Confirmation Message
                    message.channel.send(`You built the start for your new house, **${toTitleCase(objectNameArg)}**. It's a **${widthArg} by ${heightArg} ${colors[colorNumArg]['name']} ${toTitleCase(shapeArg)}** at \`[${coordinates}]\`.`)
					message.channel.send(`\`1+${randExpPoints + 1} XP\``)
			})
        }

        // ^ CHURCH
        if (buildType === 'church') {

			// Do they have a valid religion
				if(!players[userName]['religion'] || !religions[players[userName]['religion']]['is_it_valid']) {
					return message.channel.send(`You can't make a church since you don't own a valid religion.`)	
				}
				
            // Is there 7+ arguments?
                if (commaArgs.length < 7) {
                    return message.channel.send(`No no no. You do it like this \`<build church, <shape>>, <color #>, <width>, <height>, <name>, <layer name>,  <coordinates>\``)
                }

			let shapeArg = commaArgs[1].toLowerCase()
			let colorNumArg = commaArgs[2].toLowerCase()
			let widthArg = parseFloat(commaArgs[3])
			let heightArg = parseFloat(commaArgs[4])
			let objectNameArg = commaArgs[5].toLowerCase()
				
            // Is the shape an actual shape?
				if(!shapes.includes( shapeArg )) {
					return message.channel.send(`**${shapeArg}** is not a shape you can choose. There's only \`${listOfShapes}\``)
				}

            // Is their color # a valid color?
                if(parseFloat(colorNumArg) > Object.keys(colors).length || !Number.isInteger(parseFloat(colorNumArg))) { 
                    return message.channel.send(`**${colorNumArg}** is not an available color number. Currently there's only ${Object.keys(colors).length} colors. Check them by doing \`<colors\``)
                }
            
            // Checks if valid width
            if(widthArg < widthAndHeightRange[0] || parseFloat(widthArg) > widthAndHeightRange[1] || parseFloat(widthArg) % widthAndHeightMultiple != 0) {
                return message.channel.send(`**${widthArg}** is not a valid width. It must be between ${widthAndHeightRange[0]}-${widthAndHeightRange[1]} and be a multiple of ${widthAndHeightMultiple}.`)
            }

            // Checks if valid height
            if(heightArg < widthAndHeightRange[0] || parseFloat(heightArg) > widthAndHeightRange[1] || parseFloat(heightArg) % widthAndHeightMultiple != 0) {
                return message.channel.send(`**${heightArg}** is not a valid height. It must be between ${widthAndHeightRange[0]}-${widthAndHeightRange[1]} and be a multiple of ${widthAndHeightMultiple}.`)
            }
            
            let num_ = 0
            let tempName = objectNameArg

            while (allObjects.includes(tempName)) {
                tempName = `${objectNameArg}${num_}`
                num_ = num_ + 1
                if(!allObjects.includes(tempName)) {
                    message.channel.send(`That name already exists. Your house was renamed to **${toTitleCase(tempName)}**`)
                }
            }
            objectNameArg = tempName

            // Organizes coordinates into variables
                // Puts coordinate arguments into array and create placement variables
                let coordinates = commaArgs.slice(6,commaArgs.length).join(', ').slice(1,-1)
                let coordArgs = coordinates.split(', ')
                let hp
                let vp

            // Checks if you have 4+ coordinate arguments
                if(coordArgs.length < 4) {
                    return message.channel.send(`You typed your coordinates (\`${coordinates}\`) incorrectly. Take a look at #guide-to-coordinates to see how to format it correctly.`)
                }

            // Organizes Horizontal Placement
                if (['0','1'].includes(coordArgs[0])) {
                    hp = [parseFloat(coordArgs[0]), 1]
                } else {
                    hp = [parseFloat( coordArgs[0].slice( 0,coordArgs[0].indexOf('/') ) ), parseFloat( coordArgs[0].slice(coordArgs[0].indexOf('/')+1,coordArgs[0].length) )]
                }

            // Organizes Vertical Placement
                if (['0','1'].includes(coordArgs[1])) {
                    vp = [parseFloat(coordArgs[1]), 1]
                } else {
                    vp = [parseFloat( coordArgs[1].slice( 0,coordArgs[1].indexOf('/') ) ), parseFloat( coordArgs[1].slice(coordArgs[1].indexOf('/')+1,coordArgs[1].length) )]
                }
            
            // Organizes Alignments
                let ha = parseFloat( coordArgs[2] )
                let va = parseFloat( coordArgs[3] )

            // Checks if coordinate arguments are valid
                if(!limitations['placements'].includes(hp[1]) || hp[0] > hp[1] || (!hp[0] && hp[0] != 0) || !hp[1]) {
                    return message.channel.send(`**${coordArgs[0]}** is not a valid horizontal placement. Check your \`<limits\` or check #guide-to-coordinates to make sure you typed it right`)
                }
                
                if(!limitations['placements'].includes(vp[1]) || vp[0] > vp[1] || (!vp[0] && vp[0] != 0) || !vp[1]) {
                    return message.channel.send(`**${coordArgs[1]}** is not a valid vertical placement. Check your \`<limits\` or check #guide-to-coordinates to make sure you typed it right`)
                }

                if(!limitations['alignments'].includes(parseFloat(ha))) {
                    return message.channel.send(`**${ha}** is not a valid horizontal alignment. It can only be -1 (left), 0 (center), or 1 (right)`)
                } if(!limitations['alignments'].includes(parseFloat(va))) {
                    return message.channel.send(`**${va}** is not a valid vertical alignment. It can only be -1 (above), 0 (center), or 1 (below)`)
                }
            
            let xPos = ((1000/hp[1]*hp[0])-(widthArg/2)) + (ha * (widthArg/2))
            let yPos = (1000/vp[1]*vp[0])-(heightArg/2) + (va * (heightArg/2))
            let createImage = createPNG(shapeArg, colorNumArg, widthArg, heightArg, hp, vp, ha, va, objectNameArg)
            createImage.then((result) => {
                // Add house to the objects json file
                objects[objectNameArg] = {
                    "information": {
                        "owner": userName,
                        "type": "church",
						"religion": players[userName]['religion'],
                        "image": [result],
                        "width": [[xPos,xPos+widthArg]],
                        "height": [[yPos,yPos+heightArg]],
                    }
                }
                
                // Increase builds
                    players[userName]['builds'] = theirBuilds - 1
					players[userName]['experience'] += randExpPoints + 1

                // Overwrite JSON file
                    fs.writeFileSync('objects.json', JSON.stringify(objects))
                    fs.writeFileSync('players.json', JSON.stringify(players))

                
                // Confirmation Message
                    message.channel.send(`You built the start for your new church, **${toTitleCase(objectNameArg)}**. It's a **${widthArg} by ${heightArg} ${colors[colorNumArg]['name']} ${toTitleCase(shapeArg)}** at \`[${coordinates}]\`.`)
					message.channel.send(`\`+${randExpPoints + 1} XP\``)
			})
        }
	},
};