import type { ParsedRoute, RouteConfig, MatchResult } from './types.js';

/**
 * Match a pathname against parsed routes.
 * Returns the first matching route with extracted params.
 */
export function matchRoute<T extends RouteConfig>(
  routes: ParsedRoute<T>[],
  pathname: string
): MatchResult<T> | null {
  const normalizedPath = normalizePath(pathname);

  for (const route of routes) {
    const result = matchSingleRoute(route, normalizedPath, [], {});

    if (result) {
      return result;
    }
  }

  return null;
}

/**
 * Match a single route, handling nested children.
 * For routes with children, we first try to match children.
 * Children have their full path patterns, so they match directly.
 */
function matchSingleRoute<T extends RouteConfig>(
  route: ParsedRoute<T>,
  pathname: string,
  parentChain: T[],
  parentParams: Record<string, string>
): MatchResult<T> | null {
  const chain = [...parentChain, route.config];

  if (route.children && route.children.length > 0) {
    for (const child of route.children) {
      const childResult = matchSingleRoute(child, pathname, chain, parentParams);

      if (childResult) {
        return childResult;
      }
    }
  }

  const match = route.regex.exec(pathname);

  if (!match) {
    return null;
  }

  const params = {
    ...parentParams,
    ...extractParams(match, route.paramNames),
  };

  return {
    route: route.config,
    params,
    chain,
    pathname,
  };
}

/**
 * Extract named params from a regex match.
 */
function extractParams(
  match: RegExpExecArray,
  paramNames: string[]
): Record<string, string> {
  const params: Record<string, string> = {};

  for (const name of paramNames) {
    const value = match.groups?.[name];

    if (value !== undefined) {
      params[name] = value;
    }
  }

  return params;
}

/**
 * Normalize a pathname (remove trailing slash except for root).
 */
function normalizePath(pathname: string): string {
  if (pathname === '/') {
    return pathname;
  }

  return pathname.replace(/\/+$/, '') || '/';
}
