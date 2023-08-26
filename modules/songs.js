const { EmbedBuilder } = require('discord.js');

class Song {
	constructor({
		song_name,
		artist,
		original_artist=undefined,
		album=undefined,
		seconds_long,
		days_since_added_to_playlist,
		plays,
		days_ago_last_played=-1,
		skips=0,
		rating,
		link=undefined,
		genre=undefined,
	}) {
		this.song_name = song_name;
		this.artist = artist;
		this.original_artist = original_artist;
		this.album = album;
		this.seconds_long = seconds_long;
		this.days_since_added_to_playlist = days_since_added_to_playlist;
		this.plays = plays;
		this.days_ago_last_played = days_ago_last_played;
		this.skips = skips;
		this.rating = rating;
		this.link = link;
		this.genre = genre;
	}

	getTimeCode() {
		let minutes = Math.floor(this.seconds_long / 60);
		let seconds = this.seconds_long % 60;

		if (seconds <= 9) {
			seconds = "0" + seconds;
		}

		return `${minutes}:${seconds}`;
	}

	getRating() {
		const RatingDescription = {
			7: "Enjoyable",
			8: "Great!",
			9: "Outstanding!!!"
		}

		return RatingDescription[this.rating];
	}

	toEmbed() {
		const original_artist_msg = this.original_artist ? `**Original Artist**: ${this.original_artist}` : ``;
		const days_ago_last_played_msg = this.days_ago_last_played === -1 ? "Never" : this.days_ago_last_played;
		const album_msg = this.album ? ` from ${this.album}`: ``;


		const embed = new EmbedBuilder()
			.setColor(0xc31c87)
			.setTitle(`"` + this.song_name + `" by ` + this.artist + album_msg)
			.setDescription(`\`${this.getTimeCode()}\` ` + original_artist_msg)
			.addFields(
				{ name: "Rating", value: this.getRating(), inline: true },
				{ name: "Plays", value: `${this.plays}`, inline: true },
				{ name: "Skips", value: `${this.skips}`, inline: true },
				{ name: "Days Since Last Played", value: `${days_ago_last_played_msg}`, inline: true },
				{ name: "Days Since Discovered", value: `${this.days_since_added_to_playlist}`, inline: true },
			);

		if (this.genre) {
			embed.addFields( { name: "Genre Guess", value: this.genre, inline: true } )
		}

		if (this.link) {
			embed.addFields( { name: "Link To Song", value: this.link, inline: false } )
		}

		return embed;
	}
}

class Songs {
	constructor(songs_array) {
		this.songs = [];

		for (let song_obj of songs_array) {
			let song = new Song(song_obj);
			this.songs.push(song);
		}
	}

	getRandomSong() {
		let random_index = Math.floor( Math.random() * (this.songs.length) );
		const rand_song = this.songs[random_index];
		return rand_song;
	}

	sendRandomSong(channel) {
		const rand_song = this.getRandomSong()
		const embed = rand_song.toEmbed();
		channel.send({content: "BEEP BOOP! Random song generated", embeds: [embed]});
	}

	sendRandomLinkedSong(channel) {
		const linked_songs = this.songs.filter(song => song.link);

		if (linked_songs.length <= 0) {
			return channel.send("N/A");
		}

		let random_index = Math.floor( Math.random() * (linked_songs.length) );
		const rand_linked_song = linked_songs[random_index];
		const embed = rand_linked_song.toEmbed();
		channel.send({content: "Random Song Generated:"});
		channel.send({embeds: [embed]});
	}
}

// "BEEP BOOP! Random song generated:"


