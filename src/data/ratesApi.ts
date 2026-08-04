/**
 * Fetches and validates one day's rates from the provider hosts.
 *
 * Requests are bounded by a timeout and response-size limit, and failures are
 * returned as typed results.
 */

import { REFERENCE_CURRENCY_CODE } from '../domain/conversion';

import { isRateDate, parseRateSnapshot, type RateSnapshot } from './rateSchema';

export const LATEST_DATE_SPEC = 'latest';

export type RateFetchFailure = 'notFound' | 'invalid' | 'networkError';

export type RateFetchResult =
  | { readonly ok: true; readonly snapshot: RateSnapshot }
  | { readonly ok: false; readonly reason: RateFetchFailure };

const FAILURE_SEVERITY: Readonly<Record<RateFetchFailure, number>> = {
  notFound: 3,
  invalid: 2,
  networkError: 1,
};

const REQUEST_TIMEOUT_MS = 10_000;

const HTTP_NOT_FOUND = 404;

const MAX_DECLARED_RESPONSE_BYTES = 1_048_576;
const MAX_BUFFERED_RESPONSE_CODE_UNITS = 1_048_576;

function declaresOversizedBody(response: Response): boolean {
  const declared = Number(response.headers.get('content-length'));

  return Number.isFinite(declared) && declared > MAX_DECLARED_RESPONSE_BYTES;
}

type UrlBuilder = (dateSpec: string) => string;

const HOSTS: readonly UrlBuilder[] = [
  (dateSpec) =>
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${dateSpec}/v1/currencies/${REFERENCE_CURRENCY_CODE}.min.json`,
  (dateSpec) =>
    `https://${dateSpec}.currency-api.pages.dev/v1/currencies/${REFERENCE_CURRENCY_CODE}.min.json`,
];

function isSupportedDateSpec(dateSpec: string): boolean {
  return dateSpec === LATEST_DATE_SPEC || isRateDate(dateSpec);
}

async function fetchFromHost(url: string): Promise<RateFetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (response.status === HTTP_NOT_FOUND) {
      return { ok: false, reason: 'notFound' };
    }

    if (!response.ok) {
      return { ok: false, reason: 'networkError' };
    }

    if (declaresOversizedBody(response)) {
      return { ok: false, reason: 'invalid' };
    }

    const body = await response.text();

    // React Native fetch does not expose a portable streaming reader. This post-buffer
    // sanity check measures UTF-16 code units; the header check above is the byte cap.
    if (body.length > MAX_BUFFERED_RESPONSE_CODE_UNITS) {
      return { ok: false, reason: 'invalid' };
    }

    const parsed = parseRateSnapshot(body);

    return parsed.ok ? { ok: true, snapshot: parsed.snapshot } : { ok: false, reason: 'invalid' };
  } catch {
    return { ok: false, reason: 'networkError' };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchRateSnapshot(dateSpec: string): Promise<RateFetchResult> {
  if (!isSupportedDateSpec(dateSpec)) {
    return { ok: false, reason: 'notFound' };
  }

  let failure: RateFetchFailure = 'networkError';

  for (const buildUrl of HOSTS) {
    const result = await fetchFromHost(buildUrl(dateSpec));

    if (result.ok) {
      return result;
    }

    if (FAILURE_SEVERITY[result.reason] > FAILURE_SEVERITY[failure]) {
      failure = result.reason;
    }
  }

  return { ok: false, reason: failure };
}
