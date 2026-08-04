import { fireEvent, render, screen } from '@testing-library/react-native';
import { Platform, Text } from 'react-native';

import { type RateRepository, type SnapshotOutcome } from '../../data/rateRepository';
import { type RateSnapshot } from '../../data/rateSchema';
import { I18nProvider } from '../../i18n/I18nContext';
import { RatesProvider, useRates } from '../../state/RatesContext';
import {
  dismissPicker,
  platformPickerProps,
  selectPickerDate,
} from '../../testing/platformDatePicker';
import { ThemeProvider } from '../../theme/ThemeContext';

import { currentRateDate, toUtcDate } from './dateBounds';
import { RateHeader } from './RateHeader';

const SNAPSHOT: RateSnapshot = {
  date: currentRateDate(),
  baseCurrencyCode: 'eur',
  rates: { eur: 1, usd: 1.0842 },
};

const STALE_SNAPSHOT: RateSnapshot = { ...SNAPSHOT, date: '2026-07-27' };

const PAST_DATE = '2024-03-02';

function DatePickerProbe() {
  const { selectDate } = useRates();

  return (
    <Text accessibilityRole="button" onPress={() => selectDate(PAST_DATE)}>
      pick a date
    </Text>
  );
}

const PICKER_LABEL = 'Rate date';

afterEach(() => {
  jest.restoreAllMocks();
});

function repositoryReturning(
  latest: SnapshotOutcome,
  date: SnapshotOutcome = latest,
): RateRepository {
  return { loadLatest: () => Promise.resolve(latest), loadDate: () => Promise.resolve(date) };
}

function recordingRepository(latest: SnapshotOutcome, date: SnapshotOutcome = latest) {
  const loadLatest = jest.fn(() => Promise.resolve(latest));
  const loadDate = jest.fn((_rateDate: string) => Promise.resolve(date));

  return { loadLatest, loadDate };
}

async function openPicker() {
  await fireEvent.press(screen.getByRole('button', { name: 'Change date' }));
}

async function choose(rateDate: string) {
  await selectPickerDate(PICKER_LABEL, toUtcDate(rateDate));
}

async function renderHeader(repository: RateRepository) {
  await render(
    <ThemeProvider>
      <I18nProvider initialLocale="en">
        <RatesProvider repository={repository}>
          <RateHeader />
          <DatePickerProbe />
        </RatesProvider>
      </I18nProvider>
    </ThemeProvider>,
  );
}

describe('RateHeader', () => {
  it('labels the bundled fallback as loading until the latest request settles', async () => {
    await renderHeader({
      loadLatest: () => new Promise(() => {}),
      loadDate: () => new Promise(() => {}),
    });

    expect(screen.getByText('Loading rates…')).toBeOnTheScreen();
    expect(screen.queryByText('Rates from 2026-08-01')).toBeNull();
  });

  it('shows the date the snapshot itself reports', async () => {
    await renderHeader(repositoryReturning({ status: 'ok', snapshot: SNAPSHOT }));

    expect(await screen.findByText(`Rates from ${SNAPSHOT.date}`)).toBeOnTheScreen();
  });

  describe('the stale notice', () => {
    it('says the user is offline when that is what happened', async () => {
      await renderHeader(
        repositoryReturning({ status: 'stale', snapshot: SNAPSHOT, reason: 'networkError' }),
      );

      expect(await screen.findByText('Offline — showing the last rates saved')).toBeOnTheScreen();
    });

    it('does not claim the user is offline when the provider answered unreadably', async () => {
      await renderHeader(
        repositoryReturning({ status: 'stale', snapshot: SNAPSHOT, reason: 'invalid' }),
      );

      expect(
        await screen.findByText(
          'The rate provider returned something unreadable — showing the last rates saved',
        ),
      ).toBeOnTheScreen();
      expect(screen.queryByText('Offline — showing the last rates saved')).toBeNull();
    });

    it('says the day was never published when the provider had no rates for it', async () => {
      await renderHeader(
        repositoryReturning({ status: 'stale', snapshot: SNAPSHOT, reason: 'notFound' }),
      );

      expect(
        await screen.findByText('No rates were published for today — showing the last rates saved'),
      ).toBeOnTheScreen();
    });
  });

  it('keeps the snapshot date when a request for another date fails', async () => {
    await renderHeader(
      repositoryReturning(
        { status: 'ok', snapshot: STALE_SNAPSHOT },
        { status: 'unavailable', reason: 'notFound' },
      ),
    );

    await screen.findByText(`Rates from ${STALE_SNAPSHOT.date}`);
    await fireEvent.press(screen.getByRole('button', { name: 'pick a date' }));

    expect(await screen.findByText('No rates were published for that date')).toBeOnTheScreen();
    expect(screen.getByText(`Rates from ${STALE_SNAPSHOT.date}`)).toBeOnTheScreen();
    expect(screen.queryByText(`Rates from ${PAST_DATE}`)).toBeNull();
  });
});

