// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');

module.exports = {
    name: 'view',
    description: 'Shows you what an object is made of and an image of it',
    guildOnly: true,
    args: true,
    aliases: ['viewobject', 'vo'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    usage: '<object-name>', //
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        var userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase()
        var objects = JSON.parse(fs.readFileSync('objects.json'))
        var colors = JSON.parse(fs.readFileSync('limitations.json'))['colors']
        var theObject = args.join(' ')
        var theMessage = []
        var applianceList =['workbench','ladder','smelter']

        if(!Object.keys(objects).includes(args.join(' '))) {
                return message.channel.send(`**${args.join(' ')}** is not an object that exists.`)
            }

        if(objects[theObject]['information']['owner'] != userName && objects[theObject]['information']['type'] != 'character' && !applianceList.includes(theObject)) {
            return message.channel.send(`You don't own that object.`)
        } 
        
        if(objects[args.join(' ')]['information']['image']) {
            message.channel.send(`**${args.join(' ')}**`,{
                files: [objects[args.join(' ')]['information']['image'][0]]
              })
        }

        if (objects[theObject]['information']['type']) {
            let objectType = objects[theObject]['information']['type']
            theMessage.push(`**Type**: ${objectType}`)
        }

        Object.entries(objects[args.join(' ')]['layers']).forEach(
            (layer, num) => {
                let horizontalPlacement
                if (![0,1].includes(layer[1]['coords']['horizontally'])) {
                    horizontalPlacement = layer[1]['coords']['horizontally'].join('/')
                } else {
                    horizontalPlacement = layer[1]['coords']['horizontally']
                }
                let verticalPlacement
                if (![0,1].includes(layer[1]['coords']['vertically'])) {
                    verticalPlacement = layer[1]['coords']['vertically'].join('/')
                } else {
                    verticalPlacement = layer[1]['coords']['vertically']
                }
                let horizontalAlignment = layer[1]['coords']['horizontal alignment']
                let verticalAlignment = layer[1]['coords']['vertical alignment']
    

                if (layer[1]['object']) {
                    let objectName = layer[1]['object']
                    theMessage.push(`**Layer ${num+1}:** "${objectName}" at \`[${horizontalPlacement}, ${verticalPlacement}, ${horizontalAlignment}, ${verticalAlignment}]\``)
                } else {
                    let width = layer[1]['width']
                    let height = layer[1]['height']
                    let color = colors[layer[1]['color']]['name']
                    let shape = layer[1]['shape']
                    theMessage.push(`**Layer ${num+1}:** ${width}x${height} ${color} ${shape} at \`[${horizontalPlacement}, ${verticalPlacement}, ${horizontalAlignment}, ${verticalAlignment}]\``)
                }
            }
        )
        message.channel.send(theMessage)
	},
};