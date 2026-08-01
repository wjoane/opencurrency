import { act, screen } from '@testing-library/react-native';

import { nearestCompositeProps } from './compositeProps';

export interface PlatformPickerProps {
  readonly value?: unknown;
  readonly minimumDate?: unknown;
  readonly maximumDate?: unknown;
  readonly timeZoneName?: unknown;
  readonly onValueChange?: (event: unknown, selected: Date) => void;
  readonly onDismiss?: () => void;
  readonly onNeutralButtonPress?: () => void;
}

export function platformPickerProps(accessibilityLabel: string): PlatformPickerProps {
  return nearestCompositeProps<PlatformPickerProps>(
    screen.getByLabelText(accessibilityLabel),
    (props) => props.value instanceof Date,
    'platform date picker',
  );
}

export async function selectPickerDate(accessibilityLabel: string, selected: Date) {
  const { onValueChange } = platformPickerProps(accessibilityLabel);

  await act(async () => {
    onValueChange?.({}, selected);
  });
}

export async function dismissPicker(accessibilityLabel: string) {
  const { onDismiss } = platformPickerProps(accessibilityLabel);

  await act(async () => {
    onDismiss?.();
  });
}
