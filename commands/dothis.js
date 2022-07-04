// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ! ME ——————————————————————————————————————————————————————————————————————————————————————————————————————

/* eslint-disable no-unused-vars */
const fs = require('fs');


module.exports = {
	name: 'dothis',
	guildOnly: true,
	requiredServer: ['850167368101396520'],
	requiredCategory: ['The Underground'],
	requiredRole:['God'],
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
		let locations = JSON.parse(fs.readFileSync('locations.json'))
		function reduce_to_first_item(array) {
			if (
				array.length > 1
			) {
				array = [array[0]]
			}
		}


		Object.entries(locations).forEach((location, location_num) => {
			let location_name = location[0];
			let location_properties = location[1];
			let num = 0
			
			if (location_properties['layers']) {
				Object.entries(location_properties['layers']).forEach((layer, layer_num) => {
					let layer_name = layer[0];
					let layer_properties = layer[1];
					
					if (
						layer_properties['information'] &&
						layer_properties['information']['type'] &&
						layer_properties['information']['type'] === 'plant'
					) {
						delete locations[location_name]['layers'][layer_name]['information']['owner']
						let horizontal_placement = layer_properties['space']['horizontal placement']
						let vertical_placement = layer_properties['space']['vertical placement']
						let horizontal_coord = 
							Math.round(1920 * (horizontal_placement[0] / horizontal_placement[1]))
						let vertical_coord = 
							Math.round(1080 * (vertical_placement[0] / vertical_placement[1]))
						let mineral_width = 
							Math.abs(layer_properties['information']['width'][0][1] - layer_properties['information']['width'][0][0])
						let mineral_height = 
							Math.abs(layer_properties['information']['height'][0][1] - layer_properties['information']['height'][0][0])
						let min_mineral_width = 
							layer_properties['information']['width'][0][0]
						let min_mineral_height = 
							layer_properties['information']['height'][0][0]
						let horizontal_alignment = 
							layer_properties['space']['horizontal alignment']
						let vertical_alignment = 
							layer_properties['space']['vertical alignment'] 
							
						let x_coord = (horizontal_coord) - (mineral_width / 2) - min_mineral_width
						let y_coord = (vertical_coord) - (mineral_height / 2) - min_mineral_height
						x_coord += horizontal_alignment * (mineral_width / 2)
						y_coord += vertical_alignment * (mineral_height / 2)
						
						/* 
                                let x = (1920/horizontalPlacement[1]*horizontalPlacement[0])-(Math.abs(width[1]-width[0])/2)-width[0]
                                let y = (1080/verticalPlacement[1]*verticalPlacement[0])-(Math.abs(height[1]-height[0])/2)-height[0]
                                x = x + horizontalAlignment * (Math.abs(width[1]-width[0])/2)
                                y = y + verticalAlignment * (Math.abs(height[1]-height[0])/2) */
						
						if (num < 1) {
							console.log({layer_name, layer_properties, horizontal_placement, vertical_placement, horizontal_coord, vertical_coord, mineral_width, mineral_height, min_mineral_width, min_mineral_height, horizontal_alignment, vertical_alignment, x_coord, y_coord})
						}
						
						delete locations[location_name]['layers'][layer_name]['space']['horizontal placement'];
						delete locations[location_name]['layers'][layer_name]['space']['vertical placement'];
						delete locations[location_name]['layers'][layer_name]['space']['width'];
						delete locations[location_name]['layers'][layer_name]['space']['height'];
						delete locations[location_name]['layers'][layer_name]['space']['horizontal alignment'];
						delete locations[location_name]['layers'][layer_name]['space']['vertical alignment'];
						
						locations[location_name]['layers'][layer_name]['space']['coords'] = [x_coord, y_coord]
						
						num += 1
					}
				})
			}
		})


		fs.writeFileSync('locations.json', JSON.stringify(locations))
	},
};