const songs = new Songs([
{
		"song_name": "blue comet",
		"artist": "AAAA",
		"seconds_long": 144,
		"days_since_added_to_playlist": 182,
		"plays": 11,
		"days_ago_last_played": 45,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Ressurection",
		"artist": "Aaron Spencer",
		"seconds_long": 181,
		"days_since_added_to_playlist": 811,
		"plays": 19,
		"days_ago_last_played": 40,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Find A Way Out",
		"artist": "Aeden & Harley Bird",
		"seconds_long": 186,
		"days_since_added_to_playlist": 411,
		"plays": 26,
		"days_ago_last_played": 24,
		"skips": 2,
		"rating": 8
	},
	{
		"song_name": "Brave Shine",
		"artist": "Aimer",
		"album": "DAWN",
		"seconds_long": 232,
		"days_since_added_to_playlist": 86,
		"plays": 13,
		"days_ago_last_played": 48,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "Zankyo Sanka",
		"artist": "Aimer",
		"seconds_long": 184,
		"days_since_added_to_playlist": 86,
		"plays": 7,
		"days_ago_last_played": 12,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Normal",
		"artist": "AJR",
		"album": "The Click",
		"seconds_long": 185,
		"days_since_added_to_playlist": 583,
		"plays": 29,
		"days_ago_last_played": 15,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Break My Face",
		"artist": "AJR",
		"seconds_long": 226,
		"days_since_added_to_playlist": 583,
		"plays": 14,
		"days_ago_last_played": 48,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Come Hang Out",
		"artist": "AJR",
		"seconds_long": 273,
		"days_since_added_to_playlist": 583,
		"plays": 15,
		"days_ago_last_played": 44,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Finale (Can’t Wait To See What You Do Next)",
		"artist": "AJR",
		"seconds_long": 278,
		"days_since_added_to_playlist": 583,
		"plays": 14,
		"days_ago_last_played": 29,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "The Good Part",
		"artist": "AJR",
		"seconds_long": 227,
		"days_since_added_to_playlist": 583,
		"plays": 15,
		"days_ago_last_played": 110,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Humpty Dumpty",
		"artist": "AJR",
		"seconds_long": 217,
		"days_since_added_to_playlist": 657,
		"plays": 19,
		"days_ago_last_played": 43,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Joe",
		"artist": "AJR",
		"seconds_long": 212,
		"days_since_added_to_playlist": 657,
		"plays": 19,
		"days_ago_last_played": 39,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Karma",
		"artist": "AJR",
		"seconds_long": 248,
		"days_since_added_to_playlist": 1083,
		"plays": 38,
		"days_ago_last_played": 17,
		"skips": 11,
		"rating": 7
	},
	{
		"song_name": "My Play",
		"artist": "AJR",
		"seconds_long": 191,
		"days_since_added_to_playlist": 657,
		"plays": 35,
		"days_ago_last_played": 43,
		"skips": 8,
		"rating": 8
	},
	{
		"song_name": "OVERTURE",
		"artist": "AJR",
		"seconds_long": 224,
		"days_since_added_to_playlist": 179,
		"plays": 6,
		"days_ago_last_played": 49,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Sober Up (ft. Rivers Cuomo)",
		"artist": "AJR",
		"seconds_long": 229,
		"days_since_added_to_playlist": 624,
		"plays": 8,
		"days_ago_last_played": 47,
		"skips": 14,
		"rating": 7
	},
	{
		"song_name": "Three-Thirty",
		"artist": "AJR",
		"seconds_long": 210,
		"days_since_added_to_playlist": 583,
		"plays": 14,
		"days_ago_last_played": 44,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Turning Out Pt. ii",
		"artist": "AJR",
		"seconds_long": 223,
		"days_since_added_to_playlist": 583,
		"plays": 17,
		"days_ago_last_played": 29,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Wow, I'm Not Crazy",
		"artist": "AJR",
		"seconds_long": 198,
		"days_since_added_to_playlist": 583,
		"plays": 11,
		"days_ago_last_played": 45,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Ignotus",
		"artist": "ak+q",
		"seconds_long": 280,
		"days_since_added_to_playlist": 190,
		"plays": 8,
		"days_ago_last_played": 60,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Vivid Theory",
		"artist": "ak+q",
		"seconds_long": 149,
		"days_since_added_to_playlist": 182,
		"plays": 15,
		"days_ago_last_played": 11,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Ether Strike ('Divine Mercy' Extended)",
		"artist": "Akira Complex",
		"album": "Arcaea Sound Collection: Memories of Light",
		"seconds_long": 276,
		"days_since_added_to_playlist": 56,
		"plays": 9,
		"days_ago_last_played": 52,
		"skips": 2,
		"rating": 9
	},
	{
		"song_name": "Come to Me",
		"artist": "Akira Complex, PSYQUI",
		"album": "Hypersynthetic",
		"seconds_long": 212,
		"days_since_added_to_playlist": 40,
		"plays": 3,
		"days_ago_last_played": 38,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "ASGORE (Remix)",
		"artist": "Akosmo",
		"seconds_long": 316,
		"days_since_added_to_playlist": 477,
		"plays": 8,
		"days_ago_last_played": 17,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Here",
		"artist": "Alessia Cara",
		"seconds_long": 204,
		"days_since_added_to_playlist": 299,
		"plays": 12,
		"days_ago_last_played": 44,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Stay (ft. Zedd)",
		"artist": "Alessia Cara",
		"seconds_long": 212,
		"days_since_added_to_playlist": 297,
		"plays": 16,
		"days_ago_last_played": 43,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Mr.Saxobeat",
		"artist": "Alexandra Stan",
		"seconds_long": 193,
		"days_since_added_to_playlist": 253,
		"plays": 10,
		"days_ago_last_played": 45,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Arrow",
		"artist": "Andrew Applepie",
		"seconds_long": 200,
		"days_since_added_to_playlist": 1049,
		"plays": 47,
		"days_ago_last_played": 68,
		"skips": 17,
		"rating": 7
	},
	{
		"song_name": "Don't Say",
		"artist": "Andromedik",
		"seconds_long": 233,
		"days_since_added_to_playlist": 218,
		"plays": 12,
		"days_ago_last_played": 45,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Remind Me",
		"artist": "Andy Mineo, JVKE",
		"album": "Never Land II",
		"seconds_long": 170,
		"days_since_added_to_playlist": 56,
		"plays": 4,
		"days_ago_last_played": 18,
		"skips": 2,
		"rating": 8
	},
	{
		"song_name": "Tom's Diner (Cover) (ft. Giant Rooks)",
		"artist": "AnnenMayKantereit",
		"seconds_long": 273,
		"days_since_added_to_playlist": 311,
		"plays": 11,
		"days_ago_last_played": 35,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Windy Summer (Night Tempo Edit)",
		"artist": "Anri",
		"seconds_long": 200,
		"days_since_added_to_playlist": 731,
		"plays": 18,
		"days_ago_last_played": 61,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "γuarδina",
		"artist": "Aoi",
		"seconds_long": 130,
		"days_since_added_to_playlist": 190,
		"plays": 13,
		"days_ago_last_played": 13,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Insane (ft. Tech N9ne)",
		"artist": "Apashe",
		"album": "Renaissance",
		"seconds_long": 211,
		"days_since_added_to_playlist": 86,
		"plays": 15,
		"days_ago_last_played": 48,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Aurora (ft. Koherent)",
		"artist": "Aperio",
		"seconds_long": 339,
		"days_since_added_to_playlist": 155,
		"plays": 12,
		"days_ago_last_played": 39,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Flashback",
		"artist": "ARForest",
		"album": "Frost Era",
		"seconds_long": 276,
		"days_since_added_to_playlist": 56,
		"plays": 3,
		"days_ago_last_played": 43,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Aoba",
		"artist": "ARForest",
		"album": "The Unfinished",
		"seconds_long": 165,
		"days_since_added_to_playlist": 56,
		"plays": 6,
		"days_ago_last_played": 28,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Break Free (ft. Zedd)",
		"artist": "Ariana Grande",
		"seconds_long": 214,
		"days_since_added_to_playlist": 281,
		"plays": 15,
		"days_ago_last_played": 35,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Problem (ft. Iggy Azalea)",
		"artist": "Ariana Grande",
		"seconds_long": 193,
		"days_since_added_to_playlist": 281,
		"plays": 8,
		"days_ago_last_played": 47,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "7 rings",
		"artist": "Ariana Grande",
		"seconds_long": 178,
		"days_since_added_to_playlist": 330,
		"plays": 27,
		"days_ago_last_played": 49,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "motive",
		"artist": "Ariana Grande, Doja Cat",
		"seconds_long": 169,
		"days_since_added_to_playlist": 87,
		"plays": 18,
		"days_ago_last_played": 49,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Before Labour",
		"artist": "Artificial Music",
		"seconds_long": 156,
		"days_since_added_to_playlist": 764,
		"plays": 19,
		"days_ago_last_played": 123,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Bubbles Drifting in the Morning Breeze",
		"artist": "Artificial Music",
		"seconds_long": 189,
		"days_since_added_to_playlist": 837,
		"plays": 46,
		"days_ago_last_played": 60,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Curtains",
		"artist": "Artificial Music",
		"seconds_long": 174,
		"days_since_added_to_playlist": 841,
		"plays": 48,
		"days_ago_last_played": 47,
		"skips": 13,
		"rating": 7
	},
	{
		"song_name": "Gradually",
		"artist": "ASTN",
		"seconds_long": 187,
		"days_since_added_to_playlist": 330,
		"plays": 26,
		"days_ago_last_played": 79,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Activate",
		"artist": "Au5",
		"seconds_long": 326,
		"days_since_added_to_playlist": 732,
		"plays": 36,
		"days_ago_last_played": 30,
		"skips": 10,
		"rating": 7
	},
	{
		"song_name": "Snowblind (ft. Tasha Baxter)",
		"artist": "Au5",
		"seconds_long": 347,
		"days_since_added_to_playlist": 235,
		"plays": 7,
		"days_ago_last_played": 48,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Adventure Of A Lifetime (Remix)",
		"artist": "Audien",
		"origial_artist": "Coldplay",
		"seconds_long": 210,
		"days_since_added_to_playlist": 280,
		"plays": 15,
		"days_ago_last_played": 20,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "MATOI",
		"artist": "awfuless, Zekk",
		"seconds_long": 264,
		"days_since_added_to_playlist": 108,
		"plays": 6,
		"days_ago_last_played": 51,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "MATOI -phase L-",
		"artist": "awfuless, Zekk",
		"seconds_long": 124,
		"days_since_added_to_playlist": 108,
		"plays": 14,
		"days_ago_last_played": 20,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Build a Bitch",
		"artist": "Bella Poarch",
		"seconds_long": 123,
		"days_since_added_to_playlist": 257,
		"plays": 16,
		"days_ago_last_played": 47,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Good Egg (Remix)",
		"artist": "Ben Briggs",
		"seconds_long": 216,
		"days_since_added_to_playlist": 358,
		"plays": 10,
		"days_ago_last_played": 45,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Gusty Garden (Remix)",
		"artist": "Ben Briggs",
		"seconds_long": 137,
		"days_since_added_to_playlist": 358,
		"plays": 8,
		"days_ago_last_played": 36,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Napstablook MegaMix",
		"artist": "Ben Briggs",
		"seconds_long": 229,
		"days_since_added_to_playlist": 477,
		"plays": 9,
		"days_ago_last_played": 60,
		"skips": 10,
		"rating": 7
	},
	{
		"song_name": "Happier Than Ever",
		"artist": "Billie Eilish",
		"album": "Happier Than Ever",
		"seconds_long": 315,
		"days_since_added_to_playlist": 532,
		"plays": 16,
		"days_ago_last_played": 10,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Bellyache",
		"artist": "Billie Eilish",
		"seconds_long": 179,
		"days_since_added_to_playlist": 129,
		"plays": 8,
		"days_ago_last_played": 47,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Getting Older",
		"artist": "Billie Eilish",
		"seconds_long": 244,
		"days_since_added_to_playlist": 532,
		"plays": 33,
		"days_ago_last_played": 54,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "I Didn’t Change My Number",
		"artist": "Billie Eilish",
		"seconds_long": 158,
		"days_since_added_to_playlist": 129,
		"plays": 14,
		"days_ago_last_played": 43,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "idontwannabeyouanymore",
		"artist": "Billie Eilish",
		"seconds_long": 204,
		"days_since_added_to_playlist": 129,
		"plays": 20,
		"days_ago_last_played": 17,
		"skips": 4,
		"rating": 8
	},
	{
		"song_name": "NDA",
		"artist": "Billie Eilish",
		"seconds_long": 216,
		"days_since_added_to_playlist": 129,
		"plays": 5,
		"days_ago_last_played": 18,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "OverHeated",
		"artist": "Billie Eilish",
		"seconds_long": 214,
		"days_since_added_to_playlist": 532,
		"plays": 16,
		"days_ago_last_played": 185,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Therefore I Am",
		"artist": "Billie Eilish",
		"seconds_long": 174,
		"days_since_added_to_playlist": 129,
		"plays": 18,
		"days_ago_last_played": 33,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "First Degree",
		"artist": "Bingx, CHVSE",
		"album": "L.L.A.C.",
		"seconds_long": 228,
		"days_since_added_to_playlist": 56,
		"plays": 6,
		"days_ago_last_played": 18,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Pump It",
		"artist": "The Black Eyed Peas",
		"seconds_long": 213,
		"days_since_added_to_playlist": 252,
		"plays": 16,
		"days_ago_last_played": 117,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Xeraphinite",
		"artist": "BlackY",
		"seconds_long": 147,
		"days_since_added_to_playlist": 182,
		"plays": 16,
		"days_ago_last_played": 10,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Body & Mind",
		"artist": "Blaine Stranger",
		"seconds_long": 234,
		"days_since_added_to_playlist": 218,
		"plays": 10,
		"days_ago_last_played": 16,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Polaroids of You",
		"artist": "Boxplot, Ownglow",
		"seconds_long": 333,
		"days_since_added_to_playlist": 267,
		"plays": 14,
		"days_ago_last_played": 16,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "I'm not dead.",
		"artist": "Boyinaband",
		"seconds_long": 202,
		"days_since_added_to_playlist": 646,
		"plays": 26,
		"days_ago_last_played": 10,
		"skips": 9,
		"rating": 7
	},
	{
		"song_name": "Pointless Fast Rap",
		"artist": "boyinaband",
		"seconds_long": 87,
		"days_since_added_to_playlist": 646,
		"plays": 27,
		"days_ago_last_played": 43,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "The Promise (Remix)",
		"artist": "Boyinaband",
		"seconds_long": 270,
		"days_since_added_to_playlist": 646,
		"plays": 29,
		"days_ago_last_played": 43,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Spectrum (ft. Cryaotic, Minx)",
		"artist": "Boyinaband",
		"seconds_long": 267,
		"days_since_added_to_playlist": 646,
		"plays": 23,
		"days_ago_last_played": 13,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "My Anxiety",
		"artist": "Cal Scruby",
		"seconds_long": 189,
		"days_since_added_to_playlist": 56,
		"plays": 6,
		"days_ago_last_played": 40,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Blame (ft. John Newman)",
		"artist": "Calvin Harris",
		"seconds_long": 211,
		"days_since_added_to_playlist": 255,
		"plays": 11,
		"days_ago_last_played": 60,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "B L A C K - R A Y",
		"artist": "Camellia",
		"album": "Blackmagik Blazing",
		"seconds_long": 278,
		"days_since_added_to_playlist": 630,
		"plays": 22,
		"days_ago_last_played": 17,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Lúin øf Celtchaя",
		"artist": "Camellia",
		"album": "Blackmagik Blazing",
		"seconds_long": 319,
		"days_since_added_to_playlist": 630,
		"plays": 12,
		"days_ago_last_played": 10,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Nasty * Nasty * Spell",
		"artist": "Camellia",
		"album": "Blackmagik Blazing",
		"seconds_long": 264,
		"days_since_added_to_playlist": 774,
		"plays": 26,
		"days_ago_last_played": 16,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "NIGHTMARE † CITY",
		"artist": "Camellia",
		"album": "Blackmagik Blazing",
		"seconds_long": 432,
		"days_since_added_to_playlist": 887,
		"plays": 27,
		"days_ago_last_played": 10,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "SECRET BOSS",
		"artist": "Camellia",
		"album": "Blackmagik Blazing",
		"seconds_long": 273,
		"days_since_added_to_playlist": 630,
		"plays": 20,
		"days_ago_last_played": 14,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "///Under Construxion///",
		"artist": "Camellia",
		"album": "Blackmagik Blazing",
		"seconds_long": 285,
		"days_since_added_to_playlist": 734,
		"plays": 23,
		"days_ago_last_played": 13,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "wanna go to a beach! VS. Resort Sunset",
		"artist": "Camellia",
		"album": "Camellia \nGuest Tracks\n Summary and VIPs 01",
		"seconds_long": 303,
		"days_since_added_to_playlist": 630,
		"plays": 17,
		"days_ago_last_played": 13,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "crystallized",
		"artist": "Camellia",
		"album": "crystallized",
		"seconds_long": 277,
		"days_since_added_to_playlist": 887,
		"plays": 40,
		"days_ago_last_played": 16,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Light It Up",
		"artist": "Camellia",
		"album": "crystallized",
		"seconds_long": 374,
		"days_since_added_to_playlist": 630,
		"plays": 15,
		"days_ago_last_played": 96,
		"skips": 7,
		"rating": 8
	},
	{
		"song_name": "Dans la mer de son",
		"artist": "Camellia",
		"album": "Cyphisonia",
		"seconds_long": 400,
		"days_since_added_to_playlist": 626,
		"plays": 29,
		"days_ago_last_played": 42,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "GHOST",
		"artist": "Camellia",
		"album": "Cyphisonia",
		"seconds_long": 349,
		"days_since_added_to_playlist": 626,
		"plays": 19,
		"days_ago_last_played": 13,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Flower of Wilderness",
		"artist": "Camellia",
		"album": "DESTOPIA",
		"seconds_long": 341,
		"days_since_added_to_playlist": 630,
		"plays": 21,
		"days_ago_last_played": 12,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "[diffraction]",
		"artist": "Camellia",
		"album": "[diffraction]",
		"seconds_long": 352,
		"days_since_added_to_playlist": 630,
		"plays": 13,
		"days_ago_last_played": 44,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Asymmetric Snowflakes",
		"artist": "Camellia",
		"album": "Flowers Unfold Re:Bloom",
		"seconds_long": 273,
		"days_since_added_to_playlist": 627,
		"plays": 15,
		"days_ago_last_played": 16,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "{albus}",
		"artist": "Camellia",
		"album": "GALAXY BURST",
		"seconds_long": 275,
		"days_since_added_to_playlist": 630,
		"plays": 36,
		"days_ago_last_played": 9,
		"skips": 4,
		"rating": 8
	},
	{
		"song_name": "Chirality",
		"artist": "Camellia",
		"album": "GALAXY BURST",
		"seconds_long": 265,
		"days_since_added_to_playlist": 630,
		"plays": 17,
		"days_ago_last_played": 13,
		"skips": 2,
		"rating": 8
	},
	{
		"song_name": "You Are F**king Noob!!!!",
		"artist": "Camellia",
		"album": "GALAXY BURST",
		"seconds_long": 265,
		"days_since_added_to_playlist": 630,
		"plays": 17,
		"days_ago_last_played": 16,
		"skips": 4,
		"rating": 8
	},
	{
		"song_name": "Συζυγία (Syzygía)",
		"artist": "Camellia",
		"album": "GALAXY BURST",
		"seconds_long": 260,
		"days_since_added_to_playlist": 630,
		"plays": 30,
		"days_ago_last_played": 13,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Embracing intelligences",
		"artist": "Camellia",
		"album": "heart of android",
		"seconds_long": 223,
		"days_since_added_to_playlist": 769,
		"plays": 35,
		"days_ago_last_played": 42,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Even If It's Only By Mechanism",
		"artist": "Camellia",
		"album": "heart of android",
		"seconds_long": 263,
		"days_since_added_to_playlist": 769,
		"plays": 35,
		"days_ago_last_played": 16,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "[ns]",
		"artist": "Camellia",
		"album": "heart of android",
		"seconds_long": 290,
		"days_since_added_to_playlist": 771,
		"plays": 34,
		"days_ago_last_played": 13,
		"skips": 4,
		"rating": 8
	},
	{
		"song_name": "This Future (we didn't expect)",
		"artist": "Camellia",
		"album": "heart of android",
		"seconds_long": 261,
		"days_since_added_to_playlist": 773,
		"plays": 34,
		"days_ago_last_played": 16,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Tojita Sekai",
		"artist": "Camellia",
		"album": "heart of android",
		"seconds_long": 421,
		"days_since_added_to_playlist": 769,
		"plays": 34,
		"days_ago_last_played": 9,
		"skips": 7,
		"rating": 8
	},
	{
		"song_name": "Upload Your Mind :: Download My Soul",
		"artist": "Camellia",
		"album": "heart of android",
		"seconds_long": 284,
		"days_since_added_to_playlist": 773,
		"plays": 60,
		"days_ago_last_played": 12,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "fastest crash",
		"artist": "Camellia",
		"album": "paroxysm",
		"seconds_long": 370,
		"days_since_added_to_playlist": 630,
		"plays": 31,
		"days_ago_last_played": 13,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "Night Fog (ft. Luschel)",
		"artist": "Camellia",
		"album": "SPD GAR",
		"seconds_long": 299,
		"days_since_added_to_playlist": 630,
		"plays": 27,
		"days_ago_last_played": 16,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Canned Sunset",
		"artist": "Camellia",
		"album": "Stance on Wave",
		"seconds_long": 291,
		"days_since_added_to_playlist": 729,
		"plays": 36,
		"days_ago_last_played": 10,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "farewell to today",
		"artist": "Camellia",
		"album": "sudden shower",
		"seconds_long": 299,
		"days_since_added_to_playlist": 729,
		"plays": 24,
		"days_ago_last_played": 42,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "BAD ACCESS",
		"artist": "Camellia",
		"album": "Tera I/O",
		"seconds_long": 311,
		"days_since_added_to_playlist": 887,
		"plays": 59,
		"days_ago_last_played": 48,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "M1LLI0N PP",
		"artist": "Camellia",
		"album": "Tera I/O",
		"seconds_long": 430,
		"days_since_added_to_playlist": 887,
		"plays": 55,
		"days_ago_last_played": 117,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "путь льда",
		"artist": "Camellia",
		"album": "ThanksFollowers40K",
		"seconds_long": 305,
		"days_since_added_to_playlist": 630,
		"plays": 25,
		"days_ago_last_played": 42,
		"skips": 3,
		"rating": 8
	},
	{
		"song_name": "FINAL BLENDERMAN APPEARED. (feat. RichaadEB)",
		"artist": "Camellia",
		"album": "U.U.F.O.",
		"seconds_long": 282,
		"days_since_added_to_playlist": 597,
		"plays": 22,
		"days_ago_last_played": 39,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "GHOUL",
		"artist": "Camellia",
		"album": "U.U.F.O.",
		"seconds_long": 274,
		"days_since_added_to_playlist": 597,
		"plays": 15,
		"days_ago_last_played": 13,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "KillerToy",
		"artist": "Camellia",
		"album": "U.U.F.O.",
		"seconds_long": 280,
		"days_since_added_to_playlist": 597,
		"plays": 22,
		"days_ago_last_played": 79,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "Myths You Forgot (ft. Toby Fox)",
		"artist": "Camellia",
		"album": "U.U.F.O.",
		"seconds_long": 258,
		"days_since_added_to_playlist": 597,
		"plays": 33,
		"days_ago_last_played": 69,
		"skips": 10,
		"rating": 8
	},
	{
		"song_name": "POLYBIUS GB SPEEDRUN (Glitchless 100% WR in 0:03:57)",
		"artist": "Camellia",
		"album": "U.U.F.O.",
		"seconds_long": 248,
		"days_since_added_to_playlist": 597,
		"plays": 23,
		"days_ago_last_played": 24,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "SLIME INCIDENT",
		"artist": "Camellia",
		"album": "U.U.F.O.",
		"seconds_long": 308,
		"days_since_added_to_playlist": 597,
		"plays": 13,
		"days_ago_last_played": 13,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Tentaclar Aliens' Epic Extraterretterrestrial Jungle Dance Party",
		"artist": "Camellia",
		"album": "U.U.F.O.",
		"seconds_long": 306,
		"days_since_added_to_playlist": 597,
		"plays": 14,
		"days_ago_last_played": 44,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "We Magicians Still Alive in 2021",
		"artist": "Camellia",
		"album": "U.U.F.O.",
		"seconds_long": 333,
		"days_since_added_to_playlist": 597,
		"plays": 24,
		"days_ago_last_played": 82,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Completeness Under Incompleteness",
		"artist": "Camellia",
		"album": "Xronial Xero",
		"seconds_long": 125,
		"days_since_added_to_playlist": 630,
		"plays": 12,
		"days_ago_last_played": 44,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Newspapers for Magicians",
		"artist": "Camellia",
		"album": "60+3+10k",
		"seconds_long": 293,
		"days_since_added_to_playlist": 887,
		"plays": 47,
		"days_ago_last_played": 60,
		"skips": 13,
		"rating": 7
	},
	{
		"song_name": "Another Xronixle",
		"artist": "Camellia",
		"seconds_long": 345,
		"days_since_added_to_playlist": 627,
		"plays": 20,
		"days_ago_last_played": 30,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Artificial Snow",
		"artist": "Camellia",
		"seconds_long": 266,
		"days_since_added_to_playlist": 731,
		"plays": 18,
		"days_ago_last_played": 16,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "AttraqtiA",
		"artist": "Camellia",
		"seconds_long": 167,
		"days_since_added_to_playlist": 774,
		"plays": 39,
		"days_ago_last_played": 9,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "BIG SHOT (Remix)",
		"artist": "Camellia",
		"origial_artist": "Toby Fox",
		"seconds_long": 292,
		"days_since_added_to_playlist": 521,
		"plays": 27,
		"days_ago_last_played": 79,
		"skips": 10,
		"rating": 8
	},
	{
		"song_name": "chrono diver -fragment-  (\ncrossroads of chrono\n Remix)",
		"artist": "Camellia",
		"seconds_long": 323,
		"days_since_added_to_playlist": 630,
		"plays": 20,
		"days_ago_last_played": 96,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Feelin Sky (Self Remix)",
		"artist": "Camellia",
		"seconds_long": 389,
		"days_since_added_to_playlist": 734,
		"plays": 23,
		"days_ago_last_played": 16,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Final Flash Flight",
		"artist": "Camellia",
		"seconds_long": 146,
		"days_since_added_to_playlist": 374,
		"plays": 22,
		"days_ago_last_played": 81,
		"skips": 12,
		"rating": 8
	},
	{
		"song_name": "Flash Me Back",
		"artist": "Camellia",
		"seconds_long": 327,
		"days_since_added_to_playlist": 122,
		"plays": 10,
		"days_ago_last_played": 13,
		"skips": 3,
		"rating": 8
	},
	{
		"song_name": "LowerMost Revolt (ft. Kagekiha Gakusei)",
		"artist": "Camellia",
		"seconds_long": 304,
		"days_since_added_to_playlist": 626,
		"plays": 20,
		"days_ago_last_played": 10,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Maboroshi",
		"artist": "Camellia",
		"seconds_long": 178,
		"days_since_added_to_playlist": 630,
		"plays": 20,
		"days_ago_last_played": 82,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "METAVERSE DO BE LIKE THIS",
		"artist": "Camellia",
		"seconds_long": 155,
		"days_since_added_to_playlist": 29,
		"plays": 1,
		"days_ago_last_played": 27,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Nacreous Snowmelt",
		"artist": "Camellia",
		"seconds_long": 440,
		"days_since_added_to_playlist": 887,
		"plays": 38,
		"days_ago_last_played": 16,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "NITROUS CANNON",
		"artist": "Camellia",
		"seconds_long": 286,
		"days_since_added_to_playlist": 630,
		"plays": 11,
		"days_ago_last_played": 45,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Petals (ft. Nanahira)",
		"artist": "Camellia",
		"seconds_long": 348,
		"days_since_added_to_playlist": 630,
		"plays": 23,
		"days_ago_last_played": 16,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Quantum Entanglement",
		"artist": "Camellia",
		"seconds_long": 338,
		"days_since_added_to_playlist": 630,
		"plays": 20,
		"days_ago_last_played": 17,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "The weight of a heart",
		"artist": "Camellia",
		"seconds_long": 312,
		"days_since_added_to_playlist": 630,
		"plays": 19,
		"days_ago_last_played": 9,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Z:iRNiTRA",
		"artist": "Camellia",
		"seconds_long": 381,
		"days_since_added_to_playlist": 626,
		"plays": 24,
		"days_ago_last_played": 43,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "#1f1e33",
		"artist": "Camellia",
		"seconds_long": 167,
		"days_since_added_to_playlist": 627,
		"plays": 22,
		"days_ago_last_played": 10,
		"skips": 3,
		"rating": 8
	},
	{
		"song_name": "Toki no shūchaku-ten (ft. Hanatan, YURICa)",
		"artist": "Camellia",
		"seconds_long": 308,
		"days_since_added_to_playlist": 627,
		"plays": 18,
		"days_ago_last_played": 10,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Railgun Roulette",
		"artist": "Camellia, Akira Complex",
		"album": "Reality Distortion",
		"seconds_long": 247,
		"days_since_added_to_playlist": 773,
		"plays": 56,
		"days_ago_last_played": 12,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Kallisto",
		"artist": "Camo, Krooked, Mefjus",
		"seconds_long": 346,
		"days_since_added_to_playlist": 267,
		"plays": 20,
		"days_ago_last_played": 42,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Captain Disillusion Theme",
		"artist": "Captain Disillusion",
		"album": "Captain Disillusion Soundtrack",
		"seconds_long": 70,
		"days_since_added_to_playlist": 102,
		"plays": 17,
		"days_ago_last_played": 10,
		"skips": 3,
		"rating": 8
	},
	{
		"song_name": "Overtime",
		"artist": "Cash Cash",
		"seconds_long": 245,
		"days_since_added_to_playlist": 280,
		"plays": 12,
		"days_ago_last_played": 20,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Aquamarine",
		"artist": "Cashew",
		"seconds_long": 155,
		"days_since_added_to_playlist": 556,
		"plays": 19,
		"days_ago_last_played": 69,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Blanket Fort",
		"artist": "Catmosphere",
		"seconds_long": 173,
		"days_since_added_to_playlist": 1250,
		"plays": 42,
		"days_ago_last_played": 92,
		"skips": 14,
		"rating": 7
	},
	{
		"song_name": "Want U Back",
		"artist": "Cher Lloyd",
		"seconds_long": 214,
		"days_since_added_to_playlist": 253,
		"plays": 14,
		"days_ago_last_played": 36,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Sober",
		"artist": "Childish Gambino",
		"seconds_long": 252,
		"days_since_added_to_playlist": 307,
		"plays": 12,
		"days_ago_last_played": 11,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Fine China",
		"artist": "Chris Brown",
		"seconds_long": 214,
		"days_since_added_to_playlist": 253,
		"plays": 15,
		"days_ago_last_played": 44,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "City of Tears",
		"artist": "Christopher Larkin",
		"album": "Hollow Knight Original Soundtrack",
		"seconds_long": 178,
		"days_since_added_to_playlist": 386,
		"plays": 20,
		"days_ago_last_played": 57,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "City of Tears (Inside)",
		"artist": "Christopher Larkin",
		"album": "Hollow Knight Original Soundtrack",
		"seconds_long": 312,
		"days_since_added_to_playlist": 386,
		"plays": 27,
		"days_ago_last_played": 54,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Daughter of Hallownest",
		"artist": "Christopher Larkin",
		"album": "Hollow Knight Original Soundtrack",
		"seconds_long": 176,
		"days_since_added_to_playlist": 388,
		"plays": 10,
		"days_ago_last_played": 12,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Enter Hallownest",
		"artist": "Christopher Larkin",
		"album": "Hollow Knight Original Soundtrack",
		"seconds_long": 89,
		"days_since_added_to_playlist": 52,
		"plays": 2,
		"days_ago_last_played": 12,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "The Grimm Troupe",
		"artist": "Christopher Larkin",
		"album": "Hollow Knight Original Soundtrack",
		"seconds_long": 138,
		"days_since_added_to_playlist": 386,
		"plays": 5,
		"days_ago_last_played": 49,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "Pale Court",
		"artist": "Christopher Larkin",
		"album": "Hollow Knight Original Soundtrack",
		"seconds_long": 233,
		"days_since_added_to_playlist": 56,
		"plays": 2,
		"days_ago_last_played": 12,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Sealed Vessel",
		"artist": "Christopher Larkin",
		"album": "Hollow Knight Original Soundtrack",
		"seconds_long": 345,
		"days_since_added_to_playlist": 386,
		"plays": 6,
		"days_ago_last_played": 49,
		"skips": 22,
		"rating": 7
	},
	{
		"song_name": "Soul Sanctum",
		"artist": "Christopher Larkin",
		"album": "Hollow Knight Original Soundtrack",
		"seconds_long": 270,
		"days_since_added_to_playlist": 386,
		"plays": 31,
		"days_ago_last_played": 10,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "White Palace",
		"artist": "Christopher Larkin",
		"album": "Hollow Knight Original Soundtrack",
		"seconds_long": 259,
		"days_since_added_to_playlist": 386,
		"plays": 39,
		"days_ago_last_played": 10,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Blackout",
		"artist": "CHVSE",
		"seconds_long": 221,
		"days_since_added_to_playlist": 54,
		"plays": 3,
		"days_ago_last_played": 39,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Level Up",
		"artist": "Ciara",
		"seconds_long": 204,
		"days_since_added_to_playlist": 257,
		"plays": 15,
		"days_ago_last_played": 44,
		"skips": 2,
		"rating": 7,
		"link": "https://www.youtube.com/watch?v=Dh-ULbQmmF8",
		"genre": "Dance-pop",
	},
	{
		"song_name": "Ai To Zou",
		"artist": "CIVILIAN",
		"album": "AitoZou Special Edition",
		"seconds_long": 223,
		"days_since_added_to_playlist": 86,
		"plays": 5,
		"days_ago_last_played": 62,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "LOVE HATE DRAMA",
		"artist": "CIVILIAN",
		"album": "AitoZou Special Edition",
		"seconds_long": 218,
		"days_since_added_to_playlist": 86,
		"plays": 7,
		"days_ago_last_played": 28,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Seikai Fuseikai",
		"artist": "CIVILIAN",
		"album": "Toumei",
		"seconds_long": 249,
		"days_since_added_to_playlist": 249,
		"plays": 22,
		"days_ago_last_played": 12,
		"skips": 5,
		"rating": 8
	},
	{
		"song_name": "Bokurano Shouninsenso",
		"artist": "CIVILIAN, majiko",
		"album": "Kaikou No Gozen Reiji",
		"seconds_long": 259,
		"days_since_added_to_playlist": 39,
		"plays": 0,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Fiat",
		"artist": "Cody Ko, Matt Miggz",
		"seconds_long": 165,
		"days_since_added_to_playlist": 86,
		"plays": 12,
		"days_ago_last_played": 33,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Amuse Bouche (Reprise)",
		"artist": "Colin Stetson",
		"album": "The Menu Original Motion Picture Soundtrack",
		"seconds_long": 127,
		"days_since_added_to_playlist": 113,
		"plays": 5,
		"days_ago_last_played": 1,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "The Purifying Flame",
		"artist": "Colin Stetson",
		"album": "The Menu Original Motion Picture Soundtrack",
		"seconds_long": 324,
		"days_since_added_to_playlist": 113,
		"plays": 37,
		"days_ago_last_played": 57,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "A Revolution in Cuisine",
		"artist": "Colin Stetson",
		"album": "The Menu Original Motion Picture Soundtrack",
		"seconds_long": 99,
		"days_since_added_to_playlist": 113,
		"plays": 23,
		"days_ago_last_played": 41,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Taco Tuesday",
		"artist": "Colin Stetson",
		"album": "The Menu Original Motion Picture Soundtrack",
		"seconds_long": 130,
		"days_since_added_to_playlist": 113,
		"plays": 19,
		"days_ago_last_played": 16,
		"skips": 11,
		"rating": 7
	},
	{
		"song_name": "comfy vibes",
		"artist": "comfi beats",
		"seconds_long": 193,
		"days_since_added_to_playlist": 853,
		"plays": 54,
		"days_ago_last_played": 15,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "dreamy night",
		"artist": "comfi beats",
		"seconds_long": 245,
		"days_since_added_to_playlist": 853,
		"plays": 50,
		"days_ago_last_played": 58,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "POM☆POM",
		"artist": "comfi beats",
		"seconds_long": 173,
		"days_since_added_to_playlist": 482,
		"plays": 27,
		"days_ago_last_played": 43,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "these days it's hard to find the words",
		"artist": "comfi beats",
		"seconds_long": 168,
		"days_since_added_to_playlist": 853,
		"plays": 74,
		"days_ago_last_played": 15,
		"skips": 21,
		"rating": 7
	},
	{
		"song_name": "agoraphobic",
		"artist": "CORPSE",
		"seconds_long": 129,
		"days_since_added_to_playlist": 80,
		"plays": 11,
		"days_ago_last_played": 49,
		"skips": 9,
		"rating": 7
	},
	{
		"song_name": "Nhato",
		"artist": "Cosmica",
		"seconds_long": 145,
		"days_since_added_to_playlist": 182,
		"plays": 16,
		"days_ago_last_played": 10,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Dement After Legend",
		"artist": "Cosmograph, Lunatic Sounds",
		"album": "The Legend",
		"seconds_long": 237,
		"days_since_added_to_playlist": 56,
		"plays": 20,
		"days_ago_last_played": 17,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Need You Now",
		"artist": "Crissy Criss",
		"seconds_long": 292,
		"days_since_added_to_playlist": 218,
		"plays": 8,
		"days_ago_last_played": 16,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Panic Room (Drum And Bass Remix)",
		"artist": "Culture Shock",
		"origial_artist": "Au/Ra",
		"seconds_long": 282,
		"days_since_added_to_playlist": 218,
		"plays": 20,
		"days_ago_last_played": 41,
		"skips": 3,
		"rating": 8
	},
	{
		"song_name": "Bloodline (ft. Raphaella)",
		"artist": "Cyantific",
		"seconds_long": 246,
		"days_since_added_to_playlist": 218,
		"plays": 10,
		"days_ago_last_played": 45,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Fade Into The Night",
		"artist": "Cyantific",
		"seconds_long": 287,
		"days_since_added_to_playlist": 218,
		"plays": 25,
		"days_ago_last_played": 46,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "All I Want",
		"artist": "Cyantific, T & Sugah",
		"seconds_long": 277,
		"days_since_added_to_playlist": 267,
		"plays": 11,
		"days_ago_last_played": 45,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Babaroque",
		"artist": "cYsmix",
		"seconds_long": 287,
		"days_since_added_to_playlist": 340,
		"plays": 20,
		"days_ago_last_played": 23,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Record Player",
		"artist": "Daisy The Great, AJR",
		"seconds_long": 154,
		"days_since_added_to_playlist": 122,
		"plays": 7,
		"days_ago_last_played": 47,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "I Still Love You",
		"artist": "Dan Salvato",
		"album": "Doki Doki Literature Club! Original Soundtrack",
		"seconds_long": 163,
		"days_since_added_to_playlist": 37,
		"plays": 2,
		"days_ago_last_played": 37,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Ohayou Sayori!",
		"artist": "Dan Salvato",
		"album": "Doki Doki Literature Club! Original Soundtrack",
		"seconds_long": 163,
		"days_since_added_to_playlist": 37,
		"plays": 2,
		"days_ago_last_played": 37,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Sayo-nara",
		"artist": "Dan Salvato",
		"album": "Doki Doki Literature Club! Original Soundtrack",
		"seconds_long": 157,
		"days_since_added_to_playlist": 37,
		"plays": 4,
		"days_ago_last_played": 1,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Poems Are Forever",
		"artist": "Dan Salvato, shoji",
		"album": "Doki Doki Literature Club! Original Soundtrack",
		"seconds_long": 221,
		"days_since_added_to_playlist": 37,
		"plays": 2,
		"days_ago_last_played": 31,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "BOX 15",
		"artist": "Danganronpa 1",
		"album": "Danganronpa 1 Original Soundtrack",
		"seconds_long": 245,
		"days_since_added_to_playlist": 328,
		"plays": 3,
		"days_ago_last_played": 17,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "BOX 16",
		"artist": "Danganronpa 1",
		"album": "Danganronpa 1 Original Soundtrack",
		"seconds_long": 332,
		"days_since_added_to_playlist": 328,
		"plays": 6,
		"days_ago_last_played": 17,
		"skips": 15,
		"rating": 7
	},
	{
		"song_name": "New World Order",
		"artist": "Danganronpa 1",
		"album": "Danganronpa 1 Original Soundtrack",
		"seconds_long": 284,
		"days_since_added_to_playlist": 328,
		"plays": 1,
		"days_ago_last_played": 325,
		"skips": 23,
		"rating": 7
	},
	{
		"song_name": "Not Today",
		"artist": "Dashel",
		"seconds_long": 165,
		"days_since_added_to_playlist": 95,
		"plays": 13,
		"days_ago_last_played": 16,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "THINK AGAIN",
		"artist": "Dashel",
		"seconds_long": 167,
		"days_since_added_to_playlist": 135,
		"plays": 11,
		"days_ago_last_played": 45,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "All I Wanted",
		"artist": "Daughter",
		"album": "Life Is Strange: Before The Storm Soundtrack",
		"seconds_long": 201,
		"days_since_added_to_playlist": 202,
		"plays": 22,
		"days_ago_last_played": 34,
		"skips": 14,
		"rating": 7
	},
	{
		"song_name": "Dreams of William",
		"artist": "Daughter",
		"album": "Life Is Strange: Before The Storm Soundtrack",
		"seconds_long": 257,
		"days_since_added_to_playlist": 202,
		"plays": 33,
		"days_ago_last_played": 14,
		"skips": 9,
		"rating": 7
	},
	{
		"song_name": "Flaws",
		"artist": "Daughter",
		"album": "Life Is Strange: Before The Storm Soundtrack",
		"seconds_long": 173,
		"days_since_added_to_playlist": 202,
		"plays": 39,
		"days_ago_last_played": 13,
		"skips": 7,
		"rating": 8
	},
	{
		"song_name": "Witches",
		"artist": "Daughter",
		"album": "Life Is Strange: Before The Storm Soundtrack",
		"seconds_long": 186,
		"days_since_added_to_playlist": 202,
		"plays": 121,
		"days_ago_last_played": 54,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "All I Wanted (Live at Asylum Chapel)",
		"artist": "Daughter",
		"seconds_long": 226,
		"days_since_added_to_playlist": 101,
		"plays": 12,
		"days_ago_last_played": 10,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Home",
		"artist": "Daughter",
		"seconds_long": 256,
		"days_since_added_to_playlist": 101,
		"plays": 12,
		"days_ago_last_played": 10,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Run",
		"artist": "Daughter",
		"seconds_long": 245,
		"days_since_added_to_playlist": 101,
		"plays": 12,
		"days_ago_last_played": 43,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "She Wolf (ft. Sia)",
		"artist": "David Guetta",
		"seconds_long": 211,
		"days_since_added_to_playlist": 253,
		"plays": 26,
		"days_ago_last_played": 10,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Ichiban no Takaramono",
		"artist": "David Guthrie Music, chiisana",
		"seconds_long": 377,
		"days_since_added_to_playlist": 40,
		"plays": 2,
		"days_ago_last_played": 19,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Take Control",
		"artist": "Dawn Wall",
		"seconds_long": 270,
		"days_since_added_to_playlist": 267,
		"plays": 21,
		"days_ago_last_played": 33,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Book Of Revelations",
		"artist": "Dax",
		"album": "I'll Say It For You",
		"seconds_long": 204,
		"days_since_added_to_playlist": 54,
		"plays": 8,
		"days_ago_last_played": 1,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Dear God",
		"artist": "Dax",
		"album": "I'll Say It For You",
		"seconds_long": 203,
		"days_since_added_to_playlist": 55,
		"plays": 3,
		"days_ago_last_played": 17,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "She Cheated Again",
		"artist": "Dax",
		"seconds_long": 167,
		"days_since_added_to_playlist": 56,
		"plays": 5,
		"days_ago_last_played": 34,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Last Claim",
		"artist": "DBangz",
		"seconds_long": 177,
		"days_since_added_to_playlist": 56,
		"plays": 6,
		"days_ago_last_played": 9,
		"skips": 3,
		"rating": 8
	},
	{
		"song_name": "Kolaa",
		"artist": "Diode",
		"seconds_long": 140,
		"days_since_added_to_playlist": 190,
		"plays": 11,
		"days_ago_last_played": 16,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "La'qryma of the Wasteland",
		"artist": "DJ Noriken",
		"album": "N+CODE",
		"seconds_long": 302,
		"days_since_added_to_playlist": 190,
		"plays": 18,
		"days_ago_last_played": 17,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "ANIMA (Drumstep Remix) (ft. Nyamai)",
		"artist": "dj-Jo",
		"seconds_long": 290,
		"days_since_added_to_playlist": 440,
		"plays": 30,
		"days_ago_last_played": 13,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Bravely You (ft. Akano) (Remix)",
		"artist": "dj-Jo",
		"seconds_long": 355,
		"days_since_added_to_playlist": 442,
		"plays": 15,
		"days_ago_last_played": 28,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Gusty Garden (Remix)",
		"artist": "DJ-VipFlash",
		"seconds_long": 178,
		"days_since_added_to_playlist": 358,
		"plays": 9,
		"days_ago_last_played": 16,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Soul Sanctum (Musicbox Cover)",
		"artist": "DK's Musicbox",
		"seconds_long": 255,
		"days_since_added_to_playlist": 386,
		"plays": 16,
		"days_ago_last_played": 13,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Say So",
		"artist": "Doja Cat",
		"seconds_long": 238,
		"days_since_added_to_playlist": 257,
		"plays": 20,
		"days_ago_last_played": 45,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Rita (Shikkoku no Sharnoth)",
		"artist": "Dorchadas",
		"seconds_long": 278,
		"days_since_added_to_playlist": 731,
		"plays": 22,
		"days_ago_last_played": 43,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "ロミオとシンデレラ (Zekk Remix) (ft. 初音ミク)",
		"artist": "doriko",
		"seconds_long": 181,
		"days_since_added_to_playlist": 182,
		"plays": 21,
		"days_ago_last_played": 43,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "My Soul, Your Beats! (Remix)",
		"artist": "Dr. SparX Beats",
		"seconds_long": 198,
		"days_since_added_to_playlist": 442,
		"plays": 20,
		"days_ago_last_played": 33,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Journey to Windrise (ft. aadajuulia)",
		"artist": "DraGonis",
		"seconds_long": 167,
		"days_since_added_to_playlist": 301,
		"plays": 15,
		"days_ago_last_played": 44,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Final Bowser Battle (Guitar Cover)",
		"artist": "DSC",
		"seconds_long": 168,
		"days_since_added_to_playlist": 358,
		"plays": 15,
		"days_ago_last_played": 70,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "Blow Your Mind (mwah)",
		"artist": "Dua Lipa",
		"seconds_long": 179,
		"days_since_added_to_playlist": 256,
		"plays": 9,
		"days_ago_last_played": 46,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "IGNITE",
		"artist": "Eir Aoi",
		"album": "D'AZUR",
		"seconds_long": 243,
		"days_since_added_to_playlist": 86,
		"plays": 14,
		"days_ago_last_played": 12,
		"skips": 3,
		"rating": 8
	},
	{
		"song_name": "When I'm Gone",
		"artist": "Eminem",
		"album": "Curtain Call: The Hits",
		"seconds_long": 281,
		"days_since_added_to_playlist": 80,
		"plays": 2,
		"days_ago_last_played": 52,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Cleanin' Out My Closet",
		"artist": "Eminem",
		"album": "The Eminem Show",
		"seconds_long": 298,
		"days_since_added_to_playlist": 80,
		"plays": 11,
		"days_ago_last_played": 48,
		"skips": 9,
		"rating": 7
	},
	{
		"song_name": "Square Dance",
		"artist": "Eminem",
		"album": "The Eminem Show",
		"seconds_long": 323,
		"days_since_added_to_playlist": 86,
		"plays": 4,
		"days_ago_last_played": 49,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Without Me",
		"artist": "Eminem",
		"album": "The Eminem Show",
		"seconds_long": 291,
		"days_since_added_to_playlist": 80,
		"plays": 5,
		"days_ago_last_played": 44,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Greatest",
		"artist": "Eminem",
		"album": "Kamikaze",
		"seconds_long": 230,
		"days_since_added_to_playlist": 623,
		"plays": 19,
		"days_ago_last_played": 82,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Lucky You",
		"artist": "Eminem",
		"album": "Kamikaze",
		"seconds_long": 245,
		"days_since_added_to_playlist": 790,
		"plays": 31,
		"days_ago_last_played": 82,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Not Alike (ft. Royce da 5'9)",
		"artist": "Eminem",
		"album": "Kamikaze",
		"seconds_long": 292,
		"days_since_added_to_playlist": 790,
		"plays": 31,
		"days_ago_last_played": 78,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "The Ringer",
		"artist": "Eminem",
		"album": "Kamikaze",
		"seconds_long": 339,
		"days_since_added_to_playlist": 155,
		"plays": 9,
		"days_ago_last_played": 0,
		"skips": 4,
		"rating": 8
	},
	{
		"song_name": "Kill You",
		"artist": "Eminem",
		"album": "The Marshall Mathers LP",
		"seconds_long": 264,
		"days_since_added_to_playlist": 731,
		"plays": 29,
		"days_ago_last_played": 118,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Who Knew",
		"artist": "Eminem",
		"album": "The Marshall Mathers LP",
		"seconds_long": 227,
		"days_since_added_to_playlist": 86,
		"plays": 10,
		"days_ago_last_played": 39,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Darkness",
		"artist": "Eminem",
		"album": "Music to Be Murdered By",
		"seconds_long": 337,
		"days_since_added_to_playlist": 86,
		"plays": 4,
		"days_ago_last_played": 49,
		"skips": 6,
		"rating": 8
	},
	{
		"song_name": "Godzilla (ft. Juice WRLD)",
		"artist": "Eminem",
		"album": "Music to Be Murdered By",
		"seconds_long": 210,
		"days_since_added_to_playlist": 729,
		"plays": 23,
		"days_ago_last_played": 35,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Little Engine",
		"artist": "Eminem",
		"album": "Music to Be Murdered By",
		"seconds_long": 177,
		"days_since_added_to_playlist": 774,
		"plays": 39,
		"days_ago_last_played": 61,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Marsh",
		"artist": "Eminem",
		"album": "Music to Be Murdered By",
		"seconds_long": 200,
		"days_since_added_to_playlist": 86,
		"plays": 6,
		"days_ago_last_played": 52,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Unaccommodating (ft. Young M.A)",
		"artist": "Eminem",
		"album": "Music to Be Murdered By",
		"seconds_long": 216,
		"days_since_added_to_playlist": 729,
		"plays": 22,
		"days_ago_last_played": 46,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Alfred’s Theme",
		"artist": "Eminem",
		"album": "Music to Be Murdered By Side B",
		"seconds_long": 339,
		"days_since_added_to_playlist": 623,
		"plays": 25,
		"days_ago_last_played": 69,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Book of Rhymes (ft. DJ Premier)",
		"artist": "Eminem",
		"album": "Music to Be Murdered By Side B",
		"seconds_long": 289,
		"days_since_added_to_playlist": 813,
		"plays": 63,
		"days_ago_last_played": 43,
		"skips": 6,
		"rating": 8
	},
	{
		"song_name": "GNAT",
		"artist": "Eminem",
		"album": "Music to Be Murdered By Side B",
		"seconds_long": 236,
		"days_since_added_to_playlist": 694,
		"plays": 29,
		"days_ago_last_played": 43,
		"skips": 12,
		"rating": 7
	},
	{
		"song_name": "These Demons",
		"artist": "Eminem",
		"album": "Music to Be Murdered By Side B",
		"seconds_long": 207,
		"days_since_added_to_playlist": 623,
		"plays": 16,
		"days_ago_last_played": 46,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Tone Deaf",
		"artist": "Eminem",
		"album": "Music to Be Murdered By Side B",
		"seconds_long": 290,
		"days_since_added_to_playlist": 623,
		"plays": 23,
		"days_ago_last_played": 33,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Zeus (ft. White Gold)",
		"artist": "Eminem",
		"album": "Music to Be Murdered By Side B",
		"seconds_long": 230,
		"days_since_added_to_playlist": 80,
		"plays": 10,
		"days_ago_last_played": 49,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Offended",
		"artist": "Eminem",
		"album": "Revival",
		"seconds_long": 320,
		"days_since_added_to_playlist": 729,
		"plays": 52,
		"days_ago_last_played": 35,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Brain Damage",
		"artist": "Eminem",
		"album": "The Slim Shady LP",
		"seconds_long": 226,
		"days_since_added_to_playlist": 86,
		"plays": 18,
		"days_ago_last_played": 49,
		"skips": 9,
		"rating": 7
	},
	{
		"song_name": "Guilty Conscience (ft. Dr. Dre)",
		"artist": "Eminem",
		"album": "The Slim Shady LP",
		"seconds_long": 199,
		"days_since_added_to_playlist": 86,
		"plays": 13,
		"days_ago_last_played": 43,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Criminal",
		"artist": "Eminem",
		"seconds_long": 319,
		"days_since_added_to_playlist": 731,
		"plays": 33,
		"days_ago_last_played": 94,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Friday Night Cypher (Eminem's Verse)",
		"artist": "Eminem",
		"seconds_long": 140,
		"days_since_added_to_playlist": 86,
		"plays": 6,
		"days_ago_last_played": 0,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "I'm Back",
		"artist": "Eminem",
		"seconds_long": 309,
		"days_since_added_to_playlist": 623,
		"plays": 17,
		"days_ago_last_played": 118,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Kamikaze",
		"artist": "Eminem",
		"seconds_long": 216,
		"days_since_added_to_playlist": 731,
		"plays": 26,
		"days_ago_last_played": 77,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Lock It Up (ft. Anderson .Paak)",
		"artist": "Eminem",
		"seconds_long": 170,
		"days_since_added_to_playlist": 731,
		"plays": 34,
		"days_ago_last_played": 70,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "The Way I Am",
		"artist": "Eminem",
		"seconds_long": 290,
		"days_since_added_to_playlist": 731,
		"plays": 28,
		"days_ago_last_played": 43,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Black Magic",
		"artist": "Eminem, Skylar Grey",
		"album": "Music to Be Murdered By Side B",
		"seconds_long": 174,
		"days_since_added_to_playlist": 80,
		"plays": 12,
		"days_ago_last_played": 35,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Cutter",
		"artist": "EmoCosine",
		"seconds_long": 145,
		"days_since_added_to_playlist": 56,
		"plays": 3,
		"days_ago_last_played": 44,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Love Kills U",
		"artist": "EmoCosine",
		"seconds_long": 138,
		"days_since_added_to_playlist": 56,
		"plays": 11,
		"days_ago_last_played": 20,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "American Boy (ft. Kanye West)",
		"artist": "Estelle",
		"seconds_long": 308,
		"days_since_added_to_playlist": 252,
		"plays": 9,
		"days_ago_last_played": 46,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Kissing Lucifer",
		"artist": "ETIA.",
		"seconds_long": 146,
		"days_since_added_to_playlist": 182,
		"plays": 20,
		"days_ago_last_played": 11,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Proximity Launchpad Mashup 2015",
		"artist": "Exige",
		"seconds_long": 386,
		"days_since_added_to_playlist": 280,
		"plays": 15,
		"days_ago_last_played": 83,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Wake Up Alone (Remix)",
		"artist": "Fairlane",
		"origial_artist": "The Chainsmokers",
		"seconds_long": 216,
		"days_since_added_to_playlist": 280,
		"plays": 10,
		"days_ago_last_played": 20,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Will Be Love by U",
		"artist": "FAL",
		"seconds_long": 150,
		"days_since_added_to_playlist": 880,
		"plays": 24,
		"days_ago_last_played": 20,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Hornet (Intense Symphonic Metal Cover)",
		"artist": "FalKKonE",
		"seconds_long": 392,
		"days_since_added_to_playlist": 386,
		"plays": 7,
		"days_ago_last_played": 47,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Sealed Vessel (Intense Symphonic Metal Cover)",
		"artist": "FalKKonE",
		"seconds_long": 351,
		"days_since_added_to_playlist": 386,
		"plays": 23,
		"days_ago_last_played": 40,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Kill Command (Metal Remix)",
		"artist": "FamilyJules",
		"origial_artist": "Masafumi Takada",
		"seconds_long": 348,
		"days_since_added_to_playlist": 327,
		"plays": 13,
		"days_ago_last_played": 13,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Turn Up The Love (ft. Cover Drive)",
		"artist": "Far East Movement",
		"seconds_long": 213,
		"days_since_added_to_playlist": 253,
		"plays": 5,
		"days_ago_last_played": 49,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Defiant (ft. Laura Brehm)",
		"artist": "Feint",
		"seconds_long": 249,
		"days_since_added_to_playlist": 218,
		"plays": 14,
		"days_ago_last_played": 16,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Rugie (ft. Sennzai)",
		"artist": "Feryquitous",
		"seconds_long": 214,
		"days_since_added_to_playlist": 190,
		"plays": 13,
		"days_ago_last_played": 17,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Kairos",
		"artist": "Flite",
		"seconds_long": 356,
		"days_since_added_to_playlist": 267,
		"plays": 16,
		"days_ago_last_played": 40,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Decisions",
		"artist": "Flite, Justin Hawkes",
		"album": "Calm Before The Storm",
		"seconds_long": 327,
		"days_since_added_to_playlist": 267,
		"plays": 22,
		"days_ago_last_played": 39,
		"skips": 7,
		"rating": 8
	},
	{
		"song_name": "Calm Before The Storm",
		"artist": "Flite, Justin Hawkes, Karina Ramage",
		"album": "Calm Before The Storm",
		"seconds_long": 341,
		"days_since_added_to_playlist": 86,
		"plays": 8,
		"days_ago_last_played": 25,
		"skips": 1,
		"rating": 9
	},
	{
		"song_name": "Handle Your Bars",
		"artist": "Flobot",
		"seconds_long": 142,
		"days_since_added_to_playlist": 760,
		"plays": 57,
		"days_ago_last_played": 38,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Said & Done (ft. Reiki Ruawai)",
		"artist": "Flowidus",
		"seconds_long": 235,
		"days_since_added_to_playlist": 267,
		"plays": 25,
		"days_ago_last_played": 42,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Smart Race (Remix)",
		"artist": "fluffyhairs",
		"seconds_long": 138,
		"days_since_added_to_playlist": 399,
		"plays": 16,
		"days_ago_last_played": 43,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Rushing Back (Ekko, Sidetrack Bootleg) (ft. Vera Blue)",
		"artist": "Flume",
		"origial_artist": "Flume",
		"seconds_long": 272,
		"days_since_added_to_playlist": 267,
		"plays": 23,
		"days_ago_last_played": 43,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Spanish Sahara",
		"artist": "Foals",
		"album": "Life Is Strange Soundtrack",
		"seconds_long": 409,
		"days_since_added_to_playlist": 206,
		"plays": 29,
		"days_ago_last_played": 25,
		"skips": 18,
		"rating": 9,
		"link": "https://www.youtube.com/watch?v=UNmz61Lf1vk",
		"genre": "Indie Rock",
	},
	{
		"song_name": "Whispers from a Distant Star",
		"artist": "Fractal Dreamers",
		"album": "Azure of the Horizon",
		"seconds_long": 148,
		"days_since_added_to_playlist": 56,
		"plays": 1,
		"days_ago_last_played": 49,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Epiphany (ft. NF)",
		"artist": "Futuristic",
		"album": "Blessings",
		"seconds_long": 240,
		"days_since_added_to_playlist": 639,
		"plays": 21,
		"days_ago_last_played": 46,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "No Money",
		"artist": "Galantis",
		"seconds_long": 189,
		"days_since_added_to_playlist": 280,
		"plays": 11,
		"days_ago_last_played": 31,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Dandelion",
		"artist": "Galantis & JVKE",
		"seconds_long": 141,
		"days_since_added_to_playlist": 56,
		"plays": 3,
		"days_ago_last_played": 33,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Final Bowser Battle (Remix)",
		"artist": "GaMetal",
		"seconds_long": 266,
		"days_since_added_to_playlist": 358,
		"plays": 17,
		"days_ago_last_played": 10,
		"skips": 4,
		"rating": 8
	},
	{
		"song_name": "Truth, Beauty, and Hatred (Remix)",
		"artist": "GaMetal",
		"origial_artist": "Christopher Larkin",
		"seconds_long": 249,
		"days_since_added_to_playlist": 56,
		"plays": 1,
		"days_ago_last_played": 53,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Gusty Garden Galaxy (Remix) (ft. String Player Gamer)",
		"artist": "GaMetal",
		"seconds_long": 251,
		"days_since_added_to_playlist": 363,
		"plays": 3,
		"days_ago_last_played": 49,
		"skips": 3,
		"rating": 8
	},
	{
		"song_name": "Resurrection (Post Rock Remix)",
		"artist": "General Offensive",
		"seconds_long": 315,
		"days_since_added_to_playlist": 641,
		"plays": 51,
		"days_ago_last_played": 29,
		"skips": 10,
		"rating": 8
	},
	{
		"song_name": "Aether",
		"artist": "Geoxor",
		"seconds_long": 232,
		"days_since_added_to_playlist": 312,
		"plays": 9,
		"days_ago_last_played": 16,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Blusk",
		"artist": "Geoxor",
		"seconds_long": 183,
		"days_since_added_to_playlist": 482,
		"plays": 29,
		"days_ago_last_played": 16,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Cheese",
		"artist": "Geoxor",
		"seconds_long": 281,
		"days_since_added_to_playlist": 500,
		"plays": 15,
		"days_ago_last_played": 44,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Euphoria II",
		"artist": "Geoxor",
		"seconds_long": 202,
		"days_since_added_to_playlist": 500,
		"plays": 15,
		"days_ago_last_played": 16,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Faerie",
		"artist": "Geoxor",
		"seconds_long": 243,
		"days_since_added_to_playlist": 500,
		"plays": 20,
		"days_ago_last_played": 16,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Galaxy",
		"artist": "Geoxor",
		"seconds_long": 217,
		"days_since_added_to_playlist": 500,
		"plays": 28,
		"days_ago_last_played": 16,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Gotta Lay",
		"artist": "Geoxor",
		"seconds_long": 187,
		"days_since_added_to_playlist": 500,
		"plays": 21,
		"days_ago_last_played": 16,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Let You Go (ft. Sugar Rush)",
		"artist": "Geoxor",
		"seconds_long": 236,
		"days_since_added_to_playlist": 500,
		"plays": 17,
		"days_ago_last_played": 16,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Moonlight",
		"artist": "Geoxor",
		"seconds_long": 347,
		"days_since_added_to_playlist": 500,
		"plays": 33,
		"days_ago_last_played": 67,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Nandayo",
		"artist": "Geoxor",
		"seconds_long": 257,
		"days_since_added_to_playlist": 500,
		"plays": 25,
		"days_ago_last_played": 43,
		"skips": 4,
		"rating": 8
	},
	{
		"song_name": "Neon Eyes",
		"artist": "Geoxor",
		"seconds_long": 224,
		"days_since_added_to_playlist": 500,
		"plays": 21,
		"days_ago_last_played": 116,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Pixels",
		"artist": "Geoxor",
		"seconds_long": 179,
		"days_since_added_to_playlist": 500,
		"plays": 24,
		"days_ago_last_played": 20,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Shaii",
		"artist": "Geoxor",
		"seconds_long": 262,
		"days_since_added_to_playlist": 500,
		"plays": 25,
		"days_ago_last_played": 41,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Stardust",
		"artist": "Geoxor",
		"seconds_long": 262,
		"days_since_added_to_playlist": 500,
		"plays": 15,
		"days_ago_last_played": 44,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Turn Around",
		"artist": "Geoxor",
		"seconds_long": 272,
		"days_since_added_to_playlist": 500,
		"plays": 19,
		"days_ago_last_played": 77,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Twilight",
		"artist": "Geoxor",
		"seconds_long": 174,
		"days_since_added_to_playlist": 500,
		"plays": 52,
		"days_ago_last_played": 28,
		"skips": 12,
		"rating": 7
	},
	{
		"song_name": "Vanilla",
		"artist": "Geoxor",
		"seconds_long": 202,
		"days_since_added_to_playlist": 500,
		"plays": 15,
		"days_ago_last_played": 44,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Virtual",
		"artist": "Geoxor",
		"seconds_long": 316,
		"days_since_added_to_playlist": 500,
		"plays": 12,
		"days_ago_last_played": 9,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "World is Mine (Remix)",
		"artist": "Geoxor",
		"seconds_long": 174,
		"days_since_added_to_playlist": 500,
		"plays": 26,
		"days_ago_last_played": 43,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Element",
		"artist": "Geoxor, Altimo",
		"seconds_long": 294,
		"days_since_added_to_playlist": 500,
		"plays": 12,
		"days_ago_last_played": 44,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "DEAD",
		"artist": "Geoxor, SVRGE",
		"seconds_long": 216,
		"days_since_added_to_playlist": 374,
		"plays": 26,
		"days_ago_last_played": 20,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "EOS",
		"artist": "ginkiha",
		"album": "Shade of Mythology",
		"seconds_long": 261,
		"days_since_added_to_playlist": 86,
		"plays": 5,
		"days_ago_last_played": 17,
		"skips": 5,
		"rating": 8
	},
	{
		"song_name": "Enough",
		"artist": "Glacier",
		"seconds_long": 235,
		"days_since_added_to_playlist": 56,
		"plays": 5,
		"days_ago_last_played": 25,
		"skips": 0,
		"rating": 9
	},
	{
		"song_name": "Nurture (ft. Brenna Myers)",
		"artist": "Glacier",
		"seconds_long": 219,
		"days_since_added_to_playlist": 56,
		"plays": 7,
		"days_ago_last_played": 28,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Still",
		"artist": "Glacier",
		"seconds_long": 208,
		"days_since_added_to_playlist": 56,
		"plays": 18,
		"days_ago_last_played": 48,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Radiance",
		"artist": "Grafix",
		"seconds_long": 254,
		"days_since_added_to_playlist": 267,
		"plays": 22,
		"days_ago_last_played": 33,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Rain Fall Down",
		"artist": "Grafix",
		"seconds_long": 276,
		"days_since_added_to_playlist": 267,
		"plays": 23,
		"days_ago_last_played": 16,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Einherjar Joker",
		"artist": "Gram VS DJ Genki",
		"seconds_long": 230,
		"days_since_added_to_playlist": 182,
		"plays": 9,
		"days_ago_last_played": 13,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Starship",
		"artist": "Grant",
		"seconds_long": 213,
		"days_since_added_to_playlist": 410,
		"plays": 18,
		"days_ago_last_played": 16,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Color",
		"artist": "Grant, Juneau",
		"seconds_long": 217,
		"days_since_added_to_playlist": 40,
		"plays": 2,
		"days_ago_last_played": 24,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Hornet Theme (Orchestra Remix)",
		"artist": "Grim Studio",
		"seconds_long": 171,
		"days_since_added_to_playlist": 386,
		"plays": 10,
		"days_ago_last_played": 18,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "What You Waiting For?",
		"artist": "Gwen Stefani",
		"seconds_long": 221,
		"days_since_added_to_playlist": 252,
		"plays": 12,
		"days_ago_last_played": 45,
		"skips": 11,
		"rating": 7
	},
	{
		"song_name": "As It Was",
		"artist": "Harry Styles",
		"seconds_long": 165,
		"days_since_added_to_playlist": 182,
		"plays": 22,
		"days_ago_last_played": 33,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Resolution",
		"artist": "Haruka Tomatsu",
		"seconds_long": 290,
		"days_since_added_to_playlist": 39,
		"plays": 1,
		"days_ago_last_played": 37,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Burn (ft. Pauline Herr)",
		"artist": "Hex Cougar",
		"seconds_long": 244,
		"days_since_added_to_playlist": 410,
		"plays": 21,
		"days_ago_last_played": 77,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Breathe In (ft. Ayah Marar)",
		"artist": "High Maintenance",
		"seconds_long": 266,
		"days_since_added_to_playlist": 218,
		"plays": 13,
		"days_ago_last_played": 16,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Bravely You (Piano Cover)",
		"artist": "Hikaru Station, Navarone Boo",
		"origial_artist": "Jun Meade, Lia",
		"seconds_long": 117,
		"days_since_added_to_playlist": 86,
		"plays": 12,
		"days_ago_last_played": 40,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Burning",
		"artist": "Home",
		"seconds_long": 186,
		"days_since_added_to_playlist": 817,
		"plays": 12,
		"days_ago_last_played": 35,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Puzzle",
		"artist": "Home",
		"seconds_long": 176,
		"days_since_added_to_playlist": 817,
		"plays": 28,
		"days_ago_last_played": 17,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Synchronize",
		"artist": "Home",
		"seconds_long": 240,
		"days_since_added_to_playlist": 819,
		"plays": 25,
		"days_ago_last_played": 28,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "We're Finally Landing",
		"artist": "Home",
		"seconds_long": 272,
		"days_since_added_to_playlist": 819,
		"plays": 50,
		"days_ago_last_played": 28,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Purple Verse",
		"artist": "Hommarju",
		"seconds_long": 145,
		"days_since_added_to_playlist": 182,
		"plays": 6,
		"days_ago_last_played": 49,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Alone With Me",
		"artist": "Hopsin",
		"seconds_long": 265,
		"days_since_added_to_playlist": 56,
		"plays": 10,
		"days_ago_last_played": 53,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Kumbaya",
		"artist": "Hopsin",
		"seconds_long": 244,
		"days_since_added_to_playlist": 56,
		"plays": 9,
		"days_ago_last_played": 52,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Afterlife (ft. ECHOS)",
		"artist": "Illenium",
		"seconds_long": 362,
		"days_since_added_to_playlist": 410,
		"plays": 20,
		"days_ago_last_played": 16,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Needed You (ft. Dia Frampton)",
		"artist": "Illenium",
		"seconds_long": 305,
		"days_since_added_to_playlist": 410,
		"plays": 22,
		"days_ago_last_played": 10,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Where'd U Go",
		"artist": "Illenium & Said The Sky",
		"seconds_long": 184,
		"days_since_added_to_playlist": 410,
		"plays": 19,
		"days_ago_last_played": 123,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Gorgeous",
		"artist": "ILLENIUM, Blanke, Bipolar Sunshine",
		"album": "ASCEND",
		"seconds_long": 278,
		"days_since_added_to_playlist": 86,
		"plays": 21,
		"days_ago_last_played": 43,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Dream",
		"artist": "Imagine Dragons",
		"seconds_long": 258,
		"days_since_added_to_playlist": 572,
		"plays": 40,
		"days_ago_last_played": 10,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "It's Time",
		"artist": "Imagine Dragons",
		"seconds_long": 238,
		"days_since_added_to_playlist": 577,
		"plays": 11,
		"days_ago_last_played": 45,
		"skips": 13,
		"rating": 7
	},
	{
		"song_name": "Natural",
		"artist": "Imagine Dragons",
		"seconds_long": 189,
		"days_since_added_to_playlist": 572,
		"plays": 13,
		"days_ago_last_played": 44,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Round And Round",
		"artist": "Imagine Dragons",
		"seconds_long": 197,
		"days_since_added_to_playlist": 576,
		"plays": 14,
		"days_ago_last_played": 10,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Summer",
		"artist": "Imagine Dragons",
		"seconds_long": 218,
		"days_since_added_to_playlist": 572,
		"plays": 25,
		"days_ago_last_played": 41,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Cola Song (ft. J Balvin)",
		"artist": "INNA",
		"seconds_long": 200,
		"days_since_added_to_playlist": 255,
		"plays": 7,
		"days_ago_last_played": 48,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Reason to Care",
		"artist": "Invent",
		"seconds_long": 234,
		"days_since_added_to_playlist": 56,
		"plays": 4,
		"days_ago_last_played": 9,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Cosmic Cove (Lofi Remix)",
		"artist": "Inverted Colors",
		"seconds_long": 170,
		"days_since_added_to_playlist": 358,
		"plays": 41,
		"days_ago_last_played": 18,
		"skips": 10,
		"rating": 7
	},
	{
		"song_name": "Bravely You (String Quartet Cover)",
		"artist": "Jajnov",
		"album": "Anime on Strings",
		"seconds_long": 91,
		"days_since_added_to_playlist": 40,
		"plays": 1,
		"days_ago_last_played": 39,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Macrocosmic Modulation",
		"artist": "JAKAZiD",
		"seconds_long": 151,
		"days_since_added_to_playlist": 182,
		"plays": 14,
		"days_ago_last_played": 28,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Kaleidoscope (Hybrid Minds Remix)",
		"artist": "Jareth",
		"seconds_long": 336,
		"days_since_added_to_playlist": 218,
		"plays": 19,
		"days_ago_last_played": 18,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "The Other Side",
		"artist": "Jason Derulo",
		"seconds_long": 223,
		"days_since_added_to_playlist": 253,
		"plays": 27,
		"days_ago_last_played": 43,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Know Better (ft. Mister Blonde)",
		"artist": "JayKode",
		"seconds_long": 314,
		"days_since_added_to_playlist": 395,
		"plays": 20,
		"days_ago_last_played": 44,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Shining In The Sky (Piano Cover)",
		"artist": "Jeremy Ng",
		"album": "Anime Piano: Shining In The Sky",
		"seconds_long": 248,
		"days_since_added_to_playlist": 40,
		"plays": 1,
		"days_ago_last_played": 39,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Unjust Life (Piano Cover)",
		"artist": "Jeremy Ng",
		"album": "Anime Piano: Shining In The Sky",
		"seconds_long": 199,
		"days_since_added_to_playlist": 40,
		"plays": 1,
		"days_ago_last_played": 39,
		"skips": 2,
		"rating": 8
	},
	{
		"song_name": "Play",
		"artist": "Joakim Karud",
		"album": "The Melanphonics",
		"seconds_long": 169,
		"days_since_added_to_playlist": 899,
		"plays": 10,
		"days_ago_last_played": 119,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Future Funk",
		"artist": "Joakim Karud",
		"seconds_long": 247,
		"days_since_added_to_playlist": 899,
		"plays": 17,
		"days_ago_last_played": 43,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "All About Us",
		"artist": "Jordan Fisher",
		"seconds_long": 227,
		"days_since_added_to_playlist": 255,
		"plays": 5,
		"days_ago_last_played": 28,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "ISIS (ft. Logic)",
		"artist": "Joyner Lucas",
		"album": "ADHD",
		"seconds_long": 244,
		"days_since_added_to_playlist": 144,
		"plays": 8,
		"days_ago_last_played": 47,
		"skips": 3,
		"rating": 8
	},
	{
		"song_name": "I'm Not Racist",
		"artist": "Joyner Lucas",
		"seconds_long": 415,
		"days_since_added_to_playlist": 150,
		"plays": 11,
		"days_ago_last_played": 54,
		"skips": 12,
		"rating": 8
	},
	{
		"song_name": "The Message",
		"artist": "Jun Kuroda",
		"seconds_long": 141,
		"days_since_added_to_playlist": 190,
		"plays": 21,
		"days_ago_last_played": 10,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "My Most Precious Treasure",
		"artist": "Jun Maeda",
		"album": "Angel Beats! Original Soundtrack",
		"seconds_long": 168,
		"days_since_added_to_playlist": 259,
		"plays": 32,
		"days_ago_last_played": 18,
		"skips": 9,
		"rating": 7
	},
	{
		"song_name": "My Soul, Your Beats! (Instrumental)",
		"artist": "Jun Maeda",
		"album": "Angel Beats! Original Soundtrack",
		"seconds_long": 276,
		"days_since_added_to_playlist": 442,
		"plays": 9,
		"days_ago_last_played": 10,
		"skips": 9,
		"rating": 7
	},
	{
		"song_name": "Operation Start",
		"artist": "Jun Maeda",
		"album": "Angel Beats! Original Soundtrack",
		"seconds_long": 139,
		"days_since_added_to_playlist": 259,
		"plays": 3,
		"days_ago_last_played": 177,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Otonashi",
		"artist": "Jun Maeda",
		"album": "Angel Beats! Original Soundtrack",
		"seconds_long": 100,
		"days_since_added_to_playlist": 259,
		"plays": 16,
		"days_ago_last_played": 41,
		"skips": 19,
		"rating": 7
	},
	{
		"song_name": "Soul Friends",
		"artist": "Jun Maeda",
		"album": "Angel Beats! Original Soundtrack",
		"seconds_long": 176,
		"days_since_added_to_playlist": 259,
		"plays": 15,
		"days_ago_last_played": 41,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Unjust Life",
		"artist": "Jun Maeda",
		"album": "Angel Beats! Original Soundtrack",
		"seconds_long": 166,
		"days_since_added_to_playlist": 259,
		"plays": 17,
		"days_ago_last_played": 37,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Control",
		"artist": "Jun Maeda",
		"album": "Charlotte Original Soundtrack",
		"seconds_long": 121,
		"days_since_added_to_playlist": 231,
		"plays": 6,
		"days_ago_last_played": 55,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Haru No Hi",
		"artist": "Jun Maeda",
		"album": "Charlotte Original Soundtrack",
		"seconds_long": 183,
		"days_since_added_to_playlist": 231,
		"plays": 14,
		"days_ago_last_played": 15,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "High Tension",
		"artist": "Jun Maeda",
		"album": "Charlotte Original Soundtrack",
		"seconds_long": 107,
		"days_since_added_to_playlist": 231,
		"plays": 5,
		"days_ago_last_played": 42,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Ketsui",
		"artist": "Jun Maeda",
		"album": "Charlotte Original Soundtrack",
		"seconds_long": 154,
		"days_since_added_to_playlist": 231,
		"plays": 31,
		"days_ago_last_played": 10,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Movement",
		"artist": "Jun Maeda",
		"album": "Charlotte Original Soundtrack",
		"seconds_long": 108,
		"days_since_added_to_playlist": 231,
		"plays": 41,
		"days_ago_last_played": 15,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Omoi",
		"artist": "Jun Maeda",
		"album": "Charlotte Original Soundtrack",
		"seconds_long": 142,
		"days_since_added_to_playlist": 231,
		"plays": 16,
		"days_ago_last_played": 41,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Shinigami",
		"artist": "Jun Maeda",
		"album": "Charlotte Original Soundtrack",
		"seconds_long": 218,
		"days_since_added_to_playlist": 231,
		"plays": 10,
		"days_ago_last_played": 48,
		"skips": 18,
		"rating": 7
	},
	{
		"song_name": "Yuuki",
		"artist": "Jun Maeda",
		"album": "Charlotte Original Soundtrack",
		"seconds_long": 155,
		"days_since_added_to_playlist": 231,
		"plays": 53,
		"days_ago_last_played": 10,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "To the Same Heights",
		"artist": "Jun Maeda",
		"album": "Clannad Original Soundtrack",
		"seconds_long": 119,
		"days_since_added_to_playlist": 225,
		"plays": 31,
		"days_ago_last_played": 11,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Ichiban no Takaramono",
		"artist": "Jun Maeda, Karuta",
		"album": "Angel Beats! Perfect Vocal Collection",
		"seconds_long": 360,
		"days_since_added_to_playlist": 259,
		"plays": 19,
		"days_ago_last_played": 47,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "My Song",
		"artist": "Jun Maeda, LiSA",
		"album": "Keep The Beats!",
		"seconds_long": 293,
		"days_since_added_to_playlist": 86,
		"plays": 22,
		"days_ago_last_played": 54,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "My Song (AmaLee English Cover)",
		"artist": "Jun Maeda, LiSA",
		"album": "Total Coverage, Vol. 2",
		"seconds_long": 290,
		"days_since_added_to_playlist": 86,
		"plays": 12,
		"days_ago_last_played": 57,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Storm Song",
		"artist": "Jun Maeda, LiSA, Hikarishuyo",
		"album": "Angel Beats! Perfect Vocal Collection",
		"seconds_long": 253,
		"days_since_added_to_playlist": 259,
		"plays": 14,
		"days_ago_last_played": 44,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Thousand Enemies",
		"artist": "Jun Maeda, LiSA, Hikarishuyo",
		"album": "Keep The Beats!",
		"seconds_long": 288,
		"days_since_added_to_playlist": 259,
		"plays": 23,
		"days_ago_last_played": 44,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "My Soul, Your Beats!",
		"artist": "Jun Maede, Lia",
		"album": "Angel Beats! Perfect Vocal Collection",
		"seconds_long": 275,
		"days_since_added_to_playlist": 875,
		"plays": 59,
		"days_ago_last_played": 11,
		"skips": 9,
		"rating": 7
	},
	{
		"song_name": "Exploration",
		"artist": "Junklicious",
		"seconds_long": 220,
		"days_since_added_to_playlist": 1250,
		"plays": 33,
		"days_ago_last_played": 60,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "STAY (Lookas Remix)",
		"artist": "Justin Bieber",
		"seconds_long": 203,
		"days_since_added_to_playlist": 329,
		"plays": 16,
		"days_ago_last_played": 43,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "catch me",
		"artist": "JVKE",
		"album": "this is what ____ feels like",
		"seconds_long": 177,
		"days_since_added_to_playlist": 76,
		"plays": 17,
		"days_ago_last_played": 12,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "ghost town",
		"artist": "JVKE",
		"album": "this is what ____ feels like",
		"seconds_long": 158,
		"days_since_added_to_playlist": 56,
		"plays": 2,
		"days_ago_last_played": 51,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Golden Hour",
		"artist": "JVKE",
		"album": "this is what ____ feels like",
		"seconds_long": 216,
		"days_since_added_to_playlist": 80,
		"plays": 21,
		"days_ago_last_played": 12,
		"skips": 2,
		"rating": 9
	},
	{
		"song_name": "this is what heartbreak feels like",
		"artist": "JVKE",
		"album": "this is what ____ feels like",
		"seconds_long": 156,
		"days_since_added_to_playlist": 56,
		"plays": 17,
		"days_ago_last_played": 46,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "this is what sadness feels like",
		"artist": "JVKE",
		"album": "this is what ____ feels like",
		"seconds_long": 191,
		"days_since_added_to_playlist": 56,
		"plays": 10,
		"days_ago_last_played": 50,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "wonder if she loves me",
		"artist": "JVKE",
		"album": "this is what ____ feels like",
		"seconds_long": 160,
		"days_since_added_to_playlist": 56,
		"plays": 3,
		"days_ago_last_played": 9,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "golden hour (Carta Remix)",
		"artist": "JVKE",
		"seconds_long": 171,
		"days_since_added_to_playlist": 56,
		"plays": 4,
		"days_ago_last_played": 35,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "i'm not okay",
		"artist": "JVKE",
		"seconds_long": 144,
		"days_since_added_to_playlist": 56,
		"plays": 3,
		"days_ago_last_played": 14,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "*Pulse Wave Intensifies*",
		"artist": "K@keru Records, Mameyudoufu",
		"album": "COMPLE:X 2.0",
		"seconds_long": 279,
		"days_since_added_to_playlist": 56,
		"plays": 1,
		"days_ago_last_played": 53,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Mute City (Remix)",
		"artist": "Kamex",
		"seconds_long": 240,
		"days_since_added_to_playlist": 288,
		"plays": 5,
		"days_ago_last_played": 49,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "It's Raining Somewhere Else (Remix)",
		"artist": "Kamex & RetroSpecter",
		"seconds_long": 233,
		"days_since_added_to_playlist": 461,
		"plays": 19,
		"days_ago_last_played": 45,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Cycle Hit (ft. J Genki, C-Show, and Camellia)",
		"artist": "KASAI HARCORES",
		"seconds_long": 330,
		"days_since_added_to_playlist": 954,
		"plays": 72,
		"days_ago_last_played": 16,
		"skips": 12,
		"rating": 7
	},
	{
		"song_name": "C'mon",
		"artist": "Ke$ha",
		"seconds_long": 214,
		"days_since_added_to_playlist": 253,
		"plays": 11,
		"days_ago_last_played": 45,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Foxes",
		"artist": "Keeno",
		"seconds_long": 289,
		"days_since_added_to_playlist": 218,
		"plays": 17,
		"days_ago_last_played": 42,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Heartbeat Song",
		"artist": "Kelly Clarkson",
		"seconds_long": 200,
		"days_since_added_to_playlist": 253,
		"plays": 15,
		"days_ago_last_played": 44,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Edicius",
		"artist": "King ISO",
		"seconds_long": 239,
		"days_since_added_to_playlist": 54,
		"plays": 4,
		"days_ago_last_played": 9,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Town, Flow Of Time, People (Lofi Hip Hop Remix)",
		"artist": "King Mars",
		"seconds_long": 188,
		"days_since_added_to_playlist": 40,
		"plays": 1,
		"days_ago_last_played": 39,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Az Izz Diss \nWhat I Can Say\n",
		"artist": "Knox Hill",
		"seconds_long": 178,
		"days_since_added_to_playlist": 669,
		"plays": 34,
		"days_ago_last_played": 46,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "WHY (ft. Boston)",
		"artist": "Knox Hill",
		"seconds_long": 246,
		"days_since_added_to_playlist": 680,
		"plays": 42,
		"days_ago_last_played": 81,
		"skips": 13,
		"rating": 7
	},
	{
		"song_name": "Worldwide Cypher Takeover",
		"artist": "Knox Hill",
		"seconds_long": 74,
		"days_since_added_to_playlist": 623,
		"plays": 20,
		"days_ago_last_played": 77,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "This Game",
		"artist": "Konomi Suzuki",
		"seconds_long": 280,
		"days_since_added_to_playlist": 875,
		"plays": 43,
		"days_ago_last_played": 34,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "Blood Flower",
		"artist": "Kotori",
		"seconds_long": 183,
		"days_since_added_to_playlist": 284,
		"plays": 14,
		"days_ago_last_played": 11,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "Bloom (ft. Stessie)",
		"artist": "Kotori",
		"seconds_long": 203,
		"days_since_added_to_playlist": 284,
		"plays": 17,
		"days_ago_last_played": 16,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Dandere",
		"artist": "Kotori",
		"seconds_long": 256,
		"days_since_added_to_playlist": 284,
		"plays": 15,
		"days_ago_last_played": 10,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Death From Above",
		"artist": "Kotori",
		"seconds_long": 221,
		"days_since_added_to_playlist": 284,
		"plays": 17,
		"days_ago_last_played": 37,
		"skips": 3,
		"rating": 8
	},
	{
		"song_name": "Healing",
		"artist": "Kotori",
		"seconds_long": 201,
		"days_since_added_to_playlist": 284,
		"plays": 9,
		"days_ago_last_played": 46,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Lunar Tear",
		"artist": "Kotori",
		"seconds_long": 199,
		"days_since_added_to_playlist": 284,
		"plays": 10,
		"days_ago_last_played": 28,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Our World (ft. Bien) (Remix)",
		"artist": "Kotori",
		"origial_artist": "Polarr",
		"seconds_long": 308,
		"days_since_added_to_playlist": 284,
		"plays": 14,
		"days_ago_last_played": 42,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Reborn (Remix)",
		"artist": "Kotori",
		"origial_artist": "Becko",
		"seconds_long": 275,
		"days_since_added_to_playlist": 284,
		"plays": 11,
		"days_ago_last_played": 17,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Scarlet Wing",
		"artist": "Kotori",
		"seconds_long": 273,
		"days_since_added_to_playlist": 284,
		"plays": 9,
		"days_ago_last_played": 46,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Starstruck (ft. Kagi)",
		"artist": "Kotori",
		"seconds_long": 276,
		"days_since_added_to_playlist": 284,
		"plays": 28,
		"days_ago_last_played": 25,
		"skips": 6,
		"rating": 9
	},
	{
		"song_name": "SummerTime Blood (Remix) (ft. Bladee, Ecco2k, AIKA)",
		"artist": "Kotori",
		"origial_artist": "Yung Lean & Skrillex",
		"seconds_long": 189,
		"days_since_added_to_playlist": 284,
		"plays": 7,
		"days_ago_last_played": 47,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Textacy (Remix)",
		"artist": "Kotori",
		"origial_artist": "Dion Timmer",
		"seconds_long": 222,
		"days_since_added_to_playlist": 284,
		"plays": 14,
		"days_ago_last_played": 60,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Violet Veil",
		"artist": "Kotori",
		"seconds_long": 225,
		"days_since_added_to_playlist": 290,
		"plays": 11,
		"days_ago_last_played": 45,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Waterfall (ft. JVNA)",
		"artist": "Kotori",
		"seconds_long": 249,
		"days_since_added_to_playlist": 284,
		"plays": 18,
		"days_ago_last_played": 104,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Wired (Remix)",
		"artist": "Kotori",
		"origial_artist": "Redeilia",
		"seconds_long": 240,
		"days_since_added_to_playlist": 284,
		"plays": 22,
		"days_ago_last_played": 116,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Silence",
		"artist": "Koven",
		"seconds_long": 346,
		"days_since_added_to_playlist": 790,
		"plays": 22,
		"days_ago_last_played": 114,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Cold Snap",
		"artist": "Kubbi",
		"album": "Taiga",
		"seconds_long": 391,
		"days_since_added_to_playlist": 1362,
		"plays": 45,
		"days_ago_last_played": 14,
		"skips": 14,
		"rating": 7
	},
	{
		"song_name": "The Cairn",
		"artist": "Kubbi",
		"seconds_long": 370,
		"days_since_added_to_playlist": 1453,
		"plays": 40,
		"days_ago_last_played": 10,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "Ember",
		"artist": "Kubbi",
		"seconds_long": 295,
		"days_since_added_to_playlist": 1214,
		"plays": 29,
		"days_ago_last_played": 136,
		"skips": 14,
		"rating": 7
	},
	{
		"song_name": "Firelight",
		"artist": "Kubbi",
		"seconds_long": 268,
		"days_since_added_to_playlist": 1040,
		"plays": 26,
		"days_ago_last_played": 40,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Wake",
		"artist": "Kubbi",
		"seconds_long": 336,
		"days_since_added_to_playlist": 1362,
		"plays": 54,
		"days_ago_last_played": 37,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "clueless",
		"artist": "kuru x kurtains",
		"seconds_long": 127,
		"days_since_added_to_playlist": 229,
		"plays": 23,
		"days_ago_last_played": 44,
		"skips": 3,
		"rating": 8
	},
	{
		"song_name": "SHIKI",
		"artist": "Lapis",
		"seconds_long": 276,
		"days_since_added_to_playlist": 182,
		"plays": 7,
		"days_ago_last_played": 48,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Rather Be (Remix)",
		"artist": "Lash",
		"origial_artist": "Clean Bandit",
		"seconds_long": 292,
		"days_since_added_to_playlist": 280,
		"plays": 5,
		"days_ago_last_played": 49,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "PRAGMATISM -RESURRECTION",
		"artist": "Laur",
		"album": "CELESTIAL",
		"seconds_long": 162,
		"days_since_added_to_playlist": 76,
		"plays": 13,
		"days_ago_last_played": 16,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "PRAGMATISM",
		"artist": "Laur",
		"seconds_long": 122,
		"days_since_added_to_playlist": 182,
		"plays": 12,
		"days_ago_last_played": 60,
		"skips": 4,
		"rating": 8
	},
	{
		"song_name": "Sheriruth (Laur Remix)",
		"artist": "Laur",
		"seconds_long": 126,
		"days_since_added_to_playlist": 182,
		"plays": 14,
		"days_ago_last_played": 13,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "Vindication",
		"artist": "Laur",
		"seconds_long": 243,
		"days_since_added_to_playlist": 182,
		"plays": 9,
		"days_ago_last_played": 13,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Mirror Temple (Mirror Magic Mix)",
		"artist": "Lena Raine",
		"album": "Celeste Original Soundtrack",
		"seconds_long": 235,
		"days_since_added_to_playlist": 642,
		"plays": 33,
		"days_ago_last_played": 49,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Mute City (Remix)",
		"artist": "Lincoln Souza",
		"seconds_long": 240,
		"days_since_added_to_playlist": 288,
		"plays": 18,
		"days_ago_last_played": 40,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "enchanted love",
		"artist": "linear ring",
		"seconds_long": 292,
		"days_since_added_to_playlist": 518,
		"plays": 23,
		"days_ago_last_played": 10,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Gypsophila",
		"artist": "linear ring",
		"seconds_long": 165,
		"days_since_added_to_playlist": 512,
		"plays": 28,
		"days_ago_last_played": 28,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "lalabai call me",
		"artist": "linear ring",
		"seconds_long": 146,
		"days_since_added_to_playlist": 512,
		"plays": 13,
		"days_ago_last_played": 45,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Windflower",
		"artist": "linear ring",
		"seconds_long": 142,
		"days_since_added_to_playlist": 512,
		"plays": 24,
		"days_ago_last_played": 42,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Yura Yura Lovelight",
		"artist": "linear ring",
		"seconds_long": 226,
		"days_since_added_to_playlist": 512,
		"plays": 18,
		"days_ago_last_played": 69,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "あなたが望む電気羊の夢の色彩へ",
		"artist": "linear ring",
		"seconds_long": 158,
		"days_since_added_to_playlist": 512,
		"plays": 21,
		"days_ago_last_played": 10,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Crossing Field",
		"artist": "LiSA",
		"album": "LANDSPACE",
		"seconds_long": 247,
		"days_since_added_to_playlist": 86,
		"plays": 8,
		"days_ago_last_played": 17,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Rising Hope",
		"artist": "LiSA",
		"album": "Launcher",
		"seconds_long": 248,
		"days_since_added_to_playlist": 86,
		"plays": 17,
		"days_ago_last_played": 17,
		"skips": 8,
		"rating": 9
	},
	{
		"song_name": "Gurenge",
		"artist": "LiSA",
		"album": "LEO-NiNE",
		"seconds_long": 270,
		"days_since_added_to_playlist": 86,
		"plays": 14,
		"days_ago_last_played": 48,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Catch the Moment",
		"artist": "LiSA",
		"album": "Little Devil Parade",
		"seconds_long": 285,
		"days_since_added_to_playlist": 86,
		"plays": 4,
		"days_ago_last_played": 49,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "ADAMAS",
		"artist": "LiSA",
		"seconds_long": 225,
		"days_since_added_to_playlist": 249,
		"plays": 26,
		"days_ago_last_played": 12,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Juice",
		"artist": "Lizzo",
		"seconds_long": 200,
		"days_since_added_to_playlist": 257,
		"plays": 10,
		"days_ago_last_played": 45,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Mt. Washington",
		"artist": "Local Natives",
		"album": "Life Is Strange Soundtrack",
		"seconds_long": 197,
		"days_since_added_to_playlist": 202,
		"plays": 33,
		"days_ago_last_played": 28,
		"skips": 9,
		"rating": 7
	},
	{
		"song_name": "Make me Feel (Zekk Remix)",
		"artist": "Lolica Tonica",
		"seconds_long": 195,
		"days_since_added_to_playlist": 108,
		"plays": 8,
		"days_ago_last_played": 16,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Powerless (ft. Sennzai)",
		"artist": "Lost Desire",
		"seconds_long": 160,
		"days_since_added_to_playlist": 182,
		"plays": 20,
		"days_ago_last_played": 13,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "Komorebi",
		"artist": "The Loyalist",
		"seconds_long": 202,
		"days_since_added_to_playlist": 880,
		"plays": 28,
		"days_ago_last_played": 42,
		"skips": 2,
		"rating": 8
	},
	{
		"song_name": "Company (ft. Juul)",
		"artist": "Maduk",
		"seconds_long": 249,
		"days_since_added_to_playlist": 267,
		"plays": 13,
		"days_ago_last_played": 9,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "takt",
		"artist": "Mafumafu, gaku, ryo",
		"seconds_long": 274,
		"days_since_added_to_playlist": 224,
		"plays": 22,
		"days_ago_last_played": 17,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Country Lane",
		"artist": "Magome Togoshi",
		"album": "Clannad Original Soundtrack",
		"seconds_long": 196,
		"days_since_added_to_playlist": 225,
		"plays": 23,
		"days_ago_last_played": 33,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Shining in the Sky",
		"artist": "Magome Togoshi",
		"album": "Clannad Original Soundtrack",
		"seconds_long": 308,
		"days_since_added_to_playlist": 225,
		"plays": 56,
		"days_ago_last_played": 40,
		"skips": 16,
		"rating": 7
	},
	{
		"song_name": "TOE",
		"artist": "Magome Togoshi",
		"album": "Clannad Original Soundtrack",
		"seconds_long": 164,
		"days_since_added_to_playlist": 225,
		"plays": 5,
		"days_ago_last_played": 14,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Dragon Castle",
		"artist": "Makai Symphony",
		"seconds_long": 162,
		"days_since_added_to_playlist": 1098,
		"plays": 8,
		"days_ago_last_played": 12,
		"skips": 13,
		"rating": 7
	},
	{
		"song_name": "Bluebird",
		"artist": "Makoto, Hugh Hardie",
		"seconds_long": 298,
		"days_since_added_to_playlist": 267,
		"plays": 11,
		"days_ago_last_played": 9,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Call My Name (ft. Yukacco)",
		"artist": "Mameyudoufu",
		"seconds_long": 208,
		"days_since_added_to_playlist": 190,
		"plays": 10,
		"days_ago_last_played": 16,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Reverberation (ft. Shizaki Yuki)",
		"artist": "Mameyudoufu",
		"seconds_long": 225,
		"days_since_added_to_playlist": 56,
		"plays": 3,
		"days_ago_last_played": 34,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Equilibrium",
		"artist": "Maozon",
		"seconds_long": 137,
		"days_since_added_to_playlist": 190,
		"plays": 14,
		"days_ago_last_played": 16,
		"skips": 2,
		"rating": 8
	},
	{
		"song_name": "Mount Wario (CarboHydroMusic & Friends Remix)",
		"artist": "Mario Kart 8 Deluxe",
		"seconds_long": 152,
		"days_since_added_to_playlist": 288,
		"plays": 13,
		"days_ago_last_played": 28,
		"skips": 10,
		"rating": 7
	},
	{
		"song_name": "Welcome to DANGAN IsLand!!",
		"artist": "Masafumi Takada",
		"album": "Danganronpa 2 Original Soundtrack",
		"seconds_long": 118,
		"days_since_added_to_playlist": 328,
		"plays": 10,
		"days_ago_last_played": 17,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Sushi",
		"artist": "Merk, Kremont",
		"seconds_long": 168,
		"days_since_added_to_playlist": 256,
		"plays": 12,
		"days_ago_last_played": 35,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Melty Monster Galaxy (Mesmonium Remix)",
		"artist": "Mesmonium",
		"origial_artist": "Super Mario Galaxy 2",
		"seconds_long": 244,
		"days_since_added_to_playlist": 358,
		"plays": 10,
		"days_ago_last_played": 44,
		"skips": 2,
		"rating": 8
	},
	{
		"song_name": "Mountains",
		"artist": "Message To Bears",
		"album": "Life Is Strange Soundtrack",
		"seconds_long": 233,
		"days_since_added_to_playlist": 202,
		"plays": 26,
		"days_ago_last_played": 10,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "2u",
		"artist": "Minerva",
		"seconds_long": 243,
		"days_since_added_to_playlist": 1250,
		"plays": 42,
		"days_ago_last_played": 16,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Impure Bird",
		"artist": "MIssionary",
		"seconds_long": 116,
		"days_since_added_to_playlist": 190,
		"plays": 11,
		"days_ago_last_played": 10,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Righteous",
		"artist": "Mo Beats",
		"seconds_long": 164,
		"days_since_added_to_playlist": 86,
		"plays": 3,
		"days_ago_last_played": 62,
		"skips": 9,
		"rating": 7
	},
	{
		"song_name": "Gusty Garden Galaxy (Remix)",
		"artist": "Mohmega",
		"seconds_long": 304,
		"days_since_added_to_playlist": 358,
		"plays": 11,
		"days_ago_last_played": 10,
		"skips": 13,
		"rating": 7
	},
	{
		"song_name": "PUPA",
		"artist": "Morimori Atsushi",
		"seconds_long": 126,
		"days_since_added_to_playlist": 190,
		"plays": 11,
		"days_ago_last_played": 20,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "YOG",
		"artist": "Morimori Atsushi",
		"seconds_long": 125,
		"days_since_added_to_playlist": 86,
		"plays": 21,
		"days_ago_last_played": 9,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "The Sense Of Me",
		"artist": "Mudflow",
		"album": "Life Is Strange Soundtrack",
		"seconds_long": 154,
		"days_since_added_to_playlist": 202,
		"plays": 29,
		"days_ago_last_played": 11,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Star Glide (ft. Cammie Robinson)",
		"artist": "MUZZ",
		"album": "The Promised Land",
		"seconds_long": 308,
		"days_since_added_to_playlist": 56,
		"plays": 17,
		"days_ago_last_played": 49,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Spillway",
		"artist": "Nameless Warning",
		"seconds_long": 237,
		"days_since_added_to_playlist": 1250,
		"plays": 33,
		"days_ago_last_played": 42,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "Toads Factory (Remix)",
		"artist": "Naz3nt",
		"seconds_long": 139,
		"days_since_added_to_playlist": 288,
		"plays": 16,
		"days_ago_last_played": 17,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "In The Sun Again (ft. Laura Brehm)",
		"artist": "NCT",
		"seconds_long": 272,
		"days_since_added_to_playlist": 218,
		"plays": 9,
		"days_ago_last_played": 46,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Promiscuous (ft. Timbaland)",
		"artist": "Nelly Furtado",
		"seconds_long": 243,
		"days_since_added_to_playlist": 252,
		"plays": 7,
		"days_ago_last_played": 48,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Summertime (Remix)",
		"artist": "Nelver",
		"origial_artist": "Smote",
		"seconds_long": 363,
		"days_since_added_to_playlist": 267,
		"plays": 6,
		"days_ago_last_played": 9,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "The Thrill (Porter Robinson Remix)",
		"artist": "Nero",
		"seconds_long": 277,
		"days_since_added_to_playlist": 235,
		"plays": 12,
		"days_ago_last_played": 44,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Nobody (Lexurus Remix)",
		"artist": "Netsky, Stargate",
		"seconds_long": 218,
		"days_since_added_to_playlist": 218,
		"plays": 7,
		"days_ago_last_played": 30,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "CLOUDS",
		"artist": "NF",
		"album": "Clouds (The Mixtape)",
		"seconds_long": 253,
		"days_since_added_to_playlist": 171,
		"plays": 14,
		"days_ago_last_played": 32,
		"skips": 9,
		"rating": 7
	},
	{
		"song_name": "DRIFTING",
		"artist": "NF",
		"album": "Clouds (The Mixtape)",
		"seconds_long": 200,
		"days_since_added_to_playlist": 723,
		"plays": 44,
		"days_ago_last_played": 13,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "LOST (ft. Hopsin)",
		"artist": "NF",
		"album": "Clouds (The Mixtape)",
		"seconds_long": 243,
		"days_since_added_to_playlist": 739,
		"plays": 56,
		"days_ago_last_played": 34,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "PAID MY DUES",
		"artist": "NF",
		"album": "Clouds (The Mixtape)",
		"seconds_long": 220,
		"days_since_added_to_playlist": 721,
		"plays": 43,
		"days_ago_last_played": 34,
		"skips": 4,
		"rating": 8
	},
	{
		"song_name": "STORY",
		"artist": "NF",
		"album": "Clouds (The Mixtape)",
		"seconds_long": 305,
		"days_since_added_to_playlist": 723,
		"plays": 52,
		"days_ago_last_played": 10,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "TRUST (ft. Tech N9ne)",
		"artist": "NF",
		"album": "Clouds (The Mixtape)",
		"seconds_long": 264,
		"days_since_added_to_playlist": 723,
		"plays": 59,
		"days_ago_last_played": 77,
		"skips": 15,
		"rating": 8
	},
	{
		"song_name": "HOPE",
		"artist": "NF",
		"album": "HOPE",
		"seconds_long": 265,
		"days_since_added_to_playlist": 29,
		"plays": 6,
		"days_ago_last_played": 1,
		"skips": 0,
		"rating": 9
	},
	{
		"song_name": "MOTTO",
		"artist": "NF",
		"album": "HOPE",
		"seconds_long": 233,
		"days_since_added_to_playlist": 9,
		"plays": 5,
		"days_ago_last_played": 1,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Mansion (ft. Fleurie)",
		"artist": "NF",
		"album": "Mansion",
		"seconds_long": 323,
		"days_since_added_to_playlist": 86,
		"plays": 11,
		"days_ago_last_played": 56,
		"skips": 12,
		"rating": 7
	},
	{
		"song_name": "Destiny",
		"artist": "NF",
		"album": "Perception",
		"seconds_long": 239,
		"days_since_added_to_playlist": 638,
		"plays": 25,
		"days_ago_last_played": 32,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Intro III",
		"artist": "NF",
		"album": "Perception",
		"seconds_long": 268,
		"days_since_added_to_playlist": 663,
		"plays": 18,
		"days_ago_last_played": 80,
		"skips": 5,
		"rating": 8
	},
	{
		"song_name": "Know",
		"artist": "NF",
		"album": "Perception",
		"seconds_long": 238,
		"days_since_added_to_playlist": 674,
		"plays": 21,
		"days_ago_last_played": 121,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Outro",
		"artist": "NF",
		"album": "Perception",
		"seconds_long": 209,
		"days_since_added_to_playlist": 663,
		"plays": 35,
		"days_ago_last_played": 57,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Remember This (Audio)",
		"artist": "NF",
		"album": "Perception",
		"seconds_long": 240,
		"days_since_added_to_playlist": 86,
		"plays": 10,
		"days_ago_last_played": 49,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "Nate",
		"artist": "NF",
		"album": "The Search",
		"seconds_long": 303,
		"days_since_added_to_playlist": 86,
		"plays": 3,
		"days_ago_last_played": 48,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Only (ft. Sasha Sloan)",
		"artist": "NF",
		"album": "The Search",
		"seconds_long": 226,
		"days_since_added_to_playlist": 638,
		"plays": 19,
		"days_ago_last_played": 43,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Returns",
		"artist": "NF",
		"album": "The Search",
		"seconds_long": 233,
		"days_since_added_to_playlist": 638,
		"plays": 22,
		"days_ago_last_played": 43,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "The Search",
		"artist": "NF",
		"album": "The Search",
		"seconds_long": 291,
		"days_since_added_to_playlist": 638,
		"plays": 25,
		"days_ago_last_played": 12,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "WHY",
		"artist": "NF",
		"album": "The Search",
		"seconds_long": 191,
		"days_since_added_to_playlist": 686,
		"plays": 25,
		"days_ago_last_played": 92,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Intro 2",
		"artist": "NF",
		"album": "Therapy Session",
		"seconds_long": 196,
		"days_since_added_to_playlist": 663,
		"plays": 41,
		"days_ago_last_played": 11,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Statement",
		"artist": "NF",
		"album": "Therapy Session",
		"seconds_long": 191,
		"days_since_added_to_playlist": 638,
		"plays": 16,
		"days_ago_last_played": 88,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Therapy Session",
		"artist": "NF",
		"album": "Therapy Session",
		"seconds_long": 334,
		"days_since_added_to_playlist": 709,
		"plays": 12,
		"days_ago_last_played": 30,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "NO NAME",
		"artist": "NF",
		"seconds_long": 183,
		"days_since_added_to_playlist": 717,
		"plays": 27,
		"days_ago_last_played": 77,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Warm Up",
		"artist": "NF",
		"seconds_long": 180,
		"days_since_added_to_playlist": 638,
		"plays": 22,
		"days_ago_last_played": 56,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Gekka",
		"artist": "Nhato",
		"seconds_long": 370,
		"days_since_added_to_playlist": 182,
		"plays": 20,
		"days_ago_last_played": 45,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "「Doki Doki ドキドキ」",
		"artist": "Nikki Kaelar (Varien)",
		"seconds_long": 222,
		"days_since_added_to_playlist": 345,
		"plays": 6,
		"days_ago_last_played": 49,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Astral tale Denebold",
		"artist": "Noah",
		"seconds_long": 336,
		"days_since_added_to_playlist": 182,
		"plays": 17,
		"days_ago_last_played": 46,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Deltarune Chapter 2 Medley",
		"artist": "NoteBlock",
		"seconds_long": 785,
		"days_since_added_to_playlist": 399,
		"plays": 6,
		"days_ago_last_played": 49,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Clouds (ft. Delaney Kai)",
		"artist": "Nurko",
		"seconds_long": 223,
		"days_since_added_to_playlist": 241,
		"plays": 11,
		"days_ago_last_played": 10,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Naked Soul",
		"artist": "Nurko",
		"seconds_long": 240,
		"days_since_added_to_playlist": 241,
		"plays": 15,
		"days_ago_last_played": 11,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Lost Without You (ft. Knownasnat)",
		"artist": "Nurko, Crystal Skies",
		"seconds_long": 231,
		"days_since_added_to_playlist": 247,
		"plays": 8,
		"days_ago_last_played": 47,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Enter REM",
		"artist": "OBLVYN",
		"seconds_long": 161,
		"days_since_added_to_playlist": 56,
		"plays": 3,
		"days_ago_last_played": 51,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Planet Eternium",
		"artist": "OBLVYN",
		"seconds_long": 193,
		"days_since_added_to_playlist": 40,
		"plays": 5,
		"days_ago_last_played": 36,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "My Soul, Your Beats! (Oiztex Remix)",
		"artist": "Oiztex",
		"seconds_long": 271,
		"days_since_added_to_playlist": 442,
		"plays": 8,
		"days_ago_last_played": 10,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Unspoken (Remix) (ft. Elle Exxe & Muzzy)",
		"artist": "Oliverse",
		"seconds_long": 187,
		"days_since_added_to_playlist": 267,
		"plays": 24,
		"days_ago_last_played": 24,
		"skips": 11,
		"rating": 8
	},
	{
		"song_name": "Sick Boy (Remix)",
		"artist": "ONEDUO",
		"origial_artist": "The Chainsmokers",
		"seconds_long": 207,
		"days_since_added_to_playlist": 280,
		"plays": 12,
		"days_ago_last_played": 44,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Cores & Shells",
		"artist": "Oneeva",
		"seconds_long": 273,
		"days_since_added_to_playlist": 1181,
		"plays": 54,
		"days_ago_last_played": 88,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "A Monster",
		"artist": "Oneeva",
		"seconds_long": 223,
		"days_since_added_to_playlist": 1181,
		"plays": 47,
		"days_ago_last_played": 78,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Platform 9",
		"artist": "Oneeva",
		"seconds_long": 252,
		"days_since_added_to_playlist": 1192,
		"plays": 50,
		"days_ago_last_played": 63,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Time and Space",
		"artist": "Oneeva",
		"seconds_long": 276,
		"days_since_added_to_playlist": 1181,
		"plays": 73,
		"days_ago_last_played": 16,
		"skips": 14,
		"rating": 7
	},
	{
		"song_name": "Last 7 Letters",
		"artist": "oneohkay",
		"seconds_long": 204,
		"days_since_added_to_playlist": 86,
		"plays": 7,
		"days_ago_last_played": 16,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Wherever I Go",
		"artist": "OneRepublic",
		"seconds_long": 203,
		"days_since_added_to_playlist": 255,
		"plays": 10,
		"days_ago_last_played": 45,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Ultralight",
		"artist": "Opposition",
		"seconds_long": 253,
		"days_since_added_to_playlist": 267,
		"plays": 9,
		"days_ago_last_played": 46,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Burning (ft. IDA)",
		"artist": "The Outsiders",
		"seconds_long": 341,
		"days_since_added_to_playlist": 267,
		"plays": 12,
		"days_ago_last_played": 10,
		"skips": 5,
		"rating": 8
	},
	{
		"song_name": "The Moon",
		"artist": "Overspace, Atura, Hikaru Station",
		"seconds_long": 337,
		"days_since_added_to_playlist": 86,
		"plays": 9,
		"days_ago_last_played": 49,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Back To You",
		"artist": "Ownglow",
		"seconds_long": 259,
		"days_since_added_to_playlist": 267,
		"plays": 18,
		"days_ago_last_played": 59,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "As the Nights Get Darker",
		"artist": "Ozoh",
		"seconds_long": 227,
		"days_since_added_to_playlist": 665,
		"plays": 55,
		"days_ago_last_played": 34,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Horizon",
		"artist": "Ozoh",
		"seconds_long": 167,
		"days_since_added_to_playlist": 665,
		"plays": 23,
		"days_ago_last_played": 91,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "TWINKLE MAGIC",
		"artist": "P*Light",
		"seconds_long": 130,
		"days_since_added_to_playlist": 56,
		"plays": 2,
		"days_ago_last_played": 50,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Death Of A Bachelor",
		"artist": "Panic! At The Disco",
		"seconds_long": 210,
		"days_since_added_to_playlist": 129,
		"plays": 8,
		"days_ago_last_played": 35,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Mr Worldwide",
		"artist": "Pete & Bas",
		"seconds_long": 180,
		"days_since_added_to_playlist": 56,
		"plays": 6,
		"days_ago_last_played": 8,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Sindhu Sesh",
		"artist": "Pete & Bas",
		"seconds_long": 230,
		"days_since_added_to_playlist": 56,
		"plays": 4,
		"days_ago_last_played": 44,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "All Night (Metrik Remix) (ft. Georgie Allen)",
		"artist": "Polar Youth",
		"seconds_long": 251,
		"days_since_added_to_playlist": 218,
		"plays": 15,
		"days_ago_last_played": 36,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Alone",
		"artist": "Pold",
		"seconds_long": 197,
		"days_since_added_to_playlist": 500,
		"plays": 28,
		"days_ago_last_played": 29,
		"skips": 12,
		"rating": 7
	},
	{
		"song_name": "Fly",
		"artist": "Pold",
		"seconds_long": 173,
		"days_since_added_to_playlist": 839,
		"plays": 43,
		"days_ago_last_played": 54,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Monochrome Princess",
		"artist": "polysha",
		"seconds_long": 138,
		"days_since_added_to_playlist": 190,
		"plays": 12,
		"days_ago_last_played": 28,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Astronomical Optical Interferometry",
		"artist": "poplavor, Zekk",
		"album": "emome -エモミ Essential TranceStep CASE01-",
		"seconds_long": 218,
		"days_since_added_to_playlist": 108,
		"plays": 20,
		"days_ago_last_played": 48,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Angel Voices",
		"artist": "Porter Robinson",
		"album": "Virtual Self",
		"seconds_long": 392,
		"days_since_added_to_playlist": 235,
		"plays": 15,
		"days_ago_last_played": 42,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Eon Break",
		"artist": "Porter Robinson",
		"album": "Virtual Self",
		"seconds_long": 220,
		"days_since_added_to_playlist": 235,
		"plays": 19,
		"days_ago_last_played": 13,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Particle Arts",
		"artist": "Porter Robinson",
		"album": "Virtual Self",
		"seconds_long": 236,
		"days_since_added_to_playlist": 235,
		"plays": 16,
		"days_ago_last_played": 10,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Divinity (ft. Amy Millan)",
		"artist": "Porter Robinson",
		"seconds_long": 368,
		"days_since_added_to_playlist": 235,
		"plays": 13,
		"days_ago_last_played": 11,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Musician (Synthion Hardcore Edit)",
		"artist": "Porter Robinson",
		"seconds_long": 211,
		"days_since_added_to_playlist": 692,
		"plays": 20,
		"days_ago_last_played": 71,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Into The Night",
		"artist": "The Prototypes",
		"seconds_long": 260,
		"days_since_added_to_playlist": 267,
		"plays": 19,
		"days_ago_last_played": 67,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Oxygen (ft. Kudu Blue)",
		"artist": "The Prototypes",
		"seconds_long": 244,
		"days_since_added_to_playlist": 267,
		"plays": 10,
		"days_ago_last_played": 45,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Intro (Afterlife vs Fractures vs DLMD vs Disarm You) (ft. Illenium)",
		"artist": "Proximity",
		"seconds_long": 335,
		"days_since_added_to_playlist": 280,
		"plays": 5,
		"days_ago_last_played": 49,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Chatroom",
		"artist": "PSYQUI",
		"album": "Concenptive. 10",
		"seconds_long": 320,
		"days_since_added_to_playlist": 190,
		"plays": 9,
		"days_ago_last_played": 10,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Endless (Mameyudoufu Remix)",
		"artist": "PSYQUI",
		"album": "epoqc2025",
		"seconds_long": 218,
		"days_since_added_to_playlist": 56,
		"plays": 12,
		"days_ago_last_played": 44,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Filament",
		"artist": "Puru",
		"seconds_long": 141,
		"days_since_added_to_playlist": 182,
		"plays": 19,
		"days_ago_last_played": 12,
		"skips": 2,
		"rating": 8
	},
	{
		"song_name": "Snow White",
		"artist": "Puru",
		"seconds_long": 137,
		"days_since_added_to_playlist": 556,
		"plays": 45,
		"days_ago_last_played": 47,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Mountains (ft. Veela)",
		"artist": "Rameses B",
		"seconds_long": 273,
		"days_since_added_to_playlist": 521,
		"plays": 16,
		"days_ago_last_played": 10,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Story",
		"artist": "Rameses B",
		"seconds_long": 232,
		"days_since_added_to_playlist": 218,
		"plays": 11,
		"days_ago_last_played": 61,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Twilight Zone (ft. Laura Brehm)",
		"artist": "Rameses B",
		"seconds_long": 282,
		"days_since_added_to_playlist": 218,
		"plays": 9,
		"days_ago_last_played": 45,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "One More Time (feat. Nahra)",
		"artist": "Ramin",
		"seconds_long": 265,
		"days_since_added_to_playlist": 624,
		"plays": 10,
		"days_ago_last_played": 57,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "REKKA RESONANCE",
		"artist": "REDALiCE, Kobaryo",
		"seconds_long": 142,
		"days_since_added_to_playlist": 56,
		"plays": 4,
		"days_ago_last_played": 34,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Unlimited Katharsis",
		"artist": "Reku Mochizuki",
		"album": "RM Scramble (Vol. 01)",
		"seconds_long": 177,
		"days_since_added_to_playlist": 56,
		"plays": 2,
		"days_ago_last_played": 51,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Asymmetry",
		"artist": "Reol",
		"seconds_long": 252,
		"days_since_added_to_playlist": 810,
		"plays": 53,
		"days_ago_last_played": 34,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "END",
		"artist": "Reol",
		"seconds_long": 301,
		"days_since_added_to_playlist": 812,
		"plays": 41,
		"days_ago_last_played": 10,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Gekihaku",
		"artist": "Reol",
		"seconds_long": 212,
		"days_since_added_to_playlist": 875,
		"plays": 43,
		"days_ago_last_played": 160,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "HYPE MODE",
		"artist": "Reol",
		"seconds_long": 213,
		"days_since_added_to_playlist": 790,
		"plays": 24,
		"days_ago_last_played": 43,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Lost Paradise",
		"artist": "Reol",
		"seconds_long": 254,
		"days_since_added_to_playlist": 875,
		"plays": 44,
		"days_ago_last_played": 114,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "No title",
		"artist": "Reol",
		"seconds_long": 246,
		"days_since_added_to_playlist": 875,
		"plays": 40,
		"days_ago_last_played": 121,
		"skips": 11,
		"rating": 7
	},
	{
		"song_name": "Phanto(me)",
		"artist": "Reol",
		"seconds_long": 246,
		"days_since_added_to_playlist": 875,
		"plays": 49,
		"days_ago_last_played": 78,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "SAIREN",
		"artist": "Reol",
		"seconds_long": 240,
		"days_since_added_to_playlist": 875,
		"plays": 47,
		"days_ago_last_played": 28,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Saisaki",
		"artist": "Reol",
		"seconds_long": 221,
		"days_since_added_to_playlist": 732,
		"plays": 35,
		"days_ago_last_played": 20,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Ten to One",
		"artist": "Reol",
		"seconds_long": 225,
		"days_since_added_to_playlist": 731,
		"plays": 28,
		"days_ago_last_played": 78,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Utena",
		"artist": "Reol",
		"seconds_long": 200,
		"days_since_added_to_playlist": 875,
		"plays": 39,
		"days_ago_last_played": 138,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Scar/let",
		"artist": "ReoNa",
		"album": "ANIMA",
		"seconds_long": 257,
		"days_since_added_to_playlist": 40,
		"plays": 2,
		"days_ago_last_played": 39,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "ANIMA",
		"artist": "ReoNa",
		"album": "unknown",
		"seconds_long": 267,
		"days_since_added_to_playlist": 440,
		"plays": 34,
		"days_ago_last_played": 13,
		"skips": 10,
		"rating": 8
	},
	{
		"song_name": "Till the End",
		"artist": "ReoNa",
		"album": "unknown",
		"seconds_long": 364,
		"days_since_added_to_playlist": 249,
		"plays": 11,
		"days_ago_last_played": 45,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Overkill",
		"artist": "RIOT",
		"seconds_long": 349,
		"days_since_added_to_playlist": 687,
		"plays": 37,
		"days_ago_last_played": 116,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Ten Thousand Miracles",
		"artist": "Riya, Shinji Orito, Magome Togoshi, Jun Maede",
		"album": "Clannad Original Soundtrack",
		"seconds_long": 413,
		"days_since_added_to_playlist": 225,
		"plays": 35,
		"days_ago_last_played": 10,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Candy",
		"artist": "Robbie Williams",
		"seconds_long": 201,
		"days_since_added_to_playlist": 253,
		"plays": 7,
		"days_ago_last_played": 48,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Roaring Tides (Epic Cover)",
		"artist": "Rod Herold",
		"seconds_long": 154,
		"days_since_added_to_playlist": 56,
		"plays": 4,
		"days_ago_last_played": 17,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "BIG SHOT (Remix)",
		"artist": "RoomTone",
		"origial_artist": "Toby Fox",
		"seconds_long": 152,
		"days_since_added_to_playlist": 399,
		"plays": 11,
		"days_ago_last_played": 61,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Oblivia",
		"artist": "Saiph",
		"seconds_long": 151,
		"days_since_added_to_playlist": 687,
		"plays": 31,
		"days_ago_last_played": 60,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Mount Wario (Electro Swing Remix)",
		"artist": "Samgold Production",
		"seconds_long": 153,
		"days_since_added_to_playlist": 288,
		"plays": 11,
		"days_ago_last_played": 57,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Daemon",
		"artist": "Sauniks",
		"seconds_long": 276,
		"days_since_added_to_playlist": 1250,
		"plays": 25,
		"days_ago_last_played": 42,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Mad Mew Mew Dance (Remix)",
		"artist": "SayMaxWell",
		"seconds_long": 232,
		"days_since_added_to_playlist": 461,
		"plays": 7,
		"days_ago_last_played": 48,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Megalovania / Asgore / Spider Dance (Mashup Remix)",
		"artist": "SayMaxWell",
		"seconds_long": 297,
		"days_since_added_to_playlist": 461,
		"plays": 8,
		"days_ago_last_played": 47,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Reimei",
		"artist": "Sayuri, My First Story",
		"album": "Sanketsu-girl",
		"seconds_long": 312,
		"days_since_added_to_playlist": 40,
		"plays": 3,
		"days_ago_last_played": 12,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Scatman (ski-ba-bop-ba-dop-bop)",
		"artist": "Scatman John",
		"album": "Scatman's World",
		"seconds_long": 210,
		"days_since_added_to_playlist": 80,
		"plays": 12,
		"days_ago_last_played": 44,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Darkness of Light",
		"artist": "Secession Studios",
		"album": "The Untold",
		"seconds_long": 142,
		"days_since_added_to_playlist": 86,
		"plays": 6,
		"days_ago_last_played": 57,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "The Demand of Man",
		"artist": "Secession Studios",
		"album": "The Untold",
		"seconds_long": 154,
		"days_since_added_to_playlist": 86,
		"plays": 12,
		"days_ago_last_played": 57,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Lucifers Waltz",
		"artist": "Secession Studios",
		"album": "The Untold",
		"seconds_long": 178,
		"days_since_added_to_playlist": 86,
		"plays": 23,
		"days_ago_last_played": 16,
		"skips": 5,
		"rating": 8
	},
	{
		"song_name": "One Hundred Strings",
		"artist": "Secession Studios",
		"album": "The Untold",
		"seconds_long": 184,
		"days_since_added_to_playlist": 86,
		"plays": 19,
		"days_ago_last_played": 40,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "The Untold",
		"artist": "Secession Studios",
		"album": "The Untold",
		"seconds_long": 192,
		"days_since_added_to_playlist": 86,
		"plays": 3,
		"days_ago_last_played": 57,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Vindication",
		"artist": "Secession Studios",
		"album": "The Untold",
		"seconds_long": 156,
		"days_since_added_to_playlist": 86,
		"plays": 7,
		"days_ago_last_played": 58,
		"skips": 9,
		"rating": 7
	},
	{
		"song_name": "The Untold II",
		"artist": "Secession Studios, Greg Dombrowski",
		"album": "The Untold II",
		"seconds_long": 318,
		"days_since_added_to_playlist": 86,
		"plays": 23,
		"days_ago_last_played": 40,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "An Ending (Undertale Piano Concerto)",
		"artist": "The Second Narrator",
		"seconds_long": 405,
		"days_since_added_to_playlist": 477,
		"plays": 54,
		"days_ago_last_played": 41,
		"skips": 9,
		"rating": 8
	},
	{
		"song_name": "Rain (ft. Aleana Redd)",
		"artist": "Sekai",
		"seconds_long": 258,
		"days_since_added_to_playlist": 218,
		"plays": 17,
		"days_ago_last_played": 18,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Unrequited",
		"artist": "Sennzai",
		"album": "Arrêter le temps",
		"seconds_long": 265,
		"days_since_added_to_playlist": 86,
		"plays": 15,
		"days_ago_last_played": 12,
		"skips": 3,
		"rating": 8
	},
	{
		"song_name": "Chaos Bergentrückung (Mashup Remix)",
		"artist": "SharaX",
		"seconds_long": 295,
		"days_since_added_to_playlist": 399,
		"plays": 15,
		"days_ago_last_played": 44,
		"skips": 11,
		"rating": 7
	},
	{
		"song_name": "Roaring Tides (Jeremy Ng Cover)",
		"artist": "Shinji Orito",
		"album": "Anime Piano: Shining In The Sky",
		"seconds_long": 195,
		"days_since_added_to_playlist": 86,
		"plays": 11,
		"days_ago_last_played": 17,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Roaring Ocean",
		"artist": "Shinji Orito",
		"album": "Clannad Original Soundtrack",
		"seconds_long": 351,
		"days_since_added_to_playlist": 225,
		"plays": 24,
		"days_ago_last_played": 18,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Roaring Tides",
		"artist": "Shinji Orito",
		"album": "Clannad Original Soundtrack",
		"seconds_long": 157,
		"days_since_added_to_playlist": 225,
		"plays": 48,
		"days_ago_last_played": 40,
		"skips": 27,
		"rating": 9
	},
	{
		"song_name": "Roaring Tides II",
		"artist": "Shinji Orito",
		"album": "Clannad Original Soundtrack",
		"seconds_long": 255,
		"days_since_added_to_playlist": 225,
		"plays": 29,
		"days_ago_last_played": 29,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Town, Flow of Time, People",
		"artist": "Shinji Orito",
		"album": "Clannad Original Soundtrack",
		"seconds_long": 268,
		"days_since_added_to_playlist": 225,
		"plays": 18,
		"days_ago_last_played": 40,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Town, Flow of Time, People (Vocals)",
		"artist": "Shinji Orito",
		"album": "Clannad Original Soundtrack",
		"seconds_long": 180,
		"days_since_added_to_playlist": 40,
		"plays": 4,
		"days_ago_last_played": 36,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Roaring Tides (PianoDeuss Cover)",
		"artist": "Shinji Orito",
		"album": "Clannad Emotional Songs (Piano Collection)",
		"seconds_long": 98,
		"days_since_added_to_playlist": 86,
		"plays": 25,
		"days_ago_last_played": 17,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Protoflicker",
		"artist": "Silentroom",
		"album": "Rainbow Frontier",
		"seconds_long": 172,
		"days_since_added_to_playlist": 182,
		"plays": 20,
		"days_ago_last_played": 10,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Yoshi Star Galaxy (Electro Swing Remix)",
		"artist": "SitDeaf",
		"seconds_long": 135,
		"days_since_added_to_playlist": 358,
		"plays": 15,
		"days_ago_last_played": 42,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Rock 'n' Roll (Will Take You to the Mountain)",
		"artist": "Skrillex",
		"seconds_long": 284,
		"days_since_added_to_playlist": 253,
		"plays": 11,
		"days_ago_last_played": 45,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Where Are U Now",
		"artist": "Skrillex, Diplo, Justin Bieber",
		"seconds_long": 241,
		"days_since_added_to_playlist": 329,
		"plays": 19,
		"days_ago_last_played": 60,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Don't Give Up, Don't Forget (Mashup Remix)",
		"artist": "Skybriel",
		"seconds_long": 291,
		"days_since_added_to_playlist": 399,
		"plays": 12,
		"days_ago_last_played": 10,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Scattered and Lost (Remix)",
		"artist": "Skybriel",
		"origial_artist": "Celeste Original Sountrack",
		"seconds_long": 244,
		"days_since_added_to_playlist": 641,
		"plays": 33,
		"days_ago_last_played": 10,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Don't Forget (Remix)",
		"artist": "Slyleaf",
		"seconds_long": 120,
		"days_since_added_to_playlist": 402,
		"plays": 14,
		"days_ago_last_played": 16,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Can't Sleep Alone (ft. oksami & Nick Smith)",
		"artist": "SMLE",
		"seconds_long": 165,
		"days_since_added_to_playlist": 411,
		"plays": 19,
		"days_ago_last_played": 113,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Every Chance You Get",
		"artist": "SMLE",
		"seconds_long": 209,
		"days_since_added_to_playlist": 395,
		"plays": 22,
		"days_ago_last_played": 16,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Halo (ft. Helen Tess)",
		"artist": "SMLE",
		"seconds_long": 230,
		"days_since_added_to_playlist": 395,
		"plays": 26,
		"days_ago_last_played": 43,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "It'll Be Okay",
		"artist": "SMLE",
		"seconds_long": 227,
		"days_since_added_to_playlist": 411,
		"plays": 30,
		"days_ago_last_played": 20,
		"skips": 9,
		"rating": 8
	},
	{
		"song_name": "Overflow (ft. Helen Tess)",
		"artist": "SMLE",
		"seconds_long": 216,
		"days_since_added_to_playlist": 395,
		"plays": 24,
		"days_ago_last_played": 107,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "Weightless (ft. Nick Smith)",
		"artist": "SMLE",
		"seconds_long": 176,
		"days_since_added_to_playlist": 235,
		"plays": 17,
		"days_ago_last_played": 41,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "before the last summer ends",
		"artist": "Snail's House",
		"album": "L'été",
		"seconds_long": 248,
		"days_since_added_to_playlist": 536,
		"plays": 31,
		"days_ago_last_played": 15,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Pluie",
		"artist": "Snail's House",
		"album": "L'été",
		"seconds_long": 217,
		"days_since_added_to_playlist": 542,
		"plays": 38,
		"days_ago_last_played": 17,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Cinnamon",
		"artist": "Snail's House",
		"seconds_long": 256,
		"days_since_added_to_playlist": 536,
		"plays": 18,
		"days_ago_last_played": 45,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Hot Milk",
		"artist": "Snail's House",
		"seconds_long": 249,
		"days_since_added_to_playlist": 542,
		"plays": 18,
		"days_ago_last_played": 43,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "medicine",
		"artist": "Snail's House",
		"seconds_long": 255,
		"days_since_added_to_playlist": 542,
		"plays": 812,
		"days_ago_last_played": 10,
		"skips": 12,
		"rating": 7
	},
	{
		"song_name": "nightfall",
		"artist": "Snail's House",
		"seconds_long": 210,
		"days_since_added_to_playlist": 542,
		"plays": 23,
		"days_ago_last_played": 290,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "[snowdrift]",
		"artist": "Snail's House",
		"seconds_long": 292,
		"days_since_added_to_playlist": 536,
		"plays": 34,
		"days_ago_last_played": 11,
		"skips": 9,
		"rating": 7
	},
	{
		"song_name": "[whiteout]",
		"artist": "Snail's House",
		"seconds_long": 244,
		"days_since_added_to_playlist": 536,
		"plays": 16,
		"days_ago_last_played": 28,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Hanging On (Remix)",
		"artist": "Sound Remedy",
		"seconds_long": 281,
		"days_since_added_to_playlist": 410,
		"plays": 26,
		"days_ago_last_played": 16,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Medicine (Remix)",
		"artist": "Sound Remedy",
		"seconds_long": 431,
		"days_since_added_to_playlist": 410,
		"plays": 23,
		"days_ago_last_played": 44,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Moondust (Remix)",
		"artist": "Sound Remedy",
		"seconds_long": 356,
		"days_since_added_to_playlist": 410,
		"plays": 18,
		"days_ago_last_played": 10,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Party for Monsters",
		"artist": "Sta",
		"album": "Reasons",
		"seconds_long": 245,
		"days_since_added_to_playlist": 56,
		"plays": 3,
		"days_ago_last_played": 34,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "BLRINK",
		"artist": "Sta",
		"seconds_long": 170,
		"days_since_added_to_playlist": 182,
		"plays": 22,
		"days_ago_last_played": 10,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Friends",
		"artist": "Stessie",
		"seconds_long": 213,
		"days_since_added_to_playlist": 223,
		"plays": 12,
		"days_ago_last_played": 35,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Ready",
		"artist": "Stessie",
		"seconds_long": 211,
		"days_since_added_to_playlist": 223,
		"plays": 8,
		"days_ago_last_played": 47,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Together",
		"artist": "Stessie",
		"seconds_long": 235,
		"days_since_added_to_playlist": 223,
		"plays": 9,
		"days_ago_last_played": 36,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Hestia",
		"artist": "Street",
		"album": "Kachou Fugetsuu",
		"seconds_long": 133,
		"days_since_added_to_playlist": 56,
		"plays": 2,
		"days_ago_last_played": 44,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Φ",
		"artist": "Street",
		"seconds_long": 124,
		"days_since_added_to_playlist": 56,
		"plays": 2,
		"days_ago_last_played": 44,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Her (Remix)",
		"artist": "Strider White",
		"origial_artist": "VALENTINE",
		"seconds_long": 192,
		"days_since_added_to_playlist": 280,
		"plays": 7,
		"days_ago_last_played": 48,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "My Dearest",
		"artist": "supercell",
		"seconds_long": 344,
		"days_since_added_to_playlist": 86,
		"plays": 17,
		"days_ago_last_played": 12,
		"skips": 1,
		"rating": 9
	},
	{
		"song_name": "Trust in you",
		"artist": "sweet ARMS",
		"seconds_long": 273,
		"days_since_added_to_playlist": 249,
		"plays": 17,
		"days_ago_last_played": 10,
		"skips": 3,
		"rating": 8
	},
	{
		"song_name": "Date A Live",
		"artist": "sweet ARMS",
		"seconds_long": 273,
		"days_since_added_to_playlist": 249,
		"plays": 21,
		"days_ago_last_played": 9,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Blossom",
		"artist": "Synthion",
		"seconds_long": 218,
		"days_since_added_to_playlist": 693,
		"plays": 29,
		"days_ago_last_played": 34,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Cake Pop",
		"artist": "Synthion",
		"seconds_long": 223,
		"days_since_added_to_playlist": 690,
		"plays": 21,
		"days_ago_last_played": 56,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Dreamer",
		"artist": "Synthion",
		"seconds_long": 209,
		"days_since_added_to_playlist": 56,
		"plays": 2,
		"days_ago_last_played": 36,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Gravity",
		"artist": "Synthion",
		"seconds_long": 229,
		"days_since_added_to_playlist": 691,
		"plays": 22,
		"days_ago_last_played": 78,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Hypervelocity",
		"artist": "Synthion",
		"seconds_long": 289,
		"days_since_added_to_playlist": 692,
		"plays": 35,
		"days_ago_last_played": 11,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Konpeito",
		"artist": "Synthion",
		"seconds_long": 233,
		"days_since_added_to_playlist": 690,
		"plays": 22,
		"days_ago_last_played": 117,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Lost (ft. Anemoi)",
		"artist": "Synthion",
		"seconds_long": 258,
		"days_since_added_to_playlist": 690,
		"plays": 35,
		"days_ago_last_played": 40,
		"skips": 9,
		"rating": 7
	},
	{
		"song_name": "Lullaby (Remix)",
		"artist": "Synthion",
		"seconds_long": 202,
		"days_since_added_to_playlist": 690,
		"plays": 41,
		"days_ago_last_played": 41,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Omurice (ft. Kotori)",
		"artist": "Synthion",
		"seconds_long": 209,
		"days_since_added_to_playlist": 690,
		"plays": 32,
		"days_ago_last_played": 43,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Orbit (ft. Kotori)",
		"artist": "Synthion",
		"seconds_long": 269,
		"days_since_added_to_playlist": 690,
		"plays": 22,
		"days_ago_last_played": 82,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Promise",
		"artist": "Synthion",
		"seconds_long": 230,
		"days_since_added_to_playlist": 694,
		"plays": 36,
		"days_ago_last_played": 43,
		"skips": 5,
		"rating": 8
	},
	{
		"song_name": "Ruby (ft. Milkoi)",
		"artist": "Synthion",
		"seconds_long": 264,
		"days_since_added_to_playlist": 690,
		"plays": 20,
		"days_ago_last_played": 121,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Sky Blue",
		"artist": "Synthion",
		"seconds_long": 187,
		"days_since_added_to_playlist": 581,
		"plays": 17,
		"days_ago_last_played": 104,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Starlight",
		"artist": "Synthion",
		"seconds_long": 234,
		"days_since_added_to_playlist": 693,
		"plays": 31,
		"days_ago_last_played": 48,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Swift",
		"artist": "Synthion",
		"seconds_long": 169,
		"days_since_added_to_playlist": 693,
		"plays": 27,
		"days_ago_last_played": 20,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "There For Me",
		"artist": "Synthion",
		"seconds_long": 248,
		"days_since_added_to_playlist": 572,
		"plays": 17,
		"days_ago_last_played": 60,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Travel+",
		"artist": "Synthion",
		"seconds_long": 246,
		"days_since_added_to_playlist": 679,
		"plays": 27,
		"days_ago_last_played": 42,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "True (ft. STΔRLIVHT♠♥)",
		"artist": "Synthion",
		"seconds_long": 224,
		"days_since_added_to_playlist": 692,
		"plays": 48,
		"days_ago_last_played": 10,
		"skips": 16,
		"rating": 8
	},
	{
		"song_name": "Twin Skies (ft. Kotori)",
		"artist": "Synthion",
		"seconds_long": 268,
		"days_since_added_to_playlist": 358,
		"plays": 31,
		"days_ago_last_played": 40,
		"skips": 5,
		"rating": 8
	},
	{
		"song_name": "Us (Remix) (ft. Naji)",
		"artist": "Synthion",
		"seconds_long": 223,
		"days_since_added_to_playlist": 690,
		"plays": 30,
		"days_ago_last_played": 43,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Volt Switch",
		"artist": "Synthion",
		"seconds_long": 155,
		"days_since_added_to_playlist": 692,
		"plays": 31,
		"days_ago_last_played": 61,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Voyage",
		"artist": "Synthion",
		"seconds_long": 203,
		"days_since_added_to_playlist": 693,
		"plays": 19,
		"days_ago_last_played": 28,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Windrunner",
		"artist": "Synthion",
		"seconds_long": 264,
		"days_since_added_to_playlist": 679,
		"plays": 26,
		"days_ago_last_played": 82,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Wings",
		"artist": "Synthion",
		"seconds_long": 290,
		"days_since_added_to_playlist": 690,
		"plays": 25,
		"days_ago_last_played": 36,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Back In Time (ft. Luna Morgenstern)",
		"artist": "T & Sugah",
		"seconds_long": 268,
		"days_since_added_to_playlist": 218,
		"plays": 9,
		"days_ago_last_played": 46,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Time (ft. Bensley, C.)",
		"artist": "T & Sugah",
		"seconds_long": 266,
		"days_since_added_to_playlist": 218,
		"plays": 10,
		"days_ago_last_played": 45,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Faint Light",
		"artist": "Taishi",
		"seconds_long": 466,
		"days_since_added_to_playlist": 182,
		"plays": 9,
		"days_ago_last_played": 11,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Emma's Sorrow",
		"artist": "Takahiro Obata",
		"album": "The Promised Neverland Season 1 Original Soundtrack",
		"seconds_long": 192,
		"days_since_added_to_playlist": 56,
		"plays": 3,
		"days_ago_last_played": 14,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "GATE OF STEINER (Piano Cover)",
		"artist": "Takeshi Abo",
		"seconds_long": 236,
		"days_since_added_to_playlist": 40,
		"plays": 4,
		"days_ago_last_played": 14,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "GATE OF STEINER (Symphonic Cover)",
		"artist": "Takeshi Abo",
		"seconds_long": 291,
		"days_since_added_to_playlist": 40,
		"plays": 4,
		"days_ago_last_played": 36,
		"skips": 2,
		"rating": 8
	},
	{
		"song_name": "All Yours",
		"artist": "Tall Order (UK), Sydney",
		"seconds_long": 251,
		"days_since_added_to_playlist": 86,
		"plays": 6,
		"days_ago_last_played": 30,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Cybernecia Catharsis",
		"artist": "Tanchiky",
		"seconds_long": 134,
		"days_since_added_to_playlist": 190,
		"plays": 12,
		"days_ago_last_played": 37,
		"skips": 1,
		"rating": 7,
		"link": "https://www.youtube.com/watch?v=Ry18IVMVFGs",
		"genre": "Future Bass (EDM)",
	},
	{
		"song_name": "Scar",
		"artist": "Tatsuya Kitani",
		"seconds_long": 260,
		"days_since_added_to_playlist": 73,
		"plays": 12,
		"days_ago_last_played": 48,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Speedom (Worldwide Choppers 2) (ft. Eminem, Krizz Kaliko)",
		"artist": "Tech N9ne",
		"album": "Special Effects",
		"seconds_long": 309,
		"days_since_added_to_playlist": 86,
		"plays": 13,
		"days_ago_last_played": 52,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Far Away Light",
		"artist": "technoplanet",
		"seconds_long": 151,
		"days_since_added_to_playlist": 182,
		"plays": 23,
		"days_ago_last_played": 13,
		"skips": 5,
		"rating": 8
	},
	{
		"song_name": "GIFTBOX",
		"artist": "TERRAGAZER Crew, Zekk, awfuless, Cosmograph, EmoCosine, NeLiME, GUANA, KARUT, Riya, Sound Souler, Titancube, litmus*",
		"seconds_long": 209,
		"days_since_added_to_playlist": 86,
		"plays": 0,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Cosmic Cove (Synthwave Remix)",
		"artist": "Timdeuces",
		"seconds_long": 180,
		"days_since_added_to_playlist": 358,
		"plays": 11,
		"days_ago_last_played": 11,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Stay Safe",
		"artist": "Tiny Meat Gang",
		"album": "Locals Only",
		"seconds_long": 100,
		"days_since_added_to_playlist": 86,
		"plays": 7,
		"days_ago_last_played": 46,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Walk Man",
		"artist": "Tiny Meat Gang",
		"seconds_long": 164,
		"days_since_added_to_playlist": 592,
		"plays": 20,
		"days_ago_last_played": 121,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "Rude Buster",
		"artist": "Toby Fox",
		"album": "Deltarune Original Soundtrack",
		"seconds_long": 75,
		"days_since_added_to_playlist": 154,
		"plays": 7,
		"days_ago_last_played": 38,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Another Medium",
		"artist": "Toby Fox",
		"album": "Undertale Original Soundtrack",
		"seconds_long": 142,
		"days_since_added_to_playlist": 481,
		"plays": 11,
		"days_ago_last_played": 10,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Battle Against a True Hero",
		"artist": "Toby Fox",
		"album": "Undertale Original Soundtrack",
		"seconds_long": 156,
		"days_since_added_to_playlist": 154,
		"plays": 12,
		"days_ago_last_played": 41,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Finale",
		"artist": "Toby Fox",
		"album": "Undertale Original Soundtrack",
		"seconds_long": 112,
		"days_since_added_to_playlist": 481,
		"plays": 26,
		"days_ago_last_played": 12,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "A Cyber's World (Video Game Remixes Remix)",
		"artist": "Toby Fox",
		"seconds_long": 203,
		"days_since_added_to_playlist": 402,
		"plays": 24,
		"days_ago_last_played": 40,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Field of Hopes and Dreams (RetroSpecter Remix)",
		"artist": "Toby Fox",
		"seconds_long": 228,
		"days_since_added_to_playlist": 454,
		"plays": 5,
		"days_ago_last_played": 49,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Field of Hopes and Dreams (SharaX Remix)",
		"artist": "Toby Fox",
		"seconds_long": 301,
		"days_since_added_to_playlist": 454,
		"plays": 16,
		"days_ago_last_played": 20,
		"skips": 13,
		"rating": 7
	},
	{
		"song_name": "Field of Hopes and Dreams (Video Game Remixes Remix)",
		"artist": "Toby Fox",
		"seconds_long": 187,
		"days_since_added_to_playlist": 454,
		"plays": 11,
		"days_ago_last_played": 45,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Legend (Chillwave Remix)",
		"artist": "Tudd",
		"original_artist": "Toby Fox",
		"seconds_long": 280,
		"days_since_added_to_playlist": 404,
		"plays": 29,
		"days_ago_last_played": 10,
		"skips": 1,
		"rating": 7
	},
	{
	"song_name": "Megalovania (Remix)",
	"artist": "Camellia",
	"original_artist": "Toby Fox",
	"seconds_long": 380,
	"days_since_added_to_playlist": 627,
	"plays": 13,
	"days_ago_last_played": 45,
	"skips": 4,
	"rating": 7,
	"link": "https://www.youtube.com/watch?v=9X7I3bW49S8",
	"genre": "Speedcore (EDM)"
	},
	{
		"song_name": "Ruins (Video Game Remixes Remix)",
		"artist": "Toby Fox",
		"seconds_long": 131,
		"days_since_added_to_playlist": 481,
		"plays": 10,
		"days_ago_last_played": 61,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Waterfall (DJ-R Remix) (ft. bLiNd)",
		"artist": "Toby Fox",
		"seconds_long": 330,
		"days_since_added_to_playlist": 477,
		"plays": 21,
		"days_ago_last_played": 57,
		"skips": 12,
		"rating": 7
	},
	{
		"song_name": "And You",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 195,
		"days_since_added_to_playlist": 122,
		"plays": 11,
		"days_ago_last_played": 46,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "FBI",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 178,
		"days_since_added_to_playlist": 76,
		"plays": 9,
		"days_ago_last_played": 49,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Flamingo",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 239,
		"days_since_added_to_playlist": 122,
		"plays": 11,
		"days_ago_last_played": 45,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Flamingo Video Shoot",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 230,
		"days_since_added_to_playlist": 122,
		"plays": 16,
		"days_ago_last_played": 10,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Goodbye!! (Bonus Track)",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 136,
		"days_since_added_to_playlist": 76,
		"plays": 7,
		"days_ago_last_played": 8,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Household Name",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 210,
		"days_since_added_to_playlist": 76,
		"plays": 5,
		"days_ago_last_played": 34,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Mail (Outro)",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 182,
		"days_since_added_to_playlist": 56,
		"plays": 6,
		"days_ago_last_played": 14,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Mom Would Agree",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 180,
		"days_since_added_to_playlist": 56,
		"plays": 10,
		"days_ago_last_played": 50,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "No Service",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 232,
		"days_since_added_to_playlist": 152,
		"plays": 23,
		"days_ago_last_played": 11,
		"skips": 13,
		"rating": 9
	},
	{
		"song_name": "Rich For You",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 240,
		"days_since_added_to_playlist": 76,
		"plays": 10,
		"days_ago_last_played": 49,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Same Difference",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 294,
		"days_since_added_to_playlist": 122,
		"plays": 24,
		"days_ago_last_played": 56,
		"skips": 5,
		"rating": 8
	},
	{
		"song_name": "Somewhere In Between",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 276,
		"days_since_added_to_playlist": 76,
		"plays": 20,
		"days_ago_last_played": 17,
		"skips": 3,
		"rating": 9
	},
	{
		"song_name": "Suitcase and a Passport",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 188,
		"days_since_added_to_playlist": 76,
		"plays": 5,
		"days_ago_last_played": 44,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Treehouse",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 194,
		"days_since_added_to_playlist": 122,
		"plays": 18,
		"days_ago_last_played": 24,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Well",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 182,
		"days_since_added_to_playlist": 122,
		"plays": 14,
		"days_ago_last_played": 44,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "YouTube Rapper (ft. Tech N9ne)",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 235,
		"days_since_added_to_playlist": 151,
		"plays": 20,
		"days_ago_last_played": 33,
		"skips": 2,
		"rating": 8
	},
	{
		"song_name": "7th Day",
		"artist": "Token",
		"album": "Between Somewhere",
		"seconds_long": 243,
		"days_since_added_to_playlist": 76,
		"plays": 13,
		"days_ago_last_played": 48,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Shavings",
		"artist": "Token",
		"album": "Eraser Shavings",
		"seconds_long": 246,
		"days_since_added_to_playlist": 56,
		"plays": 10,
		"days_ago_last_played": 44,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Be Happy",
		"artist": "Token",
		"album": "Pink Is Better",
		"seconds_long": 177,
		"days_since_added_to_playlist": 56,
		"plays": 22,
		"days_ago_last_played": 33,
		"skips": 2,
		"rating": 8
	},
	{
		"song_name": "Best Highs",
		"artist": "Token",
		"album": "Pink Is Better",
		"seconds_long": 164,
		"days_since_added_to_playlist": 56,
		"plays": 13,
		"days_ago_last_played": 46,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Caught on Camera",
		"artist": "Token",
		"album": "Pink Is Better",
		"seconds_long": 188,
		"days_since_added_to_playlist": 56,
		"plays": 12,
		"days_ago_last_played": 33,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Chit Chat",
		"artist": "Token",
		"album": "Pink Is Better",
		"seconds_long": 145,
		"days_since_added_to_playlist": 115,
		"plays": 7,
		"days_ago_last_played": 47,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "I Can't Help (ft. Digital Nas, SAINT LYOR)",
		"artist": "Token",
		"album": "Pink Is Better",
		"seconds_long": 188,
		"days_since_added_to_playlist": 56,
		"plays": 12,
		"days_ago_last_played": 46,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "A Little Different",
		"artist": "Token",
		"album": "Pink Is Better",
		"seconds_long": 184,
		"days_since_added_to_playlist": 56,
		"plays": 15,
		"days_ago_last_played": 14,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Pink",
		"artist": "Token",
		"album": "Pink Is Better",
		"seconds_long": 160,
		"days_since_added_to_playlist": 56,
		"plays": 13,
		"days_ago_last_played": 30,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Sip",
		"artist": "Token",
		"album": "Pink Is Better",
		"seconds_long": 142,
		"days_since_added_to_playlist": 56,
		"plays": 9,
		"days_ago_last_played": 53,
		"skips": 10,
		"rating": 7
	},
	{
		"song_name": "Struck Gold",
		"artist": "Token",
		"album": "Pink Is Better",
		"seconds_long": 236,
		"days_since_added_to_playlist": 56,
		"plays": 11,
		"days_ago_last_played": 9,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Thank God",
		"artist": "Token",
		"album": "Pink Is Better",
		"seconds_long": 172,
		"days_since_added_to_playlist": 56,
		"plays": 11,
		"days_ago_last_played": 46,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Curfew",
		"artist": "Token",
		"seconds_long": 192,
		"days_since_added_to_playlist": 150,
		"plays": 14,
		"days_ago_last_played": 44,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Dentures",
		"artist": "Token",
		"seconds_long": 193,
		"days_since_added_to_playlist": 115,
		"plays": 15,
		"days_ago_last_played": 47,
		"skips": 2,
		"rating": 8
	},
	{
		"song_name": "Doozy",
		"artist": "Token",
		"seconds_long": 261,
		"days_since_added_to_playlist": 115,
		"plays": 8,
		"days_ago_last_played": 47,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Hi Billie Eilish...",
		"artist": "Token",
		"seconds_long": 179,
		"days_since_added_to_playlist": 649,
		"plays": 37,
		"days_ago_last_played": 43,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Hi J. Cole...",
		"artist": "Token",
		"seconds_long": 201,
		"days_since_added_to_playlist": 666,
		"plays": 49,
		"days_ago_last_played": 77,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "One Like Equals",
		"artist": "Token",
		"seconds_long": 302,
		"days_since_added_to_playlist": 56,
		"plays": 3,
		"days_ago_last_played": 9,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Patty Cake",
		"artist": "Token",
		"seconds_long": 292,
		"days_since_added_to_playlist": 115,
		"plays": 10,
		"days_ago_last_played": 33,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Run It Back",
		"artist": "Token",
		"seconds_long": 181,
		"days_since_added_to_playlist": 56,
		"plays": 11,
		"days_ago_last_played": 44,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Salt Shaker",
		"artist": "Token",
		"seconds_long": 141,
		"days_since_added_to_playlist": 115,
		"plays": 8,
		"days_ago_last_played": 47,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "This House",
		"artist": "Tom MacDonald",
		"album": "Deathreats",
		"seconds_long": 216,
		"days_since_added_to_playlist": 153,
		"plays": 16,
		"days_ago_last_played": 35,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Sad Rappers",
		"artist": "Tom MacDonald",
		"album": "Ghostories",
		"seconds_long": 178,
		"days_since_added_to_playlist": 80,
		"plays": 6,
		"days_ago_last_played": 49,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Don't Look Down",
		"artist": "Tom MacDonald",
		"seconds_long": 448,
		"days_since_added_to_playlist": 80,
		"plays": 13,
		"days_ago_last_played": 12,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Mac Lethal Sucks",
		"artist": "Tom MacDonald",
		"seconds_long": 268,
		"days_since_added_to_playlist": 513,
		"plays": 18,
		"days_ago_last_played": 89,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Hamidashimono",
		"artist": "Tomori Kusunoki",
		"seconds_long": 235,
		"days_since_added_to_playlist": 249,
		"plays": 18,
		"days_ago_last_played": 82,
		"skips": 4,
		"rating": 8
	},
	{
		"song_name": "unravel",
		"artist": "Toru Kitajima",
		"seconds_long": 241,
		"days_since_added_to_playlist": 875,
		"plays": 41,
		"days_ago_last_played": 12,
		"skips": 7,
		"rating": 8
	},
	{
		"song_name": "Fading Giants",
		"artist": "Trevor DeMaere, David Chappell",
		"seconds_long": 214,
		"days_since_added_to_playlist": 985,
		"plays": 8,
		"days_ago_last_played": 419,
		"skips": 18,
		"rating": 7
	},
	{
		"song_name": "phony (ft. KAFU)",
		"artist": "Tsumiki",
		"seconds_long": 202,
		"days_since_added_to_playlist": 431,
		"plays": 24,
		"days_ago_last_played": 24,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Car Radio",
		"artist": "Twenty One Pilots",
		"seconds_long": 267,
		"days_since_added_to_playlist": 640,
		"plays": 33,
		"days_ago_last_played": 10,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Chlorine",
		"artist": "Twenty One Pilots",
		"seconds_long": 324,
		"days_since_added_to_playlist": 640,
		"plays": 11,
		"days_ago_last_played": 45,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Morph",
		"artist": "Twenty One Pilots",
		"seconds_long": 260,
		"days_since_added_to_playlist": 640,
		"plays": 16,
		"days_ago_last_played": 36,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Neon Gravestones",
		"artist": "Twenty One Pilots",
		"seconds_long": 240,
		"days_since_added_to_playlist": 640,
		"plays": 27,
		"days_ago_last_played": 10,
		"skips": 3,
		"rating": 8
	},
	{
		"song_name": "Redecorate",
		"artist": "Twenty One Pilots",
		"seconds_long": 240,
		"days_since_added_to_playlist": 640,
		"plays": 27,
		"days_ago_last_played": 10,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Ride",
		"artist": "Twenty One Pilots",
		"seconds_long": 214,
		"days_since_added_to_playlist": 640,
		"plays": 15,
		"days_ago_last_played": 44,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Tear in My Heart",
		"artist": "Twenty One Pilots",
		"seconds_long": 188,
		"days_since_added_to_playlist": 640,
		"plays": 13,
		"days_ago_last_played": 45,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Re：End of a Dream",
		"artist": "uma, Morimori Atsushi",
		"seconds_long": 249,
		"days_since_added_to_playlist": 56,
		"plays": 4,
		"days_ago_last_played": 12,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Another Medium (Hybrid Remix)",
		"artist": "Undertale",
		"seconds_long": 172,
		"days_since_added_to_playlist": 477,
		"plays": 25,
		"days_ago_last_played": 28,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Make Me Fade",
		"artist": "Vanic, K.Flay",
		"seconds_long": 277,
		"days_since_added_to_playlist": 407,
		"plays": 15,
		"days_ago_last_played": 44,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Rainbow Road (Remix)",
		"artist": "Vector U",
		"seconds_long": 235,
		"days_since_added_to_playlist": 288,
		"plays": 6,
		"days_ago_last_played": 49,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Coconut Mall (Remix)",
		"artist": "Video Game Remixes",
		"seconds_long": 176,
		"days_since_added_to_playlist": 369,
		"plays": 17,
		"days_ago_last_played": 77,
		"skips": 5,
		"rating": 7,
		"link": "https://www.youtube.com/watch?v=hlpGhchmXRk",
		"genre": "EDM"
	},
	{
		"song_name": "Sidetracked Day",
		"artist": "VINXIS",
		"seconds_long": 340,
		"days_since_added_to_playlist": 56,
		"plays": 3,
		"days_ago_last_played": 9,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Idols (EDM Mashup)",
		"artist": "Virtual Riot",
		"seconds_long": 229,
		"days_since_added_to_playlist": 280,
		"plays": 24,
		"days_ago_last_played": 54,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Surrender",
		"artist": "void (Mournfinale)",
		"seconds_long": 320,
		"days_since_added_to_playlist": 190,
		"plays": 10,
		"days_ago_last_played": 35,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Androgynos",
		"artist": "WAiKURO",
		"album": "ULT!MATE END",
		"seconds_long": 297,
		"days_since_added_to_playlist": 56,
		"plays": 12,
		"days_ago_last_played": 9,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Wareta Ringo",
		"artist": "Watanabe Saki (Risa Taneda)",
		"seconds_long": 251,
		"days_since_added_to_playlist": 86,
		"plays": 22,
		"days_ago_last_played": 28,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Don't Be Nice",
		"artist": "Watsky",
		"album": "x Infinity",
		"seconds_long": 215,
		"days_since_added_to_playlist": 56,
		"plays": 1,
		"days_ago_last_played": 50,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "DIE FOR YOU",
		"artist": "The Weeknd",
		"seconds_long": 257,
		"days_since_added_to_playlist": 330,
		"plays": 16,
		"days_ago_last_played": 92,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Suicide (Remix)",
		"artist": "Wheathin",
		"origial_artist": "Midnight to Monaco",
		"seconds_long": 233,
		"days_since_added_to_playlist": 280,
		"plays": 11,
		"days_ago_last_played": 10,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "VECTOЯ",
		"artist": "WHITEFISTS",
		"seconds_long": 142,
		"days_since_added_to_playlist": 190,
		"plays": 11,
		"days_ago_last_played": 24,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Shukufuku",
		"artist": "YOASOBI",
		"seconds_long": 197,
		"days_since_added_to_playlist": 73,
		"plays": 4,
		"days_ago_last_played": 32,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Generation (ft. nayuta, Kisaki ichigo)",
		"artist": "YOU, Freezer",
		"album": "J-neration 10",
		"seconds_long": 243,
		"days_since_added_to_playlist": 56,
		"plays": 3,
		"days_ago_last_played": 30,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Koino Uta (ft. Yune) (Future Bass Remix)",
		"artist": "Yunomi",
		"seconds_long": 242,
		"days_since_added_to_playlist": 442,
		"plays": 25,
		"days_ago_last_played": 97,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Koino Uta",
		"artist": "Yunomi, Tsukaa Yuzaki",
		"album": "Tonikawa Original Soundtrack",
		"seconds_long": 209,
		"days_since_added_to_playlist": 442,
		"plays": 10,
		"days_ago_last_played": 45,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Phantasia",
		"artist": "Yunosuke",
		"seconds_long": 153,
		"days_since_added_to_playlist": 190,
		"plays": 15,
		"days_ago_last_played": 10,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "LIKE I WOULD",
		"artist": "ZAYN",
		"seconds_long": 193,
		"days_since_added_to_playlist": 255,
		"plays": 17,
		"days_ago_last_played": 34,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "365",
		"artist": "Zedd, Katy Perry",
		"seconds_long": 194,
		"days_since_added_to_playlist": 256,
		"plays": 13,
		"days_ago_last_played": 34,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "D4NCE",
		"artist": "Zekk",
		"album": "FÜGENE 02",
		"seconds_long": 237,
		"days_since_added_to_playlist": 108,
		"plays": 7,
		"days_ago_last_played": 34,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Reference",
		"artist": "Zekk",
		"album": "Hyper Glitch Hop -Level01-",
		"seconds_long": 184,
		"days_since_added_to_playlist": 108,
		"plays": 6,
		"days_ago_last_played": 20,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Feelsg00d",
		"artist": "Zekk",
		"album": "Jersey club Re:Bible 001",
		"seconds_long": 178,
		"days_since_added_to_playlist": 108,
		"plays": 11,
		"days_ago_last_played": 43,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Libertas",
		"artist": "Zekk",
		"album": "Memories of Realms",
		"seconds_long": 260,
		"days_since_added_to_playlist": 145,
		"plays": 8,
		"days_ago_last_played": 39,
		"skips": 2,
		"rating": 9
	},
	{
		"song_name": "ReIMEI",
		"artist": "Zekk",
		"album": "PLEiADES",
		"seconds_long": 152,
		"days_since_added_to_playlist": 108,
		"plays": 4,
		"days_ago_last_played": 62,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Vespera",
		"artist": "Zekk",
		"album": "PLEiADES",
		"seconds_long": 156,
		"days_since_added_to_playlist": 108,
		"plays": 14,
		"days_ago_last_played": 42,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Salpa",
		"artist": "Zekk",
		"album": "Salpa EP",
		"seconds_long": 248,
		"days_since_added_to_playlist": 108,
		"plays": 5,
		"days_ago_last_played": 24,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Define",
		"artist": "Zekk",
		"album": "Stream Palette",
		"seconds_long": 188,
		"days_since_added_to_playlist": 108,
		"plays": 8,
		"days_ago_last_played": 28,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Back To You",
		"artist": "Zekk",
		"album": "Stream Palette 2",
		"seconds_long": 194,
		"days_since_added_to_playlist": 108,
		"plays": 21,
		"days_ago_last_played": 30,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Burn",
		"artist": "Zekk",
		"album": "Stream Palette 3",
		"seconds_long": 181,
		"days_since_added_to_playlist": 108,
		"plays": 15,
		"days_ago_last_played": 39,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Break It",
		"artist": "Zekk",
		"album": "TERRA-FORMING",
		"seconds_long": 122,
		"days_since_added_to_playlist": 108,
		"plays": 6,
		"days_ago_last_played": 49,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "D4NCE (2019 Remaster)",
		"artist": "Zekk",
		"album": "Trinity Force",
		"seconds_long": 235,
		"days_since_added_to_playlist": 108,
		"plays": 8,
		"days_ago_last_played": 40,
		"skips": 10,
		"rating": 8
	},
	{
		"song_name": "Let Me Hear (2019 Remaster)",
		"artist": "Zekk",
		"album": "Trinity Force",
		"seconds_long": 368,
		"days_since_added_to_playlist": 108,
		"plays": 4,
		"days_ago_last_played": 49,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "SUMMER (2019 Remaster)",
		"artist": "Zekk",
		"album": "Trinity Force",
		"seconds_long": 226,
		"days_since_added_to_playlist": 108,
		"plays": 11,
		"days_ago_last_played": 49,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Trinity Force",
		"artist": "Zekk",
		"album": "Trinity Force",
		"seconds_long": 194,
		"days_since_added_to_playlist": 108,
		"plays": 22,
		"days_ago_last_played": 42,
		"skips": 2,
		"rating": 8
	},
	{
		"song_name": "Opal",
		"artist": "Zekk",
		"album": "Waves",
		"seconds_long": 228,
		"days_since_added_to_playlist": 108,
		"plays": 9,
		"days_ago_last_played": 36,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Calling",
		"artist": "Zekk",
		"seconds_long": 133,
		"days_since_added_to_playlist": 108,
		"plays": 6,
		"days_ago_last_played": 49,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Feelsleft0ut",
		"artist": "Zekk",
		"seconds_long": 131,
		"days_since_added_to_playlist": 108,
		"plays": 12,
		"days_ago_last_played": 43,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Furiifouru",
		"artist": "Zekk",
		"seconds_long": 133,
		"days_since_added_to_playlist": 108,
		"plays": 10,
		"days_ago_last_played": 32,
		"skips": 0,
		"rating": 9
	},
	{
		"song_name": "MAHOROBA",
		"artist": "Zekk",
		"seconds_long": 125,
		"days_since_added_to_playlist": 190,
		"plays": 14,
		"days_ago_last_played": 44,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Orthocanna (PODA Remix)",
		"artist": "Zekk",
		"seconds_long": 287,
		"days_since_added_to_playlist": 108,
		"plays": 3,
		"days_ago_last_played": 49,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "SUMMER (awfuless Remix)",
		"artist": "Zekk",
		"seconds_long": 233,
		"days_since_added_to_playlist": 108,
		"plays": 13,
		"days_ago_last_played": 42,
		"skips": 9,
		"rating": 7
	},
	{
		"song_name": "WE'RE BACK!!",
		"artist": "Zekk",
		"seconds_long": 135,
		"days_since_added_to_playlist": 108,
		"plays": 5,
		"days_ago_last_played": 49,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Zealous Hearts",
		"artist": "Zekk",
		"seconds_long": 242,
		"days_since_added_to_playlist": 108,
		"plays": 4,
		"days_ago_last_played": 33,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "DROPS (ft. Such)",
		"artist": "Zekk, poplavor",
		"album": "encore -Emotional Vocal POP 02-",
		"seconds_long": 182,
		"days_since_added_to_playlist": 108,
		"plays": 7,
		"days_ago_last_played": 34,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Gloomy Flash (ft. mami)",
		"artist": "Zekk, poplavor",
		"seconds_long": 211,
		"days_since_added_to_playlist": 108,
		"plays": 16,
		"days_ago_last_played": 20,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "raindance (ft. Kanata.N)",
		"artist": "Zekk, poplavor",
		"seconds_long": 210,
		"days_since_added_to_playlist": 108,
		"plays": 15,
		"days_ago_last_played": 24,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Markov Chain",
		"artist": "Zekk, Titancube",
		"album": "HYPERNIGHT, Vol 2",
		"seconds_long": 199,
		"days_since_added_to_playlist": 108,
		"plays": 6,
		"days_ago_last_played": 23,
		"skips": 4,
		"rating": 8
	},
	{
		"song_name": "Can You Really Call This A Hotel, I Didn't Receive A Mint On My Pillow Or Anything (Remix)",
		"artist": "Zerwuw",
		"seconds_long": 218,
		"days_since_added_to_playlist": 461,
		"plays": 8,
		"days_ago_last_played": 42,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Fallin'",
		"artist": "ZHIEND",
		"seconds_long": 312,
		"days_since_added_to_playlist": 56,
		"plays": 1,
		"days_ago_last_played": 51,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Prismatic",
		"artist": "Zythian",
		"seconds_long": 242,
		"days_since_added_to_playlist": 1250,
		"plays": 23,
		"days_ago_last_played": 132,
		"skips": 11,
		"rating": 8
	},
	{
		"song_name": "Keep going",
		"artist": "04 Limited Sazabys",
		"seconds_long": 161,
		"days_since_added_to_playlist": 73,
		"plays": 11,
		"days_ago_last_played": 51,
		"skips": 0,
		"rating": 8
	},
	{
		"song_name": "Crystal Champagne",
		"artist": "111robloxdude",
		"seconds_long": 204,
		"days_since_added_to_playlist": 556,
		"plays": 25,
		"days_ago_last_played": 10,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Big Blue",
		"artist": "",
		"album": "Mario Kart 8 Deluxe Original Soundtrack",
		"seconds_long": 160,
		"days_since_added_to_playlist": 294,
		"plays": 26,
		"days_ago_last_played": 43,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "Cloudtop Cruise",
		"artist": "",
		"album": "Mario Kart 8 Deluxe Original Soundtrack",
		"seconds_long": 143,
		"days_since_added_to_playlist": 294,
		"plays": 11,
		"days_ago_last_played": 10,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Hyrule Circuit",
		"artist": "",
		"album": "Mario Kart 8 Deluxe Original Soundtrack",
		"seconds_long": 118,
		"days_since_added_to_playlist": 294,
		"plays": 10,
		"days_ago_last_played": 45,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "Mario Kart Stadium",
		"artist": "",
		"album": "Mario Kart 8 Deluxe Original Soundtrack",
		"seconds_long": 124,
		"days_since_added_to_playlist": 294,
		"plays": 8,
		"days_ago_last_played": 30,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Mario Kart TV Review",
		"artist": "",
		"album": "Mario Kart 8 Deluxe Original Soundtrack",
		"seconds_long": 34,
		"days_since_added_to_playlist": 294,
		"plays": 8,
		"days_ago_last_played": 17,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Mount Wario",
		"artist": "",
		"album": "Mario Kart 8 Deluxe Original Soundtrack",
		"seconds_long": 154,
		"days_since_added_to_playlist": 288,
		"plays": 10,
		"days_ago_last_played": 45,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Mute City",
		"artist": "",
		"album": "Mario Kart 8 Deluxe Original Soundtrack",
		"seconds_long": 181,
		"days_since_added_to_playlist": 294,
		"plays": 18,
		"days_ago_last_played": 116,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "N64 Rainbow Road",
		"artist": "",
		"album": "Mario Kart 8 Deluxe Original Soundtrack",
		"seconds_long": 132,
		"days_since_added_to_playlist": 294,
		"plays": 9,
		"days_ago_last_played": 34,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Sky Garden",
		"artist": "",
		"album": "Mario Kart 8 Deluxe Original Soundtrack",
		"seconds_long": 91,
		"days_since_added_to_playlist": 294,
		"plays": 7,
		"days_ago_last_played": 48,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Start Screen",
		"artist": "",
		"album": "Mario Kart 8 Deluxe Original Soundtrack",
		"seconds_long": 172,
		"days_since_added_to_playlist": 294,
		"plays": 10,
		"days_ago_last_played": 45,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Sunshine Airport",
		"artist": "",
		"album": "Mario Kart 8 Deluxe Original Soundtrack",
		"seconds_long": 119,
		"days_since_added_to_playlist": 294,
		"plays": 11,
		"days_ago_last_played": 45,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Toad Circuit",
		"artist": "",
		"album": "Mario Kart 8 Deluxe Original Soundtrack",
		"seconds_long": 117,
		"days_since_added_to_playlist": 294,
		"plays": 2,
		"days_ago_last_played": 287,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Wii Grumble Volcano",
		"artist": "",
		"album": "Mario Kart 8 Deluxe Original Soundtrack",
		"seconds_long": 146,
		"days_since_added_to_playlist": 294,
		"plays": 9,
		"days_ago_last_played": 48,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Wild Woods",
		"artist": "",
		"album": "Mario Kart 8 Deluxe Original Soundtrack",
		"seconds_long": 125,
		"days_since_added_to_playlist": 294,
		"plays": 13,
		"days_ago_last_played": 17,
		"skips": 14,
		"rating": 7
	},
	{
		"song_name": "Winning Grand Prix",
		"artist": "",
		"album": "Mario Kart 8 Deluxe Original Soundtrack",
		"seconds_long": 85,
		"days_since_added_to_playlist": 294,
		"plays": 3,
		"days_ago_last_played": 166,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Block Plaza",
		"artist": "",
		"album": "Mario Kart Wii Original Soundtrack",
		"seconds_long": 121,
		"days_since_added_to_playlist": 294,
		"plays": 4,
		"days_ago_last_played": 138,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Coconut Mall",
		"artist": "",
		"album": "Mario Kart Wii Original Soundtrack",
		"seconds_long": 141,
		"days_since_added_to_playlist": 294,
		"plays": 4,
		"days_ago_last_played": 78,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Daisy Circuit",
		"artist": "",
		"album": "Mario Kart Wii Original Soundtrack",
		"seconds_long": 141,
		"days_since_added_to_playlist": 294,
		"plays": 13,
		"days_ago_last_played": 44,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "DK Summit",
		"artist": "",
		"album": "Mario Kart Wii Original Soundtrack",
		"seconds_long": 140,
		"days_since_added_to_playlist": 294,
		"plays": 14,
		"days_ago_last_played": 44,
		"skips": 10,
		"rating": 7
	},
	{
		"song_name": "Moonview Highway",
		"artist": "",
		"album": "Mario Kart Wii Original Soundtrack",
		"seconds_long": 150,
		"days_since_added_to_playlist": 294,
		"plays": 15,
		"days_ago_last_played": 78,
		"skips": 8,
		"rating": 7
	},
	{
		"song_name": "Thwomp Desert",
		"artist": "",
		"album": "Mario Kart Wii Original Soundtrack",
		"seconds_long": 131,
		"days_since_added_to_playlist": 294,
		"plays": 15,
		"days_ago_last_played": 41,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Toad's Factory",
		"artist": "",
		"album": "Mario Kart Wii Original Soundtrack",
		"seconds_long": 100,
		"days_since_added_to_playlist": 294,
		"plays": 12,
		"days_ago_last_played": 17,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Ball Rolling",
		"artist": "",
		"album": "Super Mario Galaxy 2 Original Soundtrack",
		"seconds_long": 62,
		"days_since_added_to_playlist": 374,
		"plays": 2,
		"days_ago_last_played": 183,
		"skips": 14,
		"rating": 7
	},
	{
		"song_name": "Boomsday",
		"artist": "",
		"album": "Super Mario Galaxy 2 Original Soundtrack",
		"seconds_long": 188,
		"days_since_added_to_playlist": 374,
		"plays": 13,
		"days_ago_last_played": 40,
		"skips": 9,
		"rating": 7
	},
	{
		"song_name": "Bouldergeist",
		"artist": "",
		"album": "Super Mario Galaxy 2 Original Soundtrack",
		"seconds_long": 116,
		"days_since_added_to_playlist": 373,
		"plays": 5,
		"days_ago_last_played": 127,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Bowser's Galaxy Generator",
		"artist": "",
		"album": "Super Mario Galaxy 2 Original Soundtrack",
		"seconds_long": 192,
		"days_since_added_to_playlist": 373,
		"plays": 2,
		"days_ago_last_played": 332,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Cloudy Court Galaxy",
		"artist": "",
		"album": "Super Mario Galaxy 2 Original Soundtrack",
		"seconds_long": 221,
		"days_since_added_to_playlist": 374,
		"plays": 7,
		"days_ago_last_played": 17,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Cosmic Cove Galaxy",
		"artist": "",
		"album": "Super Mario Galaxy 2 Original Soundtrack",
		"seconds_long": 210,
		"days_since_added_to_playlist": 374,
		"plays": 54,
		"days_ago_last_played": 57,
		"skips": 11,
		"rating": 7
	},
	{
		"song_name": "Final Bowser Battle",
		"artist": "",
		"album": "Super Mario Galaxy 2 Original Soundtrack",
		"seconds_long": 167,
		"days_since_added_to_playlist": 373,
		"plays": 9,
		"days_ago_last_played": 10,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Melty Monster Galaxy",
		"artist": "",
		"album": "Super Mario Galaxy 2 Original Soundtrack",
		"seconds_long": 148,
		"days_since_added_to_playlist": 373,
		"plays": 10,
		"days_ago_last_played": 17,
		"skips": 4,
		"rating": 7
	},
	{
		"song_name": "Purple Coins",
		"artist": "",
		"album": "Super Mario Galaxy 2 Original Soundtrack",
		"seconds_long": 194,
		"days_since_added_to_playlist": 373,
		"plays": 5,
		"days_ago_last_played": 191,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Staff Credits",
		"artist": "",
		"album": "Super Mario Galaxy 2 Original Soundtrack",
		"seconds_long": 230,
		"days_since_added_to_playlist": 357,
		"plays": 19,
		"days_ago_last_played": 40,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Starshine Beach Galaxy",
		"artist": "",
		"album": "Super Mario Galaxy 2 Original Soundtrack",
		"seconds_long": 191,
		"days_since_added_to_playlist": 374,
		"plays": 2,
		"days_ago_last_played": 82,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "The Starship Sails",
		"artist": "",
		"album": "Super Mario Galaxy 2 Original Soundtrack",
		"seconds_long": 136,
		"days_since_added_to_playlist": 374,
		"plays": 9,
		"days_ago_last_played": 17,
		"skips": 1,
		"rating": 7
	},
	{
		"song_name": "Time Attack",
		"artist": "",
		"album": "Super Mario Galaxy 2 Original Soundtrack",
		"seconds_long": 207,
		"days_since_added_to_playlist": 373,
		"plays": 9,
		"days_ago_last_played": 16,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Topman's Tower",
		"artist": "",
		"album": "Super Mario Galaxy 2 Original Soundtrack",
		"seconds_long": 199,
		"days_since_added_to_playlist": 373,
		"plays": 6,
		"days_ago_last_played": 49,
		"skips": 3,
		"rating": 7
	},
	{
		"song_name": "World S",
		"artist": "",
		"album": "Super Mario Galaxy 2 Original Soundtrack",
		"seconds_long": 169,
		"days_since_added_to_playlist": 373,
		"plays": 19,
		"days_ago_last_played": 10,
		"skips": 7,
		"rating": 7
	},
	{
		"song_name": "Good Egg Galaxy",
		"artist": "",
		"album": "Super Mario Galaxy Original Soundtrack",
		"seconds_long": 118,
		"days_since_added_to_playlist": 371,
		"plays": 7,
		"days_ago_last_played": 17,
		"skips": 1,
		"rating": 8
	},
	{
		"song_name": "Gusty Garden Galaxy",
		"artist": "",
		"album": "Super Mario Galaxy Original Soundtrack",
		"seconds_long": 154,
		"days_since_added_to_playlist": 371,
		"plays": 11,
		"days_ago_last_played": 17,
		"skips": 4,
		"rating": 8
	},
	{
		"song_name": "Star Festival",
		"artist": "",
		"album": "Super Mario Galaxy Original Soundtrack",
		"seconds_long": 82,
		"days_since_added_to_playlist": 371,
		"plays": 18,
		"days_ago_last_played": 61,
		"skips": 0,
		"rating": 7
	},
	{
		"song_name": "Birth of the Chaos Heart",
		"artist": "",
		"album": "Super Paper Mario Original Soundtrack",
		"seconds_long": 116,
		"days_since_added_to_playlist": 221,
		"plays": 3,
		"days_ago_last_played": 76,
		"skips": 5,
		"rating": 7
	},
	{
		"song_name": "Bounding Through Time",
		"artist": "",
		"album": "Super Paper Mario Original Soundtrack",
		"seconds_long": 226,
		"days_since_added_to_playlist": 221,
		"plays": 24,
		"days_ago_last_played": 17,
		"skips": 6,
		"rating": 7
	},
	{
		"song_name": "Brobot Battle",
		"artist": "",
		"album": "Super Paper Mario Original Soundtrack",
		"seconds_long": 150,
		"days_since_added_to_playlist": 177,
		"plays": 4,
		"days_ago_last_played": 17,
		"skips": 2,
		"rating": 7
	},
	{
		"song_name": "Super Paper Mario (Title Screen)",
		"artist": "",
		"album": "Super Paper Mario Original Soundtrack",
		"seconds_long": 206,
		"days_since_added_to_playlist": 221,
		"plays": 5,
		"days_ago_last_played": 126,
		"skips": 2,
		"rating": 7
	}
]);

module.exports = songs;