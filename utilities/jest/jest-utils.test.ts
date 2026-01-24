import { failTest, makeSure, repeatOverDuration, repeatEveryIntervalUntil } from "./jest-utils";

describe('jest-utils.js', () => {
  describe('expectValue (makeSure) matcher object', () => {
    test('isTrue passes on true', () => {
      expect(() => {
        makeSure(true).isTrue();
      }).not.toThrow();
    });

    test('isTrue fails on non-true', () => {
      expect(() => {
        makeSure(false).isTrue();
      }).toThrow();
    });

    test('isFalse passes on false', () => {
      expect(() => {
        makeSure(false).isFalse();
      }).not.toThrow();
    });

    test('isFalse fails on non-false', () => {
      expect(() => {
        makeSure(true).isFalse();
      }).toThrow();
    });

    test('isNotANumber passes on non-number values', () => {
      expect(() => {
        makeSure('hello').isNotANumber();
        makeSure(NaN).isNotANumber(); // NaN is a number type but should pass because of !Number.isNaN
        makeSure(null).isNotANumber();
        makeSure(undefined).isNotANumber();
      }).not.toThrow();
    });

    test('isNotANumber fails on valid numbers', () => {
      expect(() => {
        makeSure(123).isNotANumber();
      }).toThrow('Expected actual value to NOT be a number');
    });

    test('turnsOut returns original expect and allows matchers', () => {
      makeSure(10).turnsOut.toBe(10);
      expect(() => {
        makeSure(10).turnsOut.toBe(20);
      }).toThrow();
    });

    test('expectValue includes original Jest matchers', () => {
      const ev = makeSure(5);
      expect(typeof ev.toBe).toBe('function');
      expect(typeof ev.toEqual).toBe('function');
      // Just test one matcher to ensure original ones are there
      ev.toBe(5);
    });
  });

	describe('repeatOverDuration()', () => {
		let NOW: Date;

		beforeEach(() => {
			NOW = new Date();
			jest.useFakeTimers({ now: NOW });
		})

		afterEach(() => {
			jest.useRealTimers();
		})
		
		it('executes the given function 10 times', () => {
			let numExecutions = 0;
	
			repeatOverDuration(10, { seconds: 1 }, () => {
				numExecutions++;
			});
	
			makeSure(numExecutions).is(10);
		});

		it('executes the given function over 10 minutes', () => {
			const startTime = new Date();
	
			repeatOverDuration(10, { minutes: 10 }, () => {});
	
			const endTime = new Date();
	
			makeSure(endTime.getTime() - startTime.getTime()).is(10 * 60 * 1000);
		});

		it('executes the function once every minutes over 10 minutes', () => {
			const startTime = new Date();
			let numExecutions = 0;
			let totalTime = 0;
	
			let previousExecutionTime: Date | null = null as Date | null;
			repeatOverDuration(11, { minutes: 10 }, () => {
				const executionTime = new Date();
				let timeSinceLastExecution = 0;
				if (previousExecutionTime !== null) {
					timeSinceLastExecution = executionTime.getTime() - previousExecutionTime.getTime();
					makeSure(timeSinceLastExecution).is(60 * 1000);
				}
				
				if (previousExecutionTime === null) {
					timeSinceLastExecution = executionTime.getTime() - startTime.getTime();
					makeSure(timeSinceLastExecution).is(0);
				}
				
				numExecutions++;
				previousExecutionTime = executionTime;
				totalTime += timeSinceLastExecution;
			});

			if (previousExecutionTime === null) {
				failTest(`previousExecutionTime should not be null`);
			}

			const endTime = new Date();
			const timeSinceLastExecution = endTime.getTime() - previousExecutionTime.getTime();
			makeSure(timeSinceLastExecution).is(0);

			totalTime += timeSinceLastExecution;
	
			makeSure(numExecutions).is(11);
			makeSure(totalTime).is(10 * 60 * 1000);
		});
	});

	describe('repeatEveryIntervalUntil()', () => {
		let NOW: Date;

		beforeEach(() => {
			NOW = new Date();
			jest.useFakeTimers({ now: NOW });
		})

		afterEach(() => {
			jest.useRealTimers();
		})

		it('executes the function at specified intervals until end date', () => {
			const startTime = new Date();
			const endTime = new Date(startTime.getTime() + 30 * 1000); // 30 seconds from now
			let numExecutions = 0;

			repeatEveryIntervalUntil({ seconds: 10 }, endTime, () => {
				numExecutions++;
			});

			makeSure(numExecutions).is(3);
		});

		it('throws error if start date is after end date', () => {
			const startTime = new Date();
			const endTime = new Date(startTime.getTime() - 10000); // 10 seconds in the past

			expect(() => {
				repeatEveryIntervalUntil({ seconds: 10 }, endTime, () => {});
			}).toThrow();
		});

		it('passes incrementing index to function starting from 0', () => {
			const startTime = new Date();
			const endTime = new Date(startTime.getTime() + 20 * 1000); // 20 seconds from now
			const indices: number[] = [];

			repeatEveryIntervalUntil({ seconds: 10 }, endTime, (index) => {
				indices.push(index);
			});

			makeSure(indices.length).is(2);
			makeSure(indices[0]).is(0);
			makeSure(indices[1]).is(1);
		});

		it('executes function with correct interval spacing over duration', () => {
			const startTime = new Date();
			const endTime = new Date(startTime.getTime() + 60 * 1000); // 60 seconds from now
			let numExecutions = 0;

			let previousExecutionTime: Date | null = null as Date | null;
			repeatEveryIntervalUntil({ seconds: 15 }, endTime, () => {
				const executionTime = new Date();

				if (previousExecutionTime !== null) {
					const timeSinceLastExecution = executionTime.getTime() - previousExecutionTime.getTime();
					makeSure(timeSinceLastExecution).is(15 * 1000);
				}
				
				numExecutions++;
				previousExecutionTime = executionTime;
			});

			makeSure(numExecutions).is(4);
		});
	});

	
});
