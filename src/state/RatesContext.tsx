/** Provides the selected rate snapshot and loading operations. */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

import {
  createRateRepository,
  type RateRepository,
  type SnapshotOutcome,
} from '../data/rateRepository';
import { type RateFetchFailure } from '../data/ratesApi';
import { type RateSnapshot } from '../data/rateSchema';
import { BUNDLED_RATE_SNAPSHOT } from '../data/seededRates';

type RatesStatus = 'loading' | 'ready' | 'stale' | 'error';

interface RatesState {
  readonly status: RatesStatus;

  readonly snapshot: RateSnapshot | null;

  readonly failure: RateFetchFailure | null;
}

const INITIAL_STATE: RatesState = {
  status: 'loading',
  snapshot: BUNDLED_RATE_SNAPSHOT,
  failure: null,
};

type RatesAction =
  { readonly type: 'requested' } | { readonly type: 'resolved'; outcome: SnapshotOutcome };

function reduce(state: RatesState, action: RatesAction): RatesState {
  if (action.type === 'requested') {
    return { status: 'loading', snapshot: state.snapshot, failure: null };
  }

  switch (action.outcome.status) {
    case 'ok':
      return { status: 'ready', snapshot: action.outcome.snapshot, failure: null };
    case 'stale':
      return { status: 'stale', snapshot: action.outcome.snapshot, failure: action.outcome.reason };
    default:
      return { status: 'error', snapshot: state.snapshot, failure: action.outcome.reason };
  }
}

export interface RatesContextValue extends RatesState {
  readonly selectedDate: string | null;
  readonly selectDate: (date: string | null) => void;

  readonly reload: () => void;
}

const RatesContext = createContext<RatesContextValue | null>(null);

export interface RatesProviderProps {
  readonly children: ReactNode;

  readonly repository?: RateRepository;
}

export function RatesProvider({ children, repository }: RatesProviderProps) {
  const resolvedRepository = useMemo(() => repository ?? createRateRepository(), [repository]);
  const [state, dispatch] = useReducer(reduce, INITIAL_STATE);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    dispatch({ type: 'requested' });

    const request =
      selectedDate === null
        ? resolvedRepository.loadLatest()
        : resolvedRepository.loadDate(selectedDate);

    void request.then((outcome) => {
      if (!cancelled) {
        dispatch({ type: 'resolved', outcome });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [resolvedRepository, selectedDate, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  const value = useMemo<RatesContextValue>(
    () => ({ ...state, selectedDate, selectDate: setSelectedDate, reload }),
    [state, selectedDate, reload],
  );

  return <RatesContext.Provider value={value}>{children}</RatesContext.Provider>;
}

export function useRates(): RatesContextValue {
  const value = useContext(RatesContext);

  if (value === null) {
    throw new Error('useRates must be used inside a RatesProvider');
  }

  return value;
}
