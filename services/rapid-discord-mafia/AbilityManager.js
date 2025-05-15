const { Phases, AbilityArgName, ArgumentTypes, ArgumentSubtypes, Announcements, Feedback } = require("../../modules/enums.js")
const {Ability, AbilityUseCount, AbilityType, AbilityPriority, AbilityDuration} = require("./Ability.js")
const { EffectName } = require("./EffectManager.js")
const Arg = require("./Arg.js")

class AbilityManager {
	constructor(game_manager) {
		this.game_manager = game_manager;
	}

	static AbilityName = {
		Knife: "Knife",
		Murder: "Murder",
		Suicide: "Suicide",
		Smith: "Smith",
		SelfSmith: "Self Smith",
		Kidnap: "Kidnap",
		Track: "Track",
		Lookout: "Lookout",
		Nothing: "Nothing",
		DeathCurse: "Death Curse",
		Heal: "Heal",
		HealSelf: "Heal Self",
		Roleblock: "Roleblock",
		Cautious: "Cautious",
		Shoot: "Shoot",
		Frame: "Frame",
		SelfFrame: "Self Frame",
		FrameTarget: "Frame Target",
		Evaluate: "Evaluate",
		Investigate: "Investigate",
		Consort: "Consort",
		SelfVest: "Self Vest",
		Control: "Control",
		Observe: "Observe",
		Replace: "Replace",
	}

