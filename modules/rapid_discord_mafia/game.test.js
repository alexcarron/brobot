const { RoleNames, Factions, Alignments, RoleIdentifierKeywords } = require("../enums");
const { doArraysHaveSameElements } = require("../functions");
const RoleIdentifier = require("./RoleIdentifier");
const { Abilities } = require("./ability");
const Game = require("./game");
const Player = require("./player");
const roles = require("./roles");

// ^ .createRoleList()
{
	test.concurrent(
		".createRoleList() should convert Mafioso identifier to Mafioso role",
		() => {
			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = RoleIdentifier.convertIdentifierStrings(["Mafioso"]);
			rdm_game.createRoleList();

			expect(rdm_game.role_list).toStrictEqual(["Mafioso"]);
		}
	);

	test.concurrent(
		".createRoleList() should convert [Town Protective, Mafioso] identifiers to [Doctor, Mafioso]",
		async () => {
			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					"Town Protective",
					"Mafioso"
				]
			);
			await rdm_game.createRoleList();

			const expected_role_list = ["Doctor", "Mafioso"]
			const actual_role_list = rdm_game.role_list

			console.log({expected_role_list, actual_role_list})

			expect(doArraysHaveSameElements(expected_role_list, actual_role_list)).toStrictEqual(true);
		}
	);

	test.concurrent(
		".createRoleList() should assign NK and RT before NB on [Neutral Benign, Neutral Killing, Random Town]",
		async () => {
			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					Factions.Neutral + " " + Alignments.Benign,
					Factions.Neutral + " " + Alignments.Killing,
					Factions.Town + " " + RoleIdentifierKeywords.Random,
				]
			);
			await rdm_game.createRoleList();

			const actual_role_list = rdm_game.role_list

			console.log({actual_role_list})
			console.log(rdm_game.role_identifiers[0].priority)
			console.log(rdm_game.role_identifiers[1].priority)
			console.log(rdm_game.role_identifiers[2].priority)

			expect(actual_role_list.length).toStrictEqual(3);
		}
	);

	test.concurrent(
		".createRoleList() should assign RM and RT before NB on [Neutral Benign, Random Mafia, Random Town]",
		async () => {
			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					Factions.Neutral + " " + Alignments.Benign,
					Factions.Mafia + " " + RoleIdentifierKeywords.Random,
					Factions.Town + " " + RoleIdentifierKeywords.Random,
				]
			);
			await rdm_game.createRoleList();

			const actual_role_list = rdm_game.role_list

			console.log({actual_role_list})
			console.log(rdm_game.role_identifiers[0].priority)
			console.log(rdm_game.role_identifiers[1].priority)
			console.log(rdm_game.role_identifiers[2].priority)

			expect(actual_role_list.length).toStrictEqual(3);
		}
	);
}

// ^ .getRoleFromRoleIdentifier()
{
	test.concurrent(
		`.getRoleFromRoleIdentifier(RoleIdentifier.Sheriff) should return Sheriff role`,
		async () => {
			const input_identifier = new RoleIdentifier(RoleNames.Sheriff);
			const existing_role_list = [];
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					RoleNames.Sheriff
				]
			);
			const expected_output = roles[RoleNames.Sheriff];

			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getRoleFromRoleIdentifier(input_identifier, {})

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		`.getRoleFromRoleIdentifier(RoleIdentifier("Town Crowd")) should return Townie role`,
		async () => {
			const input_identifier = new RoleIdentifier(`${Factions.Town} ${Alignments.Crowd}`);
			const existing_role_list = [];
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					`${Factions.Town} ${Alignments.Crowd}`
				]
			);
			const expected_output = roles[RoleNames.Townie];

			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getRoleFromRoleIdentifier(input_identifier, {})

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		`.getRoleFromRoleIdentifier(RoleIdentifier("Neutral Killing")) should return role in Neutral faction and Killing alignment`,
		async () => {
			const input_identifier = new RoleIdentifier(`${Factions.Neutral} ${Alignments.Killing}`);
			const existing_role_list = [];
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					`${Factions.Neutral} ${Alignments.Killing}`
				]
			);

			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getRoleFromRoleIdentifier(input_identifier, {})

			expect(actual_output.faction).toStrictEqual(Factions.Neutral);
			expect(actual_output.alignment).toStrictEqual(Alignments.Killing);
		}
	)

	test.concurrent(
		`.getRoleFromRoleIdentifier(RoleIdentifier("Town Random")) should return role in Town faction`,
		async () => {
			const input_identifier = new RoleIdentifier(`${Factions.Town} ${RoleIdentifierKeywords.Random}`);
			const existing_role_list = [];
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					`${Factions.Town} ${RoleIdentifierKeywords.Random}`
				]
			);

			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getRoleFromRoleIdentifier(input_identifier, {})

			expect(actual_output.faction).toStrictEqual(Factions.Town);
		}
	)
}

