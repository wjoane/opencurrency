import { fetchRateSnapshot, LATEST_DATE_SPEC } from './ratesApi';

const JSDELIVR_URL =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.min.json';
const PAGES_URL = 'https://latest.currency-api.pages.dev/v1/currencies/eur.min.json';

const SNAPSHOT_BODY = JSON.stringify({ date: '2026-07-27', eur: { usd: 1.1697 } });

const NOT_FOUND_BODY = "Couldn't find the requested release version 2024-03-01.";

const MAX_RESPONSE_BYTES = 1_048_576;

function textResponse(body: string, status = 200, declaredBytes = body.length): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-length': String(declaredBytes) }),
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

function unmeasuredResponse(body: string): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

function stubFetch(responses: Readonly<Record<string, Response | Error>>): jest.Mock {
  const mock = jest.fn((url: string) => {
    const response = responses[url];

    if (response === undefined) {
      throw new Error(`unexpected request to ${url}`);
    }

    return response instanceof Error ? Promise.reject(response) : Promise.resolve(response);
  });

  globalThis.fetch = mock as unknown as typeof fetch;

  return mock;
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe('fetchRateSnapshot', () => {
  it('returns the snapshot from the primary host and does not call the fallback', async () => {
    const fetchMock = stubFetch({ [JSDELIVR_URL]: textResponse(SNAPSHOT_BODY) });

    const result = await fetchRateSnapshot(LATEST_DATE_SPEC);

    expect(result).toEqual({
      ok: true,
      snapshot: { date: '2026-07-27', baseCurrencyCode: 'eur', rates: { usd: 1.1697 } },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(JSDELIVR_URL, expect.anything());
  });

  it('falls back to the Cloudflare host when the primary one is unreachable', async () => {
    const fetchMock = stubFetch({
      [JSDELIVR_URL]: new Error('network request failed'),
      [PAGES_URL]: textResponse(SNAPSHOT_BODY),
    });

    const result = await fetchRateSnapshot(LATEST_DATE_SPEC);

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(2, PAGES_URL, expect.anything());
  });

  it('reports a network error when both hosts fail', async () => {
    stubFetch({
      [JSDELIVR_URL]: new Error('network request failed'),
      [PAGES_URL]: new Error('network request failed'),
    });

    expect(await fetchRateSnapshot(LATEST_DATE_SPEC)).toEqual({
      ok: false,
      reason: 'networkError',
    });
  });

  it('surfaces a 404 as notFound rather than as a network error', async () => {
    stubFetch({
      [JSDELIVR_URL]: textResponse(NOT_FOUND_BODY, 404),
      [PAGES_URL]: textResponse(NOT_FOUND_BODY, 404),
    });

    expect(await fetchRateSnapshot(LATEST_DATE_SPEC)).toEqual({ ok: false, reason: 'notFound' });
  });

  it('keeps notFound when the primary 404s and the fallback is unreachable', async () => {
    stubFetch({
      [JSDELIVR_URL]: textResponse(NOT_FOUND_BODY, 404),
      [PAGES_URL]: new Error('network request failed'),
    });

    expect(await fetchRateSnapshot(LATEST_DATE_SPEC)).toEqual({ ok: false, reason: 'notFound' });
  });

  it('retries the fallback when the primary 404s, in case only one host has the date', async () => {
    stubFetch({
      [JSDELIVR_URL]: textResponse(NOT_FOUND_BODY, 404),
      [PAGES_URL]: textResponse(SNAPSHOT_BODY),
    });

    expect((await fetchRateSnapshot(LATEST_DATE_SPEC)).ok).toBe(true);
  });

  it('reports a 200 with an unusable body as invalid, not as a snapshot', async () => {
    stubFetch({
      [JSDELIVR_URL]: textResponse('<html>maintenance</html>'),
      [PAGES_URL]: textResponse(JSON.stringify({ date: 'yesterday', eur: {} })),
    });

    expect(await fetchRateSnapshot(LATEST_DATE_SPEC)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('refuses a body the host declares to be over the cap, without reading it', async () => {
    const oversized = jest.fn(() => Promise.reject(new Error('the body must not be read')));
    const response = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-length': String(MAX_RESPONSE_BYTES + 1) }),
      text: oversized,
    } as unknown as Response;

    stubFetch({ [JSDELIVR_URL]: response, [PAGES_URL]: response });

    expect(await fetchRateSnapshot(LATEST_DATE_SPEC)).toEqual({ ok: false, reason: 'invalid' });
    expect(oversized).not.toHaveBeenCalled();
  });

  it('refuses an oversized body from a host that declares no length', async () => {
    const body = 'x'.repeat(MAX_RESPONSE_BYTES + 1);

    stubFetch({
      [JSDELIVR_URL]: unmeasuredResponse(body),
      [PAGES_URL]: unmeasuredResponse(body),
    });

    expect(await fetchRateSnapshot(LATEST_DATE_SPEC)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('still accepts a snapshot from a host that declares no length', async () => {
    stubFetch({ [JSDELIVR_URL]: unmeasuredResponse(SNAPSHOT_BODY) });

    expect((await fetchRateSnapshot(LATEST_DATE_SPEC)).ok).toBe(true);
  });

  it('treats a 5xx as retryable rather than as a missing date', async () => {
    stubFetch({
      [JSDELIVR_URL]: textResponse('bad gateway', 502),
      [PAGES_URL]: textResponse('bad gateway', 502),
    });

    expect(await fetchRateSnapshot(LATEST_DATE_SPEC)).toEqual({
      ok: false,
      reason: 'networkError',
    });
  });

  it('builds the historical URL for both hosts from the requested date', async () => {
    const fetchMock = stubFetch({
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@2024-03-02/v1/currencies/eur.min.json':
        new Error('network request failed'),
      'https://2024-03-02.currency-api.pages.dev/v1/currencies/eur.min.json':
        textResponse(SNAPSHOT_BODY),
    });

    expect((await fetchRateSnapshot('2024-03-02')).ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('uses HTTPS for every request', async () => {
    const fetchMock = stubFetch({
      [JSDELIVR_URL]: new Error('network request failed'),
      [PAGES_URL]: new Error('network request failed'),
    });

    await fetchRateSnapshot(LATEST_DATE_SPEC);

    for (const [url] of fetchMock.mock.calls as [string][]) {
      expect(url.startsWith('https://')).toBe(true);
    }
  });

  it('refuses a date spec that is not `latest` or a calendar day, without requesting anything', async () => {
    const fetchMock = stubFetch({});

    expect(await fetchRateSnapshot('../../etc/passwd')).toEqual({ ok: false, reason: 'notFound' });
    expect(await fetchRateSnapshot('2026-02-31')).toEqual({ ok: false, reason: 'notFound' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
