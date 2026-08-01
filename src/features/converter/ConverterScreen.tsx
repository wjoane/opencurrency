/** Composes the converter header, list, toolbar, and date controls. */

import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePreferences } from '../../state/PreferencesContext';
import { useRates } from '../../state/RatesContext';
import { useTheme } from '../../theme/ThemeContext';
import { type ThemeTokens } from '../../theme/tokens';

import { SettingsSheet } from '../settings/SettingsSheet';

import { AddCurrencySheet } from './AddCurrencySheet';
import { AppHeader } from './AppHeader';
import { ConverterToolbar } from './ConverterToolbar';
import { CurrencyList } from './CurrencyList';
import { RateHeader } from './RateHeader';
import { RateInfoDialog } from './RateInfoDialog';

const NO_RATES = {};

type OpenSurface = 'none' | 'addCurrency' | 'settings' | 'rateInfo';

export function ConverterScreen() {
  const { theme } = useTheme();
  const { preferences, updatePreferences } = usePreferences();
  const { snapshot } = useRates();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [openSurface, setOpenSurface] = useState<OpenSurface>('none');

  const { currencyCodes } = preferences;

  const close = useCallback(() => setOpenSurface('none'), []);

  const addCurrency = useCallback(
    (currencyCode: string) =>
      updatePreferences({ currencyCodes: [...currencyCodes, currencyCode] }),
    [currencyCodes, updatePreferences],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <AppHeader onOpenSettings={() => setOpenSurface('settings')} />
      <RateHeader />
      <View style={styles.body}>
        <CurrencyList
          footer={
            <View>
              <ConverterToolbar
                onAddCurrency={() => setOpenSurface('addCurrency')}
                onOpenRateInfo={() => setOpenSurface('rateInfo')}
              />
              <View style={styles.bottomSafetySpace} />
            </View>
          }
        />
      </View>
      <AddCurrencySheet
        visible={openSurface === 'addCurrency'}
        onClose={close}
        currencyCodes={currencyCodes}
        rates={snapshot?.rates ?? NO_RATES}
        onAdd={addCurrency}
      />
      <SettingsSheet visible={openSurface === 'settings'} onClose={close} />
      <RateInfoDialog visible={openSurface === 'rateInfo'} onClose={close} />
    </SafeAreaView>
  );
}

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    body: {
      flex: 1,
    },
    bottomSafetySpace: {
      height: theme.spacing.lg,
    },
  });
}
