import { type DirectionEnvironment, needsDirectionChange, reconcileDirection } from './direction';

function environment(isRTL: boolean) {
  const calls: string[] = [];

  const stub: DirectionEnvironment = {
    allowRTL: (allow) => calls.push(`allowRTL:${allow}`),
    forceRTL: (force) => calls.push(`forceRTL:${force}`),
    isRTL: () => isRTL,
  };

  return { stub, calls };
}

describe('needsDirectionChange', () => {
  it('is true only when the requested direction differs from the current one', () => {
    expect(needsDirectionChange('rtl', environment(false).stub)).toBe(true);
    expect(needsDirectionChange('ltr', environment(true).stub)).toBe(true);
    expect(needsDirectionChange('ltr', environment(false).stub)).toBe(false);
    expect(needsDirectionChange('rtl', environment(true).stub)).toBe(false);
  });
});

describe('reconcileDirection', () => {
  it('commits a direction the platform is not already in', () => {
    const { stub, calls } = environment(false);

    reconcileDirection('rtl', stub);

    expect(calls).toEqual(['allowRTL:true', 'forceRTL:true']);
  });

  it('does nothing when the platform already agrees', () => {
    const { stub, calls } = environment(true);

    reconcileDirection('rtl', stub);

    expect(calls).toEqual([]);
  });

  it('turns mirroring off again without restarting for a left-to-right language', () => {
    const { stub, calls } = environment(true);

    reconcileDirection('ltr', stub);

    expect(calls).toEqual(['allowRTL:false', 'forceRTL:false']);
  });

  it('swallows a platform throw rather than stopping the app from rendering', () => {
    const throwing: DirectionEnvironment = {
      ...environment(false).stub,
      allowRTL: () => {
        throw new Error('I18nManager is unavailable');
      },
    };

    expect(() => reconcileDirection('rtl', throwing)).not.toThrow();
  });
});

describe('the platform environment', () => {
  it('remembers a direction it committed, which I18nManager.isRTL does not', () => {
    let direction!: typeof import('./direction');

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      direction = require('./direction') as typeof import('./direction');
    });

    expect(direction.needsDirectionChange('ltr')).toBe(false);
    expect(direction.needsDirectionChange('rtl')).toBe(true);

    direction.reconcileDirection('rtl');

    expect(direction.needsDirectionChange('rtl')).toBe(false);

    expect(direction.needsDirectionChange('ltr')).toBe(true);
  });
});
