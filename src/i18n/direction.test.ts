import { type DirectionEnvironment, reconcileDirection } from './direction';

function environment(isRTL: boolean) {
  const calls: string[] = [];

  const stub: DirectionEnvironment = {
    allowRTL: (allow) => calls.push(`allowRTL:${allow}`),
    forceRTL: (force) => calls.push(`forceRTL:${force}`),
    isRTL: () => isRTL,
  };

  return { stub, calls };
}

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
