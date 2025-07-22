const { Faction, Alignment, RoleName } = require("./role");
const { RoleIdentifier, RoleIdentifierPriority, RoleIdentifierType, RoleIdentifierKeyword } = require("./role-identifier");
const RoleManager = require("./role-manager");

describe("RoleIdentifier", () => {
	describe("constructor", () => {
		it("RoleIdentifier Constructor for Mafioso failed", () => {
			const input_role_identifier_str = RoleName.MAFIOSO;
			const expected_obj = {
				name: RoleName.MAFIOSO,
				type: RoleIdentifierType.SPECIFIC_ROLE,
				priority: RoleIdentifierPriority.SPECIFIC_ROLE,
			};

			const actual_obj = new RoleIdentifier(input_role_identifier_str)

			expect(actual_obj.name).toStrictEqual(expected_obj.name);
			expect(actual_obj.type).toStrictEqual(expected_obj.type);
			expect(actual_obj.priority).toStrictEqual(expected_obj.priority);
		});

		it("RoleIdentifier Constructor for Town Killing failed", () => {
			const input_role_identifier_str = `${Faction.TOWN} ${Alignment.KILLING}`;

			const expected_obj = {
				name: input_role_identifier_str,
				type: RoleIdentifierType.RANDOM_ROLE_IN_FACTION_ALIGNMENT,
				priority: RoleIdentifierPriority.RANDOM_ROLE_IN_FACTION_ALIGNMENT,
			};

			const actual_obj = new RoleIdentifier(input_role_identifier_str)

			expect(actual_obj.name).toStrictEqual(expected_obj.name);
			expect(actual_obj.type).toStrictEqual(expected_obj.type);
			expect(actual_obj.priority).toStrictEqual(expected_obj.priority);
		});

		it("RoleIdentifier Constructor for Random Town failed", () => {
			const input_role_identifier_str = `${RoleIdentifierKeyword.RANDOM} ${Faction.TOWN}`;

			const expected_obj = {
				name: input_role_identifier_str,
				type: RoleIdentifierType.RANDOM_ROLE_IN_FACTION,
				priority: RoleIdentifierPriority.RANDOM_ROLE_IN_FACTION,
			};

			const actual_obj = new RoleIdentifier(input_role_identifier_str)

			expect(actual_obj.name).toStrictEqual(expected_obj.name);
			expect(actual_obj.type).toStrictEqual(expected_obj.type);
			expect(actual_obj.priority).toStrictEqual(expected_obj.priority);
		});

		it("RoleIdentifier Constructor for Mafia Random failed", () => {
			const input_role_identifier_str = `${Faction.MAFIA} ${RoleIdentifierKeyword.RANDOM}`;

			const expected_obj = {
				name: input_role_identifier_str,
				type: RoleIdentifierType.RANDOM_ROLE_IN_FACTION,
				priority: RoleIdentifierPriority.RANDOM_ROLE_IN_FACTION,
			};

			const actual_obj = new RoleIdentifier(input_role_identifier_str)

			expect(actual_obj.name).toStrictEqual(expected_obj.name);
			expect(actual_obj.type).toStrictEqual(expected_obj.type);
			expect(actual_obj.priority).toStrictEqual(expected_obj.priority);
		});

		it("RoleIdentifier Constructor for Any failed", () => {
			const input_role_identifier_str = RoleIdentifierKeyword.ANY;

			const expected_obj = {
				name: input_role_identifier_str,
				type: RoleIdentifierType.ANY_ROLE,
				priority: RoleIdentifierPriority.ANY_ROLE,
			};

			const actual_obj = new RoleIdentifier(input_role_identifier_str)

			expect(actual_obj.name).toStrictEqual(expected_obj.name);
			expect(actual_obj.type).toStrictEqual(expected_obj.type);
			expect(actual_obj.priority).toStrictEqual(expected_obj.priority);
		});
	});

	describe('isValidIdentfierStr', () => {
		it("SHOULD return false for \"Random\"", () => {
				const input_identfier_str = RoleIdentifierKeyword.RANDOM;
				const expected_output = false;

				const actual_output = RoleIdentifier.isValidIdentifierStr(input_identfier_str)

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it("SHOULD return true for \"any\"", () => {
				const input_identfier_str = RoleIdentifierKeyword.ANY.toLowerCase();
				const expected_output = true;

				const actual_output = RoleIdentifier.isValidIdentifierStr(input_identfier_str)

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it("SHOULD return false for \"Seer\"",() => {
				const input_identfier_str = "Seer";
				const expected_output = false;

				const actual_output = RoleIdentifier.isValidIdentifierStr(input_identfier_str)

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it("SHOULD return true for \"A mAfioso\"", () => {
				const input_identfier_str = "A mAfioso";
				const expected_output = true;

				const actual_output = RoleIdentifier.isValidIdentifierStr(input_identfier_str)

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it("SHOULD return false for \"Any Town\"", () => {
				const input_identfier_str = `${RoleIdentifierKeyword.ANY} Town`;
				const expected_output = false;

				const actual_output = RoleIdentifier.isValidIdentifierStr(input_identfier_str)

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it("SHOULD return true for \"a mafia random\"", () => {
				const input_identfier_str = "a mafia random";
				const expected_output = true;

				const actual_output = RoleIdentifier.isValidIdentifierStr(input_identfier_str)

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it("SHOULD return false for \"Random Killing\"", () => {
				const input_identfier_str = `${RoleIdentifierKeyword.RANDOM} ${Alignment.KILLING}`;
				const expected_output = false;

				const actual_output = RoleIdentifier.isValidIdentifierStr(input_identfier_str)

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it("SHOULD return true for \"a decepTION of mafIA\"", () => {
				const input_identfier_str = "a decepTION of mafIA";
				const expected_output = true;

				const actual_output = RoleIdentifier.isValidIdentifierStr(input_identfier_str)

				expect(actual_output).toStrictEqual(expected_output);
			}
		)
	});

	describe("getFaction", () => {
		it(
			".getFaction() on \"N/A\" returns undefined",
			() => {
				const input_role_identifier = new RoleIdentifier("N/A");
				const expected_output = undefined;

				const actual_output = input_role_identifier.getFaction()

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it(
			".getFaction() on \"Any\" returns undefined",
			() => {
				const input_role_identifier = new RoleIdentifier("Any");
				const expected_output = undefined;

				const actual_output = input_role_identifier.getFaction()

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it(
			".getFaction() on \"Mafioso\" returns undefined",
			() => {
				const input_role_identifier = new RoleIdentifier("Mafioso");
				const expected_output = undefined;

				const actual_output = input_role_identifier.getFaction()

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it(
			".getFaction() on \"mafia random\" returns Mafia",
			() => {
				const input_role_identifier = new RoleIdentifier("mafia random");

				const expected_output = Faction.MAFIA;

				const actual_output = input_role_identifier.getFaction()

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it(
			".getFaction() on \"protective town\" returns Town",
			() => {
				const input_role_identifier = new RoleIdentifier("Town random");
				const expected_output = Faction.TOWN;

				const actual_output = input_role_identifier.getFaction()

				expect(actual_output).toStrictEqual(expected_output);
			}
		)
	});

	describe("getAlignment", () => {
		it(
			".getAlignment() on \"N/A\" returns undefined",
			() => {
				const input_role_identifier =
				new RoleIdentifier("N/A");
				const expected_output = undefined;

				const actual_output = input_role_identifier.getAlignment()

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it(
			".getAlignment() on \"Any\" returns undefined",
			() => {
				const input_role_identifier = new RoleIdentifier("Any");
				const expected_output = undefined;

				const actual_output = input_role_identifier.getAlignment()

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it(
			".getAlignment() on \"Mafioso\" returns undefined",
			() => {
				const input_role_identifier = new RoleIdentifier("Mafioso");
				const expected_output = undefined;

				const actual_output = input_role_identifier.getAlignment()

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it(
			".getAlignment() on \"mafia random\" returns undefined",
			() => {
				const input_role_identifier = new RoleIdentifier("mafia random");
				const expected_output = undefined;

				const actual_output = input_role_identifier.getAlignment()

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it(
			".getAlignment() on \"protective town\" returns Protective",
			() => {
				const input_role_identifier = new RoleIdentifier("protective town");
				const expected_output = Alignment.PROTECTIVE;

				const actual_output = input_role_identifier.getAlignment()

				expect(actual_output).toStrictEqual(expected_output);
			}
		)
	})

	describe("getPossibleRoles", () => {
		it(
			".getPossibleRoles() on Mafioso SHOULD return just Mafioso",
			() => {
				const input_role_identifier = new RoleIdentifier(RoleName.MAFIOSO);
				const expected_output = [RoleManager.roles[RoleName.MAFIOSO]];

				const actual_output = input_role_identifier.getPossibleRoles()

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it(
			".getPossibleRoles() on Town Protective SHOULD return just Doctor",
			() => {
				const input_role_identifier = new RoleIdentifier(`${Faction.TOWN} ${Alignment.PROTECTIVE}`);
				const expected_output = [RoleManager.roles[RoleName.DOCTOR]];

				const actual_output = input_role_identifier.getPossibleRoles()

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it(
			".getPossibleRoles() on Neutral Random SHOULD return just Neutral Roles",
			() => {
				const input_role_identifier = new RoleIdentifier(`${Faction.NEUTRAL} ${RoleIdentifierKeyword.RANDOM}`);
				const expected_output = RoleManager.getListOfRoles().filter(role => role.faction === Faction.NEUTRAL);

				const actual_output = input_role_identifier.getPossibleRoles()

				expect(actual_output).toStrictEqual(expected_output);
			}
		)

		it(
			".getPossibleRoles() on Any SHOULD return all roles but Town Crowd",
			() => {
				const input_role_identifier = new RoleIdentifier(`${RoleIdentifierKeyword.ANY}`);
				const expected_output = RoleManager.getListOfRoles().filter(role => !(role.faction === Faction.TOWN && role.alignment === Alignment.CROWD));

				const actual_output = input_role_identifier.getPossibleRoles()

				expect(actual_output).toStrictEqual(expected_output);
			}
		)
	})


	it(
		"RoleIdentifiers.compare() SHOULD sort by priority",
		() => {
			const input_role_identifiers = [
				new RoleIdentifier(`${RoleIdentifierKeyword.RANDOM} ${Faction.TOWN}`),
				new RoleIdentifier(`${RoleIdentifierKeyword.ANY}`),
				new RoleIdentifier(`${Faction.TOWN} ${Alignment.KILLING} `),
				new RoleIdentifier(RoleName.MAFIOSO),
			]
			const expected_role_identifiers = [
				new RoleIdentifier(RoleName.MAFIOSO),
				new RoleIdentifier(`${Faction.TOWN} ${Alignment.KILLING} `),
				new RoleIdentifier(`${RoleIdentifierKeyword.RANDOM} ${Faction.TOWN}`),
				new RoleIdentifier(`${RoleIdentifierKeyword.ANY}`),
			]

			const actual_role_identifiers = input_role_identifiers.sort(RoleIdentifier.compare)

			expect(actual_role_identifiers).toStrictEqual(expected_role_identifiers)
		}
	)

	describe('.getPriority()', () => {
		it('SHOULD return 6 for input neutral_benign_role_identifier', () => {
			const neutral_benign_role_identifier = new RoleIdentifier(Faction.NEUTRAL + " " + Alignment.BENIGN);

			expect(neutral_benign_role_identifier.priority)
			.toStrictEqual(6);
		});

		it('SHOULD return 2 for input neutral_killing_role_identifier', () => {
			const neutral_killing_role_identifier = new RoleIdentifier(`${Faction.NEUTRAL} ${Alignment.KILLING}`);

			expect(neutral_killing_role_identifier.priority)
			.toStrictEqual(2);
		});

		it('SHOULD return 1 for input survivor_role_identifier despite being a non-faction', () => {
			const survivor_role_identifier = new RoleIdentifier(RoleName.SURVIVOR);

			expect(survivor_role_identifier.priority)
			.toStrictEqual(1);
		});

		it('SHOULD return 1 for input mafioso_role_identifier', () => {
			const mafioso_role_identifier = new RoleIdentifier(RoleName.MAFIOSO);

			expect(mafioso_role_identifier.priority)
			.toStrictEqual(1);
		});

		it('SHOULD return 3 for input random_neutral_role_identifier', () => {
			const random_neutral_role_identifier = new RoleIdentifier(
				`${RoleIdentifierKeyword.RANDOM} ${Faction.NEUTRAL}`
			);

			expect(random_neutral_role_identifier.priority)
			.toStrictEqual(3);
		});

		it('SHOULD return 4 for input any_role_identifier', () => {
			const any_role_identifier = new RoleIdentifier(RoleIdentifierKeyword.ANY);

			expect(any_role_identifier.priority)
			.toStrictEqual(4);
		});
	});
});
