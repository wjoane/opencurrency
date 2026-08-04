/** Renders the native date picker. */

import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';

import { clampRateDate, EARLIEST_RATE_DATE, toRateDate, toUtcDate } from './dateBounds';

export interface DatePickerProps {
  readonly value: string;
  readonly maximumDate: string;
  readonly onChange: (rateDate: string) => void;
  readonly onDismiss: () => void;
  readonly accessibilityLabel: string;
}

export function DatePicker({
  value,
  maximumDate,
  onChange,
  onDismiss,
  accessibilityLabel,
}: DatePickerProps) {
  const handleValueChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    onChange(clampRateDate(toRateDate(selected), maximumDate));
  };

  return (
    <DateTimePicker
      value={toUtcDate(value)}
      mode="date"
      display="spinner"
      minimumDate={toUtcDate(EARLIEST_RATE_DATE)}
      maximumDate={toUtcDate(maximumDate)}
      onValueChange={handleValueChange}
      onDismiss={onDismiss}
      onNeutralButtonPress={onDismiss}
      accessibilityLabel={accessibilityLabel}
      timeZoneName="UTC"
    />
  );
}
