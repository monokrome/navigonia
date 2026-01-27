import { describe, it, expect } from 'vitest';
import { parsePattern, parseRoutes } from '../src/parse.js';

describe('parsePattern', () => {
  it('parses static routes', () => {
    const result = parsePattern('/users');

    expect(result.regex.test('/users')).toBe(true);
    expect(result.regex.test('/users/')).toBe(false);
    expect(result.regex.test('/users/123')).toBe(false);
    expect(result.paramNames).toEqual([]);
    expect(result.isWildcard).toBe(false);
  });

  it('parses named params', () => {
    const result = parsePattern('/users/:id');

    expect(result.regex.test('/users/123')).toBe(true);
    expect(result.regex.test('/users/')).toBe(false);
    expect(result.regex.test('/users')).toBe(false);
    expect(result.paramNames).toEqual(['id']);
    expect(result.isWildcard).toBe(false);
  });

  it('parses multiple params', () => {
    const result = parsePattern('/users/:id/posts/:postId');

    expect(result.regex.test('/users/123/posts/456')).toBe(true);
    expect(result.paramNames).toEqual(['id', 'postId']);
  });

  it('parses optional params', () => {
    const result = parsePattern('/users/:id?');

    expect(result.regex.test('/users')).toBe(true);
    expect(result.regex.test('/users/123')).toBe(true);
    expect(result.paramNames).toEqual(['id']);
  });

  it('parses wildcard params', () => {
    const result = parsePattern('/docs/*path');

    expect(result.regex.test('/docs/')).toBe(true);
    expect(result.regex.test('/docs/foo')).toBe(true);
    expect(result.regex.test('/docs/foo/bar/baz')).toBe(true);
    expect(result.paramNames).toEqual(['path']);
    expect(result.isWildcard).toBe(true);
  });

  it('extracts param values', () => {
    const result = parsePattern('/users/:id/posts/:postId');
    const match = result.regex.exec('/users/123/posts/456');

    expect(match?.groups).toEqual({ id: '123', postId: '456' });
  });

  it('handles root path', () => {
    const result = parsePattern('/');

    expect(result.regex.test('/')).toBe(true);
    expect(result.regex.test('/foo')).toBe(false);
  });

  it('escapes regex special characters in static segments', () => {
    const result = parsePattern('/api/v1.0/users');

    expect(result.regex.test('/api/v1.0/users')).toBe(true);
    expect(result.regex.test('/api/v1X0/users')).toBe(false);
  });
});

describe('parseRoutes', () => {
  it('parses flat routes', () => {
    const routes = parseRoutes({
      '/': { page: 'home' },
      '/users': { page: 'users' },
      '/users/:id': { page: 'user' },
    });

    expect(routes).toHaveLength(3);
    expect(routes.map((r) => r.pattern)).toContain('/');
    expect(routes.map((r) => r.pattern)).toContain('/users');
    expect(routes.map((r) => r.pattern)).toContain('/users/:id');
  });

  it('sorts routes by specificity', () => {
    const routes = parseRoutes({
      '/docs/*path': { page: 'docs' },
      '/docs': { page: 'docsIndex' },
      '/docs/:id': { page: 'doc' },
    });

    expect(routes[0]?.pattern).toBe('/docs');
    expect(routes[1]?.pattern).toBe('/docs/:id');
    expect(routes[2]?.pattern).toBe('/docs/*path');
  });

  it('parses nested routes', () => {
    const routes = parseRoutes({
      '/app': {
        layout: 'app',
        children: {
          '/': { page: 'dashboard' },
          '/settings': { page: 'settings' },
        },
      },
    });

    expect(routes).toHaveLength(1);
    expect(routes[0]?.children).toHaveLength(2);
    expect(routes[0]?.children?.[0]?.pattern).toBe('/app/settings');
    expect(routes[0]?.children?.[1]?.pattern).toBe('/app');
  });
});
