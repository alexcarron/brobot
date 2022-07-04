// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');
let jimp = require('jimp');


module.exports = {
    name: 'editobject',
    description: 'Adds an object or shape onto an already existing object you own',
    guildOnly: true,
    args: true,
    aliases: ['eo', 'edit', 'editobj'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: [
        'object, <object-name>, <object-adding-name>, <coordinates>',
        'shape, <object-name>, <shape>, <color-number>, <width>, <height>, <coordinates>'
    ],
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
		let commaArgs = args.join(' ').split(', ')
        let objects = JSON.parse(fs.readFileSync('objects.json'))
        let limitations = JSON.parse(fs.readFileSync('limitations.json'))
        let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase();
		let thing_adding_to_obj = commaArgs[0].toLowerCase();
        let shapes = limitations['shapes']
        let colors = limitations['colors']
		function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

        function addShapeToImage(shape, colorNum, width, height, horizontalPlacement, verticalPlacement, horizontalAlignment, verticalAlignment, filename, oldPNG)  {
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

        function addImageToImage(horizontalPlacement, verticalPlacement, horizontalAlignment, verticalAlignment, width, height, addedImage, filename, oldPNG)  {    
            return jimp.read(oldPNG)
                .then(
                    (image) => {
                        return jimp.read(addedImage)
                            .then((addedImage) => {
                                let x = (1000/horizontalPlacement[1]*horizontalPlacement[0])-(Math.abs(width[1]-width[0])/2)-width[0]
                                let y = (1000/verticalPlacement[1]*verticalPlacement[0])-(Math.abs(height[1]-height[0])/2)-height[0]
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

        // Processing
        message.channel.send(`Processing...`)

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

                    fs.writeFileSync('objects.json', JSON.stringify(objects))
                    
                    message.channel.send(`You added **${toTitleCase(addedObjectNameArg)}** to your object, **${toTitleCase(yourObjectNameArg)}**, at the coordinates, **[${coordinates}]**.`)
                    
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
                objects[yourObjectNameArg]['information']['image'].unshift(result)
        
                let newWidth = [];
                let newHeight = [];

                let leftEdgePos = (((hp[0]/hp[1])*1000)-(parseFloat(widthArg)/2))+(ha*(parseFloat(widthArg)/2))
                let rightEdgePos = (((hp[0]/hp[1])*1000)+(parseFloat(widthArg)/2))+(ha*(parseFloat(widthArg)/2))
                let upperEdgePos = (((vp[0]/vp[1])*1000)-(parseFloat(heightArg)/2))+(va*(parseFloat(heightArg)/2))
                let lowerEdgePos = (((vp[0]/vp[1])*1000)+(parseFloat(heightArg)/2))+(va*(parseFloat(heightArg)/2))
                if (leftEdgePos < objects[yourObjectNameArg]['information']['width'][0][0]) {
                    newWidth[0]=leftEdgePos
                } else {
                    newWidth[0]=objects[yourObjectNameArg]['information']['width'][0][0]
                }
                if (rightEdgePos > objects[yourObjectNameArg]['information']['width'][0][1]) {
                    newWidth[1]=rightEdgePos
                } else {
                    newWidth[1]=objects[yourObjectNameArg]['information']['width'][0][1]
                }
                if (upperEdgePos < objects[yourObjectNameArg]['information']['height'][0][0]) {
                    newHeight[0]=upperEdgePos
                } else {
                    newHeight[0]=objects[yourObjectNameArg]['information']['height'][0][0]
                }
                if (lowerEdgePos > objects[yourObjectNameArg]['information']['height'][0][1]) {
                    newHeight[1]=lowerEdgePos
                } else {
                    newHeight[1]=objects[yourObjectNameArg]['information']['height'][0][1]
                }

                console.log({newWidth, newHeight})

                objects[yourObjectNameArg]['information']['width'].unshift(newWidth)
                objects[yourObjectNameArg]['information']['height'].unshift(newHeight)

                // Overwrite JSON file
                    fs.writeFileSync('objects.json', JSON.stringify(objects))
            
                // Confirmation Message
                    message.channel.send(`You have added a **${widthArg} by ${heightArg} ${colors[colorNumArg]['name']} ${toTitleCase(shapeArg)}** to your object, **${toTitleCase(yourObjectNameArg)}**. It's  at \`[${coordinates}]\`.`)
            })

        
        }
	},
};