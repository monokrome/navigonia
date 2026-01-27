import type {
  RouteConfig,
  RouteDefinition,
  ParsedRoute,
  MatchResult,
  ExtractParams,
  Simplify,
} from './types.js';
import { parseRoutes } from './parse.js';
import { matchRoute } from './match.js';
import { buildUrl } from './build.js';

export type { RouteConfig, RouteDefinition, MatchResult, ExtractParams };

/**
 * Router instance with type-safe matching and building.
 */
export interface Router<T extends RouteDefinition> {
  /**
   * Match a pathname against routes.
   * Returns null if no route matches.
   */
  match(pathname: string): MatchResult<T[keyof T]> | null;

  /**
   * Build a URL from a pattern and params.
   * Optionally include query string params.
   */
  build<P extends keyof T & string>(
    pattern: P,
    params: Simplify<ExtractParams<P>>,
    query?: Record<string, string | string[]>
  ): string;

  /**
   * Get all parsed routes (for debugging/introspection).
   */
  readonly routes: ParsedRoute<T[keyof T]>[];
}

/**
 * Create a router from route definitions.
 *
 * @example
 * const router = createRouter({
 *   '/': { page: 'home' },
 *   '/users/:id': { page: 'user' },
 *   '/docs/*path': { page: 'docs' },
 * });
 *
 * const match = router.match('/users/123');
 * // match.params: { id: string }
 *
 * const url = router.build('/users/:id', { id: '123' });
 * // '/users/123'
 */
export function createRouter<T extends RouteDefinition>(routes: T): Router<T> {
  const parsed = parseRoutes(routes as Record<string, RouteConfig>);

  return {
    match(pathname: string): MatchResult<T[keyof T]> | null {
      return matchRoute(parsed, pathname) as MatchResult<T[keyof T]> | null;
    },

    build<P extends keyof T & string>(
      pattern: P,
      params: Simplify<ExtractParams<P>>,
      query?: Record<string, string | string[]>
    ): string {
      return buildUrl(pattern, params as Record<string, string>, query);
    },

    get routes(): ParsedRoute<T[keyof T]>[] {
      return parsed as ParsedRoute<T[keyof T]>[];
    },
  };
}

/**
 * Type helper to infer params from a route pattern.
 *
 * @example
 * type Params = InferParams<typeof router, '/users/:id'>;
 * // { id: string }
 */
export type InferParams<
  _Router,
  Pattern extends string,
> = Simplify<ExtractParams<Pattern>>;
