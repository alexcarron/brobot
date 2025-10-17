
/**
 * Selects a value based on the current environment mode.
 * @param environmentToValue - An object containing values for both development and production environments.
 * @param environmentToValue.development - The value to use in development mode.
 * @param environmentToValue.production - The value to use in production mode.
 * @returns The value corresponding to the current environment mode.
 * @example
 * const username = chooseByEnv({
 *   development: "test-user",
 *   production: "jsmith2002",
 * });
 */
const chooseByEnv = <DevReturnType, ProdReturnType>(
	environmentToValue: {
		development: DevReturnType;
		production: ProdReturnType;
	}
): DevReturnType | ProdReturnType => {
	type Environment = keyof typeof environmentToValue;
	const isInDevelopmentEnv =
		global.botStatus?.isInDevelopmentMode;

	const environment: Environment =
		isInDevelopmentEnv
			? "development"
			: "production";

	return environmentToValue[environment];
}

export const ids = {
	users: {
    LL: "276119804182659072",
    BROBOT: "803333218614116392",
  },
  servers: {
    brobot_testing: "726562624682197024",
    gameforge: "1135364976496873644",
    rapid_discord_mafia: "1031365759919726622",
    LLGameShowCenter: "1137452342850097252",
    LL_GAME_SHOW_CENTER: "1137452342850097252",
		get NAMESMITH() {
			return chooseByEnv({
				development: "1386449684213530796",
				production: "1347359771799453777",
			});
		},
		evolutionGame: "1385961369223954522",
		get sandSeason3() {
			return chooseByEnv({
				development: "1387934149985173654",
				production: "1375999496164479226",
			});
		}
  },
  ll_user_id: "276119804182659072",
  get client() {
		return chooseByEnv({
			development: "1385404315581157498",
			production: "803333218614116392",
		});
	},
  ll_game_shows: {
    server_id: "1137452342850097252",
    controversial_channel_id: "1137452343785443471",
    channels: {
      game_show_announcements: "1137488553413189702",
      events_vc: "1151333097846091886",
      events_text_chat: "1140463227256455198",
      upcoming_games: "1142212905178239047",
      games_and_events: "1140463227256455198",
      general_talk: "1137452343785443470",
      controversial: "1137452343785443471",
      philosophy: "1137452343785443472",
      lore_discussion: "1137452343785443474",
      art_showcase: "1177340240164298862",
      song_sharing: "1177340589562408980",
      ideas_and_suggestions: "1208109892078936145",
      internet_nonsense: "1137452343785443473",
      gaming_sessions: "1208108913774297138",
      help_and_questions: "1208110687096938546",
    },
    roles: {
      viewer: "1137452342862696564",
      "LL Worshiper!": "1137452342879453189",
      "LL Devotee!": "1137452342879453188",
      "LL Addict!": "1137452342879453187",
      "LL Fanatic!": "1137452342879453186",
      "LL Enthusiast!": "1137452342862696567",
      "LL Follower!": "1137452342862696566",
      "LL Fan!": "1137452342862696565",
      all_discord_events: "1151333405712195614",
      game_night: "1137452342850097257",
      live_tune_tournament_event: "1157720530980438136",
      watch_party: "1137452342850097258",
      self_hosted_game: "1141053180201939015",
      daily_questions: "1248851063893659671",
    },
  },

  gameforge: {
    guild: "1135364976496873644",
    channels: {
      proposed_rules: "1139304249050812416",
      official_rules: "1135365489875505313",
      staff: "1139721081360490518",
      announcements: "1139750688746917888",
      game_discussion: "1135364979252527108",
    },
    roles: {
      host: "1139336733545210019",
    },
  },

  brobot_test_server: {
    server_id: "726562624682197024",
    channels: {
      dm_log: "811399149323812874",
    },
  },

  rapid_discord_mafia: {
    rdm_server_id: "1031365759919726622",
    player_actions_category_id: "1031365761320624132",
    night_chat_category_id: "1031365761320624128",
    pre_game_category_id: "1031365760607604742",
    ghost_chat_channel_id: "1031365761320624134",
    day_chat_category_id: "1031365761068957771",
    living_role_id: "1031365759944892440",
    voting_booth_id: "1045540142267514950",
    town_discussion_channel_id: "1031365761068957772",
    roles: {
      living: "1031365759944892440",
      ghosts: "1031365759919726627",
      spectators: "1031365759919726624",
      on_trial: "1031365759944892441",
      sign_up_ping: "1068690206259163206",
    },
    channels: {
      defense_stand: "1045553209495789598",
      voting_booth: "1045540142267514950",
      game_announce: "1045920748520362045",
      ghost_chat: "1031365761320624134",
      join_chat: "1045922178455060521",
      mafia_chat: "1045921843355332638",
      town_discussion: "1031365761068957772",
      role_list: "1031365760607604740",
      staff: "1031365761672937533",
      how_to_play: "1031365760607604739",
      rules: "1031365760607604738",
    },
    category: {
      player_action: "1031365761320624132",
      night: "1031365761320624128",
      pre_game: "1031365760607604742",
      day: "1031365761068957771",
      archive: "1031365761672937536",
    },
  },

	sandSeason3: {
		guild: "1375999496164479226",
		channels: {
			log: "1376025642386329610",
			team1: {
				get storageRoom() {
					return chooseByEnv({
						development: "1387934766438813717",
						production: "1387954120920666333",
					});
				},
				get kitchen() {
					return chooseByEnv({
						development: "1387934962002690151",
						production: "1387954179368026122",
					});
				},
				get hallway() {
					return chooseByEnv({
						development: "1387934976523108553",
						production: "1387954225186738196",
					});
				},
				get bathroom() {
					return chooseByEnv({
						development: "1387934990406385806",
						production: "1387954271886119018",
					});
				},
				get cyrostasisChamber() {
					return chooseByEnv({
						development: "1387935033926353008",
						production: "1387954344988508301",
					});
				},
			},
			team2: {
				get storageRoom() {
					return chooseByEnv({
						development: "1387935051248959498",
						production: "1387954135923429466",
					});
				},
				get kitchen() {
					return chooseByEnv({
						development: "1387935078943817818",
						production: "1387954195599982602",
					});
				},
				get hallway() {
					return chooseByEnv({
						development: "1387935124263407736",
						production: "1387954244333867038",
					});
				},
				get bathroom() {
					return chooseByEnv({
						development: "1387935138867843142",
						production: "1387954292677410947",
					});
				},
				get cyrostasisChamber() {
					return chooseByEnv({
						development: "1387935159155822652",
						production: "1387954361610539119",
					});
				},
			}
		},
		categories: {
			alliance: "1376025607691046933",
			alliance2: "1377051357457944607",
		},
		roles: {
			contestant: "1376029480606236812",
			spectator: "1376690406087200848",
			eliminated: "1378532839204589598",
		}
	},

	namesmith: {
		roles: {
			get namesmither() {
				return chooseByEnv({
					development: "1386449684213530798",
					production: "1385046899685462186",
				});
			},
			get spectator() {
				return chooseByEnv({
					development: "1386449684213530797",
					production: "1383979159625138196",
				});
			},
			get noName() {
				return chooseByEnv({
					development: "1386449684213530800",
					production: "1383978619407302796",
				});
			},
			get smithedName() {
				return chooseByEnv({
					development: "1386449684213530799",
					production: "1383979126276489308",
				});
			},
			get staff() {
				return chooseByEnv({
					development: "1386449684213530801",
					production: "1386431888171733033",
				});
			}
		},
		channels: {
			get OPEN_MYSTERY_BOXES() {
				return chooseByEnv({
					development: "1386449685497254137",
					production: "1384680717879087156",
				});
			},
			get PUBLISHED_NAMES() {
				return chooseByEnv({
					development: "1386449685283209282",
					production: "1384682059938791576",
				});
			},
			get NAMES_TO_VOTE_ON() {
				return chooseByEnv({
					development: "1387849102687207444",
					production: "1387849216319291553",
				});
			},
			get THE_WINNER() {
				return chooseByEnv({
					development: "1388286079110611057",
					production: "1388286117786292284",
				});
			},
			get RECIPES() {
				return chooseByEnv({
					development: "1403071809699713054",
					production: "1403071766162833532",
				});
			},
			get MINE_TOKENS() {
				return chooseByEnv({
					development: "1386449685497254133",
					production: "1384678822615453847",
				});
			},
			get CLAIM_REFILL() {
				return chooseByEnv({
					development: "1386449685497254134",
					production: "1384678899614613594",
				});
			},
			get TRADE_CHARACTERS() {
				return chooseByEnv({
					development: "1386449685497254138",
					production: "1384681851028901918",
				});
			},
			get CRAFT_CHARACTERS() {
				return chooseByEnv({
					development: "1386449685761228821",
					production: "1384681948156399727",
				});
			},
			get CHOOSE_A_ROLE() {
				return chooseByEnv({
					development: "1428831757398052895",
					production: "1428831590833979442",
				});
			},
		},
	},

	evolutionGame: {
		channels: {
			evolutions: "1385970928046964816",
		},
	},
}