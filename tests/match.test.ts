import { describe, it, expect } from 'vitest';
import { createRouter } from '../src/index.js';

describe('match', () => {
  const router = createRouter({
    '/': { page: 'home' },
    '/users': { page: 'users' },
    '/users/:id': { page: 'user' },
    '/users/:id/posts/:postId': { page: 'post' },
    '/docs/*path': { page: 'docs' },
  });

  it('matches static routes', () => {
    const match = router.match('/');

    expect(match).not.toBeNull();
    expect(match?.route).toEqual({ page: 'home' });
    expect(match?.params).toEqual({});
  });

  it('matches routes with params', () => {
    const match = router.match('/users/123');

    expect(match).not.toBeNull();
    expect(match?.route).toEqual({ page: 'user' });
    expect(match?.params).toEqual({ id: '123' });
  });

  it('matches routes with multiple params', () => {
    const match = router.match('/users/123/posts/456');

    expect(match).not.toBeNull();
    expect(match?.route).toEqual({ page: 'post' });
    expect(match?.params).toEqual({ id: '123', postId: '456' });
  });

  it('matches wildcard routes', () => {
    const match = router.match('/docs/getting-started/installation');

    expect(match).not.toBeNull();
    expect(match?.route).toEqual({ page: 'docs' });
    expect(match?.params).toEqual({ path: 'getting-started/installation' });
  });

  it('prefers more specific routes over wildcards', () => {
    const specificRouter = createRouter({
      '/docs': { page: 'docsIndex' },
      '/docs/*path': { page: 'docs' },
    });

    const match = specificRouter.match('/docs');

    expect(match?.route).toEqual({ page: 'docsIndex' });
  });

  it('returns null for unmatched routes', () => {
    const match = router.match('/nonexistent');

    expect(match).toBeNull();
  });

  it('normalizes trailing slashes', () => {
    const match = router.match('/users/');

    expect(match).not.toBeNull();
    expect(match?.route).toEqual({ page: 'users' });
  });

  it('includes pathname in result', () => {
    const match = router.match('/users/123');

    expect(match?.pathname).toBe('/users/123');
  });

  it('builds chain for flat routes', () => {
    const match = router.match('/users/123');

    expect(match?.chain).toEqual([{ page: 'user' }]);
  });
});

describe('match with nested routes', () => {
  const router = createRouter({
    '/app': {
      layout: 'app',
      children: {
        '/': { page: 'dashboard' },
        '/settings': { page: 'settings' },
        '/users/:id': { page: 'user' },
      },
    },
  });

  it('matches nested route index', () => {
    const match = router.match('/app');

    expect(match).not.toBeNull();
    expect(match?.route).toEqual({ page: 'dashboard' });
  });

  it('matches nested routes with params', () => {
    const match = router.match('/app/users/123');

    expect(match).not.toBeNull();
    expect(match?.route).toEqual({ page: 'user' });
    expect(match?.params).toEqual({ id: '123' });
  });

  it('builds chain for nested routes', () => {
    const match = router.match('/app/settings');

    expect(match?.chain).toHaveLength(2);
    expect(match?.chain[0]).toEqual({
      layout: 'app',
      children: expect.any(Object),
    });
    expect(match?.chain[1]).toEqual({ page: 'settings' });
  });
});

describe('match with optional params', () => {
  const router = createRouter({
    '/search/:query?': { page: 'search' },
  });

  it('matches with optional param present', () => {
    const match = router.match('/search/foo');

    expect(match?.params).toEqual({ query: 'foo' });
  });

  it('matches with optional param absent', () => {
    const match = router.match('/search');

    expect(match?.params).toEqual({});
  });
});
