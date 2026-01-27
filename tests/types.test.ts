import { describe, it, expectTypeOf } from 'vitest';
import { createRouter, type InferParams, type ExtractParams } from '../src/index.js';

describe('type inference', () => {
  it('extracts single param', () => {
    type Result = ExtractParams<'/users/:id'>;

    expectTypeOf<Result>().toEqualTypeOf<{ id: string }>();
  });

  it('extracts multiple params', () => {
    type Result = ExtractParams<'/users/:id/posts/:postId'>;

    expectTypeOf<Result>().toEqualTypeOf<{ id: string; postId: string }>();
  });

  it('extracts wildcard params', () => {
    type Result = ExtractParams<'/docs/*path'>;

    expectTypeOf<Result>().toEqualTypeOf<{ path: string }>();
  });

  it('extracts optional params', () => {
    type Result = ExtractParams<'/users/:id?'>;

    expectTypeOf<Result>().toEqualTypeOf<{ id?: string }>();
  });

  it('returns empty object for static routes', () => {
    type Result = ExtractParams<'/users'>;

    expectTypeOf<Result>().toEqualTypeOf<{}>();
  });

  it('handles mixed params and wildcards', () => {
    type Result = ExtractParams<'/users/:id/files/*path'>;

    expectTypeOf<Result>().toEqualTypeOf<{ id: string; path: string }>();
  });
});

describe('InferParams helper', () => {
  const router = createRouter({
    '/': { page: 'home' },
    '/users/:id': { page: 'user' },
    '/posts/:postId/comments/:commentId': { page: 'comment' },
  });

  it('infers params from router pattern', () => {
    type Result = InferParams<typeof router, '/users/:id'>;

    expectTypeOf<Result>().toEqualTypeOf<{ id: string }>();
  });

  it('infers multiple params', () => {
    type Result = InferParams<typeof router, '/posts/:postId/comments/:commentId'>;

    expectTypeOf<Result>().toEqualTypeOf<{
      postId: string;
      commentId: string;
    }>();
  });
});

describe('router.build type safety', () => {
  const router = createRouter({
    '/': { page: 'home' },
    '/users/:id': { page: 'user' },
    '/docs/*path': { page: 'docs' },
  });

  it('requires correct params for build', () => {
    const url = router.build('/users/:id', { id: '123' });

    expectTypeOf(url).toBeString();
  });

  it('accepts empty params for static routes', () => {
    const url = router.build('/', {});

    expectTypeOf(url).toBeString();
  });
});
