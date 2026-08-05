import { GameStateInitializationError } from "../utilities/error.utility";
import { GameStateRepository } from "./game-state.repository";

describe('GameStateRepository', () => {
	const TEST_DATE = new Date('2021-01-01T00:00:00.000Z');
	const DIFFERENT_DATE = new Date('2021-02-02T00:00:00.000Z');

	let gameStateRepo: GameStateRepository;

	beforeEach(() => {
		gameStateRepo = GameStateRepository.asMock();
	})

	describe('getGameState()', () => {
		it('should return an object with null properties if the game state is not set', () => {
			const gameState = gameStateRepo.getGameState();

			expect(gameState).toHaveProperty('timeStarted', null);
			expect(gameState).toHaveProperty('timeEnding', null);
			expect(gameState).toHaveProperty('timeVoteIsEnding', null);
			expect(gameState).toHaveProperty('theme', null);
		});

		it('should return an object with timeStarted, timeEnding, and timeVoteIsEnding properties when set', () => {
			gameStateRepo.setGameState({
				timeStarted: TEST_DATE,
				timeEnding: TEST_DATE,
				timeVoteIsEnding: TEST_DATE,
				theme: 'Theme',
			});

			const gameState = gameStateRepo.getGameState();

			expect(gameState).toHaveProperty('timeStarted', TEST_DATE);
			expect(gameState).toHaveProperty('timeEnding', TEST_DATE);
			expect(gameState).toHaveProperty('timeVoteIsEnding', TEST_DATE);
			expect(gameState).toHaveProperty('theme', 'Theme');
		});
	});

	describe('getDefinedGameState()', () => {
		it('should throw an error if the game state is not set', () => {
			expect(() => gameStateRepo.getDefinedGameState()).toThrow();
		});

		it('should return an object with timeStarted, timeEnding, and timeVoteIsEnding properties when set', () => {
			gameStateRepo.setGameState({
				timeStarted: TEST_DATE,
				timeEnding: TEST_DATE,
				timeVoteIsEnding: TEST_DATE,
				theme: 'Theme',
			});

			const gameState = gameStateRepo.getDefinedGameState();

			expect(gameState).toHaveProperty('timeStarted', TEST_DATE);
			expect(gameState).toHaveProperty('timeEnding', TEST_DATE);
			expect(gameState).toHaveProperty('timeVoteIsEnding', TEST_DATE);
			expect(gameState).toHaveProperty('theme', 'Theme');
		});
	});

	describe('throwIfNotDefined()', () => {
		it('should throw a GameStateInitializationError if the game state is not set', () => {
			const undefinedGameState = {
				timeStarted: null,
				timeEnding: null,
				timeVoteIsEnding: null,
				theme: null,
			}
			expect(() => gameStateRepo.throwIfNotDefined(undefinedGameState)).toThrow(GameStateInitializationError);
		});

		it('should throw a GameStateInitializationError if only one of the game state properties is set', () => {
			const undefinedGameState = {
				timeStarted: null,
				timeEnding: TEST_DATE,
				timeVoteIsEnding: TEST_DATE,
				theme: 'Theme',
			}
			expect(() => gameStateRepo.throwIfNotDefined(undefinedGameState)).toThrow(GameStateInitializationError);
		});

		it('should not throw a GameStateInitializationError if all of the game state properties are set', () => {
			const undefinedGameState = {
				timeStarted: TEST_DATE,
				timeEnding: TEST_DATE,
				timeVoteIsEnding: TEST_DATE,
				theme: 'Theme',
			}
			expect(() => gameStateRepo.throwIfNotDefined(undefinedGameState)).not.toThrow();
		});
	});

	describe('setGameState()', () => {
		it('should set the game state', () => {
			gameStateRepo.setGameState({
				timeStarted: TEST_DATE,
				timeEnding: TEST_DATE,
				timeVoteIsEnding: TEST_DATE,
				theme: 'Theme',
			});

			const gameState = gameStateRepo.getDefinedGameState();

			expect(gameState).toHaveProperty('timeStarted', TEST_DATE);
			expect(gameState).toHaveProperty('timeEnding', TEST_DATE);
			expect(gameState).toHaveProperty('timeVoteIsEnding', TEST_DATE);
			expect(gameState).toHaveProperty('theme', 'Theme');
		});

		it('should partially update the game state', () => {
			gameStateRepo.setGameState({
				timeStarted: TEST_DATE,
				timeEnding: TEST_DATE,
				timeVoteIsEnding: TEST_DATE,
				theme: 'Theme',
			});
			gameStateRepo.setGameState({
				timeStarted: DIFFERENT_DATE,
			});
			const gameState = gameStateRepo.getDefinedGameState();

			expect(gameState).toHaveProperty('timeStarted',
				DIFFERENT_DATE
			);
			expect(gameState).toHaveProperty('timeEnding',
				TEST_DATE
			);
			expect(gameState).toHaveProperty('timeVoteIsEnding',
				TEST_DATE
			);
			expect(gameState).toHaveProperty('theme', 'Theme');
		});
	});

});