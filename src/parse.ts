import type { ParsedRoute, RouteConfig, NestedRouteConfig } from './types.js';

/**
 * Convert a route pattern to a regex and extract param names.
 *
 * Supported patterns:
 *   /users         → exact match
 *   /users/:id     → named param
 *   /users/:id?    → optional param
 *   /docs/*path    → wildcard (catch-all)
 */
export function parsePattern(pattern: string): {
  regex: RegExp;
  paramNames: string[];
  isWildcard: boolean;
} {
  const paramNames: string[] = [];
  let isWildcard = false;

  let regexStr = pattern
    .replace(/\*/g, () => {
      return '\0WILDCARD\0';
    })
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\0WILDCARD\0/g, '*');

  regexStr = regexStr.replace(/\/:(\w+)\?/g, (_match, param: string) => {
    paramNames.push(param);
    return '(?:/(?<' + param + '>[^/]+))?';
  });

  regexStr = regexStr.replace(/:(\w+)/g, (_match, param: string) => {
    paramNames.push(param);
    return '(?<' + param + '>[^/]+)';
  });

  regexStr = regexStr.replace(/\*(\w+)/g, (_match, param: string) => {
    paramNames.push(param);
    isWildcard = true;
    return '(?<' + param + '>.*)';
  });

  return {
    regex: new RegExp('^' + regexStr + '$'),
    paramNames,
    isWildcard,
  };
}

/**
 * Check if a route config has children (is a nested route).
 */
function hasChildren(config: RouteConfig): config is NestedRouteConfig {
  return 'children' in config && typeof config.children === 'object';
}

/**
 * Parse a route definition into ParsedRoute objects.
 */
export function parseRoutes<T extends RouteConfig>(
  routes: Record<string, T>,
  parentPattern = ''
): ParsedRoute<T>[] {
  const parsed: ParsedRoute<T>[] = [];

  for (const [pattern, config] of Object.entries(routes)) {
    const fullPattern =
      parentPattern + (pattern === '/' && parentPattern ? '' : pattern);
    const { regex, paramNames, isWildcard } = parsePattern(
      fullPattern || '/'
    );

    const route: ParsedRoute<T> = {
      pattern: fullPattern || '/',
      regex,
      paramNames,
      isWildcard,
      config,
    };

    if (hasChildren(config)) {
      route.children = parseRoutes(
        config.children as Record<string, T>,
        fullPattern
      );
    }

    parsed.push(route);
  }

  return sortRoutes(parsed);
}

/**
 * Sort routes by specificity (most specific first).
 * Static routes > routes with params > wildcards
 * Fewer params = more specific
 */
function sortRoutes<T>(routes: ParsedRoute<T>[]): ParsedRoute<T>[] {
  return routes.sort((a, b) => {
    if (a.isWildcard && !b.isWildcard) {
      return 1;
    }

    if (!a.isWildcard && b.isWildcard) {
      return -1;
    }

    const aParams = a.paramNames.length;
    const bParams = b.paramNames.length;

    if (aParams !== bParams) {
      return aParams - bParams;
    }

    const aSegments = a.pattern.split('/').filter(Boolean);
    const bSegments = b.pattern.split('/').filter(Boolean);

    return bSegments.length - aSegments.length;
  });
}
