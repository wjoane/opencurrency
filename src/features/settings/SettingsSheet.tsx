/** Renders appearance, language, and application information settings. */

import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { SUPPORTED_LOCALES, type Translate, type TranslationKey } from '../../i18n';
import { useI18n } from '../../i18n/I18nContext';
import { reconcileDirection } from '../../i18n/direction';
import { getEndonym, getLayoutDirection } from '../../i18n/locales';
import { usePreferences } from '../../state/PreferencesContext';
import { useTheme } from '../../theme/ThemeContext';
import { type ThemePreference } from '../../theme/ThemeContext';
import { type ThemeTokens } from '../../theme/tokens';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { CheckIcon, ChevronDownIcon } from '../../ui/icons';
import { InfoDialog } from '../../ui/InfoDialog';
import { Sheet } from '../../ui/Sheet';

export interface SettingsSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

const LANGUAGE_CHOICES: readonly (string | null)[] = [null, ...SUPPORTED_LOCALES];

const CHECK_ICON_SIZE = 20;
const CHEVRON_ICON_SIZE = 18;
const GITHUB_URL = 'https://github.com/wjoane/opencurrency';
const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/wjoane';

const APPEARANCE_CHOICES: readonly {
  readonly preference: ThemePreference;
  readonly labelKey: TranslationKey;
}[] = [
  { preference: 'system', labelKey: 'settings.appearance.system' },
  { preference: 'light', labelKey: 'settings.appearance.light' },
  { preference: 'dark', labelKey: 'settings.appearance.dark' },
];

