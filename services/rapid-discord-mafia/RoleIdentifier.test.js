const { RoleNames, RoleIdentifierKeywords, RoleIdentifierTypes, RoleIdentifierPriorities } = require("../../modules/enums");
const { Faction, Alignment } = require("./Role");
const RoleIdentifier = require("./RoleIdentifier");
const RoleManager = require("./RoleManager");

// ^ RoleIdentifier Constructor
{
	test.concurrent(
	"RoleIdentifier Constructor for Mafioso failed",
	() => {
		const input_role_identifier_str = RoleNames.Mafioso;
		const expected_obj = {
			name: RoleNames.Mafioso,
			type: RoleIdentifierTypes.SpecificRole,
			priority: RoleIdentifierPriorities.SpecificRole,
		};

		const actual_obj = new RoleIdentifier(input_role_identifier_str)

		expect(actual_obj.name).toStrictEqual(expected_obj.name);
		expect(actual_obj.type).toStrictEqual(expected_obj.type);
		expect(actual_obj.priority).toStrictEqual(expected_obj.priority);
	}
)

test.concurrent(
	"RoleIdentifier Constructor for Town Killing failed",
	() => {
		const input_role_identifier_str = `${Faction.TOWN} ${Alignment.KILLING}`;

		const expected_obj = {
			name: input_role_identifier_str,
			type: RoleIdentifierTypes.RandomRoleInFactionAlignment,
			priority: RoleIdentifierPriorities.RandomRoleInFactionAlignment,
		};

		const actual_obj = new RoleIdentifier(input_role_identifier_str)

		expect(actual_obj.name).toStrictEqual(expected_obj.name);
		expect(actual_obj.type).toStrictEqual(expected_obj.type);
		expect(actual_obj.priority).toStrictEqual(expected_obj.priority);
	}
)

test.concurrent(
	"RoleIdentifier Constructor for Random Town failed",
	() => {
		const input_role_identifier_str = `${RoleIdentifierKeywords.Random} ${Faction.TOWN}`;

		const expected_obj = {
			name: input_role_identifier_str,
			type: RoleIdentifierTypes.RandomRoleInFaction,
			priority: RoleIdentifierPriorities.RandomRoleInFaction,
		};

		const actual_obj = new RoleIdentifier(input_role_identifier_str)

		expect(actual_obj.name).toStrictEqual(expected_obj.name);
		expect(actual_obj.type).toStrictEqual(expected_obj.type);
		expect(actual_obj.priority).toStrictEqual(expected_obj.priority);
	}
)

test.concurrent(
	"RoleIdentifier Constructor for Mafia Random failed",
	() => {
		const input_role_identifier_str = `${Faction.MAFIA} ${RoleIdentifierKeywords.Random}`;

		const expected_obj = {
			name: input_role_identifier_str,
			type: RoleIdentifierTypes.RandomRoleInFaction,
			priority: RoleIdentifierPriorities.RandomRoleInFaction,
		};

		const actual_obj = new RoleIdentifier(input_role_identifier_str)

		expect(actual_obj.name).toStrictEqual(expected_obj.name);
		expect(actual_obj.type).toStrictEqual(expected_obj.type);
		expect(actual_obj.priority).toStrictEqual(expected_obj.priority);
	}
)

test.concurrent(
	"RoleIdentifier Constructor for Any failed",
	() => {
		const input_role_identifier_str = RoleIdentifierKeywords.Any;

		const expected_obj = {
			name: input_role_identifier_str,
			type: RoleIdentifierTypes.AnyRole,
			priority: RoleIdentifierPriorities.AnyRole,
		};

		const actual_obj = new RoleIdentifier(input_role_identifier_str)

		expect(actual_obj.name).toStrictEqual(expected_obj.name);
		expect(actual_obj.type).toStrictEqual(expected_obj.type);
		expect(actual_obj.priority).toStrictEqual(expected_obj.priority);
	}
)
}

