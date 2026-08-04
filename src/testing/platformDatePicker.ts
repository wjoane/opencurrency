import { fireEvent, screen } from '@testing-library/react-native';

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
  return screen.getByLabelText(accessibilityLabel).props as PlatformPickerProps;
}

export async function selectPickerDate(accessibilityLabel: string, selected: Date) {
  await fireEvent(screen.getByLabelText(accessibilityLabel), 'valueChange', {}, selected);
}

export async function dismissPicker(accessibilityLabel: string) {
  await fireEvent(screen.getByLabelText(accessibilityLabel), 'dismiss');
}