export function SettingsSheet({ visible, onClose }: SettingsSheetProps) {
  const { theme, preference, setPreference } = useTheme();
  const { locale, followsDevice, t, setLocale } = useI18n();
  const { preferences, updatePreferences } = usePreferences();
  const styles = useThemedStyles(createStyles);
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);

  const chooseLocale = useCallback(
    (tag: string | null) => {
      setLanguageExpanded(false);
      const resolved = setLocale(tag);

      reconcileDirection(getLayoutDirection(resolved));
    },
    [setLocale],
  );

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('settings.title')}
      closeLabel={t('sheet.close')}
    >
      <ScrollView style={styles.body}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('settings.appearance')}
        </Text>
        <AppearanceSelector preference={preference} onChange={setPreference} t={t} />

        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('settings.display')}
        </Text>
        <View style={styles.toggleGroup}>
          <ToggleRow
            label={t('settings.display.symbols')}
            value={preferences.showCurrencySymbols}
            onChange={(showCurrencySymbols) => updatePreferences({ showCurrencySymbols })}
          />
          <ToggleRow
            label={t('settings.display.rates')}
            value={preferences.showConversionRates}
            onChange={(showConversionRates) => updatePreferences({ showConversionRates })}
          />
        </View>

        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('settings.language')}
        </Text>
        <Pressable
          onPress={() => setLanguageExpanded((expanded) => !expanded)}
          accessibilityRole="combobox"
          accessibilityLabel={t('settings.language')}
          accessibilityValue={{
            text: followsDevice ? t('settings.language.system') : getEndonym(locale),
          }}
          accessibilityState={{ expanded: languageExpanded }}
          style={styles.dropdownTrigger}
        >
          <Text style={styles.dropdownValue}>
            {followsDevice ? t('settings.language.system') : getEndonym(locale)}
          </Text>
          <ChevronDownIcon color={theme.colors.textSecondary} size={CHEVRON_ICON_SIZE} />
        </Pressable>
        {languageExpanded && (
          <View style={styles.dropdownMenu} accessibilityRole="radiogroup">
            {LANGUAGE_CHOICES.map((tag) => (
              <Choice
                key={tag ?? 'device'}
                label={tag === null ? t('settings.language.system') : getEndonym(tag)}
                selected={tag === null ? followsDevice : !followsDevice && tag === locale}
                onPress={() => {
                  chooseLocale(tag);
                }}
                tickColor={theme.colors.primary}
              />
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('settings.about')}
        </Text>
        <Pressable
          onPress={() => setAboutVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t('settings.about.open')}
          style={styles.aboutButton}
        >
          <Text style={styles.aboutLabel}>{t('settings.about.open')}</Text>
        </Pressable>
      </ScrollView>
      <InfoDialog
        visible={aboutVisible}
        onClose={() => setAboutVisible(false)}
        title={t('settings.about.open')}
        closeLabel={t('sheet.close')}
        confirmLabel={t('dialog.gotIt')}
      >
        <Text style={styles.aboutTagline}>{t('settings.about.tagline')}</Text>
        <Text style={styles.aboutBody}>{t('settings.about.description')}</Text>
        <Text style={styles.aboutBody}>{t('settings.about.licence')}</Text>
        <Text style={styles.aboutBody}>{t('settings.about.credits')}</Text>
        <ExternalLink label={t('settings.about.github')} url={GITHUB_URL} />
        <ExternalLink label={t('settings.about.buymeacoffee')} url={BUY_ME_A_COFFEE_URL} />
      </InfoDialog>
    </Sheet>
  );
}

interface AppearanceSelectorProps {
  readonly preference: ThemePreference;
  readonly onChange: (preference: ThemePreference) => void;
  readonly t: Translate;
}

function AppearanceSelector({ preference, onChange, t }: AppearanceSelectorProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={styles.appearanceSelector}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('settings.appearance')}
    >
      {APPEARANCE_CHOICES.map((choice) => {
        const selected = choice.preference === preference;
        const label = t(choice.labelKey);

        return (
          <Pressable
            key={choice.preference}
            onPress={() => onChange(choice.preference)}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ checked: selected }}
            style={[styles.appearanceChoice, selected && styles.appearanceChoiceSelected]}
          >
            <Text
              style={[
                styles.appearanceChoiceLabel,
                selected && styles.appearanceChoiceLabelSelected,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface ToggleRowProps {
  readonly label: string;
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
}

function ToggleRow({ label, value, onChange }: ToggleRowProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
      />
    </View>
  );
}

interface ChoiceProps {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly tickColor: string;
}

function Choice({ label, selected, onPress, tickColor }: ChoiceProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={styles.choice}
    >
      <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>
      {selected && <CheckIcon color={tickColor} size={CHECK_ICON_SIZE} />}
    </Pressable>
  );
}

interface ExternalLinkProps {
  readonly label: string;
  readonly url: string;
}

function ExternalLink({ label, url }: ExternalLinkProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Text style={styles.aboutBody}>
      {label}
      {'\n'}
      <Text
        accessibilityRole="link"
        accessibilityLabel={url}
        onPress={() => {
          Linking.openURL(url).catch(() => undefined);
        }}
        style={styles.aboutLink}
      >
        {url}
      </Text>
    </Text>
  );
}

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    body: {
      flexShrink: 1,
    },
    sectionTitle: {
      ...theme.typography.label,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    appearanceSelector: {
      flexDirection: 'row',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      overflow: 'hidden',
    },
    appearanceChoice: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    appearanceChoiceSelected: {
      backgroundColor: theme.colors.primary,
    },
    appearanceChoiceLabel: {
      ...theme.typography.label,
      color: theme.colors.textPrimary,
    },
    appearanceChoiceLabelSelected: {
      color: theme.colors.onEmphasis,
      fontWeight: '600',
    },
    toggleGroup: {
      paddingHorizontal: theme.spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surface,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      minHeight: 44,
      paddingVertical: theme.spacing.sm,
    },
    toggleLabel: {
      ...theme.typography.body,
      color: theme.colors.textPrimary,
      flexShrink: 1,
    },
    dropdownTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
      paddingHorizontal: theme.spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surface,
    },
    dropdownValue: {
      ...theme.typography.body,
      color: theme.colors.textPrimary,
    },
    dropdownMenu: {
      marginTop: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surface,
    },
    choice: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    choiceLabel: {
      ...theme.typography.body,
      color: theme.colors.textPrimary,
    },
    choiceLabelSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    aboutButton: {
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      marginBottom: theme.spacing.xl,
      borderRadius: theme.radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    aboutLabel: {
      ...theme.typography.body,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    aboutTagline: {
      ...theme.typography.title,
      color: theme.colors.textPrimary,
    },
    aboutBody: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    },
    aboutLink: {
      ...theme.typography.body,
      color: theme.colors.primary,
      textDecorationLine: 'underline',
    },
  });
}