	static abilities = {
		[this.AbilityName.Heal]: new Ability({
			name: this.AbilityName.Heal,
			description: "At night, you can heal a player that's not yourself at night to give them a level two defense for the night and following day. You and your target will be notified if your target was attacked while healed.",
			type: AbilityType.PROTECTION,
			priority: AbilityPriority.PROTECTION,
			uses: AbilityUseCount.UNLIMITED,
			duration: AbilityDuration.DAY_AND_NIGHT,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Heal
			],
			feedback: function(player_healing, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to heal **${player_healing}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PlayerHealing,
					description: "The player you're healing",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf],
				})
			],
			reverseEffects: async (player, game_manager) => {
				player.restoreOldDefense();
			},
		}),

		[this.AbilityName.HealSelf]: new Ability({
			name: this.AbilityName.HealSelf,
			description: "At night, you can heal yourself at night to give yourself a level two defense for the night and following day.",
			type: AbilityType.PROTECTION,
			priority: AbilityPriority.PROTECTION,
			uses: AbilityUseCount.AMOUNT(1),
			duration: AbilityDuration.DAY_AND_NIGHT,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.SelfHeal
			],
			feedback: function(player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to heal ${player_name==="You" ? "yourself" : "themself"} tonight`
			},
			reverseEffects: async (player, game_manager) => {
				player.restoreOldDefense();
			},
		}),

		[this.AbilityName.Evaluate]: new Ability({
			name: this.AbilityName.Evaluate,
			description: "At night, you can evaluate a player that's not yourself at night to see if their suspicious or innocent. Mafia, Coven, and Neutral Killing seem suspicious. Town and non-Killing Neutrals seem innocent. Those douesd by an Arsonist will be unclear. These results are affected by the players' perceived role.",
			type: AbilityType.INVESTIGATIVE,
			priority: AbilityPriority.INVESTIGATIVE,
			uses: AbilityUseCount.UNLIMITED,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Evaluate
			],
			feedback: function(player_evaluating, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to evaluate **${player_evaluating}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PlayerEvaluating,
					description: "The player you are evaluating",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				})
			]
		}),

		[this.AbilityName.Track]: new Ability({
			name: this.AbilityName.Track,
			description: "At night, you can track a player that's not yourself at night to see who they are percieved to be visiting. You will never see players visit themself.",
			type: AbilityType.INVESTIGATIVE,
			priority: AbilityPriority.INVESTIGATIVE,
			uses: AbilityUseCount.UNLIMITED,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Track
			],
			feedback: function(player_tracking, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to track the visit of **${player_tracking}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PlayerTracking,
					description: "The player whose visit your tracking",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				})
			]
		}),

		[this.AbilityName.Lookout]: new Ability({
			name: this.AbilityName.Lookout,
			description: "At night, watch a player's house that isn't yourself. If any players are percieved to have visited them, you'll be told every player that did that night. You will never see players visit themself.",
			type: AbilityType.INVESTIGATIVE,
			priority: AbilityPriority.INVESTIGATIVE,
			uses: AbilityUseCount.UNLIMITED,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Lookout
			],
			feedback: function(player_tracking, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will watch **${player_tracking}**'s house tonight to see who visits them.`
			},
			args: [
				new Arg({
					name: AbilityArgName.PlayerWatching,
					description: "The player whose house your watching for visits",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				})
			]
		}),

		[this.AbilityName.Roleblock]: new Ability({
			name: this.AbilityName.Roleblock,
			description: "At night, you can roleblock a player that is not yourself at night so that they can't perform their ability that night and following day. They will be notified of this.",
			type: AbilityType.ROLEBLOCK,
			priority: AbilityPriority.ROLEBLOCK,
			uses: AbilityUseCount.UNLIMITED,
			duration: AbilityDuration.DAY_AND_NIGHT,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Roleblock
			],
			feedback: function(player_roleblocking, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to roleblock **${player_roleblocking}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PlayerRoleblocking,
					description: "The player your roleblocking",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				})
			],
			reverseEffects: async (player, game_manager) => {
				player.isRoleblocked = false;
			},
		}),

		[this.AbilityName.Shoot]: new Ability({
			name: this.AbilityName.Shoot,
			description: "At night, you can shoot a player that isn't yourself at night, attacking them.",
			type: AbilityType.ATTACKING,
			priority: AbilityPriority.ATTACKING,
			uses: AbilityUseCount.AMOUNT(3),
			duration: AbilityDuration.ONE_NIGHT,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Attack
			],
			feedback: function(player_shooting, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to shoot **${player_shooting}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PlayerShooting,
					description: "The player your shooting",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				})
			]
		}),

		// Order: new Ability({
		// 	name: "Order",
		// 	description: "At night, you can order the Mafia to kill a non-mafia player at night so that they become the Mafioso's target. If the Mafioso doesn't exist, is dead, or is roleblocked, you will attack them yourself instead.",
		// 	type: AbilityTypes.Control,
		// 	priority: AbilityPriority.Control,
		// 	uses: AbilityUseCount.Unlimited,
		// 	duration: Duration.OneNight,
		// 	phases_can_use: [Phases.Night],
		// 	effects: [
		// 		EffectName.Order
		// 	],
		// 	feedback: function(player_ordering_to_kill, player_name="You", isYou=true) {
		// 		return `**${isYou ? "You" : player_name}** will attempt to order the Mafioso to murder **${player_ordering_to_kill}** tonight`
		// 	},
		// 	args: [
		// 		new Arg({
		// 			name: AbilityArgName.PlayerKilling,
		// 			description: "The player you want the Mafioso to kill",
		// 			type: ArgumentTypes.Player,
		// 			subtypes: [ArgumentSubtypes.NonMafia]
		// 		})
		// 	]
		// }),

		[this.AbilityName.Murder]: new Ability({
			name: this.AbilityName.Murder,
			description: "At night, you can murder a non-mafia player at night, attacking them.",
			type: AbilityType.ATTACKING,
			priority: AbilityPriority.ATTACKING,
			uses: AbilityUseCount.UNLIMITED,
			duration: AbilityDuration.ONE_NIGHT,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Attack
			],
			feedback: function(player_murdering, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to murder **${player_murdering}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PlayerKilling,
					description: "The player your killing",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NonMafia]
				})
			]
		}),

		[this.AbilityName.Frame]: new Ability({
			name: this.AbilityName.Frame,
			description: "At night, you can frame a non-mafia player at night, making them perceived to be a Mafioso until after they're investigated by a player that gets any information based off of percieved roles.",
			type: AbilityType.MANIPULATION,
			priority: AbilityPriority.MANIPULATION,
			uses: AbilityUseCount.UNLIMITED,
			duration: AbilityDuration.DAY_AND_NIGHT,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Frame
			],
			feedback: function(player_frame, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to frame **${player_frame}** as the Mafioso tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PlayerFraming,
					description: "The player your framing to be the Mafioso",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NonMafia]
				})
			],
			reverseEffects: async (player, game_manager) => {
				player.resetPercieved();
			},
		}),

		[this.AbilityName.Consort]: new Ability({
			name: this.AbilityName.Consort,
			description: "At night, you can consort a player who's not yourself at night, roleblocking them that night and following day. They will be notified.",
			type: AbilityType.ROLEBLOCK,
			priority: AbilityPriority.ROLEBLOCK,
			uses: AbilityUseCount.UNLIMITED,
			duration: AbilityDuration.DAY_AND_NIGHT,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Roleblock
			],
			feedback: function(player_roleblocking, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to roleblock **${player_roleblocking}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PlayerConsorting,
					description: "The player your roleblocking",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				})
			],
			reverseEffects: async (player, game_manager) => {
				player.isRoleblocked = false;
			},
		}),

		[this.AbilityName.Investigate]: new Ability({
			name: this.AbilityName.Investigate,
			description: "At night, you can investigate a non-mafia player at night, learning their percieved role.",
			type: AbilityType.INVESTIGATIVE,
			priority: AbilityPriority.INVESTIGATIVE,
			uses: AbilityUseCount.UNLIMITED,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Investigate
			],
			feedback: function(player_investigating, player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to investigate the role of **${player_investigating}** tonight`},
			args: [
				new Arg({
					name: AbilityArgName.PlayerInvestigating,
					description: "The player whose role your investigating",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NonMafia]
				})
			]
		}),

		[this.AbilityName.SelfFrame]: new Ability({
			name: this.AbilityName.SelfFrame,
			description: "At night, you can frame yourself at night, making yourself perceived as a Mafioso until after you're investigated by a player that gets any information based off of percieved roles.",
			type: AbilityType.MANIPULATION,
			priority: AbilityPriority.MANIPULATION,
			uses: AbilityUseCount.AMOUNT(1),
			duration: AbilityDuration.INDEFINITE,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.SelfFrame
			],
			feedback: function(player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to frame ${isYou ? "yourself" : "themself"} as the mafioso tonight`},
			reverseEffects: async (player, game_manager) => {
				player.resetPercieved();
			},
		}),

		[this.AbilityName.DeathCurse]: new Ability({
			name: this.AbilityName.DeathCurse,
			description: "After you've satisfied your win condition and been lynched, you can curse a chosen player who voted guilty during your trial with death at night, attacking them.",
			type: AbilityType.ATTACKING,
			priority: AbilityPriority.ATTACKING,
			uses: AbilityUseCount.AMOUNT(1),
			duration: AbilityDuration.ONE_NIGHT,
			phases_can_use: [Phases.Limbo],
			effects: [
				EffectName.Attack
			],
			feedback: function(player_cursing, player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to curse **${player_cursing}** with death tonight`},
			args: [
				new Arg({
					name: AbilityArgName.PlayerKilling,
					description: "The player your cursing with death",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.CertainPlayers]
				})
			],
		}),

		[this.AbilityName.FrameTarget]: new Ability({
			name: this.AbilityName.FrameTarget,
			description: "At night, you can frame your target at night, making them perceived as a Mafioso until after you're investigated by a player that gets any information based off of percieved roles.",
			type: AbilityType.MANIPULATION,
			priority: AbilityPriority.MANIPULATION,
			uses: AbilityUseCount.AMOUNT(1),
			duration: AbilityDuration.INDEFINITE,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.FrameTarget
			],
			feedback: function(player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to frame ${isYou ? "your" : "their"} target as the Mafioso tonight`},
			reverseEffects: async (player, game_manager) => {
				player.resetPercieved();
			},
		}),

		[this.AbilityName.SelfVest]: new Ability({
			name: this.AbilityName.SelfVest,
			description: "At night, you can put on a vest at night, gaining a level two defense for the night and following day.",
			type: AbilityType.PROTECTION,
			priority: AbilityPriority.PROTECTION,
			uses: AbilityUseCount.AMOUNT(4),
			duration: AbilityDuration.DAY_AND_NIGHT,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.SelfHeal
			],
			feedback: function(player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to put on a vest tonight`},
			reverseEffects: async (player, game_manager) => {
				player.restoreOldDefense();
			},
		}),

		[this.AbilityName.Knife]: new Ability({
			name: this.AbilityName.Knife,
			description: "At night, you can knife a player that's not yourself at night, attacking them.",
			type: AbilityType.ATTACKING,
			priority: AbilityPriority.ATTACKING,
			uses: AbilityUseCount.UNLIMITED,
			duration: AbilityDuration.ONE_NIGHT,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Attack
			],
			feedback(player_knifing, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to knife **${player_knifing}** to death tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PlayerKnifing,
					description: "The player your stabbing",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				})
			],
		}),

		[this.AbilityName.Cautious]: new Ability({
			name: this.AbilityName.Cautious,
			description: "At night, you can choose to be cautious at night, not attacking anyone who roleblocks you.",
			type: AbilityType.MODIFIER,
			priority: AbilityPriority.MODIFIER,
			uses: AbilityUseCount.UNLIMITED,
			duration: AbilityDuration.ONE_NIGHT,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Cautious
			],
			feedback: function(player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to be cautious of roleblockers tonight`},
		}),

		[this.AbilityName.Smith]: new Ability({
			name: this.AbilityName.Smith,
			description: "At night, you can smith a bulletproof vest for a player that's not yourself at night, giving them a level one defense that night and following day. You and your target will be notified if your target was attacked while wearing the vest.",
			type: AbilityType.PROTECTION,
			priority: AbilityPriority.PROTECTION,
			uses: AbilityUseCount.AMOUNT(3),
			duration: AbilityDuration.DAY_AND_NIGHT,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Smith
			],
			feedback: function(player_smithing_for, player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to smith a bulletproof vest for **${player_smithing_for}** tonight`},
			args: [
				new Arg({
					name: AbilityArgName.PlayerSmithingFor,
					description: "The player your smithing a bulletproof vest for",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				})
			],
			reverseEffects: async (player, game_manager) => {
				player.restoreOldDefense();
			},
		}),

		[this.AbilityName.SelfSmith]: new Ability({
			name: this.AbilityName.SelfSmith,
			description: "At night, you can smith a bulletproof vest for yourself at night, gaining a level one defense that night and following day.",
			type: AbilityType.PROTECTION,
			priority: AbilityPriority.PROTECTION,
			uses: AbilityUseCount.AMOUNT(1),
			duration: AbilityDuration.DAY_AND_NIGHT,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.SelfSmith
			],
			feedback: function(player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to smith a bulletproof vest for ${isYou ? "yourself" : "themself"} tonight`},
			reverseEffects: async (player, game_manager) => {
				player.restoreOldDefense();
			},
		}),

		[this.AbilityName.Suicide]: new Ability({
			name: this.AbilityName.Suicide,
			description: "You will shoot yourself, attacking yourself with a level four attack.",
			type: AbilityType.SUICIDE,
			priority: AbilityPriority.ATTACKING,
			uses: AbilityUseCount.NONE,
			duration: AbilityDuration.ONE_NIGHT,
			phases_can_use: [],
			effects: [
				EffectName.Attack
			],
			reverseEffects: async (player, game_manager) => {
				game_manager.addDeath(player, player, Announcements.VigilanteSuicide);

				player.sendFeedback(Feedback.ComittingSuicide);
				player.addFeedback(Feedback.ComittedSuicide);
			},
		}),

		[this.AbilityName.Control]: new Ability({
			name: this.AbilityName.Control,
			description: "At night, you can control a player that's not yourself, forcing them to use their main ability on another player or themself. You will learn the perceived role of who you controlled and they will be notified that they were controlled. Your control will fail if the player has no ability that can be used on another player or themself.",
			type: AbilityType.CONTROL,
			priority: AbilityPriority.CONTROL,
			uses: AbilityUseCount.UNLIMITED,
			duration: AbilityDuration.ONE_NIGHT,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Control
			],
			feedback: function(player_controlling, player_controlled_into, player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to control **${player_controlling}** into using their ability on **${player_controlled_into}** tonight`},
			args: [
				new Arg({
					name: AbilityArgName.PlayerControlling,
					description: "The player your controlling",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				}),
				new Arg({
					name: AbilityArgName.PlayerControlledInto,
					description: "The player your forcing whoever your controlling to visit",
					type: ArgumentTypes.Player,
					subtypes: []
				}),
			],
		}),

		[this.AbilityName.Observe]: new Ability({
			name: this.AbilityName.Observe,
			description: "At night, you can observe a player that isn't yourself and be told if this player and the last one you observed are percieved to be in the same faction. If this is the first player you observe, you are told nothing.",
			type: AbilityType.INVESTIGATIVE,
			priority: AbilityPriority.INVESTIGATIVE,
			uses: AbilityUseCount.UNLIMITED,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Observe
			],
			feedback: function(player_observing, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to observe **${player_observing}** tonight to see if they're working with the last player ${isYou ? "you" : player_name} observed.`;
			},
			args: [
				new Arg({
					name: AbilityArgName.PlayerObserving,
					description: "The player you're observing",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				}),
			],
		}),

		[this.AbilityName.Replace]: new Ability({
			name: this.AbilityName.Replace,
			description: "At night, you can replace a player that isn't yourself. You will attack them, and if you successfully kill them you will be converted to their actual role. Their role and last will won't be revealed upon death.",
			type: AbilityType.ATTACKING,
			priority: AbilityPriority.ATTACKING,
			uses: AbilityUseCount.UNLIMITED,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Attack,
				EffectName.Replace,
			],
			feedback: function(player_replacing_name, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to replace **${player_replacing_name}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PlayerReplacing,
					description: "The player you're attacking and replacing",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NotSelf]
				}),
			],
		}),

		[this.AbilityName.Kidnap]: new Ability({
			name: this.AbilityName.Kidnap,
			description: "At night, kidnap a non-mafia player. They will gain a level four defense for the night but they will be roleblocked and won't be able to speak or vote the next day. If you kidnap a role with an attack level above zero, they will attack you while kidnapped without using up an ability no matter what.",
			type: AbilityType.ROLEBLOCK,
			priority: AbilityPriority.ROLEBLOCK,
			uses: AbilityUseCount.UNLIMITED,
			phases_can_use: [Phases.Night],
			effects: [
				EffectName.Kidnap,
			],
			feedback: function(player_kidnapping_name, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to kidnap **${player_kidnapping_name}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PlayerKidnapping,
					description: "The player you're kidnapping",
					type: ArgumentTypes.Player,
					subtypes: [ArgumentSubtypes.Visiting, ArgumentSubtypes.NonMafia, ArgumentSubtypes.NotSelf]
				}),
			],
			reverseEffects: async (player, game_manager) => {
				player.unmute();
				player.regainVotingAbility();
				player.isRoleblocked = false;
				player.restoreOldDefense();
				player.sendFeedback(Feedback.Unkidnapped);
			},
		}),
	}

	/**
	 * Get an ability from an ability name
	 * @param {string} ability_name
	 * @returns {Ability | undefined} ability if ability name exists, otherwise undefined
	 */
	getAbility(ability_name) {
		return AbilityManager.abilities[ability_name];
	}

	/**
	 * Determines if a certain ability a player uses with specific arguments can be used by that player
	 * @param {Object} parameters
	 * @param {Player} parameters.player Player attempting to use ability
	 * @param {Ability} parameters.ability Ability using
	 * @param {{[arg_name: string]: [arg_value: string]}} parameters.arg_values
	 * @returns {true | String} true if you can use the ability. Otherwise, feedback for why you can't use the ability
	 */
	async canPlayerUseAbility({player, ability, arg_values}) {
		const player_role = this.game_manager.role_manager.getRole(player.role);

		// Check if role has ability
		if (player_role.abilities.every(ability => ability.name !== ability.name)) {
			return `${ability.name} is not an ability you can use`;
		}

		// Check if player is dead and can't use ability while dead
		if (!player.isAlive) {
			if (!(
				ability.phases_can_use.includes(Phases.Limbo) &&
				player.isInLimbo
			)) {
				return `You can't use the ability, **${ability.name}**, while you're not alive`;
			}
		}

		// Check if ability can be used during current phase
		if (!ability.phases_can_use.includes(this.game_manager.phase)) {

			// Check if ability can be used in limbo and player in limbo
			if (
				!(
					ability.phases_can_use.includes(Phases.Limbo) &&
					player.isInLimbo
				)
			) {
				return `You can't use this ability during the **${this.game_manager.phase}** phase`;
			}
		}

		// Check if valid arguments
		for (const ability_arg of ability.args) {
			const arg_name = ability_arg.name;
			let arg_param_value = arg_values[arg_name];

			const isValidArg = this.game_manager.isValidArgValue(player, ability_arg, arg_param_value);

			if (isValidArg !== true) {
				return isValidArg;
			}
		}

		return true;
	}
}

module.exports = AbilityManager;