// ^ .getPossibleRolesFromIdentifier()
{
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
		`.getPossibleRolesFromIdentifier(RoleIdentifier.Sheriff) should return [Sheriff Role]`,
		async () => {
			const input_identifier = new RoleIdentifier(RoleNames.Sheriff);
			const existing_role_list = [];
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					RoleNames.Sheriff
				]
			);
			const expected_output = [roles[RoleNames.Sheriff]];

			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, {})

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		`.getPossibleRolesFromIdentifier(RoleIdentifier("Town Crowd")) should return [Townie]`,
		async () => {
			const input_identifier = new RoleIdentifier(`${Factions.Town} ${Alignments.Crowd}`);
			const existing_role_list = [];
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					`${Factions.Town} ${Alignments.Crowd}`
				]
			);

			const expected_output = [roles[RoleNames.Townie]];

			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, {})

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		`.getPossibleRolesFromIdentifier(RoleIdentifier("Neutral Killing")) should return list of roles in Neutral faction and Killing alignment`,
		async () => {
			const input_identifier = new RoleIdentifier(`${Factions.Neutral} ${Alignments.Killing}`);
			const existing_role_list = [];
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					`${Factions.Neutral} ${Alignments.Killing}`
				]
			);

			const expected_output = Object.values(roles).filter( role =>
				role.faction === Factions.Neutral &&
				role.alignment === Alignments.Killing
			);

			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, {})

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		`.getPossibleRolesFromIdentifier(RoleIdentifier("Neutral Random")) should return list of roles in Neutral faction when we already have opposing factions`,
		async () => {
			const input_identifier = new RoleIdentifier(`${Factions.Neutral} ${RoleIdentifierKeywords.Random}`);
			const existing_role_list = [
				RoleNames.Mafioso,
				RoleNames.Doctor,
			];
			const input_num_roles_in_faction = {
				Town: 1,
				Mafia: 1,
			}
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					RoleNames.Mafioso,
					RoleNames.Doctor,
					`${Factions.Neutral} ${RoleIdentifierKeywords.Random}`
				]
			);

			const expected_output = Object.values(roles).filter( role =>
				role.faction === Factions.Neutral
			);

			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		`.getPossibleRolesFromIdentifier(Any, {}) should not return any Town Crowd roles or Mafia that isn't Mafioso when we have no roles`,
		async () => {
			const input_identifier = new RoleIdentifier(RoleIdentifierKeywords.Any);
			const existing_role_list = [
			];
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					RoleIdentifierKeywords.Any,
				]
			);

			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, {});

			console.log(actual_output.map(r=>r.name))

			expect(
				actual_output.every(role =>
					!(role.faction === Factions.Town &&
						role.alignment === Alignments.Crowd)
				)
			).toStrictEqual(true);

			expect(
				actual_output.every(role =>
					!(role.faction === Factions.Mafia &&
					role.name !== RoleNames.Mafioso)
				)
			).toStrictEqual(true);
		}
	)

	test.concurrent(
		`.getPossibleRolesFromIdentifier(Any) should not return any mafia roles if adding mafia would exceed mafia town max ratio`,
		async () => {
			const input_identifier = new RoleIdentifier(RoleIdentifierKeywords.Any);

			const {num_mafia, num_town} = getNumMafiaTownFromRatio(Game.MAX_MAFIA_TO_TOWN_RATIO, true);

			const existing_role_list = [
				...Array(num_mafia).fill(RoleNames.Mafioso),
				...Array(num_town).fill(RoleNames.Townie),
			];
			const input_num_roles_in_faction = {
				Mafia: num_mafia,
				Town: num_town,
			}
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					...Array(num_mafia).fill(RoleNames.Mafioso),
					...Array(num_town).fill(RoleNames.Townie),
					RoleIdentifierKeywords.Any
				]
			);


			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction);

			expect(actual_output.every(role => role.faction !== Factions.Mafia)).toStrictEqual(true);
		}
	)

	test.concurrent(
		`.getPossibleRolesFromIdentifier(Any) should not return any town roles if adding town would exceed town mafia max ratio`,
		async () => {
			const input_identifier = new RoleIdentifier(RoleIdentifierKeywords.Any);

			const {num_mafia, num_town} = getNumMafiaTownFromRatio(Game.MAX_TOWN_TO_MAFIA_RATIO, false);

			const existing_role_list = [
				...Array(num_mafia).fill(RoleNames.Mafioso),
				...Array(num_town).fill(RoleNames.Townie),
			];
			const input_num_roles_in_faction = {
				Mafia: num_mafia,
				Town: num_town,
			}
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					...Array(num_mafia).fill(RoleNames.Mafioso),
					...Array(num_town).fill(RoleNames.Townie),
					RoleIdentifierKeywords.Any
				]
			);

			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction);

			console.log({actual_output})

			expect(actual_output.every(role => role.faction !== Factions.Town)).toStrictEqual(true);
		}
	)

	test.concurrent(
		`.getPossibleRolesFromIdentifier(Any) should not return non-Mafioso Mafia if Mafioso doesn't exist`,
		async () => {
			const input_identifier = new RoleIdentifier(RoleIdentifierKeywords.Any);

			const existing_role_list = [
				RoleNames.Townie,
			];
			const input_num_roles_in_faction = {
				Town: 1,
			}
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					RoleNames.Townie,
					RoleIdentifierKeywords.Any
				]
			);

			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction);

			console.log({actual_output})

			expect(
				actual_output.every(role =>
					!(role.faction === Factions.Mafia &&
					role.name !== RoleNames.Mafioso)
				)
			).toStrictEqual(true);
		}
	)

	test.concurrent(
		`.getPossibleRolesFromIdentifier(Any) should not return Mafioso when they are already in the role list because they are unique`,
		async () => {
			const input_identifier = new RoleIdentifier(RoleIdentifierKeywords.Any);
			const existing_role_list = [
				RoleNames.Mafioso,
				RoleNames.Townie,
				RoleNames.Townie,
				RoleNames.Townie,
			];
			const input_num_roles_in_faction = {
				Town: 3,
				Mafia: 2,
			}
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					RoleNames.Mafioso,
					RoleNames.Townie,
					RoleNames.Townie,
					RoleNames.Townie,
					RoleIdentifierKeywords.Any,
				]
			);

			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction);

			console.log({actual_output})

			expect(
				actual_output.every(role =>
					role.name !== RoleNames.Mafioso
				)
			).toStrictEqual(true);
		}
	)

	test.concurrent(
		`.getPossibleRolesFromIdentifier(Any) should not return Mafioso when they are coming up in the role identifiers because they are unique`,
		async () => {
			const input_identifier = new RoleIdentifier(RoleIdentifierKeywords.Any);
			const existing_role_list = [
				RoleNames.Townie,
				RoleNames.Townie,
				RoleNames.Townie,
			];
			const input_num_roles_in_faction = {
				Town: 3,
			}
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					RoleNames.Townie,
					RoleNames.Townie,
					RoleNames.Townie,
					RoleIdentifierKeywords.Any,
					RoleNames.Mafioso,
				]
			);

			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction);

			console.log({actual_output})

			expect(
				actual_output.every(role =>
					role.name !== RoleNames.Mafioso
				)
			).toStrictEqual(true);
		}
	)

	test.concurrent(
		`.getPossibleRolesFromIdentifier(Any) should return only roles in a faction that's not Town when Town is the only faction in the role list`,
		async () => {
			const input_identifier = new RoleIdentifier(RoleIdentifierKeywords.Any);
			const existing_role_list = [
				RoleNames.Townie,
			];
			const input_num_roles_in_faction = {
				Town: 1,
			}
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					RoleNames.Townie,
					RoleIdentifierKeywords.Any,
				]
			);

			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction);

			// console.log({actual_output})

			expect(
				actual_output.every(role =>
					role.faction !== Factions.Town &&
					Game.POSSIBLE_FACTIONS.some(faction =>
						Game.isRoleInFaction(role, faction)
					)
				)
			).toStrictEqual(true);
		}
	)

	test.concurrent(
		`.getPossibleRolesFromIdentifier(Random Neutral) should return only roles in a faction when Town is the only faction in the role list`,
		async () => {
			const input_identifier = new RoleIdentifier(`${Factions.Neutral} ${RoleIdentifierKeywords.Random}`);
			const existing_role_list = [
				RoleNames.Townie,
			];
			const input_num_roles_in_faction = {
				Town: 1,
			}
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					RoleNames.Townie,
					`${Factions.Neutral} ${RoleIdentifierKeywords.Random}`,
				]
			);

			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction);

			// console.log({actual_output})

			expect(
				actual_output.every(role =>
					role.faction !== Factions.Town &&
					Game.POSSIBLE_FACTIONS.some(faction =>
						Game.isRoleInFaction(role, faction)
					)
				)
			).toStrictEqual(true);
		}
	)

	test.concurrent(
		`.getPossibleRolesFromIdentifier(Any) should return only roles in a non-Town faction when Doctor is the only role in the role list`,
		async () => {
			const input_identifier = new RoleIdentifier(RoleIdentifierKeywords.Any);
			const existing_role_list = [
				RoleNames.Doctor,
			];
			const input_num_roles_in_faction = {
				Town: 1,
			}
			const existing_role_identifiers = RoleIdentifier.convertIdentifierStrings(
				[
					RoleIdentifierKeywords.Any,
					RoleIdentifierKeywords.Any,
					RoleIdentifierKeywords.Any,
					RoleIdentifierKeywords.Any,
				]
			);

			const rdm_game = Game.getEmptyGame();
			rdm_game.role_identifiers = existing_role_identifiers;
			rdm_game.role_list = existing_role_list;

			const actual_output = rdm_game.getPossibleRolesFromIdentifier(input_identifier, input_num_roles_in_faction);

			// console.log({actual_output});

			expect(
				actual_output.every(role =>
					Game.POSSIBLE_FACTIONS.some(faction =>
						Game.isRoleInFaction(role, faction)
					) &&
					role.faction !== Factions.Town
				)
			).toStrictEqual(true);
		}
	)
}


// ^ isValidArgValue
describe('isValidArgValue', () => {
	it('should return NOT true for input framer using frame on mafioso', () => {
		const player_framing_arg = Abilities.Frame.args[0];
		const player_using_ability = new Player({name: "name"});
		const arg_value = "mafia";

		const rdm_game = Game.getEmptyGame();
		const mafia_player = new Player({
			name: "mafia",
			role: RoleNames.Mafioso,
		})
		rdm_game.Players.addPlayer(mafia_player);
		expect(
			rdm_game.isValidArgValue(player_using_ability, player_framing_arg, arg_value)
		).toStrictEqual(
			`You cannot target **mafia** as you may only target non-mafia`
		);
	});

	it('should return NOT true for input doctor using heal on themselves', () => {
		const player_framing_arg = Abilities.Heal.args[0];
		const player_using_ability = new Player({name: "name", role: RoleNames.Doctor});
		const arg_value = "name";

		const rdm_game = Game.getEmptyGame();
		rdm_game.Players.addPlayer(player_using_ability);
		expect(
			rdm_game.isValidArgValue(player_using_ability, player_framing_arg, arg_value)
		).toStrictEqual(
			`You cannot target yourself`
		);
	});
});

