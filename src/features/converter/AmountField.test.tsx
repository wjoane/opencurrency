import { render, screen } from '@testing-library/react-native';
import { StyleSheet, type TextStyle } from 'react-native';

import { type AmountFieldProps } from './AmountField';

const NATIVE_I18N_MANAGER = 'react-native/src/private/specs_DEPRECATED/modules/NativeI18nManager';

async function alignmentUnderDirection(isRTL: boolean): Promise<TextStyle['textAlign']> {
  let AmountField: (props: AmountFieldProps) => React.ReactElement;

  jest.isolateModules(() => {
    jest.doMock(NATIVE_I18N_MANAGER, () => ({
      __esModule: true,
      default: {
        getConstants: () => ({ isRTL, doLeftAndRightSwapInRTL: true, localeIdentifier: 'ar' }),
        allowRTL: () => {},
        forceRTL: () => {},
        swapLeftAndRightInRTL: () => {},
      },
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    AmountField = (require('./AmountField') as typeof import('./AmountField')).AmountField;
  });

  await render(
    // @ts-expect-error
    <AmountField value="1" onChangeText={() => {}} accessibilityLabel="Amount" style={{}} />,
  );

  const style = StyleSheet.flatten(screen.getByLabelText('Amount').props.style) as TextStyle;

  return style.textAlign;
}

describe('AmountField', () => {
  it('aligns the amount to the end of the row in both writing directions', async () => {
    expect(await alignmentUnderDirection(false)).toBe('right');

    expect(await alignmentUnderDirection(true)).toBe('right');
  });
});
