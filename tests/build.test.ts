import { describe, it, expect } from 'vitest';
import { createRouter } from '../src/index.js';
import { buildUrl } from '../src/build.js';

describe('buildUrl', () => {
  it('builds static URLs', () => {
    const url = buildUrl('/users', {});

    expect(url).toBe('/users');
  });

  it('builds URLs with params', () => {
    const url = buildUrl('/users/:id', { id: '123' });

    expect(url).toBe('/users/123');
  });

  it('builds URLs with multiple params', () => {
    const url = buildUrl('/users/:id/posts/:postId', {
      id: '123',
      postId: '456',
    });

    expect(url).toBe('/users/123/posts/456');
  });

  it('builds URLs with query params', () => {
    const url = buildUrl('/users/:id', { id: '123' }, { tab: 'posts' });

    expect(url).toBe('/users/123?tab=posts');
  });

  it('builds URLs with array query params', () => {
    const url = buildUrl('/search', {}, { tags: ['a', 'b'] });

    expect(url).toBe('/search?tags=a&tags=b');
  });

  it('builds URLs with wildcard params', () => {
    const url = buildUrl('/docs/*path', { path: 'getting-started/install' });

    expect(url).toBe('/docs/getting-started/install');
  });

  it('encodes param values', () => {
    const url = buildUrl('/users/:id', { id: 'hello world' });

    expect(url).toBe('/users/hello%20world');
  });

  it('encodes query param values', () => {
    const url = buildUrl('/search', {}, { q: 'hello world' });

    expect(url).toBe('/search?q=hello%20world');
  });

  it('throws on missing required param', () => {
    expect(() => buildUrl('/users/:id', {})).toThrow('Missing required param: id');
  });

  it('handles optional params when present', () => {
    const url = buildUrl('/users/:id?', { id: '123' });

    expect(url).toBe('/users/123');
  });
});

describe('router.build', () => {
  const router = createRouter({
    '/': { page: 'home' },
    '/users/:id': { page: 'user' },
    '/docs/*path': { page: 'docs' },
  });

  it('builds URLs through router', () => {
    const url = router.build('/users/:id', { id: '123' });

    expect(url).toBe('/users/123');
  });

  it('builds URLs with query through router', () => {
    const url = router.build('/users/:id', { id: '123' }, { edit: 'true' });

    expect(url).toBe('/users/123?edit=true');
  });
});
