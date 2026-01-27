/**
 * Parsed query string as a record.
 * Values can be strings or arrays of strings for repeated keys.
 */
export type QueryParams = Record<string, string | string[]>;

/**
 * Parse a query string into an object.
 * Handles repeated keys as arrays.
 *
 * @example
 * parseQuery('?foo=bar&arr=1&arr=2')
 * // { foo: 'bar', arr: ['1', '2'] }
 */
export function parseQuery(query: string): QueryParams {
  const result: QueryParams = {};

  const cleaned = query.startsWith('?') ? query.slice(1) : query;

  if (!cleaned) {
    return result;
  }

  for (const pair of cleaned.split('&')) {
    const eqIndex = pair.indexOf('=');

    if (eqIndex === -1) {
      const key = decodeURIComponent(pair);

      if (key) {
        result[key] = '';
      }

      continue;
    }

    const key = decodeURIComponent(pair.slice(0, eqIndex));
    const value = decodeURIComponent(pair.slice(eqIndex + 1));

    if (!key) {
      continue;
    }

    const existing = result[key];

    if (existing === undefined) {
      result[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      result[key] = [existing, value];
    }
  }

  return result;
}

/**
 * Stringify an object into a query string.
 * Arrays are serialized as repeated keys.
 *
 * @example
 * stringifyQuery({ foo: 'bar', arr: ['1', '2'] })
 * // 'foo=bar&arr=1&arr=2'
 */
export function stringifyQuery(params: QueryParams): string {
  const pairs: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    const encodedKey = encodeURIComponent(key);

    if (Array.isArray(value)) {
      for (const v of value) {
        pairs.push(encodedKey + '=' + encodeURIComponent(v));
      }
    } else {
      pairs.push(encodedKey + '=' + encodeURIComponent(value));
    }
  }

  return pairs.join('&');
}
