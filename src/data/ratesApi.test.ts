import { fetchRateSnapshot, LATEST_DATE_SPEC } from './ratesApi';

const JSDELIVR_URL =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.min.json';
const PAGES_URL = 'https://latest.currency-api.pages.dev/v1/currencies/eur.min.json';

const DATED = '2024-03-02';
const DATED_JSDELIVR_URL = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${DATED}/v1/currencies/eur.min.json`;
const DATED_PAGES_URL = `https://${DATED}.currency-api.pages.dev/v1/currencies/eur.min.json`;

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

function withoutQuery(url: string): string {
  return url.split('?')[0];
}

function stubFetch(responses: Readonly<Record<string, Response | Error>>): jest.Mock {
  const mock = jest.fn((url: string) => {
    const response = responses[withoutQuery(url)];

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
    const fetchMock = stubFetch({ [PAGES_URL]: textResponse(SNAPSHOT_BODY) });

    const result = await fetchRateSnapshot(LATEST_DATE_SPEC);

    expect(result).toEqual({
      ok: true,
      snapshot: { date: '2026-07-27', baseCurrencyCode: 'eur', rates: { usd: 1.1697 } },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(PAGES_URL), expect.anything());
  });

  it('falls back to the Cloudflare host when the primary one is unreachable', async () => {
    const fetchMock = stubFetch({
      [PAGES_URL]: new Error('network request failed'),
      [JSDELIVR_URL]: textResponse(SNAPSHOT_BODY),
    });

    const result = await fetchRateSnapshot(LATEST_DATE_SPEC);

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(JSDELIVR_URL),
      expect.anything(),
    );
  });

  it('reports a network error when both hosts fail', async () => {
    stubFetch({
      [PAGES_URL]: new Error('network request failed'),
      [JSDELIVR_URL]: new Error('network request failed'),
    });

    expect(await fetchRateSnapshot(LATEST_DATE_SPEC)).toEqual({
      ok: false,
      reason: 'networkError',
    });
  });

  it('surfaces a 404 as notFound rather than as a network error', async () => {
    stubFetch({
      [PAGES_URL]: textResponse(NOT_FOUND_BODY, 404),
      [JSDELIVR_URL]: textResponse(NOT_FOUND_BODY, 404),
    });

    expect(await fetchRateSnapshot(LATEST_DATE_SPEC)).toEqual({ ok: false, reason: 'notFound' });
  });

  it('keeps notFound when the primary 404s and the fallback is unreachable', async () => {
    stubFetch({
      [PAGES_URL]: textResponse(NOT_FOUND_BODY, 404),
      [JSDELIVR_URL]: new Error('network request failed'),
    });

    expect(await fetchRateSnapshot(LATEST_DATE_SPEC)).toEqual({ ok: false, reason: 'notFound' });
  });

  it('retries the fallback when the primary 404s, in case only one host has the date', async () => {
    stubFetch({
      [PAGES_URL]: textResponse(NOT_FOUND_BODY, 404),
      [JSDELIVR_URL]: textResponse(SNAPSHOT_BODY),
    });

    expect((await fetchRateSnapshot(LATEST_DATE_SPEC)).ok).toBe(true);
  });

  it('reports a 200 with an unusable body as invalid, not as a snapshot', async () => {
    stubFetch({
      [PAGES_URL]: textResponse('<html>maintenance</html>'),
      [JSDELIVR_URL]: textResponse(JSON.stringify({ date: 'yesterday', eur: {} })),
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

    stubFetch({ [PAGES_URL]: response, [JSDELIVR_URL]: response });

    expect(await fetchRateSnapshot(LATEST_DATE_SPEC)).toEqual({ ok: false, reason: 'invalid' });
    expect(oversized).not.toHaveBeenCalled();
  });

  it('refuses an oversized body from a host that declares no length', async () => {
    const body = 'x'.repeat(MAX_RESPONSE_BYTES + 1);

    stubFetch({
      [PAGES_URL]: unmeasuredResponse(body),
      [JSDELIVR_URL]: unmeasuredResponse(body),
    });

    expect(await fetchRateSnapshot(LATEST_DATE_SPEC)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('still accepts a snapshot from a host that declares no length', async () => {
    stubFetch({ [PAGES_URL]: unmeasuredResponse(SNAPSHOT_BODY) });

    expect((await fetchRateSnapshot(LATEST_DATE_SPEC)).ok).toBe(true);
  });

  it('treats a 5xx as retryable rather than as a missing date', async () => {
    stubFetch({
      [PAGES_URL]: textResponse('bad gateway', 502),
      [JSDELIVR_URL]: textResponse('bad gateway', 502),
    });

    expect(await fetchRateSnapshot(LATEST_DATE_SPEC)).toEqual({
      ok: false,
      reason: 'networkError',
    });
  });

  it('builds the historical URL for both hosts from the requested date', async () => {
    const fetchMock = stubFetch({
      [DATED_PAGES_URL]: new Error('network request failed'),
      [DATED_JSDELIVR_URL]: textResponse(SNAPSHOT_BODY),
    });

    expect((await fetchRateSnapshot(DATED)).ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  describe('cache bypassing', () => {
    it('stamps `latest` with the current time, so no cache can key on the URL', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(1_754_646_900_000);

      const fetchMock = stubFetch({
        [PAGES_URL]: new Error('network request failed'),
        [JSDELIVR_URL]: new Error('network request failed'),
      });

      await fetchRateSnapshot(LATEST_DATE_SPEC);

      expect(fetchMock.mock.calls.map(([url]: [string]) => url)).toEqual([
        `${PAGES_URL}?t=1754646900000`,
        `${JSDELIVR_URL}?t=1754646900000`,
      ]);
    });

    it('leaves a dated request cacheable, because a published day never changes again', async () => {
      const fetchMock = stubFetch({
        [DATED_PAGES_URL]: new Error('network request failed'),
        [DATED_JSDELIVR_URL]: textResponse(SNAPSHOT_BODY),
      });

      await fetchRateSnapshot(DATED);

      expect(fetchMock.mock.calls.map(([url]: [string]) => url)).toEqual([
        DATED_PAGES_URL,
        DATED_JSDELIVR_URL,
      ]);
    });

    it('sends no request header, which on web would cost a preflight the provider refuses', async () => {
      const fetchMock = stubFetch({
        [PAGES_URL]: new Error('network request failed'),
        [JSDELIVR_URL]: new Error('network request failed'),
      });

      await fetchRateSnapshot(LATEST_DATE_SPEC);

      expect(fetchMock).toHaveBeenCalledTimes(2);

      for (const [, init] of fetchMock.mock.calls as [string, RequestInit][]) {
        expect(init).not.toHaveProperty('headers');
      }
    });
  });

  it('uses HTTPS for every request', async () => {
    const fetchMock = stubFetch({
      [PAGES_URL]: new Error('network request failed'),
      [JSDELIVR_URL]: new Error('network request failed'),
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
