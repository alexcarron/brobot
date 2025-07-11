const { setupMockNamesmith } = require("../event-listeners/mock-setup");
const { createMockServices } = require("../services/mock-services");

describe('open-mystery-box.workflow', () => {
	beforeEach(() => {
		setupMockNamesmith();
	});

	describe('openMysteryBox()', () => {
		it('should open a mystery box and add a character to the player\'s name', async () => {
			// TODO: Write test
		});
	})
})