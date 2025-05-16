const RapidDiscordMafia = require("./rapid-discord-mafia");
const {RoleIdentifier, RoleIdentifierKeyword} = require("./role-identifier");
const { GameManager } = require("./game-manager");
const Player = require("./player");
const RoleManager = require("./role-manager");
const { abilities } = require("./ability-manager");
const { arraysHaveSameElements } = require("../../utilities/data-structure-utils");
const { Faction, Alignment, RoleName } = require("./role");
const { TrialOutcome } = require("./vote-manager");
const { Feedback } = require("./constants/possible-messages");
const { AbilityName } = require("./ability");
const { AbilityArgName } = require("./arg");


describe('GameManager', () => {
	// ^ .createRoleList()
	describe('createRoleList', () => {
		test.concurrent(
			".createRoleList() SHOULD convert Mafioso identifier to Mafioso role",
			async () => {
				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = RoleIdentifier.convertIdentifierStrings(["Mafioso"]);
				rdm_game.createRoleList();

				expect(rdm_game.role_list).toStrictEqual(["Mafioso"]);
			}
		);

		test.concurrent(
			".createRoleList() SHOULD convert [Town Protective, Mafioso] identifiers to [Doctor, Mafioso]",
			async () => {
				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						"Town Protective",
						"Mafioso"
					]
				);
				await rdm_game.createRoleList();

				const expected_role_list = ["Doctor", "Mafioso"]
				const actual_role_list = rdm_game.role_list

				expect(
					arraysHaveSameElements(expected_role_list, actual_role_list)
				).toStrictEqual(true);
			}
		);

		test.concurrent(
			".createRoleList() SHOULD assign NK and RT before NB on [Neutral Benign, Neutral Killing, Random Town]",
			async () => {
				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						Faction.NEUTRAL + " " + Alignment.BENIGN,
						Faction.NEUTRAL + " " + Alignment.KILLING,
						Faction.TOWN + " " + RoleIdentifierKeyword.RANDOM,
					]
				);
				await rdm_game.createRoleList();

				const actual_role_list = rdm_game.role_list

				expect(actual_role_list.length).toStrictEqual(3);
			}
		);

		test.concurrent(
			".createRoleList() SHOULD assign RM and RT before NB on [Neutral Benign, Random Mafia, Random Town]",
			async () => {
				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						Faction.NEUTRAL + " " + Alignment.BENIGN,
						Faction.MAFIA + " " + RoleIdentifierKeyword.RANDOM,
						Faction.TOWN + " " + RoleIdentifierKeyword.RANDOM,
					]
				);
				await rdm_game.createRoleList();

				const actual_role_list = rdm_game.role_list

				expect(actual_role_list.length).toStrictEqual(3);
			}
		);
	});

	// ^ .getRoleFromRoleIdentifier()
	describe('getRoleFromRoleIdentifier', () => {
		test.concurrent(
			`.getRoleFromRoleIdentifier(RoleIdentifier.Sheriff) SHOULD return Sheriff role`,
			async () => {
				const input_identifier = new RoleIdentifier(RoleName.SHERIFF);
				const existing_role_list = [];
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						RoleName.SHERIFF
					]
				);
				const expected_output = RoleManager.roles[RoleName.SHERIFF];

				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getRoleFromRoleIdentifier(input_identifier, {})

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		test.concurrent(
			`.getRoleFromRoleIdentifier(RoleIdentifier("Town Crowd")) SHOULD return Townie role`,
			async () => {
				const input_identifier = new RoleIdentifier(`${Faction.TOWN} ${Alignment.CROWD}`);
				const existing_role_list = [];
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						`${Faction.TOWN} ${Alignment.CROWD}`
					]
				);
				const expected_output = RoleManager.roles[RoleName.TOWNIE];

				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getRoleFromRoleIdentifier(input_identifier, {})

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		test.concurrent(
			`.getRoleFromRoleIdentifier(RoleIdentifier("Neutral Killing")) SHOULD return role in Neutral faction and Killing alignment`,
			async () => {
				const input_identifier = new RoleIdentifier(`${Faction.NEUTRAL} ${Alignment.KILLING}`);
				const existing_role_list = [];
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						`${Faction.NEUTRAL} ${Alignment.KILLING}`
					]
				);

				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getRoleFromRoleIdentifier(input_identifier, {})

				expect(actual_output.faction).toStrictEqual(Faction.NEUTRAL);
				expect(actual_output.alignment).toStrictEqual(Alignment.KILLING);
			}
		)

		test.concurrent(
			`.getRoleFromRoleIdentifier(RoleIdentifier("Town Random")) SHOULD return role in Town faction`,
			async () => {
				const input_identifier = new RoleIdentifier(`${Faction.TOWN} ${RoleIdentifierKeyword.RANDOM}`);
				const existing_role_list = [];
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						`${Faction.TOWN} ${RoleIdentifierKeyword.RANDOM}`
					]
				);

				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getRoleFromRoleIdentifier(input_identifier, {})

				expect(actual_output.faction).toStrictEqual(Faction.TOWN);
			}
		)
	});

	// ^ .getPossibleRolesFromIdentifier()
	describe('getPossibleRolesFromIdentifier', () => {
		const getNumMafiaTownFromRatio = function(ratio, isMafia) {
			let num_mafia = 1;
			let num_town = 1;

			if (ratio % 1 !== 0) {
				if (ratio > 1) {
					num_mafia = Math.floor(ratio)
				}
				else {
					num_mafia = 10
					num_town = Math.floor((1/(ratio))*10)
				}
			}
			else {
				num_mafia = ratio
			}

			if (isMafia) {
			}

			if (!isMafia) {
				[num_mafia, num_town] = [num_town, num_mafia]
			}

			return {num_mafia, num_town};
		}

		test.concurrent(
			`.getPossibleRolesFromIdentifier(RoleIdentifier.Sheriff) SHOULD return [Sheriff Role]`,
			async () => {
				const input_identifier = new RoleIdentifier(RoleName.SHERIFF);
				const existing_role_list = [];
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						RoleName.SHERIFF
					]
				);
				const expected_output = [RoleManager.roles[RoleName.SHERIFF]];

				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, {})

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		test.concurrent(
			`.getPossibleRolesFromIdentifier(RoleIdentifier("Town Crowd")) SHOULD return [Townie]`,
			async () => {
				const input_identifier = new RoleIdentifier(`${Faction.TOWN} ${Alignment.CROWD}`);
				const existing_role_list = [];
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						`${Faction.TOWN} ${Alignment.CROWD}`
					]
				);

				const expected_output = [RoleManager.roles[RoleName.TOWNIE]];

				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, {})

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		test.concurrent(
			`.getPossibleRolesFromIdentifier(RoleIdentifier("Neutral Killing")) SHOULD return list of roles in Neutral faction and Killing alignment`,
			async () => {
				const input_identifier = new RoleIdentifier(`${Faction.NEUTRAL} ${Alignment.KILLING}`);
				const existing_role_list = [];
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						`${Faction.NEUTRAL} ${Alignment.KILLING}`
					]
				);

				const expected_output = RoleManager.getListOfRoles().filter( role =>
					role.faction === Faction.NEUTRAL &&
					role.alignment === Alignment.KILLING
				);

				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, {})

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		test.concurrent(
			`.getPossibleRolesFromIdentifier(RoleIdentifier("Neutral Random")) SHOULD return list of roles in Neutral faction when we already have opposing factions`,
			async () => {
				const input_identifier = new RoleIdentifier(`${Faction.NEUTRAL} ${RoleIdentifierKeyword.RANDOM}`);
				const existing_role_list = [
					RoleName.MAFIOSO,
					RoleName.DOCTOR,
				];
				const input_num_roles_in_faction = {
					Town: 1,
					Mafia: 1,
				}
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						RoleName.MAFIOSO,
						RoleName.DOCTOR,
						`${Faction.NEUTRAL} ${RoleIdentifierKeyword.RANDOM}`
					]
				);

				const expected_output = RoleManager.getListOfRoles().filter( role =>
					role.faction === Faction.NEUTRAL
				);

				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction)

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		test.concurrent(
			`.getPossibleRolesFromIdentifier(Any, {}) SHOULD not return any Town Crowd roles or Mafia that isn't Mafioso when we have no roles`,
			async () => {
				const input_identifier = new RoleIdentifier(RoleIdentifierKeyword.ANY);
				const existing_role_list = [
				];
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						RoleIdentifierKeyword.ANY,
					]
				);

				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, {});

				expect(
					actual_output.every(role =>
						!(role.faction === Faction.TOWN &&
							role.alignment === Alignment.CROWD)
					)
				).toStrictEqual(true);

				expect(
					actual_output.every(role =>
						!(role.faction === Faction.MAFIA &&
						role.name !== RoleName.MAFIOSO)
					)
				).toStrictEqual(true);
			}
		)

		test.concurrent(
			`.getPossibleRolesFromIdentifier(Any) SHOULD not return any mafia roles if adding mafia would exceed mafia town max ratio`,
			async () => {
				const input_identifier = new RoleIdentifier(RoleIdentifierKeyword.ANY);

				const {num_mafia, num_town} = getNumMafiaTownFromRatio(GameManager.MAX_MAFIA_TO_TOWN_RATIO, true);

				const existing_role_list = [
					...Array(num_mafia).fill(RoleName.MAFIOSO),
					...Array(num_town).fill(RoleName.TOWNIE),
				];
				const input_num_roles_in_faction = {
					Mafia: num_mafia,
					Town: num_town,
				}
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						...Array(num_mafia).fill(RoleName.MAFIOSO),
						...Array(num_town).fill(RoleName.TOWNIE),
						RoleIdentifierKeyword.ANY
					]
				);


				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction);

				expect(actual_output.every(role => role.faction !== Faction.MAFIA)).toStrictEqual(true);
			}
		)

		test.concurrent(
			`.getPossibleRolesFromIdentifier(Any) SHOULD not return any town roles if adding town would exceed town mafia max ratio`,
			async () => {
				const input_identifier = new RoleIdentifier(RoleIdentifierKeyword.ANY);

				const {num_mafia, num_town} = getNumMafiaTownFromRatio(GameManager.MAX_TOWN_TO_MAFIA_RATIO, false);

				const existing_role_list = [
					...Array(num_mafia).fill(RoleName.MAFIOSO),
					...Array(num_town).fill(RoleName.TOWNIE),
				];
				const input_num_roles_in_faction = {
					Mafia: num_mafia,
					Town: num_town,
				}
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						...Array(num_mafia).fill(RoleName.MAFIOSO),
						...Array(num_town).fill(RoleName.TOWNIE),
						RoleIdentifierKeyword.ANY
					]
				);

				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction);

				expect(actual_output.every(role => role.faction !== Faction.TOWN)).toStrictEqual(true);
			}
		)

		test.concurrent(
			`.getPossibleRolesFromIdentifier(Any) SHOULD not return non-Mafioso Mafia if Mafioso doesn't exist`,
			async () => {
				const input_identifier = new RoleIdentifier(RoleIdentifierKeyword.ANY);

				const existing_role_list = [
					RoleName.TOWNIE,
				];
				const input_num_roles_in_faction = {
					Town: 1,
				}
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						RoleName.TOWNIE,
						RoleIdentifierKeyword.ANY
					]
				);

				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction);

				expect(
					actual_output.every(role =>
						!(role.faction === Faction.MAFIA &&
						role.name !== RoleName.MAFIOSO)
					)
				).toStrictEqual(true);
			}
		)

		test.concurrent(
			`.getPossibleRolesFromIdentifier(Any) SHOULD not return Mafioso when they are already in the role list because they are unique`,
			async () => {
				const input_identifier = new RoleIdentifier(RoleIdentifierKeyword.ANY);
				const existing_role_list = [
					RoleName.MAFIOSO,
					RoleName.TOWNIE,
					RoleName.TOWNIE,
					RoleName.TOWNIE,
				];
				const input_num_roles_in_faction = {
					Town: 3,
					Mafia: 2,
				}
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						RoleName.MAFIOSO,
						RoleName.TOWNIE,
						RoleName.TOWNIE,
						RoleName.TOWNIE,
						RoleIdentifierKeyword.ANY,
					]
				);

				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction);

				expect(
					actual_output.every(role =>
						role.name !== RoleName.MAFIOSO
					)
				).toStrictEqual(true);
			}
		)

		test.concurrent(
			`.getPossibleRolesFromIdentifier(Any) SHOULD not return Mafioso when they are coming up in the role identifiers because they are unique`,
			async () => {
				const input_identifier = new RoleIdentifier(RoleIdentifierKeyword.ANY);
				const existing_role_list = [
					RoleName.TOWNIE,
					RoleName.TOWNIE,
					RoleName.TOWNIE,
				];
				const input_num_roles_in_faction = {
					Town: 3,
				}
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						RoleName.TOWNIE,
						RoleName.TOWNIE,
						RoleName.TOWNIE,
						RoleIdentifierKeyword.ANY,
						RoleName.MAFIOSO,
					]
				);

				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction);

				expect(
					actual_output.every(role =>
						role.name !== RoleName.MAFIOSO
					)
				).toStrictEqual(true);
			}
		)

		test.concurrent(
			`.getPossibleRolesFromIdentifier(Any) SHOULD return only roles in a faction that's not Town when Town is the only faction in the role list`,
			async () => {
				const input_identifier = new RoleIdentifier(RoleIdentifierKeyword.ANY);
				const existing_role_list = [
					RoleName.TOWNIE,
				];
				const input_num_roles_in_faction = {
					Town: 1,
				}
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						RoleName.TOWNIE,
						RoleIdentifierKeyword.ANY,
					]
				);

				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction);

				expect(
					actual_output.every(role =>
						role.faction !== Faction.TOWN &&
						GameManager.POSSIBLE_FACTIONS.some(faction =>
							GameManager.isRoleInFaction(role, faction)
						)
					)
				).toStrictEqual(true);
			}
		)

		test.concurrent(
			`.getPossibleRolesFromIdentifier(Random Neutral) SHOULD return only roles in a faction when Town is the only faction in the role list`,
			async () => {
				const input_identifier = new RoleIdentifier(`${Faction.NEUTRAL} ${RoleIdentifierKeyword.RANDOM}`);
				const existing_role_list = [
					RoleName.TOWNIE,
				];
				const input_num_roles_in_faction = {
					Town: 1,
				}
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						RoleName.TOWNIE,
						`${Faction.NEUTRAL} ${RoleIdentifierKeyword.RANDOM}`,
					]
				);

				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction);

				expect(
					actual_output.every(role =>
						role.faction !== Faction.TOWN &&
						GameManager.POSSIBLE_FACTIONS.some(faction =>
							GameManager.isRoleInFaction(role, faction)
						)
					)
				).toStrictEqual(true);
			}
		)

		test.concurrent(
			`.getPossibleRolesFromIdentifier(Any) SHOULD return only roles in a non-Town faction when Doctor is the only role in the role list`,
			async () => {
				const input_identifier = new RoleIdentifier(RoleIdentifierKeyword.ANY);
				const existing_role_list = [
					RoleName.DOCTOR,
				];
				const input_num_roles_in_faction = {
					Town: 1,
				}
				const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
					[
						RoleIdentifierKeyword.ANY,
						RoleIdentifierKeyword.ANY,
						RoleIdentifierKeyword.ANY,
						RoleIdentifierKeyword.ANY,
					]
				);

				const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
				rdm_game.role_identifiers = existing_role_identifiers;
				rdm_game.role_list = existing_role_list;

				const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction);

				expect(
					actual_output.every(role =>
						GameManager.POSSIBLE_FACTIONS.some(faction =>
							GameManager.isRoleInFaction(role, faction)
						) &&
						role.faction !== Faction.TOWN
					)
				).toStrictEqual(true);
			}
		)
	});


	// ^ isValidArgValue
	describe('isValidArgValue', () => {
		it('SHOULD return NOT true for input framer using frame on mafioso', async () => {
			const player_framing_arg = abilities[AbilityName.FRAME].args[0];
			const player_using_ability = new Player({name: "name", isMockPlayer: true});
			const arg_value = "mafia";

			const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
			const mafia_player = new Player({
				name: "mafia",
				role: RoleName.MAFIOSO,
				isMockPlayer: true,
			})
			rdm_game.player_manager.addPlayer(mafia_player);
			expect(
				rdm_game.isValidArgValue(player_using_ability, player_framing_arg, arg_value)
			).toStrictEqual(
				`You cannot target **mafia** as you may only target non-mafia`
			);
		});

		it('SHOULD return NOT true for input doctor using heal on themselves', async () => {

			const player_framing_arg = abilities[AbilityName.HEAL].args[0];
			const player_using_ability = new Player({name: "name", role: RoleName.DOCTOR,
			isMockPlayer: true,});
			const arg_value = "name";

			const rdm_game = await RapidDiscordMafia.getEmptyGame(true);
			rdm_game.player_manager.addPlayer(player_using_ability);
			expect(
				rdm_game.isValidArgValue(player_using_ability, player_framing_arg, arg_value)
			).toStrictEqual(
				`You cannot target yourself`
			);
		});
	});

	/**
	 * @type GameManager
	 */
	let mock_game;

  const setupMockGame = () => {
		RapidDiscordMafia.setUpRapidDiscordMafia(true);
		mock_game = global.game_manager;
  };

  beforeEach(() => {
    setupMockGame();
  });

	// ^ getDeathMessages
	describe('getDeathMessages', () => {
		it('SHOULD announce cause of death from Mafia and Fool when killed by both in the same night', async () => {
			let mafioso_player = await mock_game.addPlayerToGame(RoleName.MAFIOSO);
			let fool_player = await mock_game.addPlayerToGame(RoleName.FOOL);
			let townie_player = await mock_game.addPlayerToGame(RoleName.TOWNIE);

			const role_identifiers = RoleIdentifier.convertIdentifierStrings([
				RoleName.TOWNIE,
				RoleName.MAFIOSO,
				RoleName.FOOL,
			]);

			await mock_game.start(role_identifiers);

			const mafioso_role = RoleManager.roles[RoleName.MAFIOSO];
			const fool_role = RoleManager.roles[RoleName.FOOL];
			const townie_role = RoleManager.roles[RoleName.TOWNIE];

			// Fix role not being set right
			fool_player.setRole(fool_role);
			townie_player.setRole(townie_role);
			mafioso_player.setRole(mafioso_role);

			await mock_game.startNight(mock_game.days_passed);
			await mock_game.startDay(mock_game.days_passed);

			mock_game.vote_manager.addVoteForPlayer(townie_player, fool_player);
			mock_game.vote_manager.addVoteForPlayer(mafioso_player, fool_player);

			await mock_game.startTrial(mock_game.days_passed);

			mock_game.vote_manager.addVoteForTrialOutcome(townie_player, TrialOutcome.GUILTY);
			mock_game.vote_manager.addVoteForTrialOutcome(mafioso_player, TrialOutcome.GUILTY);

			await mock_game.startTrialResults(mock_game.days_passed);
			// Fool Lynched
			// Night Starts

			mafioso_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.MURDER),
				{
					[AbilityArgName.PLAYER_KILLING]: townie_player.name,
				}
			);
			fool_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.DEATH_CURSE),
				{
					[AbilityArgName.PLAYER_KILLING]: townie_player.name,
				}
			);

			// Set phase to day
			await mock_game.setPhaseToNextPhase();

			for (const player of mock_game.player_manager.getPlayersInLimbo()) {
				player.isInLimbo = false;
			}

			await mock_game.performCurrentNightAbilities();
			await mock_game.sendFeedbackToPlayers();
			await mock_game.announceDay();

			const townie_death = mock_game.next_deaths.find(
				death => death.victim === townie_player.name
			);

			expect(townie_death).not.toBe(undefined);

			const doesMafiosoKillExist = townie_death.kills.some(
				kill =>
					kill.killer_name === mafioso_player.name &&
					kill.killer_role === RoleName.MAFIOSO
			);

			const doesFoolKillExist = townie_death.kills.some(
				kill =>
					kill.killer_name === fool_player.name &&
					kill.killer_role === RoleName.FOOL
			);

			expect(doesMafiosoKillExist).toBe(true);
			expect(doesFoolKillExist).toBe(true);

			const death_messages = mock_game.getDeathMessages(townie_death);

			const doesMessagesIncludeMafiaKill = death_messages.some(
				message =>
					message.includes(Feedback.ANNOUNCE_ANOTHER_MURDER_BY_FACTION(Faction.MAFIA)) ||
					message.includes(Feedback.ANNOUNCE_MURDER_BY_FACTION(Faction.MAFIA))
			);
			const doesMessagesIncludeFoolKill = death_messages.some(
				message =>
					message.includes(Feedback.ANNOUNCE_MURDER_BY_ROLE(RoleName.FOOL)) ||
					message.includes(Feedback.ANNOUNCE_ANOTHER_MURDER_BY_ROLE(RoleName.FOOL))
			);

			expect(doesMessagesIncludeMafiaKill).toBe(true);
			expect(doesMessagesIncludeFoolKill).toBe(true);

		});
	});
})