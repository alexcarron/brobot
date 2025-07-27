const {Ability, AbilityUseCount, AbilityType, AbilityPriority, AbilityDuration, AbilityName} = require("./ability.js")
const {Arg, AbilityArgType, ArgumentSubtype, AbilityArgName} = require("./arg.js");
const { Phase } = require("./game-state-manager.js");
const { Announcement, Feedback } = require("./constants/possible-messages.js");
const EffectManager = require("./effect-manager.js");

/**
 * Used to handle ability effects and apply them
 */
class AbilityManager {
	constructor(game_manager) {
		this.game_manager = game_manager;
	}

	static abilities = {
		[AbilityName.HEAL]: new Ability({
			name: AbilityName.HEAL,
			description: "At night, you can heal a player that's not yourself at night to give them a level two defense for the night and following day. You and your target will be notified if your target was attacked while healed.",
			type: AbilityType.PROTECTION,
			priority: AbilityPriority.PROTECTION,
			uses: AbilityUseCount.UNLIMITED,
			duration: AbilityDuration.DAY_AND_NIGHT,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Heal
			],
			feedback: function(player_healing, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to heal **${player_healing}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_HEALING,
					description: "The player you're healing",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.NOT_SELF],
				})
			],
			reverseEffects: (player) => {
				player.restoreOldDefense();
			},
		}),

		[AbilityName.HEAL_SELF]: new Ability({
			name: AbilityName.HEAL_SELF,
			description: "At night, you can heal yourself at night to give yourself a level two defense for the night and following day.",
			type: AbilityType.PROTECTION,
			priority: AbilityPriority.PROTECTION,
			uses: AbilityUseCount.AMOUNT(1),
			duration: AbilityDuration.DAY_AND_NIGHT,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.SelfHeal
			],
			feedback: function(player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to heal ${player_name==="You" ? "yourself" : "themself"} tonight`
			},
			reverseEffects: (player) => {
				player.restoreOldDefense();
			},
		}),

		[AbilityName.EVALUATE]: new Ability({
			name: AbilityName.EVALUATE,
			description: "At night, you can evaluate a player that's not yourself at night to see if their suspicious or innocent. Mafia, Coven, and Neutral Killing seem suspicious. Town and non-Killing Neutrals seem innocent. Those douesd by an Arsonist will be unclear. These results are affected by the players' perceived role.",
			type: AbilityType.INVESTIGATIVE,
			priority: AbilityPriority.INVESTIGATIVE,
			uses: AbilityUseCount.UNLIMITED,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Evaluate
			],
			feedback: function(player_evaluating, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to evaluate **${player_evaluating}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_EVLUATING,
					description: "The player you are evaluating",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.NOT_SELF]
				})
			]
		}),

		[AbilityName.TRACK]: new Ability({
			name: AbilityName.TRACK,
			description: "At night, you can track a player that's not yourself at night to see who they are percieved to be visiting. You will never see players visit themself.",
			type: AbilityType.INVESTIGATIVE,
			priority: AbilityPriority.INVESTIGATIVE,
			uses: AbilityUseCount.UNLIMITED,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Track
			],
			feedback: function(player_tracking, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to track the visit of **${player_tracking}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_TRACKING,
					description: "The player whose visit your tracking",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.NOT_SELF]
				})
			]
		}),

		[AbilityName.LOOKOUT]: new Ability({
			name: AbilityName.LOOKOUT,
			description: "At night, watch a player's house that isn't yourself. If any players are percieved to have visited them, you'll be told every player that did that night. You will never see players visit themself.",
			type: AbilityType.INVESTIGATIVE,
			priority: AbilityPriority.INVESTIGATIVE,
			uses: AbilityUseCount.UNLIMITED,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Lookout
			],
			feedback: function(player_tracking, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will watch **${player_tracking}**'s house tonight to see who visits them.`
			},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_WATCHING,
					description: "The player whose house your watching for visits",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.NOT_SELF]
				})
			]
		}),

		[AbilityName.ROLEBLOCK]: new Ability({
			name: AbilityName.ROLEBLOCK,
			description: "At night, you can roleblock a player that is not yourself at night so that they can't perform their ability that night and following day. They will be notified of this.",
			type: AbilityType.ROLEBLOCK,
			priority: AbilityPriority.ROLEBLOCK,
			uses: AbilityUseCount.UNLIMITED,
			duration: AbilityDuration.DAY_AND_NIGHT,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Roleblock
			],
			feedback: function(player_roleblocking, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to roleblock **${player_roleblocking}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_ROLEBLOCKING,
					description: "The player your roleblocking",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.NOT_SELF]
				})
			],
			reverseEffects: (player) => {
				player.isRoleblocked = false;
			},
		}),

		[AbilityName.SHOOT]: new Ability({
			name: AbilityName.SHOOT,
			description: "At night, you can shoot a player that isn't yourself at night, attacking them.",
			type: AbilityType.ATTACKING,
			priority: AbilityPriority.ATTACKING,
			uses: AbilityUseCount.AMOUNT(3),
			duration: AbilityDuration.ONE_NIGHT,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Attack
			],
			feedback: function(player_shooting, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to shoot **${player_shooting}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_SHOOTING,
					description: "The player your shooting",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.NOT_SELF]
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

		[AbilityName.MURDER]: new Ability({
			name: AbilityName.MURDER,
			description: "At night, you can murder a non-mafia player at night, attacking them.",
			type: AbilityType.ATTACKING,
			priority: AbilityPriority.ATTACKING,
			uses: AbilityUseCount.UNLIMITED,
			duration: AbilityDuration.ONE_NIGHT,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Attack
			],
			feedback: function(player_murdering, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to murder **${player_murdering}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_KILLING,
					description: "The player your killing",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.NON_MAFIA]
				})
			]
		}),

		[AbilityName.FRAME]: new Ability({
			name: AbilityName.FRAME,
			description: "At night, you can frame a non-mafia player at night, making them perceived to be a Mafioso until after they're investigated by a player that gets any information based off of percieved roles.",
			type: AbilityType.MANIPULATION,
			priority: AbilityPriority.MANIPULATION,
			uses: AbilityUseCount.UNLIMITED,
			duration: AbilityDuration.DAY_AND_NIGHT,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Frame
			],
			feedback: function(player_frame, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to frame **${player_frame}** as the Mafioso tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_FRAMING,
					description: "The player your framing to be the Mafioso",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.NON_MAFIA]
				})
			],
			reverseEffects: (player) => {
				player.resetPercieved();
			},
		}),

		[AbilityName.CONSORT]: new Ability({
			name: AbilityName.CONSORT,
			description: "At night, you can consort a player who's not yourself at night, roleblocking them that night and following day. They will be notified.",
			type: AbilityType.ROLEBLOCK,
			priority: AbilityPriority.ROLEBLOCK,
			uses: AbilityUseCount.UNLIMITED,
			duration: AbilityDuration.DAY_AND_NIGHT,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Roleblock
			],
			feedback: function(player_roleblocking, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to roleblock **${player_roleblocking}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_CONSORTING,
					description: "The player your roleblocking",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.NOT_SELF]
				})
			],
			reverseEffects: (player) => {
				player.isRoleblocked = false;
			},
		}),

		[AbilityName.INVESTIGATE]: new Ability({
			name: AbilityName.INVESTIGATE,
			description: "At night, you can investigate a non-mafia player at night, learning their percieved role.",
			type: AbilityType.INVESTIGATIVE,
			priority: AbilityPriority.INVESTIGATIVE,
			uses: AbilityUseCount.UNLIMITED,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Investigate
			],
			feedback: function(player_investigating, player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to investigate the role of **${player_investigating}** tonight`},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_INVESTIGATING,
					description: "The player whose role your investigating",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.NON_MAFIA]
				})
			]
		}),

		[AbilityName.SELF_FRAME]: new Ability({
			name: AbilityName.SELF_FRAME,
			description: "At night, you can frame yourself at night, making yourself perceived as a Mafioso until after you're investigated by a player that gets any information based off of percieved roles.",
			type: AbilityType.MANIPULATION,
			priority: AbilityPriority.MANIPULATION,
			uses: AbilityUseCount.AMOUNT(1),
			duration: AbilityDuration.INDEFINITE,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.SelfFrame
			],
			feedback: function(player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to frame ${isYou ? "yourself" : "themself"} as the mafioso tonight`},
			reverseEffects: (player) => {
				player.resetPercieved();
			},
		}),

		[AbilityName.DEATH_CURSE]: new Ability({
			name: AbilityName.DEATH_CURSE,
			description: "After you've satisfied your win condition and been lynched, you can curse a chosen player who voted guilty during your trial with death at night, attacking them.",
			type: AbilityType.ATTACKING,
			priority: AbilityPriority.ATTACKING,
			uses: AbilityUseCount.AMOUNT(1),
			duration: AbilityDuration.ONE_NIGHT,
			phases_can_use: [Phase.LIMBO],
			effects: [
				EffectManager.EffectName.Attack
			],
			feedback: function(player_cursing, player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to curse **${player_cursing}** with death tonight`},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_KILLING,
					description: "The player your cursing with death",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.CERTAIN_PLAYERS]
				})
			],
		}),

		[AbilityName.FRAME_TARGET]: new Ability({
			name: AbilityName.FRAME_TARGET,
			description: "At night, you can frame your target at night, making them perceived as a Mafioso until after you're investigated by a player that gets any information based off of percieved roles.",
			type: AbilityType.MANIPULATION,
			priority: AbilityPriority.MANIPULATION,
			uses: AbilityUseCount.AMOUNT(1),
			duration: AbilityDuration.INDEFINITE,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.FrameTarget
			],
			feedback: function(player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to frame ${isYou ? "your" : "their"} target as the Mafioso tonight`},
			reverseEffects: (player) => {
				player.resetPercieved();
			},
		}),

		[AbilityName.SELF_VEST]: new Ability({
			name: AbilityName.SELF_VEST,
			description: "At night, you can put on a vest at night, gaining a level two defense for the night and following day.",
			type: AbilityType.PROTECTION,
			priority: AbilityPriority.PROTECTION,
			uses: AbilityUseCount.AMOUNT(4),
			duration: AbilityDuration.DAY_AND_NIGHT,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.SelfHeal
			],
			feedback: function(player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to put on a vest tonight`},
			reverseEffects: (player) => {
				player.restoreOldDefense();
			},
		}),

		[AbilityName.KNIFE]: new Ability({
			name: AbilityName.KNIFE,
			description: "At night, you can knife a player that's not yourself at night, attacking them.",
			type: AbilityType.ATTACKING,
			priority: AbilityPriority.ATTACKING,
			uses: AbilityUseCount.UNLIMITED,
			duration: AbilityDuration.ONE_NIGHT,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Attack
			],
			feedback(player_knifing, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to knife **${player_knifing}** to death tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_KNIFING,
					description: "The player your stabbing",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.NOT_SELF]
				})
			],
		}),

		[AbilityName.CAUTIOUS]: new Ability({
			name: AbilityName.CAUTIOUS,
			description: "At night, you can choose to be cautious at night, not attacking anyone who roleblocks you.",
			type: AbilityType.MODIFIER,
			priority: AbilityPriority.MODIFIER,
			uses: AbilityUseCount.UNLIMITED,
			duration: AbilityDuration.ONE_NIGHT,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Cautious
			],
			feedback: function(player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to be cautious of roleblockers tonight`},
		}),

		[AbilityName.SMITH]: new Ability({
			name: AbilityName.SMITH,
			description: "At night, you can smith a bulletproof vest for a player that's not yourself at night, giving them a level one defense that night and following day. You and your target will be notified if your target was attacked while wearing the vest.",
			type: AbilityType.PROTECTION,
			priority: AbilityPriority.PROTECTION,
			uses: AbilityUseCount.AMOUNT(3),
			duration: AbilityDuration.DAY_AND_NIGHT,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Smith
			],
			feedback: function(player_smithing_for, player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to smith a bulletproof vest for **${player_smithing_for}** tonight`},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_SMITHING_FOR,
					description: "The player your smithing a bulletproof vest for",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.NOT_SELF]
				})
			],
			reverseEffects: (player) => {
				player.restoreOldDefense();
			},
		}),

		[AbilityName.SELF_SMITH]: new Ability({
			name: AbilityName.SELF_SMITH,
			description: "At night, you can smith a bulletproof vest for yourself at night, gaining a level one defense that night and following day.",
			type: AbilityType.PROTECTION,
			priority: AbilityPriority.PROTECTION,
			uses: AbilityUseCount.AMOUNT(1),
			duration: AbilityDuration.DAY_AND_NIGHT,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.SelfSmith
			],
			feedback: function(player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to smith a bulletproof vest for ${isYou ? "yourself" : "themself"} tonight`},
			reverseEffects: (player) => {
				player.restoreOldDefense();
			},
		}),

		[AbilityName.SUICIDE]: new Ability({
			name: AbilityName.SUICIDE,
			description: "You will shoot yourself, attacking yourself with a level four attack.",
			type: AbilityType.SUICIDE,
			priority: AbilityPriority.ATTACKING,
			uses: AbilityUseCount.NONE,
			duration: AbilityDuration.ONE_NIGHT,
			phases_can_use: [],
			effects: [
				EffectManager.EffectName.Attack
			],
			reverseEffects: (player, game_manager) => {
				game_manager.addDeath(player, player, Announcement.VIGILANTE_SUICIDE);

				player.sendFeedback(Feedback.COMITTING_SUICIDE);
				player.addFeedback(Feedback.COMITTED_SUICIDE);
			},
		}),

		[AbilityName.CONTROL]: new Ability({
			name: AbilityName.CONTROL,
			description: "At night, you can control a player that's not yourself, forcing them to use their main ability on another player or themself. You will learn the perceived role of who you controlled and they will be notified that they were controlled. Your control will fail if the player has no ability that can be used on another player or themself.",
			type: AbilityType.CONTROL,
			priority: AbilityPriority.CONTROL,
			uses: AbilityUseCount.UNLIMITED,
			duration: AbilityDuration.ONE_NIGHT,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Control
			],
			feedback: function(player_controlling, player_controlled_into, player_name="You", isYou=true) {return `**${isYou ? "You" : player_name}** will attempt to control **${player_controlling}** into using their ability on **${player_controlled_into}** tonight`},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_CONTROLLING,
					description: "The player your controlling",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.NOT_SELF]
				}),
				new Arg({
					name: AbilityArgName.PLAYER_CONTROLLED_INTO,
					description: "The player your forcing whoever your controlling to visit",
					type: AbilityArgType.PLAYER,
					subtypes: []
				}),
			],
		}),

		[AbilityName.OBSERVE]: new Ability({
			name: AbilityName.OBSERVE,
			description: "At night, you can observe a player that isn't yourself and be told if this player and the last one you observed are percieved to be in the same faction. If this is the first player you observe, you are told nothing.",
			type: AbilityType.INVESTIGATIVE,
			priority: AbilityPriority.INVESTIGATIVE,
			uses: AbilityUseCount.UNLIMITED,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Observe
			],
			feedback: function(player_observing, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to observe **${player_observing}** tonight to see if they're working with the last player ${isYou ? "you" : player_name} observed.`;
			},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_OBSERVING,
					description: "The player you're observing",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.NOT_SELF]
				}),
			],
		}),

		[AbilityName.REPLACE]: new Ability({
			name: AbilityName.REPLACE,
			description: "At night, you can replace a player that isn't yourself. You will attack them, and if you successfully kill them you will be converted to their actual role. Their role and last will won't be revealed upon death.",
			type: AbilityType.ATTACKING,
			priority: AbilityPriority.ATTACKING,
			uses: AbilityUseCount.UNLIMITED,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Attack,
				EffectManager.EffectName.Replace,
			],
			feedback: function(player_replacing_name, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to replace **${player_replacing_name}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_REPLACING,
					description: "The player you're attacking and replacing",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.NOT_SELF]
				}),
			],
		}),

		[AbilityName.KIDNAP]: new Ability({
			name: AbilityName.KIDNAP,
			description: "At night, kidnap a non-mafia player. They will gain a level four defense for the night but they will be roleblocked and won't be able to speak or vote the next day. If you kidnap a role with an attack level above zero, they will attack you while kidnapped without using up an ability no matter what.",
			type: AbilityType.ROLEBLOCK,
			priority: AbilityPriority.ROLEBLOCK,
			uses: AbilityUseCount.UNLIMITED,
			phases_can_use: [Phase.NIGHT],
			effects: [
				EffectManager.EffectName.Kidnap,
			],
			feedback: function(player_kidnapping_name, player_name="You", isYou=true) {
				return `**${isYou ? "You" : player_name}** will attempt to kidnap **${player_kidnapping_name}** tonight`
			},
			args: [
				new Arg({
					name: AbilityArgName.PLAYER_KIDNAPPING,
					description: "The player you're kidnapping",
					type: AbilityArgType.PLAYER,
					subtypes: [ArgumentSubtype.VISITING, ArgumentSubtype.NON_MAFIA, ArgumentSubtype.NOT_SELF]
				}),
			],
			reverseEffects: (player) => {
				player.unmute();
				player.regainVotingAbility();
				player.isRoleblocked = false;
				player.restoreOldDefense();
				player.sendFeedback(Feedback.UNKIDNAPPED);
			},
		}),
	}

	/**
	 * Get an ability from an ability name
	 * @param {string} ability_name - The name of the ability
	 * @returns {Ability} The ability
	 */
	getAbility(ability_name) {
		const ability = AbilityManager.abilities[ability_name];

		if (ability === undefined)
			throw new Error(`getAbility: ${ability_name} is not a valid ability name`);

		return ability;
	}

	/**
	 * Determines if a certain ability a player uses with specific arguments can be used by that player
	 * @param {object} parameters - Object containing player, ability, and arg_values
	 * @param {object} parameters.player - Player attempting to use ability
	 * @param {Ability} parameters.ability - Ability using
	 * @param {{[arg_name: string]: string}} parameters.arg_values - An object map from the argument name to it's passed value
	 * @returns {true | string} true if you can use the ability. Otherwise, feedback for why you can't use the ability
	 */
	canPlayerUseAbility({player, ability, arg_values}) {
		const player_role = this.game_manager.role_manager.getRole(player.role);

		// Check if role has ability
		if (player_role.abilities.every(ability => ability.name !== ability.name)) {
			return `${ability.name} is not an ability you can use`;
		}

		// Check if player is dead and can't use ability while dead
		if (!player.isAlive) {
			if (!(
				ability.phases_can_use.includes(Phase.LIMBO) &&
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
					ability.phases_can_use.includes(Phase.LIMBO) &&
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