// ^ RoleIdentfier.isValidIdentfierStr
{
	test.concurrent(
		"isValidIdentfierStr SHOULD return false for \"Random\"",
		() => {
			const input_identfier_str = RoleIdentifierKeywords.Random;
			const expected_output = false;

			const actual_output = RoleIdentifier.isValidIdentifierStr(input_identfier_str)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		"isValidIdentfierStr SHOULD return true for \"any\"",
		() => {
			const input_identfier_str = RoleIdentifierKeywords.Any.toLowerCase();
			const expected_output = true;

			const actual_output = RoleIdentifier.isValidIdentifierStr(input_identfier_str)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		"isValidIdentfierStr SHOULD return false for \"Seer\"",
		() => {
			const input_identfier_str = "Seer";
			const expected_output = false;

			const actual_output = RoleIdentifier.isValidIdentifierStr(input_identfier_str)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		"isValidIdentfierStr SHOULD return true for \"A mAfioso\"",
		() => {
			const input_identfier_str = "A mAfioso";
			const expected_output = true;

			const actual_output = RoleIdentifier.isValidIdentifierStr(input_identfier_str)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		"isValidIdentfierStr SHOULD return false for \"Any Town\"",
		() => {
			const input_identfier_str = `${RoleIdentifierKeywords.Any} Town`;
			const expected_output = false;

			const actual_output = RoleIdentifier.isValidIdentifierStr(input_identfier_str)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		"isValidIdentfierStr SHOULD return true for \"a mafia random\"",
		() => {
			const input_identfier_str = "a mafia random";
			const expected_output = true;

			const actual_output = RoleIdentifier.isValidIdentifierStr(input_identfier_str)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		"isValidIdentfierStr SHOULD return false for \"Random Killing\"",
		() => {
			const input_identfier_str = `${RoleIdentifierKeywords.Random} ${Alignment.KILLING}`;
			const expected_output = false;

			const actual_output = RoleIdentifier.isValidIdentifierStr(input_identfier_str)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		"isValidIdentfierStr SHOULD return true for \"a decepTION of mafIA\"",
		() => {
			const input_identfier_str = "a decepTION of mafIA";
			const expected_output = true;

			const actual_output = RoleIdentifier.isValidIdentifierStr(input_identfier_str)

			expect(actual_output).toStrictEqual(expected_output);
		}
	)
}

// ^ .getFaction()
{
	test.concurrent(
		".getFaction() on \"N/A\" returns undefined",
		() => {
			const input_role_identifier = new RoleIdentifier("N/A");
			const expected_output = undefined;

			const actual_output = input_role_identifier.getFaction()

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		".getFaction() on \"Any\" returns undefined",
		() => {
			const input_role_identifier = new RoleIdentifier("Any");
			const expected_output = undefined;

			const actual_output = input_role_identifier.getFaction()

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		".getFaction() on \"Mafioso\" returns undefined",
		() => {
			const input_role_identifier = new RoleIdentifier("Mafioso");
			const expected_output = undefined;

			const actual_output = input_role_identifier.getFaction()

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		".getFaction() on \"mafia random\" returns Mafia",
		() => {
			const input_role_identifier = new RoleIdentifier("mafia random");
			console.log({input_role_identifier})
			const expected_output = Faction.MAFIA;

			const actual_output = input_role_identifier.getFaction()

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		".getFaction() on \"protective town\" returns Town",
		() => {
			const input_role_identifier = new RoleIdentifier("Town random");
			const expected_output = Faction.TOWN;

			const actual_output = input_role_identifier.getFaction()

			expect(actual_output).toStrictEqual(expected_output);
		}
	)
}

// ^ .getAlignment()
{
	test.concurrent(
		".getAlignment() on \"N/A\" returns undefined",
		() => {
			const input_role_identifier = new RoleIdentifier("N/A");
			const expected_output = undefined;

			const actual_output = input_role_identifier.getAlignment()

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		".getAlignment() on \"Any\" returns undefined",
		() => {
			const input_role_identifier = new RoleIdentifier("Any");
			const expected_output = undefined;

			const actual_output = input_role_identifier.getAlignment()

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		".getAlignment() on \"Mafioso\" returns undefined",
		() => {
			const input_role_identifier = new RoleIdentifier("Mafioso");
			const expected_output = undefined;

			const actual_output = input_role_identifier.getAlignment()

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		".getAlignment() on \"mafia random\" returns undefined",
		() => {
			const input_role_identifier = new RoleIdentifier("mafia random");
			const expected_output = undefined;

			const actual_output = input_role_identifier.getAlignment()

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		".getAlignment() on \"protective town\" returns Protective",
		() => {
			const input_role_identifier = new RoleIdentifier("protective town");
			const expected_output = Alignment.PROTECTIVE;

			const actual_output = input_role_identifier.getAlignment()

			expect(actual_output).toStrictEqual(expected_output);
		}
	)
}

// ^ .getPossibleRoles()
{
	test.concurrent(
		".getPossibleRoles() on Mafioso SHOULD return just Mafioso",
		() => {
			const input_role_identifier = new RoleIdentifier(RoleNames.Mafioso);
			const expected_output = [RoleManager.roles[RoleNames.Mafioso]];

			const actual_output = input_role_identifier.getPossibleRoles()

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		".getPossibleRoles() on Town Protective SHOULD return just Doctor",
		() => {
			const input_role_identifier = new RoleIdentifier(`${Faction.TOWN} ${Alignment.PROTECTIVE}`);
			const expected_output = [RoleManager.roles[RoleNames.Doctor]];

			const actual_output = input_role_identifier.getPossibleRoles()

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		".getPossibleRoles() on Neutral Random SHOULD return just Neutral Roles",
		() => {
			const input_role_identifier = new RoleIdentifier(`${Faction.NEUTRAL} ${RoleIdentifierKeywords.Random}`);
			const expected_output = RoleManager.getListOfRoles().filter(role => role.faction === Faction.NEUTRAL);

			const actual_output = input_role_identifier.getPossibleRoles()

			expect(actual_output).toStrictEqual(expected_output);
		}
	)

	test.concurrent(
		".getPossibleRoles() on Any SHOULD return all roles but Town Crowd",
		() => {
			const input_role_identifier = new RoleIdentifier(`${RoleIdentifierKeywords.Any}`);
			const expected_output = RoleManager.getListOfRoles().filter(role => !(role.faction === Faction.TOWN && role.alignment === Alignment.CROWD));

			const actual_output = input_role_identifier.getPossibleRoles()

			expect(actual_output).toStrictEqual(expected_output);
		}
	)
}

// ^ RoleIdentfier Sorting
test.concurrent(
	"RoleIdentifiers.compare() SHOULD sort by priority",
	() => {
		const input_role_identifiers = [
			new RoleIdentifier(`${RoleIdentifierKeywords.Random} ${Faction.TOWN}`),
			new RoleIdentifier(`${RoleIdentifierKeywords.Any}`),
			new RoleIdentifier(`${Faction.TOWN} ${Alignment.KILLING} `),
			new RoleIdentifier(RoleNames.Mafioso),
		]
		const expected_role_identifiers = [
			new RoleIdentifier(RoleNames.Mafioso),
			new RoleIdentifier(`${Faction.TOWN} ${Alignment.KILLING} `),
			new RoleIdentifier(`${RoleIdentifierKeywords.Random} ${Faction.TOWN}`),
			new RoleIdentifier(`${RoleIdentifierKeywords.Any}`),
		]

		const actual_role_identifiers = input_role_identifiers.sort(RoleIdentifier.compare)

		expect(actual_role_identifiers).toStrictEqual(expected_role_identifiers)
	}
)

// ^ .getPriority()
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
		const survivor_role_identifier = new RoleIdentifier(RoleNames.Survivor);

		expect(survivor_role_identifier.priority)
		.toStrictEqual(1);
	});

	it('SHOULD return 1 for input mafioso_role_identifier', () => {
		const mafioso_role_identifier = new RoleIdentifier(RoleNames.Mafioso);

		expect(mafioso_role_identifier.priority)
		.toStrictEqual(1);
	});

	it('SHOULD return 3 for input random_neutral_role_identifier', () => {
		const random_neutral_role_identifier = new RoleIdentifier(
			`${RoleIdentifierKeywords.Random} ${Faction.NEUTRAL}`
		);

		expect(random_neutral_role_identifier.priority)
		.toStrictEqual(3);
	});

	it('SHOULD return 4 for input any_role_identifier', () => {
		const any_role_identifier = new RoleIdentifier(RoleIdentifierKeywords.Any);

		expect(any_role_identifier.priority)
		.toStrictEqual(4);
	});
});