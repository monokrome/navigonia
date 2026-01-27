/**
 * Extract parameter names from a route pattern using template literal types.
 *
 * Examples:
 *   ExtractParams<'/users/:id'> = { id: string }
 *   ExtractParams<'/users/:id/posts/:postId'> = { id: string; postId: string }
 *   ExtractParams<'/docs/*path'> = { path: string }
 */
export type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param extends `${infer P}?`
      ? { [K in P]?: string } & ExtractParams<`/${Rest}`>
      : { [K in Param]: string } & ExtractParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
      ? Param extends `${infer P}?`
        ? { [K in P]?: string }
        : { [K in Param]: string }
      : T extends `${string}*${infer Param}`
        ? { [K in Param]: string }
        : {};

/**
 * Simplify a type for better IDE display.
 */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Route configuration that can be attached to a pattern.
 */
export interface RouteConfig {
  [key: string]: unknown;
}

/**
 * Nested route configuration with optional children.
 */
export interface NestedRouteConfig extends RouteConfig {
  children?: RouteDefinition;
}

/**
 * Map of route patterns to their configurations.
 */
export type RouteDefinition = {
  [pattern: string]: RouteConfig | NestedRouteConfig;
};

/**
 * Parsed route ready for matching.
 */
export interface ParsedRoute<T = RouteConfig> {
  pattern: string;
  regex: RegExp;
  paramNames: string[];
  isWildcard: boolean;
  config: T;
  children?: ParsedRoute<T>[];
}

/**
 * Result of matching a URL against routes.
 */
export interface MatchResult<T = RouteConfig, P = Record<string, string>> {
  route: T;
  params: P;
  chain: T[];
  pathname: string;
}

/**
 * Infer params type for a specific route pattern in a router.
 */
export type InferParams<
  _Router,
  Pattern extends string,
> = Simplify<ExtractParams<Pattern>>;
