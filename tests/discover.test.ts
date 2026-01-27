import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { discoverRoutes } from '../src/discover.js';

const TEST_DIR = join(import.meta.dirname, '.test-pages');

describe('discoverRoutes', () => {
  beforeAll(async () => {
    await mkdir(TEST_DIR, { recursive: true });
    await mkdir(join(TEST_DIR, 'users'), { recursive: true });
    await mkdir(join(TEST_DIR, 'docs'), { recursive: true });

    await writeFile(join(TEST_DIR, 'index.html'), '');
    await writeFile(join(TEST_DIR, 'about.html'), '');
    await writeFile(join(TEST_DIR, 'users', 'index.html'), '');
    await writeFile(join(TEST_DIR, 'users', '[id].html'), '');
    await writeFile(join(TEST_DIR, 'docs', '[...slug].html'), '');
    await writeFile(join(TEST_DIR, '_layout.html'), '');
    await writeFile(join(TEST_DIR, 'users', '_layout.html'), '');
  });

  afterAll(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('discovers index routes', async () => {
    const routes = await discoverRoutes(TEST_DIR);

    expect(routes['/']).toBeDefined();
    expect(routes['/']?.page).toContain('index.html');
  });

  it('discovers named routes', async () => {
    const routes = await discoverRoutes(TEST_DIR);

    expect(routes['/about']).toBeDefined();
    expect(routes['/about']?.page).toContain('about.html');
  });

  it('discovers nested index routes', async () => {
    const routes = await discoverRoutes(TEST_DIR);

    expect(routes['/users']).toBeDefined();
  });

  it('converts [param] to :param', async () => {
    const routes = await discoverRoutes(TEST_DIR);

    expect(routes['/users/:id']).toBeDefined();
  });

  it('converts [...param] to *param', async () => {
    const routes = await discoverRoutes(TEST_DIR);

    expect(routes['/docs/*slug']).toBeDefined();
  });

  it('excludes layout files from routes', async () => {
    const routes = await discoverRoutes(TEST_DIR);
    const patterns = Object.keys(routes);

    expect(patterns.some((p) => p.includes('_layout'))).toBe(false);
  });

  it('assigns layouts to routes', async () => {
    const routes = await discoverRoutes(TEST_DIR);

    expect(routes['/about']?.layout).toContain('_layout.html');
    expect(routes['/users/:id']?.layout).toContain('users');
  });

  it('respects custom extensions', async () => {
    const routes = await discoverRoutes(TEST_DIR, {
      extensions: ['.tsx'],
    });

    expect(Object.keys(routes)).toHaveLength(0);
  });
});
