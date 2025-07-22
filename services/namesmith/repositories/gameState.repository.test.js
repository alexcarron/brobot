const { GameStateRepository } = require('./gameState.repository');
const { createMockGameStateRepo } = require('./mock-repositories');

describe('GameStateRepository', () => {
	/**
	 * @type {GameStateRepository}
	 */
	let gameStateRepo;

	beforeEach(() => {
		gameStateRepo = createMockGameStateRepo();
	})

  describe('getGameState()', () => {
    it('should return an object with timeStarted, timeEnding, and timeVoteIsEnding properties', async () => {
      const gameState = await gameStateRepo.getGameState();

			expect(gameState).toHaveProperty('timeStarted', undefined);
			expect(gameState).toHaveProperty('timeEnding', undefined);
			expect(gameState).toHaveProperty('timeVoteIsEnding', undefined);
    });

    it('should return an object with timeStarted, timeEnding, and timeVoteIsEnding properties when set', async () => {
			await gameStateRepo.setGameState({
				timeStarted: new Date('2021-01-01T00:00:00.000Z'),
				timeEnding: new Date('2021-01-01T00:00:00.000Z'),
				timeVoteIsEnding: new Date('2021-01-01T00:00:00.000Z'),
			});

      const gameState = await gameStateRepo.getGameState();

			expect(gameState).toHaveProperty('timeStarted', new Date('2021-01-01T00:00:00.000Z'));
			expect(gameState).toHaveProperty('timeEnding', new Date('2021-01-01T00:00:00.000Z'));
			expect(gameState).toHaveProperty('timeVoteIsEnding', new Date('2021-01-01T00:00:00.000Z'));
    });
	});

	describe('setGameState()', () => {
		it('should set the game state', async () => {
			await gameStateRepo.setGameState({
				timeStarted: new Date('2021-01-01T00:00:00.000Z'),
				timeEnding: new Date('2021-01-01T00:00:00.000Z'),
				timeVoteIsEnding: new Date('2021-01-01T00:00:00.000Z'),
			});

			const gameState = await gameStateRepo.getGameState();

			expect(gameState).toHaveProperty('timeStarted', new Date('2021-01-01T00:00:00.000Z'));
			expect(gameState).toHaveProperty('timeEnding', new Date('2021-01-01T00:00:00.000Z'));
			expect(gameState).toHaveProperty('timeVoteIsEnding', new Date('2021-01-01T00:00:00.000Z'));
		});

		it('should throw an error if the game state is not provided', async () => {
			await expect(gameStateRepo.setGameState()).rejects.toThrow();
		});

		it('should partially update the game state', async () => {
			await gameStateRepo.setGameState({
				timeStarted: new Date('2021-01-01T00:00:00.000Z'),
			});
			const gameState = await gameStateRepo.getGameState();

			expect(gameState).toHaveProperty('timeStarted', new Date('2021-01-01T00:00:00.000Z'));
			expect(gameState).toHaveProperty('timeEnding', undefined);
			expect(gameState).toHaveProperty('timeVoteIsEnding', undefined);
		});
	});

	describe('getTimeStarted()', () => {
		it('should return the timeStarted property', async () => {
			await gameStateRepo.setGameState({
				timeStarted: new Date('2021-01-01T00:00:00.000Z'),
			});
			const timeStarted = await gameStateRepo.getTimeStarted();
			expect(timeStarted).toEqual(new Date('2021-01-01T00:00:00.000Z'));
		});
	});

	describe('setTimeStarted()', () => {
		it('should set the timeStarted property', async () => {
			await gameStateRepo.setTimeStarted(new Date('2021-01-01T00:00:00.000Z'));
			const gameState = await gameStateRepo.getGameState();
			expect(gameState.timeStarted).toEqual(new Date('2021-01-01T00:00:00.000Z'));
		});
	});

	describe('getTimeEnding()', () => {
		it('should return the timeEnding property', async () => {
			await gameStateRepo.setGameState({
				timeEnding: new Date('2021-01-01T00:00:00.000Z'),
			});
			const timeEnding = await gameStateRepo.getTimeEnding();
			expect(timeEnding).toEqual(new Date('2021-01-01T00:00:00.000Z'));
		});
	});

	describe('setTimeEnding()', () => {
		it('should set the timeEnding property', async () => {
			await gameStateRepo.setTimeEnding(new Date('2021-01-01T00:00:00.000Z'));
			const gameState = await gameStateRepo.getGameState();
			expect(gameState.timeEnding).toEqual(new Date('2021-01-01T00:00:00.000Z'));
		});
	});

	describe('getTimeVoteIsEnding()', () => {
		it('should return the timeVoteIsEnding property', async () => {
			await gameStateRepo.setGameState({
				timeVoteIsEnding: new Date('2021-01-01T00:00:00.000Z'),
			});
			const timeVoteIsEnding = await gameStateRepo.getTimeVoteIsEnding();
			expect(timeVoteIsEnding).toEqual(new Date('2021-01-01T00:00:00.000Z'));
		});
	});

	describe('setTimeVoteIsEnding()', () => {
		it('should set the timeVoteIsEnding property', async () => {
			await gameStateRepo.setTimeVoteIsEnding(new Date('2021-01-01T00:00:00.000Z'));
			const gameState = await gameStateRepo.getGameState();
			expect(gameState.timeVoteIsEnding).toEqual(new Date('2021-01-01T00:00:00.000Z'));
		});
	});
});