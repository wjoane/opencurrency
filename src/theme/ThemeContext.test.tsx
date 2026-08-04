import { act, render, screen } from '@testing-library/react-native';
import { type ColorSchemeName, Text } from 'react-native';

import { type ThemePreference, ThemeProvider, useTheme } from './ThemeContext';
import { darkTheme, lightTheme } from './tokens';

const mockedUseColorScheme = jest.fn<ColorSchemeName | null, []>();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockedUseColorScheme(),
}));

function ThemeReadout() {
  const { scheme, theme, preference, setPreference } = useTheme();

  return (
    <>
      <Text>{`scheme: ${scheme}`}</Text>
      <Text>{`preference: ${preference}`}</Text>
      <Text>{`background: ${theme.colors.background}`}</Text>
      <Text onPress={() => setPreference('dark')}>choose dark</Text>
    </>
  );
}

async function renderWithPreference(initialPreference?: ThemePreference) {
  await render(
    <ThemeProvider initialPreference={initialPreference}>
      <ThemeReadout />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  mockedUseColorScheme.mockReturnValue('light');
});

describe('ThemeProvider', () => {
  it('falls back to light when the device reports no color scheme', async () => {
    mockedUseColorScheme.mockReturnValue(null);

    await renderWithPreference();

    expect(screen.getByText('scheme: light')).toBeOnTheScreen();
  });

  it('defaults to following the device', async () => {
    mockedUseColorScheme.mockReturnValue('dark');

    await renderWithPreference();

    expect(screen.getByText('preference: system')).toBeOnTheScreen();
    expect(screen.getByText('scheme: dark')).toBeOnTheScreen();
    expect(screen.getByText(`background: ${darkTheme.colors.background}`)).toBeOnTheScreen();
  });

  it('follows the device the other way too', async () => {
    mockedUseColorScheme.mockReturnValue('light');

    await renderWithPreference();

    expect(screen.getByText('scheme: light')).toBeOnTheScreen();
    expect(screen.getByText(`background: ${lightTheme.colors.background}`)).toBeOnTheScreen();
  });

  it('overrides the device when the preference is explicit', async () => {
    mockedUseColorScheme.mockReturnValue('dark');

    await renderWithPreference('light');

    expect(screen.getByText('scheme: light')).toBeOnTheScreen();
    expect(screen.getByText(`background: ${lightTheme.colors.background}`)).toBeOnTheScreen();
  });

  it('changes theme when the preference changes', async () => {
    mockedUseColorScheme.mockReturnValue('light');

    await renderWithPreference();

    expect(screen.getByText('scheme: light')).toBeOnTheScreen();

    await act(async () => {
      screen.getByText('choose dark').props.onPress();
    });

    expect(screen.getByText('scheme: dark')).toBeOnTheScreen();
    expect(screen.getByText('preference: dark')).toBeOnTheScreen();
  });
});

describe('useTheme', () => {
  it('refuses to render outside a provider', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<ThemeReadout />)).rejects.toThrow('useTheme must be used inside');

    consoleError.mockRestore();
  });
});
