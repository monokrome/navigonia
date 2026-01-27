import { readdir, stat } from 'node:fs/promises';
import { join, relative, basename, extname } from 'node:path';

/**
 * Options for route discovery.
 */
export interface DiscoverOptions {
  /** File extensions to include (default: ['.html', '.tsx', '.jsx']) */
  extensions?: string[];
  /** Patterns to ignore (default: ['_*', '.*']) */
  ignore?: string[];
}

/**
 * Discovered route entry.
 */
export interface DiscoveredRoute {
  page: string;
  layout?: string;
}

const DEFAULT_EXTENSIONS = ['.html', '.tsx', '.jsx'];
const DEFAULT_IGNORE = ['.*'];

/**
 * Discover routes from a directory structure.
 *
 * Conventions:
 *   index.html       → /
 *   users.html       → /users
 *   users/index.html → /users
 *   users/[id].html  → /users/:id
 *   docs/[...slug].html → /docs/*slug
 *   _layout.html     → Layout for directory (not a route)
 */
export async function discoverRoutes(
  dir: string,
  options: DiscoverOptions = {}
): Promise<Record<string, DiscoveredRoute>> {
  const extensions = options.extensions ?? DEFAULT_EXTENSIONS;
  const ignore = options.ignore ?? DEFAULT_IGNORE;
  const routes: Record<string, DiscoveredRoute> = {};
  const layouts = new Map<string, string>();

  await walkDirectory(dir, dir, extensions, ignore, routes, layouts);

  for (const [pattern, route] of Object.entries(routes)) {
    const dirPath = pattern.split('/').slice(0, -1).join('/') || '/';
    const layout = findLayout(dirPath, layouts);

    if (layout) {
      route.layout = layout;
    }
  }

  return routes;
}

/**
 * Recursively walk a directory and discover routes.
 */
async function walkDirectory(
  baseDir: string,
  currentDir: string,
  extensions: string[],
  ignore: string[],
  routes: Record<string, DiscoveredRoute>,
  layouts: Map<string, string>
): Promise<void> {
  const entries = await readdir(currentDir);

  for (const entry of entries) {
    if (shouldIgnore(entry, ignore)) {
      continue;
    }

    const fullPath = join(currentDir, entry);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      await walkDirectory(baseDir, fullPath, extensions, ignore, routes, layouts);
      continue;
    }

    const ext = extname(entry);

    if (!extensions.includes(ext)) {
      continue;
    }

    const name = basename(entry, ext);

    if (name === '_layout') {
      const relDir = relative(baseDir, currentDir);
      const dirPattern = relDir ? '/' + relDir : '/';
      layouts.set(dirPattern, fullPath);
      continue;
    }

    if (name.startsWith('_')) {
      continue;
    }

    const relativePath = relative(baseDir, fullPath);
    const pattern = filePathToPattern(relativePath, ext);

    routes[pattern] = {
      page: fullPath,
    };
  }
}

/**
 * Convert a file path to a route pattern.
 */
function filePathToPattern(filePath: string, ext: string): string {
  let pattern = '/' + filePath.slice(0, -ext.length);

  pattern = pattern.replace(/\\/g, '/');

  pattern = pattern.replace(/\/index$/, '') || '/';

  pattern = pattern.replace(/\[\.\.\.(\w+)\]/g, '*$1');

  pattern = pattern.replace(/\[(\w+)\]/g, ':$1');

  return pattern;
}

/**
 * Check if a filename should be ignored.
 */
function shouldIgnore(filename: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (pattern.startsWith('*') && filename.endsWith(pattern.slice(1))) {
      return true;
    }

    if (pattern.endsWith('*') && filename.startsWith(pattern.slice(0, -1))) {
      return true;
    }

    if (filename === pattern) {
      return true;
    }
  }

  return false;
}

/**
 * Find the layout for a directory path by walking up the tree.
 */
function findLayout(
  dirPattern: string,
  layouts: Map<string, string>
): string | undefined {
  let current = dirPattern;

  while (current) {
    const layout = layouts.get(current);

    if (layout) {
      return layout;
    }

    if (current === '/') {
      break;
    }

    current = current.split('/').slice(0, -1).join('/') || '/';
  }

  return undefined;
}
