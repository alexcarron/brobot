import { GameStateRepository } from "./game-state.repository";

describe('GameStateRepository', () => {
	const TEST_DATE = new Date('2021-01-01T00:00:00.000Z');
	const DIFFERENT_DATE = new Date('2021-02-02T00:00:00.000Z');

	let gameStateRepo: GameStateRepository;

	beforeEach(() => {
		gameStateRepo = GameStateRepository.asMock();
	})

  describe('getGameState()', () => {
    it('should throw an error if the game state is not set', () => {
			expect(() => gameStateRepo.getGameState()).toThrow();
    });

    it('should return an object with timeStarted, timeEnding, and timeVoteIsEnding properties when set', () => {
			gameStateRepo.setGameState({
				timeStarted: TEST_DATE,
				timeEnding: TEST_DATE,
				timeVoteIsEnding: TEST_DATE,
			});

      const gameState = gameStateRepo.getGameState();

			expect(gameState).toHaveProperty('timeStarted', TEST_DATE);
			expect(gameState).toHaveProperty('timeEnding', TEST_DATE);
			expect(gameState).toHaveProperty('timeVoteIsEnding', TEST_DATE);
    });
	});

	describe('setGameState()', () => {
		it('should set the game state', () => {
			gameStateRepo.setGameState({
				timeStarted: TEST_DATE,
				timeEnding: TEST_DATE,
				timeVoteIsEnding: TEST_DATE,
			});

			const gameState = gameStateRepo.getGameState();

			expect(gameState).toHaveProperty('timeStarted', TEST_DATE);
			expect(gameState).toHaveProperty('timeEnding', TEST_DATE);
			expect(gameState).toHaveProperty('timeVoteIsEnding', TEST_DATE);
		});

		it('should partially update the game state', () => {
			gameStateRepo.setGameState({
				timeStarted: TEST_DATE,
				timeEnding: TEST_DATE,
				timeVoteIsEnding: TEST_DATE,
			});
			gameStateRepo.setGameState({
				timeStarted: DIFFERENT_DATE,
			});
			const gameState = gameStateRepo.getGameState();

			expect(gameState).toHaveProperty('timeStarted',
				DIFFERENT_DATE
			);
			expect(gameState).toHaveProperty('timeEnding',
				TEST_DATE
			);
			expect(gameState).toHaveProperty('timeVoteIsEnding',
				TEST_DATE
			);
		});
	});

	describe('getTimeStarted()', () => {
		it('should return the timeStarted property', () => {
			gameStateRepo.setGameState({
				timeStarted: DIFFERENT_DATE,
				timeEnding: TEST_DATE,
				timeVoteIsEnding: TEST_DATE,
			});
			const timeStarted = gameStateRepo.getTimeStarted();
			expect(timeStarted).toEqual(DIFFERENT_DATE);
		});
	});

	describe('setTimeStarted()', () => {
		it('should set the timeStarted property', () => {
			gameStateRepo.setGameState({
				timeStarted: TEST_DATE,
				timeEnding: TEST_DATE,
				timeVoteIsEnding: TEST_DATE,
			});

			gameStateRepo.setTimeStarted(DIFFERENT_DATE);

			const gameState = gameStateRepo.getGameState();
			expect(gameState.timeStarted).toEqual(DIFFERENT_DATE);
		});
	});

	describe('getTimeEnding()', () => {
		it('should return the timeEnding property', () => {
			gameStateRepo.setGameState({
				timeStarted: TEST_DATE,
				timeEnding: DIFFERENT_DATE,
				timeVoteIsEnding: TEST_DATE,
			});
			const timeEnding = gameStateRepo.getTimeEnding();
			expect(timeEnding).toEqual(DIFFERENT_DATE);
		});
	});

	describe('setTimeEnding()', () => {
		it('should set the timeEnding property', () => {
			gameStateRepo.setGameState({
				timeStarted: TEST_DATE,
				timeEnding: TEST_DATE,
				timeVoteIsEnding: TEST_DATE,
			});

			gameStateRepo.setTimeVoting(DIFFERENT_DATE);
			const gameState = gameStateRepo.getGameState();
			expect(gameState.timeEnding).toEqual(DIFFERENT_DATE);
		});
	});

	describe('getTimeVoteIsEnding()', () => {
		it('should return the timeVoteIsEnding property', () => {
			gameStateRepo.setGameState({
				timeStarted: TEST_DATE,
				timeEnding: TEST_DATE,
				timeVoteIsEnding: DIFFERENT_DATE,
			});

			const timeVoteIsEnding = gameStateRepo.getTimeVoteIsEnding();
			expect(timeVoteIsEnding).toEqual(DIFFERENT_DATE);
		});
	});

	describe('setTimeVoteIsEnding()', () => {
		it('should set the timeVoteIsEnding property', () => {
			gameStateRepo.setGameState({
				timeStarted: TEST_DATE,
				timeEnding: TEST_DATE,
				timeVoteIsEnding: TEST_DATE,
			});
			gameStateRepo.setTimeVotingEnds(DIFFERENT_DATE);
			const gameState = gameStateRepo.getGameState();
			expect(gameState.timeVoteIsEnding).toEqual(DIFFERENT_DATE);
		});
	});
});