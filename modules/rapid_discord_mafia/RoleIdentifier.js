const { RoleIdentifierTypes, RoleIdentifierKeywords, RoleIdentifierPriorities, Factions, Alignments } = require("../enums");
const RoleManager = require("./RoleManager");

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
			return RoleIdentifierTypes.SpecificRole;
		}
		else if (
			Object.values(Factions).some(faction =>
				role_identifier_str.toLowerCase().includes(faction.toLowerCase())
			)
		) {
			if (role_identifier_str.toLowerCase().includes(RoleIdentifierKeywords.Random.toLowerCase()))
				return RoleIdentifierTypes.RandomRoleInFaction
			else if (
				Object.values(Alignments).some(alignment =>
					role_identifier_str.toLowerCase().includes(alignment.toLowerCase())
				)
			)
				return RoleIdentifierTypes.RandomRoleInFactionAlignment
			else
				return undefined
		}
		else if ( role_identifier_str.toLowerCase() === RoleIdentifierKeywords.Any.toLowerCase() ) {
			return RoleIdentifierTypes.AnyRole
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

		if (!canIncludeRoleInFaction && this.type !== RoleIdentifierTypes.SpecificRole)
			priority += 4;

		return priority;
	}

	static getPriorityFromType(type) {
		let role_identifier_priority_key;

		Object.entries(RoleIdentifierTypes).forEach(entry => {
			const [role_identifier_type_key, role_identifier_type] = entry;

			if (role_identifier_type === type) {
				role_identifier_priority_key = role_identifier_type_key
			}
		});

		return RoleIdentifierPriorities[role_identifier_priority_key];
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
		if ([RoleIdentifierTypes.AnyRole, RoleIdentifierTypes.SpecificRole].includes(this.type)) {
			return undefined
		}
		else {
			const faction = Object.values(Factions).find(faction =>
				this.name.toLowerCase().includes(faction.toLowerCase())
			)

			return faction;
		}
	}

	getAlignment() {
		if ([RoleIdentifierTypes.AnyRole, RoleIdentifierTypes.SpecificRole, RoleIdentifierTypes.RandomRoleInFaction].includes(this.type)) {
			return undefined
		}
		else {
			const alignment = Object.values(Alignments).find(alignment =>
				this.name.toLowerCase().includes(alignment.toLowerCase())
			)

			return alignment;
		}
	}

	getPossibleRoles() {
		let possible_roles = [];

		if (this.type === RoleIdentifierTypes.SpecificRole) {
			possible_roles = [RoleManager.getListOfRoles().find(role => role.name.toLowerCase() === this.name.toLowerCase())];
		}
		else if (this.type === RoleIdentifierTypes.RandomRoleInFactionAlignment) {
			possible_roles = RoleManager.getListOfRoles().filter( role_checking => {
				return (
					role_checking.faction === this.getFaction() &&
					role_checking.alignment === this.getAlignment()
				)
			});
		}
		else if (this.type === RoleIdentifierTypes.RandomRoleInFaction) {
			possible_roles = RoleManager.getListOfRoles().filter( role_checking => {
				return (
					role_checking.faction === this.getFaction() &&
					role_checking.alignment !== Alignments.Crowd
				)
			});
		}
		else if (this.type === RoleIdentifierTypes.AnyRole) {
			possible_roles = RoleManager.getListOfRoles().filter(role => !(role.faction === Factions.Town && role.alignment === Alignments.Crowd));
		}

		return possible_roles;
	}
}

module.exports = RoleIdentifier;