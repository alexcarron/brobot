const { defineTest, makeSure, groupTests, runBeforeEachTest, runAfterEachTest, runBeforeAllTests, runAfterAllTests, the, should, inThe, inside } = require("./jest-utils");

describe('jest-utils.js', () => {

  groupTests('runBeforeEachTest', () => {
    let counter = 0;

    runBeforeEachTest(() => {
      counter++;
    });

    defineTest('beforeEach callback increments counter', () => {
			expect(counter).toBe(1);
    });
  });

  the('runAfterEachTest function', () => {
		let counter = 0;

    runAfterEachTest(() => {
			counter++;
    });

    should('call the afterEach callback after each test', () => {
			expect(counter).toBe(0);
    });

		should('call the afterEach callback after each test', () => {
			expect(counter).toBe(1);
		})
  });

  inThe('runBeforeAllTests function', () => {
    let called = false;
    runBeforeAllTests(() => {
      called = true;
    });

    defineTest('called should be true', () => {
      expect(called).toBe(true);
    });
  });

  inside('runAfterAllTests', () => {
    let called = false;
    runAfterAllTests(() => {
      called = true;
    });

		defineTest('called should not be true', () => {
			expect(called).toBe(false);
		});

		defineTest('called should not be true', () => {
			expect(called).toBe(false);
		});
  });

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
});
