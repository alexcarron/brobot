const onButtonPressed = async function(interaction) {
	// No buttons should exist. Log error
	console.error(`Unexpected button press. Button ID: ${interaction.customId}`);
}

module.exports = { onButtonPressed };