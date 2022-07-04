// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

/*jshint sub:true*/

const fs = require('fs');

let jimp = require('jimp');

module.exports = {
    name: 'undo',
    description: 'Gets rid of the last layer placed on an object or location',
    guildOnly: true,
    args: true,
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: [
        '<undo editobject, <object-name>',
        '<undo place',
        '<undo place, <coordinates>'
    ],
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        let commaArgs = args.join(' ').split(', ');
        let objects = JSON.parse(fs.readFileSync('objects.json'));
        let locations = JSON.parse(fs.readFileSync('locations.json'));
        let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase();
        let players = JSON.parse(fs.readFileSync('players.json'));
        let playerLocation = players[userName]['location'];
		let player_location_str = playerLocation.join(', ');
        let insideLocation = players[userName]['inside'];
        let insideStatus = players[userName]['inside'] != "";
		let thing_undoing = commaArgs[0].toLowerCase();

        async function addImageToImage(horizontalPlacement, verticalPlacement, horizontalAlignment, verticalAlignment, width, height, addedImage, filename, oldPNG)  {    
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

                                    let heyluigichannel_ = message.guild.channels.cache.get('850537726561353758')
                                    let theURL = heyluigichannel_.send('',{
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
        message.channel.send(`Processing...`);


        // <undo editobject, [object]
        if (thing_undoing === 'editobject') {
            if(commaArgs.length < 2) {
                return message.channel.send(`No!!! It's like this \`<undo editobject, <objectname>\``);
            }

            // Checks if you own the object you are editing and if it exists
            let object_name_arg = commaArgs[1].toLowerCase();

                if (!Object.keys(objects).includes(object_name_arg) || objects[object_name_arg]['information']['owner'] != userName) { 
                    return message.channel.send(`${object_name_arg} is not an object that you own and/or exists.`);
                }

                if (objects[object_name_arg]['information']['image'].length <= 1) {
                    return message.channel.send(`You don't have anything to undo.`);
                }

                
                objects[object_name_arg]['information']['image'].shift();
                objects[object_name_arg]['information']['width'].shift();
                objects[object_name_arg]['information']['height'].shift();

                fs.writeFileSync('objects.json', JSON.stringify(objects))

                        
                let heyluigichannel = message.guild.channels.cache.get('850537726561353758');
                heyluigichannel.send(`**${userName}** undid **${object_name_arg}**.`);
                message.channel.send(`You undid **${object_name_arg}**. It looks like this:`, {
                    files: [objects[object_name_arg]['information']['image'][0]]
                })
        }
    
        // <undo place, [location coordinates]/current location
        if (thing_undoing.toLowerCase() === 'place') {
            let theLocation;
            if (!commaArgs[1]) {
                if (insideStatus) { // ? Inside
                    theLocation = insideLocation;
                } else {  // ? Outside
                    theLocation = player_location_str;
                }
            } else {
                theLocation = commaArgs.slice(1,commaArgs.length).join(', ');
            }

            // Check if location exists and they own it
            if (!insideStatus) { // ? Outside
                if (message.author.id != '276119804182659072' && (!Object.keys(locations).includes(theLocation) || !locations[theLocation]['owner'] || locations[theLocation]['owner'] != userName)) { 
                    return message.channel.send(`${theLocation} is not a location that you own and/or exists.`);
                }
            } else {
                if (
					!Object.keys(locations[player_location_str]['layers']).includes(theLocation) || 
					!['house','shop'].includes(locations[player_location_str]['layers'][theLocation]['information']['type']) || 
					locations[player_location_str]['layers'][theLocation]['information']['owner'] != userName
					) { 
                    return message.channel.send(`${theLocation} is not a place that you own and/or exists.`);
                }
            }
            
            // Check if there's anything to go back to
            if (insideStatus) { // ? Inside
                if (locations[player_location_str]['layers'][theLocation]['inside']['information']['image'].length <= 1) {
                    return message.channel.send(`You don't have anything to undo.`);
                }
            } else {  // ? Outside
                if (locations[theLocation]['image'].length <= 1) {
                    return message.channel.send(`You don't have anything to undo.`);
                }
            }
            
            // Undoes image
            if (insideStatus) { // ? Inside
                locations[player_location_str]['layers'][theLocation]['inside']['information']['image'].shift();
                delete objects[ 
					Object.keys( 
						locations[player_location_str]['layers'][theLocation]['inside']['layers'] 
					)[Object.keys( 
						locations[player_location_str]['layers'][theLocation]['inside']['layers'] 
					).length-1] 
				]['information']['placed'];
                delete locations[player_location_str]['layers'][theLocation]['inside']['layers'][Object.keys(locations[player_location_str]['layers'][theLocation]['inside']['layers'])[Object.keys(locations[player_location_str]['layers'][theLocation]['inside']['layers']).length-1]];

                let theImageURL = locations[player_location_str]['layers'][theLocation]['inside']['information']['image'][0];

                fs.writeFileSync('locations.json', JSON.stringify(locations));


                // Reset
                let heyluigichannel = message.guild.channels.cache.get('850537726561353758');
                heyluigichannel.send(`**${userName}** undid their placements at **${theLocation}**.`);
                message.channel.send(`You undid your placement on **${theLocation}**. It looks like this:`, {
                    files: [theImageURL]
                })

                let landchannel = message.guild.channels.cache.get('851233573604032544');
                landchannel.send(`**${message.guild.members.cache.get(message.author.id).displayName}** just undid their placement at **${theLocation}**.`, {
                files: [theImageURL]
                });
            } else {  // ? Outside

                let layersAtLocation = Object.entries(locations[theLocation]['layers']);
                let layerToDelete;
                let objectPlacedInfoToDelete;
                let layersLeft = layersAtLocation.length-1;
                let notDeleted = true;
                while (notDeleted) {
                    if (!['plant','mineral'].includes(locations[theLocation]['layers'][layersAtLocation[layersLeft][0]]['information']['type'])) {
                        layerToDelete = layersLeft;
                        objectPlacedInfoToDelete = layersLeft;
                        notDeleted = false;
                    } else {
                        layersLeft = layersLeft - 1;
                        if (layersLeft < 0) {
                            notDeleted = false;
                        }
                    }
                }

                if(!layerToDelete || !objectPlacedInfoToDelete) {
                    return message.channel.send(`You don't have anything to undo.`);
                }

                delete locations[theLocation]['layers'][layersAtLocation[layerToDelete][0]];
                delete objects[layersAtLocation[objectPlacedInfoToDelete][0]]['information']['placed'];
                locations[theLocation]['image'].shift()     

                let createImageArray = []
                Object.entries(locations[theLocation]['layers']).forEach((entry) => {
                    if (entry[1]['information']['type']) {
                    if (['plant','mineral'].includes(entry[1]['information']['type'])) {
                        let hp = locations[theLocation]['layers'][entry[0]]['space']['horizontal placement']
                        let vp = locations[theLocation]['layers'][entry[0]]['space']['vertical placement']
                        let ha = locations[theLocation]['layers'][entry[0]]['space']['horizontal alignment']
                        let va = locations[theLocation]['layers'][entry[0]]['space']['vertical alignment']
                        let plantWidth = locations[theLocation]['layers'][entry[0]]['information']['width']
                        let plantHeight = locations[theLocation]['layers'][entry[0]]['information']['height']

                        let state = entry[1]['information']['states']['state']
                        
                        let plantPNG = locations[theLocation]['layers'][entry[0]]['information']['states'][state]['image']
                        createImageArray.push([plantPNG, hp, vp, ha, va, plantWidth, plantHeight])
                    }
                    }
                })

                // Undo covered plants
                    if (locations[players[userName]['location'].join(', ')]['layers']) {
                        Object.entries(locations[players[userName]['location'].join(', ')]['layers']).forEach( (entry) => {
                            if (['plant','mineral'].includes(entry[1]['information']['type'])) {
                                locations[players[userName]['location'].join(', ')]['layers'][entry[0]]['space']['covered'].shift()
                            }
                        })
                    }


                (async function() {
                    let num = 0
                    for (let image of createImageArray) {
                        
                        let result = await addImageToImage(image[1], image[2], image[3], image[4], image[5], image[6], image[0], theLocation, locations[theLocation]['image'][0])
                        locations[theLocation]['image'][0] = result

                        if (createImageArray.length-1 === num) {
                            let theImageURL = locations[theLocation]['image'][0]

                            fs.writeFileSync('locations.json', JSON.stringify(locations))

                            // Reset
                            let heyluigichannel = message.guild.channels.cache.get('850537726561353758')
                            heyluigichannel.send(`**${userName}** undid their placements at **${theLocation}**.`)
                            message.channel.send(`You undid your placement on **${theLocation}**.`)

                            let landchannel = message.guild.channels.cache.get('851233573604032544')
                            landchannel.send(`**${message.guild.members.cache.get(message.author.id).displayName}** just undid their placement at **${theLocation}**.`, {
                            files: [theImageURL]
                            })
                        }
                        num = num + 1
                    }
                })();
            }
        } 
        
        if (!['editobject', 'place'].includes(commaArgs[0].toLowerCase())) {
            message.channel.send(`**${commaArgs[0].toLowerCase()}** is not something you can undo. For now you can only undo \`<editobject\` and \`<place\``)
        }
	}
};