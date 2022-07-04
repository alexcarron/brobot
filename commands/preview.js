// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
const fs = require('fs');
var jimp = require('jimp');

module.exports = {
    name: 'preview',
    description: 'Previews the building, editing, or placing of an object so you don\'t accidentally do something you don\'t want',
    guildOnly: true,
    args: true,
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: '<command-name>, <command-arguments>',
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var objects = JSON.parse(fs.readFileSync('objects.json'))
        var players = JSON.parse(fs.readFileSync('players.json'))
        var locations = JSON.parse(fs.readFileSync('locations.json'))
        var limitations = JSON.parse(fs.readFileSync('limitations.json'))
        var shapes = limitations['shapes']
        var userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        var colors = limitations['colors']
        var builds = ['character', 'object', 'house']
        var allObjects = Object.keys(objects)
        var widthAndHeightRange = limitations['width/height']['range']
        var widthAndHeightMultiple = limitations['width/height']['multiple']
        var insideStatus = players[userName]['inside'] != "" 
        var playerLocation = players[userName]['location']
        var listOfShapes = `${shapes.slice(0,shapes.length-1).join(`\`, \``)}\`, and \`${shapes[shapes.length-1]}`
        var applianceList = ['workbench','ladder','smelter']
		let religions = JSON.parse(fs.readFileSync('religions.json'))
		let listOfBuilds = `${builds.slice(0,builds.length-1).join(`\`, \``)}\`, or \`${builds[builds.length-1]}`
		let thePlayer = players[userName]
		let theirBuilds = thePlayer['builds']
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}


        function addShapeToImage(shape, colorNum, width, height, horizontalPlacement, verticalPlacement, horizontalAlignment, verticalAlignment, filename, oldPNG)  {
            console.log(`${shape}, ${colorNum}, ${width}, ${height}, ${horizontalPlacement}, ${verticalPlacement}, ${horizontalAlignment}, ${verticalAlignment}, ${filename}, ${oldPNG}, `)
            let rgba = jimp.intToRGBA(Number(`0x${colors[colorNum]['code']}FF`))
    
            let imageURL
    
            if (shape === 'circle') {
                imageURL = 'https://cdn.discordapp.com/attachments/850491267095986237/851887179365089300/Red_Circle.png'
            } else if (shape === 'box') {
                imageURL = 'https://cdn.discordapp.com/attachments/850491267095986237/851884156199370852/Orange_Square.png'
            } else if (shape === 'triangle') {
                imageURL = 'https://cdn.discordapp.com/attachments/850491267095986237/851884437398355998/Yellow_Triangle.png'
            }
            
            return jimp.read(oldPNG)
                .then(
                    (image) => {
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
                                    let x = (1000/horizontalPlacement[1]*horizontalPlacement[0])-(width/2)
                                    let y = (1000/verticalPlacement[1]*verticalPlacement[0])-(height/2)
                                    x = x + horizontalAlignment * (width/2)
                                    y = y + verticalAlignment * (height/2)
                                    image.composite(shape, x, y)

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

        function addImageToImage(horizontalPlacement, verticalPlacement, horizontalAlignment, verticalAlignment, width, height, addedImage, filename, oldPNG)  { 
            console.log({horizontalPlacement, verticalPlacement, horizontalAlignment, verticalAlignment, width, height, addedImage, filename, oldPNG})   
            return jimp.read(oldPNG)
                .then(
                    (image) => {
                        return jimp.read(addedImage)
                            .then((addedImage) => {
                                let actualWidth = Math.abs(width[1]-width[0])
                                let actualHeight = Math.abs(height[1]-height[0])
                                let x = ((1920/horizontalPlacement[1])*horizontalPlacement[0])-(actualWidth/2)-width[0]
                                let y = ((1080/verticalPlacement[1])*verticalPlacement[0])-(actualHeight/2)-height[0]
                                x = x + horizontalAlignment * (actualWidth/2)
                                y = y + verticalAlignment * (actualHeight/2)
                                console.log({x, y, actualWidth, actualHeight,})
                                console.log(((1920/horizontalPlacement[1])*horizontalPlacement[0])-(actualWidth/2)-width[0])
                                console.log(((1080/verticalPlacement[1])*verticalPlacement[0])-(actualHeight/2)-height[0])
                                image.composite(addedImage, x, y)

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
                        let x = (1000/horizontalPlacement[1]*horizontalPlacement[0])-(width/2)
                        let y = (1000/verticalPlacement[1]*verticalPlacement[0])-(height/2)
                        x = x + horizontalAlignment * (width/2)
                        y = y + verticalAlignment * (height/2)
                        canvas.composite(shape, x, y)

                        canvas.write(`${filename}.png`)
                        var theURL = message.channel.send('',{
                            files:[`${filename}.png`]
                        }).then(msg => {
                            return msg.attachments.array()[0].url
                        })
                        return theURL
                    }
                )
        }

        function addAnImageToImage(horizontalPlacement, verticalPlacement, horizontalAlignment, verticalAlignment, width, height, addedImage, filename, oldPNG)  {    
            return jimp.read(oldPNG)
                .then(
                    (image) => {
                        return jimp.read(addedImage)
                            .then((addedImage) => {
                                console.log({horizontalPlacement, verticalPlacement, horizontalAlignment, verticalAlignment, width, height, addedImage, filename, oldPNG})
                                let x = (1920/horizontalPlacement[1]*horizontalPlacement[0])-(Math.abs(width[1]-width[0])/2)-width[0]
                                let y = (1080/verticalPlacement[1]*verticalPlacement[0])-(Math.abs(height[1]-height[0])/2)-height[0]
                                x = x + horizontalAlignment * (Math.abs(width[1]-width[0])/2)
                                y = y + verticalAlignment * (Math.abs(height[1]-height[0])/2)
                                console.log({x, y})
                                image.composite(addedImage, x, y)


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

        function createBackground(shape, colorNum, width, height, horizontalPlacement, verticalPlacement, horizontalAlignment, verticalAlignment, filename)  {

            let canvas = new jimp(1920, 1080, 0xFFFFFF00);
            let rgba = jimp.intToRGBA(Number(`0x${colors[colorNum]['code']}FF`))
    
            let imageURL
            
            imageURL = 'https://cdn.discordapp.com/attachments/850491267095986237/851884156199370852/Orange_Square.png'
            
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
                        let x = (1920/horizontalPlacement[1]*horizontalPlacement[0])-(width/2)
                        let y = (1080/verticalPlacement[1]*verticalPlacement[0])-(height/2)
                        x = x + horizontalAlignment * (width/2)
                        y = y + verticalAlignment * (height/2)
                        canvas.composite(shape, x, y)

                        canvas.write(`${filename}.png`)
                        var theURL = message.channel.send('',{
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

        // Makes Arguments Separated by Commas
            var commaArgs = args.join(' ').split(', ') 

        if (!['editobject', 'build', 'place'].includes(commaArgs[0].toLowerCase())) {
            message.channel.send(`**${commaArgs[0].toLowerCase()}** is not something you can preview.`)
        }

        // ^ <build
        if (commaArgs[0] === 'build') {
            commaArgs.shift()
			
			let buildType = commaArgs[0].toLowerCase()
			let build_randExpPoints = 1 + Math.round( Math.random() * 2 )
        
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
					if(allObjects.includes(userName)) {
						return message.channel.send(`You already built your character.`)
					}
				
				// Do they have 3+ arguments?
					if (!shapeArg || !colorNumArg) {
						return message.channel.send(`No no no. You do it like this \`<build character, <shape>, <color #>, <width>, <height>, <body name>, <coordinates>\``)
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
						let coordinates = commaArgs.slice(5,commaArgs.length).join(', ').slice(1,-1)
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

					// Confirmation Message
						message.channel.send(`You have previewed the body for your character. It's a **${colors[colorNumArg]['name']} ${toTitleCase(shapeArg)}**.`)
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
					players[userName]['experience'] += build_randExpPoints
					
					// Confirmation Message
						message.channel.send(`You have previewed the first shape for your new object, **${toTitleCase(objectNameArg)}**. It's a **${widthArg} by ${heightArg} ${colors[colorNumArg]['name']} ${toTitleCase(shapeArg)}** at \`[${coordinates}]\`.`)
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
						players[userName]['experience'] += build_randExpPoints + 1

					
					// Confirmation Message
						message.channel.send(`You previewed the box for your new house, **${toTitleCase(objectNameArg)}**. It's a **${widthArg} by ${heightArg} ${colors[colorNumArg]['name']} ${toTitleCase(shapeArg)}** at \`[${coordinates}]\`.`)
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
                
                    // Confirmation Message
                        message.channel.send(`Here's a preview for the box for your new church, **${objectNameArg}**. It's a **${widthArg} by ${heightArg} ${colors[colorNumArg]['name']} ${shapeArg}** at \`[${coordinates}]\`.`)
                })
            }
        }

        // ^ <editobject
        if (commaArgs[0] === 'editobject') {
            commaArgs.shift()

			let thing_adding_to_obj = commaArgs[0].toLowerCase();

            // Checks if object or shape
				if (!['object','shape'].includes(thing_adding_to_obj)) {
					return message.channel.send(`Your first argument needs to be \`object\` or \`shape\``)
				}



			// ^ OBJECT
			if (thing_adding_to_obj === 'object') {
				// Makes sure you have at least 4 arguments
				if (commaArgs.length < 4) {
					return message.channel.send(`No no no. You do it like this \`<editobject object, [your object], [public object or your object], [coords]\``)
				}
				
				// Make life easier for myself
					let yourObjectNameArg = commaArgs[1].toLowerCase();
					let addedObjectNameArg = commaArgs[2].toLowerCase();
				
				// Checks if you own the object you are editing and if it exists
				if (!Object.keys(objects).includes(yourObjectNameArg) || objects[yourObjectNameArg]['information']['owner'] != userName) { 
					return message.channel.send(`${yourObjectNameArg} is not an object that you own and/or exists. \`<editobject ${commaArgs[0]}, ???\``)
				} 

				// Checks if object you are adding exists and is public or belongs to you
				if (!Object.keys(objects).includes(addedObjectNameArg) || (objects[addedObjectNameArg]['information']['owner'] != userName && objects[addedObjectNameArg]['information']['owner'] != 0)) {
					return message.channel.send(`The object you add must exist and be public or belong to you.`)
				}

				// Organizes coordinates into variables
					// Puts coordinate arguments into array and create placement variables
						let coordinates = commaArgs.slice(3,commaArgs.length).join(', ').slice(1,-1)
						let coordArgs = coordinates.split(', ')
						let hp
						let vp

					// Checks if you have 4 coordinate arguments
						if(coordArgs.length != 4) {
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
						return message.channel.send(`**${coordArgs[2]}** is not a valid horizontal alignment. It can only be -1 (left), 0 (center), or 1 (right)`)
					} if(!limitations['alignments'].includes(parseFloat(va))) {
						return message.channel.send(`**${coordArgs[3]}** is not a valid vertical alignment. It can only be -1 (above), 0 (center), or 1 (below)`)
					}
				
					let createImage = addImageToImage(hp, vp, ha, va, objects[addedObjectNameArg]['information']['width'][0], objects[addedObjectNameArg]['information']['height'][0], objects[addedObjectNameArg]['information']['image'][0], yourObjectNameArg, objects[yourObjectNameArg]['information']['image'][0])
					createImage.then((result) => {
						objects[yourObjectNameArg]['information']['image'].unshift(result)

						let newWidth = [];
						let newHeight = [];

						if (objects[addedObjectNameArg]['information']['width'][0][0] < objects[yourObjectNameArg]['information']['width'][0][0]) {
							newWidth[0]=objects[addedObjectNameArg]['information']['width'][0][0] 
						} else {
							newWidth[0]=objects[yourObjectNameArg]['information']['width'][0][0]
						}
						if (objects[addedObjectNameArg]['information']['width'][0][1] > objects[yourObjectNameArg]['information']['width'][0][1]) {
							newWidth[1]=objects[addedObjectNameArg]['information']['width'][0][1]
						} else {
							newWidth[1]=objects[yourObjectNameArg]['information']['width'][0][1]
						}
						if (objects[addedObjectNameArg]['information']['height'][0][0] < objects[yourObjectNameArg]['information']['height'][0][0]) {
							newHeight[0]=objects[addedObjectNameArg]['information']['height'][0][0]
						} else {
							newHeight[0]=objects[yourObjectNameArg]['information']['height'][0][0]
						}
						if (objects[addedObjectNameArg]['information']['height'][0][1] > objects[yourObjectNameArg]['information']['height'][0][1]) {
							newHeight[1]=objects[addedObjectNameArg]['information']['height'][0][1]
						} else {
							newHeight[1]=objects[yourObjectNameArg]['information']['height'][0][1]
						}

						console.log({newWidth, newHeight})

						objects[yourObjectNameArg]['information']['width'].unshift(newWidth)
						objects[yourObjectNameArg]['information']['height'].unshift(newHeight)
						
						message.channel.send(`You previewed adding **${toTitleCase(addedObjectNameArg)}** to your object, **${toTitleCase(yourObjectNameArg)}**, at the coordinates, **[${coordinates}]**.`)
						
					})
			}

			// ^ SHAPE
			if (commaArgs[0] === 'shape') {
			
				// Is there 6+ arguments?
				if (commaArgs.length < 8) {
					return message.channel.send(`No no no. You do it like this \`<editobject shape, <your object's name>, <shape>, <color #>, <width>, <height>, <name>, <coordinates>\``)
				}

				// Making life easier for future me
				let yourObjectNameArg = commaArgs[1].toLowerCase()
				let shapeArg = commaArgs[2].toLowerCase()
				let colorNumArg = commaArgs[3].toLowerCase()
				let widthArg = commaArgs[4].toLowerCase()
				let heightArg = commaArgs[5].toLowerCase()

				// Checks if you own the object you are editing and if it exists
				if (!Object.keys(objects).includes(yourObjectNameArg) || objects[yourObjectNameArg]['information']['owner'] != userName) { 
					return message.channel.send(`${yourObjectNameArg} is not an object that you own and/or exists.`)
				} 

				// is the shape  an actual shape?
				if(!shapes.includes( shapeArg )) {
					return message.channel.send(`**${shapeArg}** is not a shape you can choose. There's only \`${shapes.slice(0,shapes.length-1).join(`\`, \``)}\`, and \`${shapes[shapes.length-1]}\``)
				}

				// Is their color # a valid color?
				if(parseFloat(colorNumArg) > Object.keys(colors).length || !Number.isInteger(parseFloat(colorNumArg))) { // is "<build character <body> ___" the right thing?
					return message.channel.send(`**${colorNumArg}** is not an available color number. Currently there's only ${Object.keys(colors).length} colors. Check them by doing \`<colors\``)
				}
		
			// Checks if valid width
			if(parseFloat(widthArg) < 50 || parseFloat(widthArg) > 1000 || parseFloat(widthArg) % 50 != 0) {
				return message.channel.send(`**${widthArg}** is not a valid width. It must be between 50-1000 and be a multiple of 50.`)
			}

			// Checks if valid height
			if(parseFloat(heightArg) < 50 || parseFloat(heightArg) > 1000 || parseFloat(heightArg) % 50 != 0) {
				return message.channel.send(`**${heightArg}** is not a valid height. It must be between 50-1000 and be a multiple of 50.`)
			}

			// Organizes coordinates into variables
				// Puts coordinate arguments into array and create placement variables
					let coordinates = commaArgs.slice(6,commaArgs.length).join(', ').slice(1,-1)
					let coordArgs = coordinates.split(', ')
					let hp
					let vp

				// Checks if you have 4 coordinate arguments
					if(coordArgs.length != 4) {
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
						return message.channel.send(`**${coordArgs[2]}** is not a valid horizontal alignment. It can only be -1 (left), 0 (center), or 1 (right)`)
					} if(!limitations['alignments'].includes(parseFloat(va))) {
						return message.channel.send(`**${coordArgs[3]}** is not a valid vertical alignment. It can only be -1 (above), 0 (center), or 1 (below)`)
					}
				
				let createImage = addShapeToImage(shapeArg, colorNumArg, parseFloat(widthArg), parseFloat(heightArg), hp, vp, ha, va, yourObjectNameArg, objects[yourObjectNameArg]['information']['image'][0])
				let editImage = createImage
                editImage.then((result) => {
                
                    // Confirmation Message
                        message.channel.send(`Here's a preview of you adding a **${widthArg} by ${heightArg} ${colors[colorNumArg]['name']} ${shapeArg}** to your object, **${yourObjectNameArg}**. It's  at \`[${coordinates}]\`.`)
                })

            
            }
        }

        // ^ <place
        if (commaArgs[0] === 'place') {
            commaArgs.shift()

            let theObject = commaArgs[0]
    
            // Checks if amount of arguments are 2+
        if (commaArgs.length < 2) {
            return message.channel.send(`No!!! It's like this: \`<place <your object>, <coordinates>, <wall-color-num> (Optional)\``)
        }

        // Is the first argument correct?
            if (!Object.keys(objects).includes(theObject)) {
                return message.channel.send(`**${theObject}** is not an object that exist`)
            }
        
        // Check if it's a character
            if (objects[theObject]['information']['type'] === 'character') {
                return message.channel.send(`You can't place characters.`)
            }
        
        // Check if they own the object
        if(!applianceList.includes(theObject)) {
            if (objects[theObject]['information']['owner'] != userName) {
                return message.channel.send(`You don't own that object`)
            }
        } else {
            if (!players[userName]['inventory'][theObject] || players[userName]['inventory'][theObject]['amount'] <= 0) {
                return message.channel.send(`You don't have a **${theObject}**`)
            }
        }

        // * If inside then no houses or shops or plants
            if (insideStatus) {
                if ( ['mineral','plant','house','shop'].includes(objects[theObject]['information']['type']) ) {
                    return message.channel.send(`You can't place buildings or plants inside other buildings.`)
                }
            }

        // * Is their current location claimed by them
            if (insideStatus) { // ? Inside
                if(objects[players[userName]['inside']]['information']['owner'] != userName) {
                    return message.channel.send(`You don't own the building you're in.`)
                }
            } else { // ? Outside
                if(locations[playerLocation.join(', ')]['owner'] != userName && message.author.id != '276119804182659072') {
                    return message.channel.send(`You don't own the current location you're in.`)
                }
            }

        // * Has the object been placed before here
        if (objects[theObject]['information']['type'] != 'mineral') {
            if (insideStatus) { // ? Inside 
                let stopCommand = false
                if ( locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'] ) {
                    Object.entries( locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'] ).forEach( layer => {
                        if (layer[0] === theObject) {
                            stopCommand = true
                        }
                    })
                }
                if (stopCommand) {
                    return message.channel.send(`You already placed that here`)
                }
            } else { // ? Outside 
                let stopCommand = false
                if ( locations[playerLocation.join(', ')]['layers'] ) {
                    Object.entries( locations[playerLocation.join(', ')]['layers'] ).forEach( layer => {
                        if (layer[0] === theObject) {
                            stopCommand = true
                        }
                    })
                }
                if (stopCommand) {
                    return message.channel.send(`You already placed that here`)
                }
            }
        }
		
		if (['house','shop','church'].includes(objects[theObject]['information']['type'])) {
			if(commaArgs.length < 3) {
				return message.channel.send(`You need to specify a wall color if you're placing down a building.`)
			}
			
			let wall_color_arg = commaArgs[2];
			
			if(
				parseFloat(wall_color_arg) > Object.keys(colors).length || 
				!Number.isInteger(parseFloat(wall_color_arg))
			) { 
				return message.channel.send(`**${wall_color_arg}** is not an available color number for your wall. Currently there's only ${Object.keys(colors).length} colors. Check them by doing \`<colors\``)
			} 
		}

            // Organizes coordinates into variables
                // Puts coordinate arguments into array and create placement variables
                    let coordinates = commaArgs.slice(1).join(', ').slice(1,-1)
                    let coordArgs = coordinates.split(', ')
                    let hp
                    let vp

            // Checks if you have 4 coordinate arguments
                if(coordArgs.length != 4) {
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
        if(message.author.id != '276119804182659072') {
            if(!limitations['placements'].includes(hp[1]) || hp[0] > hp[1] || (!hp[0] && hp[0] != 0) || !hp[1]) {
                return message.channel.send(`**${coordArgs[0]}** is not a valid horizontal placement. Check your \`<limits\` or check #guide-to-coordinates to make sure you typed it right`)
            }
            
            if(!limitations['placements'].includes(vp[1]) || vp[0] > vp[1] || (!vp[0] && vp[0] != 0) || !vp[1]) {
                return message.channel.send(`**${coordArgs[1]}** is not a valid vertical placement. Check your \`<limits\` or check #guide-to-coordinates to make sure you typed it right`)
            }

            if(!limitations['alignments'].includes(parseFloat(ha))) {
                return message.channel.send(`**${coordArgs[2]}** is not a valid horizontal alignment. It can only be -1 (left), 0 (center), or 1 (right)`)
            } if(!limitations['alignments'].includes(parseFloat(va))) {
                return message.channel.send(`**${coordArgs[3]}** is not a valid vertical alignment. It can only be -1 (above), 0 (center), or 1 (below)`)
            }
        }
                    
            // Calculate width and height
            let objectWidth = objects[theObject]['information']['width'][0][1]-objects[theObject]['information']['width'][0][0]
            let objectHeight = objects[theObject]['information']['height'][0][1]-objects[theObject]['information']['height'][0][0]
            let objectx = ((1920*(hp[0]/hp[1]))+(objectWidth*(ha/2)))
            let objecty = ((1080*(vp[0]/vp[1]))+(objectHeight*(va/2)))

        // * On a plant or mineral?
        let stopCommand_ = false
            if(!insideStatus) { // ? Outside
                if (locations[playerLocation.join(', ')]['layers']) {
                    Object.entries(locations[playerLocation.join(', ')]['layers']).forEach( (entry) => {
                        if (entry[1]['information'] && ['mineral','plant'].includes(entry[1]['information']['type'])) {
                            let plantWidth = entry[1]['information']['width'][0][1]-entry[1]['information']['width'][0][0]
                            let plantHeight = entry[1]['information']['height'][0][1]-entry[1]['information']['height'][0][0]
                            let planthp = entry[1]['space']['horizontal placement']
                            let plantvp = entry[1]['space']['vertical placement']
                            let plantha = entry[1]['space']['horizontal alignment']
                            let plantva = entry[1]['space']['vertical alignment']
                            let plantx = ((1920*(planthp[0]/planthp[1]))+(objectWidth*(plantha/2)))
                            let planty = ((1080*(plantvp[0]/plantvp[1]))+(objectHeight*(plantva/2)))
                            if ((Math.abs(objectx - plantx) * 2 < (objectWidth + plantWidth)) && (Math.abs(objecty - planty) * 2 < (objectHeight + plantHeight))) {
                                if (entry[1]['information']['type'] === 'plant') {
                                    message.channel.send(`Your object was placed on top of a plant/mineral so that plant won't be able to be harvested from anymore. <undo if you don't want that.`)
                                    if (['mineral','plant'].includes(objects[theObject]['information']['type'])) {
                                        locations[playerLocation.join(', ')]['layers'][entry[0]]['space']['covered'][0] = true
                                    } else {
                                        locations[playerLocation.join(', ')]['layers'][entry[0]]['space']['covered'].unshift(true)
                                    }
                                } else {
                                    stopCommand_ = true
                                }
                            } else {
                                if (['mineral','plant'].includes(objects[theObject]['information']['type'])) {
                                    locations[playerLocation.join(', ')]['layers'][entry[0]]['space']['covered'][0] = false
                                } else {
                                    locations[playerLocation.join(', ')]['layers'][entry[0]]['space']['covered'].unshift(false)
                                }
                            }
                        }
                    })
                }
                if (stopCommand_) {
                    return message.channel.send(`That would've been placed over a mineral. You can't do that >:(`)
                }
            }
                    

            // & Readable Variables
                let theObjectWidth = objects[theObject]['information']['width'][0]
                let theObjectHeight = objects[theObject]['information']['height'][0]
                let theObjectImage = objects[theObject]['information']['image'][0]
                let theFileName
                    if (insideStatus) { // ? Inside
                        theFileName = `${players[userName]['inside']} Inside`
                    } else { // ? Outside
                        theFileName = playerLocation.join(', ')
                    }
                let theOldImage
                    if (insideStatus) { // ? Inside
                        theOldImage = locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['information']['image'][0]
                    } else { // ? Outside
                        theOldImage = locations[playerLocation.join(', ')]['image'][0]
                    }
            // & Readable Variables
            
            // ^ MAKING THE IMAGE
            let createImage = addImageToImage(hp, vp, ha, va, theObjectWidth, theObjectHeight, theObjectImage, theFileName, theOldImage)
            createImage.then((result) => {
                return message.channel.send(`Here's your preview`)
			});
        }
	},
};