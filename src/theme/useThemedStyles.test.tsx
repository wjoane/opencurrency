import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ThemeProvider } from './ThemeContext';
import { type ThemeTokens } from './tokens';
import { useThemedStyles } from './useThemedStyles';

interface ProbeProps {
  readonly label: string;
  readonly createStyles: (theme: ThemeTokens) => { readonly color: string };
}

function Probe({ label, createStyles }: ProbeProps) {
  const styles = useThemedStyles(createStyles);

  return <Text>{`${label}:${styles.color}`}</Text>;
}

describe('useThemedStyles', () => {
  it('shares one stylesheet between consumers of the same factory and theme', async () => {
    const createStyles = jest.fn((theme: ThemeTokens) => ({ color: theme.colors.primary }));

    await render(
      <ThemeProvider initialPreference="light">
        <Probe label="first" createStyles={createStyles} />
        <Probe label="second" createStyles={createStyles} />
      </ThemeProvider>,
    );

    expect(screen.getByText('first:#2563EB')).toBeOnTheScreen();
    expect(screen.getByText('second:#2563EB')).toBeOnTheScreen();
    expect(createStyles).toHaveBeenCalledTimes(1);
  });

  it('keeps factories separate when they use the same theme', async () => {
    const primaryStyles = jest.fn((theme: ThemeTokens) => ({ color: theme.colors.primary }));
    const dangerStyles = jest.fn((theme: ThemeTokens) => ({ color: theme.colors.danger }));

    await render(
      <ThemeProvider initialPreference="dark">
        <Probe label="primary" createStyles={primaryStyles} />
        <Probe label="danger" createStyles={dangerStyles} />
      </ThemeProvider>,
    );

    expect(screen.getByText('primary:#3B82F6')).toBeOnTheScreen();
    expect(screen.getByText('danger:#F87171')).toBeOnTheScreen();
    expect(primaryStyles).toHaveBeenCalledTimes(1);
    expect(dangerStyles).toHaveBeenCalledTimes(1);
  });
});
