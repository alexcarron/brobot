const validator = {
	validateName(name) {
		console.log(`Validating Name: ${name}`);

		const nameRegex = /^[a-zA-Z0-9 ]+$/;

		if ( name.length > 32 ) {
			return `Your name must be under 32 characters. It's currently ${name.length} characters.`
		}

		// Checks if username has letters or numbers
		if ( !nameRegex.test(name) ) {
			return `Your name must only have letters and numbers in it.`;
		}

		return true;
	},
	isInteger(value) {
		return (
			typeof value === 'number' &&
			Number.isInteger(value) &&
			value >= 1
		)
	},

	isObject(value) {
		return (
			typeof value === 'object' &&
			value !== null &&
			!Array.isArray(value)
		)
	},
	isArray(value) {
		return Array.isArray(value);
	},
	isEnumValue(value, enum_obj) {
		const enum_values = Object.values(enum_obj);
		return enum_values.includes(value);
	},
	isArrayofType(value, typeValidationFunction) {
		if (!Array.isArray(value))
			return false;

		if (value.length <= 0)
			return true;

		for (const item of value) {
			if (!typeValidationFunction(item)) {
				return false; // At least one item does not satisfy the validation function
			}
		}

		return true;
	},
	doesObjectHaveKeys(object, ...keys) {
		const obj_keys = Object.keys(object);

		if (
			!keys.every(key => obj_keys.includes(key))
		) {
			return false;
		}

		return true
	}
};

module.exports = validator;