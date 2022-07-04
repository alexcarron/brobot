/* eslint-disable no-unused-vars */
// ? Little Luigi Land ——————————————————————————————————————————————————————————————————————————————————————————————————————

// ? Characters ——————————————————————————————————————————————————————————————————————————————————————————————————————

const fs = require('fs');

module.exports = {
    name: 'levelup',
    description: 'Levels you up if you have the required XP and gives you rewards',
    guildOnly: true,
    aliases: ['lu', 'level'],
    requiredServer: ['850167368101396520'],
    requiredCategory: ['Request Rooms'],
    requiredRole:['Character'],
    status: true,
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
        let players = JSON.parse(fs.readFileSync('players.json'));
        let levels = JSON.parse(fs.readFileSync('levels.json'));
        var items = JSON.parse(fs.readFileSync('items.json'));
        let userName = message.guild.members.cache.get(message.author.id).displayName.toLowerCase();
		let player_xp = players[userName]['experience'];
		let player_level = players[userName]['level'];
		let next_level = levels[players[userName]['level'] + 1];
		let next_level_req_xp = next_level['required xp'];
		let stop = false;
		let reward_message = [];
        function toTitleCase(string) { // Magic Function DO NOT TOUCH
			return string.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

		console.log({player_xp, player_level, next_level, next_level_req_xp})
		
		// Level Up
			if ( player_xp < next_level_req_xp ) {
				return message.channel.send(`You need \`${next_level_req_xp} XP\` to level up, but you only have \`${player_xp} XP\`!`)
			} else {
				players[userName]['experience'] -= next_level_req_xp
				players[userName]['level'] += 1 
			}
			
		// Give Rewards
			if (next_level['reward']) {
				
				if (next_level['reward']['LLPoints']) {
					players[userName]['LL Points'] += next_level['reward']['LLPoints']
					reward_message.push(`You received \`${next_level['reward']['LLPoints']} LL Points!\``)
				}
				
				if (next_level['reward']['claims']) {
					players[userName]['claims'] += next_level['reward']['claims']
					reward_message.push(`You received **${next_level['reward']['claims']} claims**!`)
				}
				
				if (next_level['reward']['builds']) {
					players[userName]['builds'] += next_level['reward']['builds']
					reward_message.push(`You received **${next_level['reward']['builds']} builds**!`)
				}
				
				if (next_level['reward']['HP']) {
					players[userName]['HP'] += next_level['reward']['HP']
					reward_message.push(`You have healed \`${next_level['reward']['HP']} HP\`!`)
				}
				
				if (next_level['reward']['items']) {
					reward_message.push(`You have received:`)
					
					Object.entries(next_level['reward']['items']).forEach((entry, num) => {
						let item_name = entry[0]
						let item_amount = entry[1]
						
						let inv_space_of_player = players[userName]['inventory']['space']
				
						if (inv_space_of_player[1] < inv_space_of_player[0] + item_amount) {
							stop = true
							return message.channel.send(`You don't have enough space left in your inventory. You only have room for \`${inv_space_of_player[1] - inv_space_of_player[0]}\` items.`)
						}
						
						if (!players[userName]['inventory'][item_name]) {
                            players[userName]['inventory'][item_name] = items[item_name]
                            players[userName]['inventory'][item_name]['amount'] = item_amount
                        } else {
                            players[userName]['inventory'][item_name]['amount'] += item_amount
                        }
						
						players[userName]['inventory']['space'][0] += item_amount
						
						reward_message.push(`    **${toTitleCase(item_name)}**(x${item_amount})`)
					})
				}
			}
			
		if (stop) {return}
			
		fs.writeFileSync('players.json', JSON.stringify(players))
        
        message.channel.send(`You've leveled up to level \`${players[userName]['level']}\`!`)
        message.channel.send(reward_message)
        message.channel.send(`You'll need \`${levels[players[userName]['level'] + 1]['required xp']} XP\` to get to the next level`)
		message.channel.send(`Your \`${players[userName]['LL Points'] <= 150 ? 150 - players[userName]['LL Points'] : 0}\` LL Points from becoming a religious leader`)
	},
};