// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');
let jimp = require('jimp');


module.exports = {
    name: 'place',
    description: 'Places an object you made on your current location (or inside the building your in if your inside). You must own the location. The location is 1920 by 1080 pixels. You need to specify a wall color if you\'re placing a building',
    guildOnly: true,
    args: true,
    aliases: ['p'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: '<object-name>, <wall-color-num> (Optional), <coordinates>',
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        let objects = JSON.parse(fs.readFileSync('objects.json'))
        let players = JSON.parse(fs.readFileSync('players.json'))
        let locations = JSON.parse(fs.readFileSync('locations.json'))
        let limitations = JSON.parse(fs.readFileSync('limitations.json'))
        let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        let colors = limitations['colors']
        let insideStatus = players[userName]['inside'] != "" 
        let commaArgs = args.join(' ').split(', ') 
        let theObject = commaArgs[0].toLowerCase()
        let playerLocation = players[userName]['location']
		let commaArgsCoordsSliceNum = 1;
		let wall_color_arg
        const APPLIANCE_LIST = ['workbench', 'ladder', 'smelter', 'crate'];
		const INVALID_INSIDE_TYPE_LIST = ['mineral','plant','house','shop'];
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

        // Processing
        message.channel.send(`Processing...`)                

        function addImageToImage(horizontalPlacement, verticalPlacement, horizontalAlignment, verticalAlignment, width, height, addedImage, filename, oldPNG)  { 
            console.log({horizontalPlacement, verticalPlacement, horizontalAlignment, verticalAlignment, width, height, addedImage, filename, oldPNG})   
            return jimp.read(oldPNG)
                .then(
                    (image) => {
                        return jimp.read(addedImage)
                            .then((addedImage) => {
                                let x = (1920/horizontalPlacement[1]*horizontalPlacement[0])-(Math.abs(width[1]-width[0])/2)-width[0]
                                let y = (1080/verticalPlacement[1]*verticalPlacement[0])-(Math.abs(height[1]-height[0])/2)-height[0]
                                x = x + horizontalAlignment * (Math.abs(width[1]-width[0])/2)
                                y = y + verticalAlignment * (Math.abs(height[1]-height[0])/2)
                                image.composite(addedImage, x, y)


                                    image.write(`${filename}.png`)
                                    let theURL = message.channel.send('',{
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
                        let theURL = message.channel.send('',{
                            files:[`${filename}.png`]
                        }).then(msg => {
                            return msg.attachments.array()[0].url
                        })
                        return theURL
                    }
                )
        }

		if (commaArgs.length < 2) {
			return message.channel.send(`No!!! It's like this: \`<place <your object>, <coordinates>, <wall-color-num> (Optional)\``)
		}

        // Does that object exist?
            if (!Object.keys(objects).includes(theObject)) {
                return message.channel.send(`**${theObject}** is not an object that exist`)
            }
        
        // Check if it's a character
            if (objects[theObject]['information']['type'] === 'character') {
                return message.channel.send(`You can't place characters.`)
            }
        
        // Check if they own the object
			if(!APPLIANCE_LIST.includes(theObject)) 
			{
				if (objects[theObject]['information']['owner'] != userName) {
					return message.channel.send(`You don't own that object`)
				}
			} 
			else {
				if (
					!players[userName]['inventory'][theObject] || 
					players[userName]['inventory'][theObject]['amount'] <= 0
				) {
					return message.channel.send(`You don't have a **${theObject}**`)
				}
			}

        // If inside then no houses or shops or plants
            if (insideStatus) {
                if ( INVALID_INSIDE_TYPE_LIST.includes(objects[theObject]['information']['type']) ) {
                    return message.channel.send(`You can't place buildings or plants inside other buildings.`)
                }
            }

        // Do they own the location?
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
			
			wall_color_arg = commaArgs[1];
			commaArgsCoordsSliceNum = 2;
			
			if (
				parseFloat(wall_color_arg) > Object.keys(colors).length || 
				!Number.isInteger(parseFloat(wall_color_arg))
			) { 
				return message.channel.send(`**${wall_color_arg}** is not an available color number for your wall. Currently there's only ${Object.keys(colors).length} colors. Check them by doing \`<colors\``)
			} 
		}

            // Organizes coordinates into variables
                // Puts coordinate arguments into array and create placement variables
                    let coordinates = commaArgs.slice(commaArgsCoordsSliceNum).join(', ').slice(1,-1)
                    let coordArgs = coordinates.split(', ')
                    let hp
                    let vp

            // Checks if you have 4 coordinate arguments
                if(coordArgs.length != 4) {
                    return message.channel.send(`You typed your coordinates (\`${coordinates}\`) incorrectly. Take a look at #guide-to-coordinates to see how to format it correctly.`)
                } //

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
                    
		// Calculate width and height of object
			let horizontal_coord = Math.round(1920 * (hp[0] / hp[1]))
			let vertical_coord = Math.round(1080 * (vp[0] / vp[1]))
            let objectWidth = objects[theObject]['information']['width'][0][1]-objects[theObject]['information']['width'][0][0]
            let objectMinWidth = objects[theObject]['information']['width'][0][0]
            let objectHeight = objects[theObject]['information']['height'][0][1]-objects[theObject]['information']['height'][0][0]
            let objectMinHeight = objects[theObject]['information']['height'][0][0]
            let objectx = ((1920*(hp[0]/hp[1]))+(objectWidth*(ha/2)))
            let objecty = ((1080*(vp[0]/vp[1]))+(objectHeight*(va/2)))
			let object_x_coord = (horizontal_coord) - (objectWidth / 2) - objectMinWidth
			let object_y_coord = (vertical_coord) - (objectHeight / 2) - objectMinHeight
			object_x_coord += ha * (objectWidth / 2)
			object_y_coord += va * (objectHeight / 2)
			
							

        // * On a plant or mineral?
        let stopCommand_ = false
            if(!insideStatus) // ? Outside
			{ 
                if (locations[playerLocation.join(', ')]['layers']) 
				{
                    Object.entries(locations[playerLocation.join(', ')]['layers']).forEach( (layer) => {
						let layer_name = layer[0];
						let layer_properties = layer[1];
						
                        if (
							layer_properties['information'] && ['mineral','plant'].includes(layer_properties['information']['type'])
						) 
						{
                            let plantWidth = 
								layer_properties['information']['width'][0][1] - layer_properties['information']['width'][0][0]
                            let plantHeight = 
								layer_properties['information']['height'][0][1]-layer_properties['information']['height'][0][0]
                            let plantx = layer_properties['space']['coords'][0]
                            let planty = layer_properties['space']['coords'][1]
							
							console.log(layer_properties['information'])
							console.log(layer_properties['information']['width '])
							console.log({plantWidth, plantHeight, plantx, planty})
							
                            if (
								(Math.abs(objectx - plantx) * 2 < (objectWidth + plantWidth)) && 
								(Math.abs(objecty - planty) * 2 < (objectHeight + plantHeight))
							) {
                                if (layer_properties['information']['type'] === 'plant') 
								{
                                    message.channel.send(`Your object was placed on top of a plant/mineral so that plant won't be able to be harvested from anymore. <undo if you don't want that.`)
									
                                    if (['mineral','plant'].includes(objects[theObject]['information']['type'])) {
                                        locations[playerLocation.join(', ')]['layers'][layer_name]['space']['covered'][0] = true
                                    } 
									else {
                                        locations[playerLocation.join(', ')]['layers'][layer_name]['space']['covered'].unshift(true)
                                    }
                                } 
								else {
                                    stopCommand_ = true
                                }
                            } 
							else {
                                if (['mineral','plant'].includes(objects[theObject]['information']['type'])) {
                                    locations[playerLocation.join(', ')]['layers'][layer_name]['space']['covered'][0] = false
                                } 
								else {
                                    locations[playerLocation.join(', ')]['layers'][layer_name]['space']['covered'].unshift(false)
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
                let layerName = theObject
                // Add object to location layers
                if (insideStatus) { // ? Inside
                    if (locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers']) {
                            locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'][theObject] = objects[theObject]
							
							locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'][theObject]['information']['image'] = [locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'][theObject]['information']['image'][0]]
							
							locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'][theObject]['information']['width'] = [locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'][theObject]['information']['width'][0]]
							
							locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'][theObject]['information']['height'] = [locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'][theObject]['information']['height'][0]]
                    } else {
                        locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'] = {
                        }
                        locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'][theObject] = objects[theObject]
						
						locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'][theObject]['information']['image'] = [locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'][theObject]['information']['image'][0]]
						
						locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'][theObject]['information']['width'] = [locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'][theObject]['information']['width'][0]]
						
						locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'][theObject]['information']['height'] = [locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'][theObject]['information']['height'][0]]
                    }
					
					if (objects[theObject]['information']['type'] === 'storage device') {
						locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'][theObject]['information']['space'] = [0, objects[theObject]['information']['space']];
					}
                } else { // ? Outside
                    if (locations[playerLocation.join(', ')]['layers']) {
                        if (objects[theObject]['information']['type'] === 'mineral') {
                            
                            // Make sure name isn't used
                            let num_ = 0
                            let tempName = theObject

                            while (Object.keys(locations[playerLocation.join(', ')]['layers']).includes(tempName)) {
                            tempName = `${theObject}${num_}`
                            num_ = num_ + 1
                            }

                            layerName = tempName
                            locations[playerLocation.join(', ')]['layers'][layerName] = objects[theObject]
                        } else {
                            locations[playerLocation.join(', ')]['layers'][theObject] = objects[theObject]
							
							locations[playerLocation.join(', ')]['layers'][theObject]['information']['image'] = [locations[playerLocation.join(', ')]['layers'][theObject]['information']['image'][0]]
							
							locations[playerLocation.join(', ')]['layers'][theObject]['information']['width'] = [locations[playerLocation.join(', ')]['layers'][theObject]['information']['width'][0]]
							
							locations[playerLocation.join(', ')]['layers'][theObject]['information']['height'] = [locations[playerLocation.join(', ')]['layers'][theObject]['information']['height'][0]]
                        }
                    } else {
                        locations[playerLocation.join(', ')]['layers'] = {
                        }
                        if (objects[theObject]['information']['type'] === 'mineral') {

                            // Make sure name isn't used
                            let num_ = 0
                            let tempName = theObject

                            while (Object.keys(locations[playerLocation.join(', ')]['layers']).includes(tempName)) {
                            tempName = `${theObject}${num_}`
                            num_ = num_ + 1
                            }

                            layerName = tempName
                            locations[playerLocation.join(', ')]['layers'][layerName] = objects[theObject]
                        } else {
                            locations[playerLocation.join(', ')]['layers'][theObject] = objects[theObject]
							
							locations[playerLocation.join(', ')]['layers'][theObject]['information']['image'] = [locations[playerLocation.join(', ')]['layers'][theObject]['information']['image'][0]]
							
							locations[playerLocation.join(', ')]['layers'][theObject]['information']['width'] = [locations[playerLocation.join(', ')]['layers'][theObject]['information']['width'][0]]
							
							locations[playerLocation.join(', ')]['layers'][theObject]['information']['height'] = [locations[playerLocation.join(', ')]['layers'][theObject]['information']['height'][0]]
                        }
                    }
					
					if (objects[theObject]['information']['type'] === 'storage device') {
						locations[playerLocation.join(', ')]['layers'][theObject]['information']['space'] = 
							[0, objects[theObject]['information']['space']];
					}
                }  
                
                // Give it some space
                if(insideStatus) { // ? Inside
                    locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['layers'][theObject]['space'] = {
                        'width':[Math.round((1920*(hp[0]/hp[1]))+(objectWidth*((ha-1)/2))), Math.round(((1920*(hp[0]/hp[1]))+(objectWidth*((ha-1)/2)))+objectWidth)],
                        'height':[Math.round((1080*(vp[0]/vp[1]))+(objectHeight*((va-1)/2))), Math.round(((1080*(vp[0]/vp[1]))+(objectHeight*((va-1)/2)))+objectHeight)],
                        'horizontal placement':hp,
                        'vertical placement':vp,
                        'horizontal alignment':ha,
                        'vertical alignment':va
                    }
                } else { // ? Outside
					if (['plant', 'mineral'].includes(objects[theObject]['information']['type'])) {
						locations[playerLocation.join(', ')]['layers'][theObject]['space'] = {
							'covered':[false],
							'coords': [object_x_coord, object_y_coord]
						}
					}
					else {
						locations[playerLocation.join(', ')]['layers'][theObject]['space'] = {
							'width':[
								Math.round( (1920 * (hp[0] / hp[1])) + (objectWidth * ((ha - 1) / 2)) ), 
								Math.round(((1920*(hp[0]/hp[1]))+(objectWidth*((ha-1)/2)))+objectWidth)
							],
							'height':[Math.round((1080*(vp[0]/vp[1]))+(objectHeight*((va-1)/2))), Math.round(((1080*(vp[0]/vp[1]))+(objectHeight*((va-1)/2)))+objectHeight)],
							'horizontal placement':hp,
							'vertical placement':vp, 
							'horizontal alignment':ha,
							'vertical alignment':va
						}
					}
                }
				
                if (objects[theObject]['information']['type'] === 'plant') {
                    let one = '1'
                    let plantState = locations[playerLocation.join(', ')]['layers'][layerName]['information']['states']['state']
                    locations[playerLocation.join(', ')]['layers'][layerName]['information']['states']['state'] = one.repeat(plantState.length)
                } else if (objects[theObject]['information']['type'] === 'mineral') {
                    let amountOfStates = Object.keys(locations[playerLocation.join(', ')]['layers'][layerName]['information']['states']).length-2
                    locations[playerLocation.join(', ')]['layers'][layerName]['information']['states']['state'] = amountOfStates
                }
                
                // Adds to image
                if (!['plant', 'mineral'].includes(objects[theObject]['information']['type'])) {
                    if (insideStatus) { // ? Inside
                        locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['information']['image'].unshift(result)
                    } else { // ? Outside
                        locations[playerLocation.join(', ')]['image'].unshift(result)
                    }
                } else {
                    if (insideStatus) { // ? Inside
                        locations[playerLocation.join(', ')]['layers'][players[userName]['inside']]['inside']['information']['image'][0] = result
                    } else { // ? Outside
                        locations[playerLocation.join(', ')]['image'][0] = result
                    }
                }

                let requestRoomMessage
                let otherLandMessage

                if (insideStatus) { // ? Inside
                    requestRoomMessage = `You placed your object, **${toTitleCase(theObject)}** inside of \`${players[userName]['inside']}\` at \`[${coordinates}]\`.`
                    otherLandMessage = `**${toTitleCase(userName)}** just placed the object, **${toTitleCase(theObject)}**, inside of \`${players[userName]['inside']}\`.`
                } else { // ? Outside
                    requestRoomMessage = `You placed your object, **${toTitleCase(theObject)}** in the location, \`${playerLocation.join(', ')}\` at \`[${coordinates}]\`.`
                    otherLandMessage = `**${toTitleCase(userName)}** just placed the object, **${toTitleCase(theObject)}**, at the location, \`(${playerLocation.join(', ')})\`.`
                }

                // ! Makes Inside of House
                    if (['house','shop','church'].includes(objects[theObject]['information']['type'])) {
                        let wallColor = parseFloat(wall_color_arg);
                        let createImage2 = createBackground('box', wallColor, 1920, 1080, [1,2], [1,2], 0, 0, `${theObject} Inside`)
                        createImage2.then((result2) => {
                            locations[playerLocation.join(', ')]['layers'][theObject]['inside'] = {
                                "information":{
                                "image":[
                                        result2
                                ]
                                },
                                "layers":{
                                    "Wall":{
                                        "shape":"box",
                                        "width":1920,
                                        "height":1080,
                                        "color":wallColor,
                                        "coords":{
                                            "horizontally":[
                                                1,
                                                2
                                            ],
                                            "vertically":[
                                                1,
                                                2
                                            ],
                                            "horizontal alignment":0,
                                            "vertical alignment":0
                                        }
                                    }
                                }
                            }

                            // Overwrite JSON file
                                fs.writeFileSync('locations.json', JSON.stringify(locations))
                                fs.writeFileSync('objects.json', JSON.stringify(objects))
                                fs.writeFileSync('players.json', JSON.stringify(players))

                            
                            // Confirmation Message
                                let landchannel = message.guild.channels.cache.get('851233573604032544')
                                landchannel.send(`**${toTitleCase(userName)}** just placed the object, **${toTitleCase(theObject)}**, at the location, \`(${playerLocation.join(', ')})\`.`, {
                                    files: [locations[playerLocation.join(', ')]['image'][0]]
                                })

                                message.channel.send(`You placed your object, **${toTitleCase(theObject)}** on the location, \`${playerLocation.join(', ')}\` at \`[${coordinates}]\`.`)
                        })
                    } else {
                        // Overwrite JSON file
                            fs.writeFileSync('locations.json', JSON.stringify(locations))
                            fs.writeFileSync('objects.json', JSON.stringify(objects))
                            fs.writeFileSync('players.json', JSON.stringify(players))

                        
                        // Confirmation Message
                            let land_channel = message.guild.channels.cache.get('851233573604032544')
                            land_channel.send(otherLandMessage, {
                                files: [result]
                            })

                            message.channel.send(requestRoomMessage)
                    }
					
				if (APPLIANCE_LIST.includes(theObject)) {
					players[userName]['inventory'][theObject]['amount'] -= 1
				}
            })
            .catch((error) => {
                message.channel.send(`There was an error!`)
                console.error(error);
			});
	},
};