import { stringifyQuery } from './query.js';

/**
 * Build a URL from a route pattern and params.
 *
 * @param pattern - Route pattern with :params and *wildcards
 * @param params - Values for route params
 * @param query - Optional query string params
 * @returns Built URL path
 *
 * @example
 * buildUrl('/users/:id', { id: '123' })
 * // '/users/123'
 *
 * buildUrl('/users/:id', { id: '123' }, { tab: 'posts' })
 * // '/users/123?tab=posts'
 */
export function buildUrl<P extends Record<string, string>>(
  pattern: string,
  params: P,
  query?: Record<string, string | string[]>
): string {
  let url = pattern;

  url = url.replace(/:(\w+)\??/g, (_match, param: string) => {
    const value = params[param];

    if (value === undefined) {
      throw new Error(`Missing required param: ${param}`);
    }

    return encodeURIComponent(value);
  });

  url = url.replace(/\*(\w+)/g, (_match, param: string) => {
    const value = params[param];

    if (value === undefined) {
      throw new Error(`Missing required wildcard param: ${param}`);
    }

    return value
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  });

  if (query && Object.keys(query).length > 0) {
    url += '?' + stringifyQuery(query);
  }

  return url;
}
