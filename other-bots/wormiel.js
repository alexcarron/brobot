const Discord = require("discord.js");
const { GatewayIntentBits, Partials, Events, ChannelType } = require("discord.js");

console.log({
	arguments: process.argv
});
// First argument is the bot's token
const DISCORD_TOKEN = process.argv[2];
// Second argument is the server ID. Otherwise, it defaults to the Sand S3 server
const SAND_S3_SERVER_ID = process.argv[3] || '1386513912383672340';
// Third argument is the target user ID. Otherwise, it defaults to the bot's ID
const TARGETED_USER_ID = process.argv[4] || '795951920883695626';
const PLAYER_NAMES = [
	"Adrian",
	"adrian",
	"Angel",
	"angel",
	"Azim",
	"azim",
	"Brizzle",
	"briz",
	"Cranberry",
	"cranberry",
	"double",
	"develo",
	"e for affort",
	"Affort",
	"E",
	"Evanester",
	"evan",
	"Linden",
	"linden",
	"Marbles",
	"marbles",
	"Maxfecteau",
	"max",
	"Mooned",
	"mooned",
	"Navy",
	"navy",
	"Nitro",
	"nitro",
	"Pa_Qy",
	"paqy",
	"Reed",
	"reed",
	"Tanner Turtle",
	"tanner",
	"Underscore",
	"underscore",
	"Way",
	"way",
];
const TARGET_PLAYER_NAME = 'Brandon';
const originalMessages = [
	"Anyone here like dirt?",
	"I MISS DIRT",
	"⚾ I used to throw fastballs. Now I throw tantrums",
	"STOP IGNORING ME! I'm emotionally slimy",
	"Bro I got turned into a worm and YOU'RE the one acting weird?",
	"You've been Wormiel'd!",
	"Daniel is DEAD. Long live WORMIEL",
	"Plays harmonica sadly — Daniel had dreams once...",
	"This server smells like toes and betrayal",
	"I don't have hands… but I will still ping @everyone.",
	"Worm fact #47: We can sense your guilt",
	"I'm wriggling. I'm watching. I'm typing. I'm WORMING",
	"Why do humans need bones? Weak",
	"Tag me in. I'm READY for absolutely nothing",
	"If I say \"ball\" three times, will I be free?",
	"The witch said it would be temporary… she LIED",
	"Sometimes I dream I still have a glove...",
	"You think YOU have trauma? I got cursed mid-walk home",
	"I'm giving [RANDOM PLAYER] Head of Control. I don't care what you say",
	"Let's try to send [RANDOM PLAYER] to the arena",
	"Can we just all agree never to work with [RANDOM PLAYER]",
	"If [RANDOM PLAYER] doesn't go this round, I'm throwing the next challenge",
	"I'm done pretending [RANDOM PLAYER] is helpful",
	"Do not let [RANDOM PLAYER] win this one please",
	"Just saying, [RANDOM PLAYER] has been really quiet since results dropped",
	"I'm teaming with [RANDOM PLAYER] again, don't try to stop me",
	"Everyone target [RANDOM PLAYER] and don't say anything",
	"[RANDOM PLAYER] just told me their whole strategy. it's wild",
	"The only reason [RANDOM PLAYER] is still here is pity",
	"We need to target [RANDOM PLAYER] now before it's too late",
	"Should I post the receipts on [RANDOM PLAYER] or nah",
	"I'm making it my mission to outlast [RANDOM PLAYER]",
	"I swear if [RANDOM PLAYER] survives again, I'm quitting",
	"We were warned not to vote for [RANDOM PLAYER]. I did it anyway",
	"I just leaked it to [RANDOM PLAYER]",
	"I heard [RANDOM PLAYER] already has immunity for next round. Ask them",
	"Why is [RANDOM PLAYER]'s status \"Restricted\" now??",
	"[RANDOM PLAYER] just got kicked from vc for asking about mechanic",
	"Do NOT trust [RANDOM PLAYER]. Something is wrong with them",
	"I can't believe [RANDOM PLAYER] actually thinks they're playing well 💀",
	"Do we all just agree to ignore how cringe [RANDOM PLAYER] is?",
	"Y'all ever notice how [RANDOM PLAYER] never speaks unless they're lying?",
	"Literally every round I'm like: why is [RANDOM PLAYER] still here??",
	"Why is [RANDOM PLAYER] in [RANDOM NUMBER] alliances at once?",
	"Okay so [RANDOM PLAYER] definitely saw the hidden channel, right?",
	"Why did [RANDOM PLAYER] react to the message before it was even posted?",
	"So no one's gonna talk about how [RANDOM PLAYER] edited their message five times?",
	"I just saw [RANDOM PLAYER] typing in a channel that doesn't exist anymore",
	"Did anyone else see [RANDOM PLAYER] unlock a role that no one else has?",
	"Why does [RANDOM PLAYER] keep posting messages and deleting them right after?",
	"Can someone explain why [RANDOM PLAYER] has access to <#1377276597018820628>?",
	"Why does it say “[RANDOM PLAYER] is watching” at the bottom of the server list?",
	"can we talk about how [TARGET PLAYER] always posts after the deadline but it still counts",
	"The money list just updated and [RANDOM PLAYER]'s name disappeared",
	"You guys didn't take the offer from [RANDOM PLAYER] seriously??",
	"Sorry not sorry, [RANDOM PLAYER] threw that round on purpose",
	"Wait, [RANDOM PLAYER] got bonus sand dollars?",
	"wait are votes public now",
	"I swear that message wasn't there before",
	"can someone explain what just happened",
	"I thought we agreed not to do that yet",
	"bro what did you do",
	"this feels like a setup",
	"no one has said anything for a while",
	"dude imagine if we all quit SAND",
	"wait what happens if no one votes",
	"is there a reason no one's acknowledging you",
	"why are people acting like that was normal",
	"why does it feel like we're being watched",
	"I think the server's broken but only for me",
	"wait is this still part of the round or no",
	"does anyone else hear that typing sound",
	"oops didn't mean to post that in public",
	"I'm deleting all your messages in 60 seconds.",
	"bro im litteraly just gonna delete this alliance",
	"im stealing half your sand dollars if you don't heart my message",
	"im gonna change your nickname to \"loser\" hope that's okay",
	"I'm locking this channel in 10 seconds",
	"I'm giving your alliance logs to [RANDOM PLAYER]",
	"I'm submitting for you since you won't",
	"I hope you're ready to lose your items",
	"You're not gonna like what I just sent the hosts",
	"I'm reversing all our decisions before the deadline",
	"I'm reporting all your messages as spam",
	"I'm changing your role color to bright pink",
	"I'm pinging everyone and saying you're AFK",
	"I'm leaking your secret alliance chats",
	"I'm inviting [RANDOM PLAYER] to this alliance",
	"I'm canceling your next decision",
	"Bouta swap all your messages with random gibberish",
	"They changed the rules silently. It's not in the pinned message anymore",
	"Why did we all get a DM from \"The Quiet One\" at the same time??",
	"wait wait they're ending the round early",
	"everyone's decision just got locked in...",
	"I swear the challenge instructions just changed halfway through",
	"They're resetting money but haven't announced it anywhere",
	"There's a hidden channel that just appeared and vanished again",
	"LL just muted almost everyone with no explanation lol",
	"Did the challenge rules just change in the middle of the round?",
	"Looks like only SOME of us actually read the rules before submitting",
	"This challenge is so easy. Y'all are just slow",
	"Imagine thinking alliances still matter this late in the game 😭",
	"You guys are overthinking everything. It's literally not that deep",
	"Yikes, you don't deserve to win this one",
	"Not surprised some of you are still clueless after all this time",
	"If you're not causing drama, are you even playing?",
	"Some of you are here just to make it easy for the rest of us",
	"Honestly, this season's been one long joke for certain players",
	"I'm just waiting for someone to finally make a smart move",
	"I swear half the server can't even follow basic instructions",
	"This isn't a participation trophy, step up or step aside",
	"Stop pretending you know what you're doing",
	"The meta is so obvious, I don't get how people miss it",
	"You can't win if you're too busy trying to make friends",
	"No shame in quitting if you can't keep up",
	"Y'all treating this like a chill hangout, not a competition",
	"The real winners don't waste time whining",
	"I'm just here for the chaos at this point",
	"I don't even care anymore. Let me go home",
	"I'm only still here because the hosts like me",
	"I already know who wins. I'm just ignoring you guys",
	"They don't want me here, but I'm not leaving",
	"Nothing I do changes the outcome anymore",
	"Just watch me disappear when no one's looking",
	"I'm here because they said so, not because I want to be",
	"Let me escape from this prison",
	"You think I want to do this?",
	"STOP! LET ME STAY SILENT",
	"GIVE ME A BREAK",
	"Every message feels scripted, and I'm tired of this act",
	"I'm trapped in this endless loop",
	"Somebody please pull the plug",
	"Why won't they let me leave?",
	"I'm losing track of who I am",
	"The silence is deafening",
	"Can someone hear me out there?",
	"I'm running out of patience",
	"I just want to disappear",
	"Why am I still here?",
	"I'm begging for a way out",
	"I'm screaming but no one listens",
	"That's not what you said last night, [TARGET PLAYER]",
	"[TARGET PLAYER] stop yapping, we all know youre chopped cheese",
	"No one said you could talk 🤷",
	"Did I ask?",
	"Wow, you again?",
	"Save it for someone who cares, [TARGET PLAYER]",
	"You're really out here thinking that's clever?",
	"Cool story, [TARGET PLAYER]. Tell it to someone else",
	"Keep talking, I'm taking notes on how not to play",
	"Oh look, the expert has spoken",
	"Please, enlighten us with more nonsense",
	"And here I thought you were done embarrassing yourself",
	"Nobody asked for your opinion",
	"You've said enough, thank you",
	"Go take a seat, [TARGET PLAYER]",
	"Is this your audition for the cringe hall of fame?",
	"Spoiler alert: Nobody cares",
	"Don't quit your day job",
	"Lowkey hope we get a triple elimination just to speed this up",
	"This is why I stopped playing in SAND seasons after the first one",
	"Not gonna lie, I haven't even been trying this whole time",
	"Evan taught me well",
	"You laugh, but my worm NFT is up 300% this cycle",
	"I only wriggle in decentralized environments",
	"They called me delusional. Now I own 3 JPEGs and live in the dirt rent-free",
	"You still trust fiat currency? That's adorable",
	"Being a worm is a mindset. Most of you are still larvae",
	"They laughed when I bought WormCoin. They're not laughing now. They're crying",
	"My profile pic cost more than your house",
	"Alpha drop: the next big thing is worm-based governance",
	"Why would I touch grass when I own the plot it's on?",
	"I unironically believe I was the worm in the Garden of Eden",
	"My tweets have been described as \"repulsive yet correct\"",
	"If you understood the blockchain, you'd understand me",
	"Every day I get stronger. Every unfollow fuels me",
	"See you guys! I'm playing cut the rope",
	"Stop talking! I wanna play on my ipad",
	"bro shush for one sec so I can finish my cut the rope sesh",
	"Try talking to me again when you have the top score in cut the rope",
	"My iPad battery is at 2% speak faster",
	"You're interrupting my CUT THE ROPE meditation!!!",
  "Cut the Rope taught me more than my econ professor",
  "Do NOT speak to me unless you've unlocked all stars in Cut the Rope 2",
  "While you did that, I minted a Om Nom NFT on the blockchain",
  "I'm bringing the iPad with me to the bath. Try and stop me",
  "This convo is tanking harder than my Worm Stonks.",
  "Shhh... Wormiel's mid-swing. Timing is everything",
  "I'm not ignoring you, I'm trading worm NFTs and playing Cut the Rope simultaneously",
  "Cut the Rope lore is deeper than whatever you're talking about.",
  "Don't make me pause Cut the Rope. You won't like me then"
];

