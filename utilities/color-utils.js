/**
 * Generates a random hex color string.
 * @returns {string} A random hex color string, 6 characters long.
 */
const createRandomHexColor = () => {
	const characters = '0123456789ABCDEF';
	let color = '';

	// Generate a random hex color by looping 6 times and assigning a random character
	// from the characters string to the color string at each loop iteration.
	for (let i = 0; i < 6; i++) {
		color += characters[Math.floor(Math.random() * 16)];
	}

	return color;
}

module.exports = { createRandomHexColor };