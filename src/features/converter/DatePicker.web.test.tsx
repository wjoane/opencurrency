import { fireEvent, render, screen } from '@testing-library/react-native';

import { EARLIEST_RATE_DATE } from './dateBounds';
import { DatePicker } from './DatePicker.web';

const TODAY = '2026-07-28';

async function renderPicker(overrides: Partial<Parameters<typeof DatePicker>[0]> = {}) {
  const onChange = jest.fn();
  const onDismiss = jest.fn();

  await render(
    <DatePicker
      value="2026-07-27"
      maximumDate={TODAY}
      accessibilityLabel="Rate date"
      onChange={onChange}
      onDismiss={onDismiss}
      {...overrides}
    />,
  );

  return { onChange, onDismiss, input: screen.getByLabelText('Rate date') };
}

async function type(input: ReturnType<typeof screen.getByLabelText>, value: string) {
  await fireEvent(input, 'change', { target: { value } });
}

describe('DatePicker on web', () => {
  it('bounds the picker rather than validating after the fact', async () => {
    const { input } = await renderPicker();

    expect(input.props.min).toBe(EARLIEST_RATE_DATE);
    expect(input.props.max).toBe(TODAY);
  });

  it('opens on the date it was given', async () => {
    const { input } = await renderPicker();

    expect(input.props.value).toBe('2026-07-27');
  });

  it('reports a date inside the range unchanged', async () => {
    const { onChange, input } = await renderPicker();

    await type(input, '2025-06-01');

    expect(onChange).toHaveBeenCalledWith('2025-06-01');
  });

  it('ignores a date typed before the provider’s first publication', async () => {
    const { onChange, input } = await renderPicker();

    await type(input, '2024-03-01');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('ignores a date typed in the future', async () => {
    const { onChange, input } = await renderPicker();

    await type(input, '2030-01-01');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not commit a request for each keystroke of a year being typed', async () => {
    const { onChange, input } = await renderPicker();

    for (const partial of ['0002-06-01', '0020-06-01', '0202-06-01']) {
      await type(input, partial);
    }

    expect(onChange).not.toHaveBeenCalled();

    await type(input, '2025-06-01');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2025-06-01');
  });

  it('treats a cleared field as a dismissal, not as a request for the epoch', async () => {
    const { onChange, onDismiss, input } = await renderPicker();

    await type(input, '');

    expect(onDismiss).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
