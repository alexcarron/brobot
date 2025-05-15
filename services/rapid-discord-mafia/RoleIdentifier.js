const { Faction, Alignment } = require("./Role");
const RoleManager = require("./RoleManager");

/**
 * Enum of possible unique role identfier keywords
 */
const RoleIdentifierKeyword = Object.freeze({
	RANDOM: "Random",
	ANY: "Any",
});

/**
 * Enum of possible role identifier types
 */
const RoleIdentifierType = Object.freeze({
	SPECIFIC_ROLE: "role",
	RANDOM_ROLE_IN_FACTION_ALIGNMENT: "faction alignment",
	RANDOM_ROLE_IN_FACTION: "faction",
	ANY_ROLE: "any"
});

/**
 * Enum of possible priority values for role identifiers by their type
 */
const RoleIdentifierPriority = Object.freeze({
	SPECIFIC_ROLE: 1,
	RANDOM_ROLE_IN_FACTION_ALIGNMENT: 2,
	RANDOM_ROLE_IN_FACTION: 3,
	ANY_ROLE: 4
});

class RoleIdentifier {
	name;
	type;
	priority;

	constructor(role_identifier_str) {
		this.name = role_identifier_str;
		this.type = RoleIdentifier.getTypeFromIdentifierStr(role_identifier_str);
		this.priority = this.getPriority();
	}

	static isValidIdentifierStr(role_identifier_str) {
		const type = RoleIdentifier.getTypeFromIdentifierStr(role_identifier_str);
		return type !== undefined;
	}

	static getTypeFromIdentifierStr(role_identifier_str) {
		const role_names = RoleManager.getListOfRoles().map(role => role.name);

		if (
			role_names.some(role_name =>
				role_identifier_str.toLowerCase().includes(role_name.toLowerCase())
			)
		) {
			return RoleIdentifierType.SPECIFIC_ROLE;
		}
		else if (
			Object.values(Faction).some(faction =>
				role_identifier_str.toLowerCase().includes(faction.toLowerCase())
			)
		) {
			if (role_identifier_str.toLowerCase().includes(RoleIdentifierKeyword.RANDOM.toLowerCase()))
				return RoleIdentifierType.RANDOM_ROLE_IN_FACTION
			else if (
				Object.values(Alignment).some(alignment =>
					role_identifier_str.toLowerCase().includes(alignment.toLowerCase())
				)
			)
				return RoleIdentifierType.RANDOM_ROLE_IN_FACTION_ALIGNMENT
			else
				return undefined
		}
		else if ( role_identifier_str.toLowerCase() === RoleIdentifierKeyword.ANY.toLowerCase() ) {
			return RoleIdentifierType.ANY_ROLE
		}
		else {
			return undefined;
		}
	}

	getPriority() {
		let priority = RoleIdentifier.getPriorityFromType(this.type);

		const possible_roles = this.getPossibleRoles();
		const canIncludeRoleInFaction = possible_roles.some(role =>{
			return RoleManager.isRoleInPossibleFaction(role)
		})

		if (!canIncludeRoleInFaction && this.type !== RoleIdentifierType.SPECIFIC_ROLE)
			priority += 4;

		return priority;
	}

	static getPriorityFromType(type) {
		let role_identifier_priority_key;

		Object.entries(RoleIdentifierType).forEach(entry => {
			const [role_identifier_type_key, role_identifier_type] = entry;

			if (role_identifier_type === type) {
				role_identifier_priority_key = role_identifier_type_key
			}
		});

		return RoleIdentifierPriority[role_identifier_priority_key];
	}

	/**
	 *
	 * @param {String[]} role_identifier_strings The list of role identifier strings you want to convert
	 * @returns {RoleIdentifier[]} The converted role identifiers
	 */
	static convertIdentifierStrings(role_identifier_strings) {
		return role_identifier_strings.map(
			role_identifer_str => new RoleIdentifier(role_identifer_str)
		)
	}

	static compare(role_identifier1, role_identifier2) {
		return role_identifier1.priority - role_identifier2.priority;
	}

	getFaction() {
		if ([RoleIdentifierType.ANY_ROLE, RoleIdentifierType.SPECIFIC_ROLE].includes(this.type)) {
			return undefined
		}
		else {
			const faction = Object.values(Faction).find(faction =>
				this.name.toLowerCase().includes(faction.toLowerCase())
			)

			return faction;
		}
	}

	getAlignment() {
		if ([RoleIdentifierType.ANY_ROLE, RoleIdentifierType.SPECIFIC_ROLE, RoleIdentifierType.RANDOM_ROLE_IN_FACTION].includes(this.type)) {
			return undefined
		}
		else {
			const alignment = Object.values(Alignment).find(alignment =>
				this.name.toLowerCase().includes(alignment.toLowerCase())
			)

			return alignment;
		}
	}

	getPossibleRoles() {
		let possible_roles = [];

		if (this.type === RoleIdentifierType.SPECIFIC_ROLE) {
			possible_roles = [RoleManager.getListOfRoles().find(role => role.name.toLowerCase() === this.name.toLowerCase())];
		}
		else if (this.type === RoleIdentifierType.RANDOM_ROLE_IN_FACTION_ALIGNMENT) {
			possible_roles = RoleManager.getListOfRoles().filter( role_checking => {
				return (
					role_checking.faction === this.getFaction() &&
					role_checking.alignment === this.getAlignment()
				)
			});
		}
		else if (this.type === RoleIdentifierType.RANDOM_ROLE_IN_FACTION) {
			possible_roles = RoleManager.getListOfRoles().filter( role_checking => {
				return (
					role_checking.faction === this.getFaction() &&
					role_checking.alignment !== Alignment.CROWD
				)
			});
		}
		else if (this.type === RoleIdentifierType.ANY_ROLE) {
			possible_roles = RoleManager.getListOfRoles().filter(role => !(role.faction === Faction.TOWN && role.alignment === Alignment.CROWD));
		}

		return possible_roles;
	}
}

module.exports = {RoleIdentifier, RoleIdentifierKeyword, RoleIdentifierType, RoleIdentifierPriority};