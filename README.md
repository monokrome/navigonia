# navigonia

Minimal, type-safe, universal router library. Zero dependencies, works everywhere.

## Install

```bash
pnpm add navigonia
```

## Usage

### Basic Router

```typescript
import { createRouter } from 'navigonia';

const router = createRouter({
  '/': { page: 'home' },
  '/users': { page: 'users' },
  '/users/:id': { page: 'user-detail' },
  '/docs/*path': { page: 'docs' },
});

// Match a URL
const match = router.match('/users/123');
// { route: { page: 'user-detail' }, params: { id: '123' }, ... }

// Build a URL (type-safe!)
const url = router.build('/users/:id', { id: '456' });
// '/users/456'

// With query params
const urlWithQuery = router.build('/users/:id', { id: '456' }, { tab: 'posts' });
// '/users/456?tab=posts'
```

### Type-Safe Parameters

Route parameters are inferred from the pattern:

```typescript
const router = createRouter({
  '/users/:id': { page: 'user' },
  '/posts/:postId/comments/:commentId': { page: 'comment' },
});

// TypeScript knows params shape
router.build('/users/:id', { id: '123' }); // OK
router.build('/users/:id', {}); // Error: missing 'id'
router.build('/users/:id', { id: '123', foo: 'bar' }); // Error: excess property
```

### Route Patterns

| Pattern | Example Match | Params |
|---------|--------------|--------|
| `/users` | `/users` | `{}` |
| `/users/:id` | `/users/123` | `{ id: '123' }` |
| `/users/:id?` | `/users` or `/users/123` | `{ id?: '123' }` |
| `/docs/*path` | `/docs/a/b/c` | `{ path: 'a/b/c' }` |

### Query String Utilities

```typescript
import { parseQuery, stringifyQuery } from 'navigonia/query';

// Parse
parseQuery('?foo=bar&arr=1&arr=2');
// { foo: 'bar', arr: ['1', '2'] }

// Stringify
stringifyQuery({ foo: 'bar', arr: ['1', '2'] });
// 'foo=bar&arr=1&arr=2'
```

### File-System Route Discovery

Automatically discover routes from a directory structure (like Next.js/SvelteKit):

```typescript
import { discoverRoutes } from 'navigonia/discover';

const routes = await discoverRoutes('./pages');
```

#### Conventions

| File | Route |
|------|-------|
| `index.html` | `/` |
| `users.html` | `/users` |
| `users/index.html` | `/users` |
| `users/[id].html` | `/users/:id` |
| `docs/[...slug].html` | `/docs/*slug` |
| `_layout.html` | Layout (not a route) |

Files starting with `_` or `.` are ignored.

```typescript
const routes = await discoverRoutes('./pages', {
  extensions: ['.html', '.tsx', '.jsx'], // default
  ignore: ['.*'], // default
});

// Result:
// {
//   '/': { page: '/abs/path/pages/index.html' },
//   '/users/:id': { page: '/abs/path/pages/users/[id].html', layout: '/abs/path/pages/_layout.html' },
// }
```

## API

### `createRouter(routes)`

Create a router instance.

- `routes` - Object mapping patterns to route config
- Returns `Router` with `match()`, `build()`, and `routes` properties

### `router.match(pathname)`

Match a pathname against routes.

- Returns `{ route, params, chain, pathname }` or `null`

### `router.build(pattern, params, query?)`

Build a URL from pattern and params.

- `pattern` - Route pattern (type-checked against defined routes)
- `params` - Parameter values (type-checked against pattern)
- `query` - Optional query parameters

### `parseQuery(query)`

Parse a query string into an object.

### `stringifyQuery(params)`

Stringify an object into a query string.

### `discoverRoutes(dir, options?)`

Discover routes from a directory structure.

- `dir` - Directory to scan
- `options.extensions` - File extensions to include
- `options.ignore` - Patterns to ignore

## License

MIT