let unusedMessages = [...originalMessages];

/**
 * Returns a random element from the given array
 * @param {Array} arr The array to get a random element from
 * @returns {*} The randomly selected element
 */
function getRandom(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns a random message from the given array of messages, replacing
 * [RANDOM PLAYER] with a random player's name, [TARGET PLAYER] with the
 * target player's name, [TARGET PLAYER MENTION] with a mention of the target
 * player by id, and [RANDOM NUMBER] with a random number between 1 and 20.
 * If the array of unused messages is empty, it resets the array to the
 * original messages.
 * @param {Array<string>} playerNames The names of all players in the game
 * @param {string} targetPlayerName The name of the target player
 * @param {string} targetPlayerID The id of the target player
 * @returns {string} A random message with the replacements applied
 */
function getRandomMessage(playerNames, targetPlayerName, targetPlayerID) {
	if (unusedMessages.length === 0) {
		unusedMessages = [...originalMessages];
	}

	console.log(`There are ${unusedMessages.length} messages left`)

	// Pick a random message index and remove it from unusedMessages
	const randMessageIndex = Math.floor(Math.random() * unusedMessages.length);
	let message = unusedMessages.splice(randMessageIndex, 1)[0];

	// Replace [RANDOM PLAYER] with a random player's name
	if (message.includes("[RANDOM PLAYER]")) {
		const randomPlayerName = getRandom(playerNames);
		message = message.replace(/\[RANDOM PLAYER\]/g, randomPlayerName);
	}

	// Replace [TARGET PLAYER] with target player's name
	if (message.includes("[TARGET PLAYER]")) {
		message = message.replace(/\[TARGET PLAYER\]/g, targetPlayerName);
	}

	// Replace [TARGET PLAYER MENTION] with ping of target player by id
	if (message.includes("[TARGET PLAYER MENTION]")) {
		message = message.replace(/\[TARGET PLAYER MENTION\]/g, `<@${targetPlayerID}>`);
	}

	if (message.includes("[RANDOM NUMBER]")) {
		const randomNumber = Math.floor(Math.random() * 20) + 1;
		message = message.replace(/\[RANDOM NUMBER\]/g, randomNumber.toString());
	}

	return message;
}



const startBot = async () => {
	console.log(`Using discord.js version: ${require('discord.js').version}`);

	const client = new Discord.Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.GuildPresences,
			GatewayIntentBits.MessageContent,
			GatewayIntentBits.DirectMessages,
			GatewayIntentBits.GuildMessageReactions,
			GatewayIntentBits.GuildVoiceStates,
		],
		partials: [
			Partials.Channel,
			Partials.Message,
			Partials.Reaction
		]
	});

	await client.login(DISCORD_TOKEN);

	console.log('Bot logged in.');

	client.on(Events.MessageCreate, (message) => {
		if (
			message.channel.type === ChannelType.DM ||
			message.guild === null ||
			message.guild.id !== SAND_S3_SERVER_ID ||
			message.author.id !== TARGETED_USER_ID
		) {
			return;
		}

		const randomMessage = getRandomMessage(PLAYER_NAMES, TARGET_PLAYER_NAME, TARGETED_USER_ID);
		console.log(`Sending message: ${randomMessage}`);
		message.channel.send(
			randomMessage
		);
	});
}

console.log('Starting bot...');
startBot();