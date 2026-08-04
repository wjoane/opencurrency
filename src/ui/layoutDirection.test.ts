import { Platform } from 'react-native';

import { getDirectionProps, getDirectionStyle } from './layoutDirection';

describe('layout direction on native', () => {
  it('mirrors through the layout style', () => {
    expect(getDirectionStyle('rtl')).toEqual({ direction: 'rtl' });
  });

  it('adds no web attribute', () => {
    expect(getDirectionProps('rtl')).toEqual({});
  });
});

describe('layout direction on web', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'web' as typeof Platform.OS);
  });

  it('mirrors through the dir attribute', () => {
    expect(getDirectionProps('rtl')).toEqual({ dir: 'rtl' });
  });

  it('omits the layout style react-native-web rejects', () => {
    expect(getDirectionStyle('rtl')).toBeUndefined();
  });
});
