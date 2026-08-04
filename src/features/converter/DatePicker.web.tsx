/** Renders the date picker using the web date input. */

import { StyleSheet, View } from 'react-native';

import { EARLIEST_RATE_DATE, isSelectableRateDate } from './dateBounds';
import { type DatePickerProps } from './DatePicker';

export function DatePicker({
  value,
  maximumDate,
  onChange,
  onDismiss,
  accessibilityLabel,
}: DatePickerProps) {
  return (
    <View style={styles.container}>
      <input
        type="date"
        value={value}
        min={EARLIEST_RATE_DATE}
        max={maximumDate}
        aria-label={accessibilityLabel}
        onChange={(event) => {
          const selected = event.target.value;

          if (selected === '') {
            onDismiss();

            return;
          }

          if (isSelectableRateDate(selected, maximumDate)) {
            onChange(selected);
          }
        }}
        style={inputStyle}
      />
    </View>
  );
}

const inputStyle = {
  fontSize: 16,
  padding: 8,
  width: '100%',
} as const;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
});
