import { render } from '@testing-library/react-native';

import {
  dismissPicker,
  platformPickerProps,
  selectPickerDate,
} from '../../testing/platformDatePicker';

import { DatePicker, type DatePickerProps } from './DatePicker';
import { EARLIEST_RATE_DATE, toRateDate, toUtcDate } from './dateBounds';

const MAXIMUM_DATE = '2026-07-28';

const BASE_PROPS: DatePickerProps = {
  value: '2026-07-27',
  maximumDate: MAXIMUM_DATE,
  onChange: () => {},
  onDismiss: () => {},
  accessibilityLabel: 'Rate date',
};

async function renderPicker(overrides: Partial<DatePickerProps> = {}) {
  await render(<DatePicker {...BASE_PROPS} {...overrides} />);
}

describe('DatePicker', () => {
  it('hands the platform component the range and the UTC zone', async () => {
    await renderPicker();

    const picker = platformPickerProps(BASE_PROPS.accessibilityLabel);

    expect(picker.minimumDate).toEqual(toUtcDate(EARLIEST_RATE_DATE));
    expect(picker.maximumDate).toEqual(toUtcDate(MAXIMUM_DATE));
    expect(picker.value).toEqual(toUtcDate(BASE_PROPS.value));
    expect(picker.timeZoneName).toBe('UTC');
  });

  it('reports a completed selection as the day that was chosen', async () => {
    const onChange = jest.fn();
    const onDismiss = jest.fn();

    await renderPicker({ onChange, onDismiss });
    await selectPickerDate(BASE_PROPS.accessibilityLabel, toUtcDate('2025-06-01'));

    expect(onChange).toHaveBeenCalledWith('2025-06-01');
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('reports a dismissal as a dismissal, not as the day under the wheel', async () => {
    const onChange = jest.fn();
    const onDismiss = jest.fn();

    await renderPicker({ onChange, onDismiss });
    await dismissPicker(BASE_PROPS.accessibilityLabel);

    expect(onDismiss).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('treats the neutral action as a dismissal too', async () => {
    const onDismiss = jest.fn();

    await renderPicker({ onDismiss });
    const picker = platformPickerProps(BASE_PROPS.accessibilityLabel);
    picker.onNeutralButtonPress?.();

    expect(onDismiss).toHaveBeenCalled();
  });

  it('clamps a selection above the upper bound rather than requesting it', async () => {
    const onChange = jest.fn();

    await renderPicker({ onChange });
    await selectPickerDate(BASE_PROPS.accessibilityLabel, toUtcDate('2027-01-01'));

    expect(onChange).toHaveBeenCalledWith(MAXIMUM_DATE);
  });

  it('clamps a selection before the provider’s first publication', async () => {
    const onChange = jest.fn();

    await renderPicker({ onChange });
    await selectPickerDate(BASE_PROPS.accessibilityLabel, toUtcDate('2024-03-01'));

    expect(onChange).toHaveBeenCalledWith(EARLIEST_RATE_DATE);
  });

  it('keeps the calendar day when the selection carries a time of day', async () => {
    const onChange = jest.fn();

    await renderPicker({ onChange });
    await selectPickerDate(BASE_PROPS.accessibilityLabel, new Date('2025-06-01T23:30:00.000Z'));

    expect(onChange).toHaveBeenCalledWith('2025-06-01');
    expect(toRateDate(new Date('2025-06-01T23:30:00.000Z'))).toBe('2025-06-01');
  });
});
