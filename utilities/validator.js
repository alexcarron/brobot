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
};

module.exports = validator;