describe('RateHeader date selection', () => {
  it('offers a way to change the date', async () => {
    await renderHeader(repositoryReturning({ status: 'ok', snapshot: SNAPSHOT }));

    expect(screen.getByRole('button', { name: 'Change date' })).toBeOnTheScreen();
  });

  it('opens the picker on today when the displayed snapshot is stale', async () => {
    await renderHeader(repositoryReturning({ status: 'ok', snapshot: STALE_SNAPSHOT }));

    expect(screen.getByRole('button', { name: 'Today' })).toBeOnTheScreen();
    await openPicker();

    expect(screen.getByLabelText(PICKER_LABEL)).toBeOnTheScreen();
    expect(platformPickerProps(PICKER_LABEL).value).toEqual(toUtcDate(currentRateDate()));
  }, 60000);

  it('asks for today as `latest`, never as an explicit date', async () => {
    const picked: RateSnapshot = { ...SNAPSHOT, date: PAST_DATE };
    const repository = recordingRepository(
      { status: 'ok', snapshot: SNAPSHOT },
      { status: 'ok', snapshot: picked },
    );

    await renderHeader(repository);
    await openPicker();
    await choose(PAST_DATE);
    await screen.findByText(`Rates from ${PAST_DATE}`);

    repository.loadDate.mockClear();
    repository.loadLatest.mockClear();

    await openPicker();
    await choose(currentRateDate());

    expect(repository.loadLatest).toHaveBeenCalled();
    expect(repository.loadDate).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
  });

  it('asks for a past day by its explicit date', async () => {
    const picked: RateSnapshot = { ...SNAPSHOT, date: PAST_DATE };
    const repository = recordingRepository(
      { status: 'ok', snapshot: SNAPSHOT },
      { status: 'ok', snapshot: picked },
    );

    await renderHeader(repository);
    await openPicker();
    await choose(PAST_DATE);

    expect(repository.loadDate).toHaveBeenCalledWith(PAST_DATE);
    expect(await screen.findByText(`Rates from ${PAST_DATE}`)).toBeOnTheScreen();
  });

  it('closes the picker once a day has been chosen', async () => {
    await renderHeader(repositoryReturning({ status: 'ok', snapshot: SNAPSHOT }));
    await openPicker();
    await choose(PAST_DATE);

    expect(screen.queryByLabelText(PICKER_LABEL)).toBeNull();
  });

  it('closes the picker, and asks for nothing, when it is dismissed', async () => {
    const repository = recordingRepository({ status: 'ok', snapshot: SNAPSHOT });

    await renderHeader(repository);
    await openPicker();

    repository.loadLatest.mockClear();
    await dismissPicker(PICKER_LABEL);

    expect(screen.queryByLabelText(PICKER_LABEL)).toBeNull();
    expect(repository.loadDate).not.toHaveBeenCalled();
    expect(repository.loadLatest).not.toHaveBeenCalled();
  });

  it('gives Android no sheet, because its picker is its own dialog', async () => {
    jest.replaceProperty(Platform, 'OS', 'android' as typeof Platform.OS);

    await renderHeader(repositoryReturning({ status: 'ok', snapshot: SNAPSHOT }));
    await openPicker();

    expect(screen.getByLabelText(PICKER_LABEL)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('gives every other platform the sheet, because their pickers render inline', async () => {
    await renderHeader(repositoryReturning({ status: 'ok', snapshot: SNAPSHOT }));
    await openPicker();

    expect(screen.getByRole('button', { name: 'Close' })).toBeOnTheScreen();
  });

  it('does not offer a future date when the displayed snapshot is ahead', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const ahead: RateSnapshot = { ...SNAPSHOT, date: tomorrow };

    await renderHeader(repositoryReturning({ status: 'ok', snapshot: ahead }));
    await openPicker();

    const picker = platformPickerProps(PICKER_LABEL);

    expect(picker.value).toEqual(toUtcDate(currentRateDate()));
    expect(picker.maximumDate).toEqual(toUtcDate(currentRateDate()));
    expect(picker.minimumDate).toBeInstanceOf(Date);
    expect((picker.minimumDate as Date).getTime()).toBeLessThanOrEqual(
      (picker.maximumDate as Date).getTime(),
    );
  });

  it('shows the snapshot that comes back for a picked date', async () => {
    const picked: RateSnapshot = { ...SNAPSHOT, date: PAST_DATE };

    await renderHeader(
      repositoryReturning({ status: 'ok', snapshot: SNAPSHOT }, { status: 'ok', snapshot: picked }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'pick a date' }));

    expect(await screen.findByText(`Rates from ${PAST_DATE}`)).toBeOnTheScreen();
  });

  it('offers a way back to today only once a past date is showing', async () => {
    const picked: RateSnapshot = { ...SNAPSHOT, date: PAST_DATE };

    await renderHeader(
      repositoryReturning({ status: 'ok', snapshot: SNAPSHOT }, { status: 'ok', snapshot: picked }),
    );

    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'pick a date' }));

    expect(await screen.findByRole('button', { name: 'Today' })).toBeOnTheScreen();
  });

  it('returns to today, and to today’s snapshot, when asked', async () => {
    const picked: RateSnapshot = { ...SNAPSHOT, date: PAST_DATE };

    await renderHeader(
      repositoryReturning({ status: 'ok', snapshot: SNAPSHOT }, { status: 'ok', snapshot: picked }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'pick a date' }));
    await screen.findByText(`Rates from ${PAST_DATE}`);

    await fireEvent.press(screen.getByRole('button', { name: 'Today' }));

    expect(await screen.findByText(`Rates from ${SNAPSHOT.date}`)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
  });
});
