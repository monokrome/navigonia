# navigonia

Type-safe, zero-dependency, universal router with compile-time parameter inference. Part of the [gonia](https://github.com/monokrome/gonia) ecosystem.

Works everywhere: Node, browsers, Deno, edge runtimes. No framework lock-in.

## Install

```bash
pnpm add navigonia
```

## Quick Start

```typescript
import { createRouter } from 'navigonia'

const router = createRouter({
  '/': { page: 'home' },
  '/users': { page: 'users' },
  '/users/:id': { page: 'user-detail' },
  '/docs/*path': { page: 'docs' },
})

const match = router.match('/users/123')
// { route: { page: 'user-detail' }, params: { id: '123' }, chain: [...], pathname: '/users/123' }

const url = router.build('/users/:id', { id: '456' })
// '/users/456'

const urlWithQuery = router.build('/users/:id', { id: '456' }, { tab: 'posts' })
// '/users/456?tab=posts'
```

## Route Patterns

Four pattern types cover all routing needs:

| Pattern | Matches | Params |
|---|---|---|
| `/users` | Exact path | `{}` |
| `/users/:id` | Single dynamic segment | `{ id: string }` |
| `/users/:id?` | Optional dynamic segment | `{ id?: string }` |
| `/docs/*path` | Wildcard catch-all | `{ path: string }` |

Patterns compose freely:

```typescript
'/users/:userId/posts/:postId'        // multiple params
'/api/:version/docs/*path'            // param + wildcard
'/files/:category/:name?'             // required + optional
```

## Type Safety

Route parameters are inferred at compile time from pattern strings using TypeScript template literal types. No codegen, no runtime overhead.

```typescript
const router = createRouter({
  '/users/:id': { page: 'user' },
  '/posts/:postId/comments/:commentId': { page: 'comment' },
})

router.build('/users/:id', { id: '123' })           // OK
router.build('/users/:id', {})                       // Error: missing 'id'
router.build('/users/:id', { id: '1', foo: 'bar' }) // Error: excess property 'foo'
```

### Extracting Param Types

Use `InferParams` to extract the parameter type for a given pattern:

```typescript
import type { InferParams } from 'navigonia'

type UserParams = InferParams<typeof router, '/users/:id'>
// { id: string }

type CommentParams = InferParams<typeof router, '/posts/:postId/comments/:commentId'>
// { postId: string; commentId: string }
```

The underlying `ExtractParams` utility type works on any pattern string:

```typescript
import type { ExtractParams } from 'navigonia'

type Params = ExtractParams<'/users/:id/files/*path'>
// { id: string; path: string }
```

## Nested Routes

Routes can declare children. Child patterns are prepended with the parent pattern automatically.

```typescript
const router = createRouter({
  '/app': {
    layout: 'app-shell',
    children: {
      '/': { page: 'dashboard' },
      '/settings': { page: 'settings' },
      '/users/:id': { page: 'user-detail' },
    },
  },
})
```

Matching a nested route returns the full hierarchy in `chain`:

```typescript
const result = router.match('/app/settings')
// result.route  → { page: 'settings' }
// result.chain  → [
//   { layout: 'app-shell', children: { ... } },
//   { page: 'settings' }
// ]
```

The chain enables layout composition: walk the chain from root to leaf to build up nested layouts, middleware, or breadcrumbs.

## Route Matching

### Specificity

Routes are sorted by specificity when the router is created. Matching returns the first (most specific) match:

1. **Static routes** match before parametric routes
2. **Fewer parameters** match before more parameters
3. **More segments** match before fewer (at equal param count)
4. **Wildcard routes** match last

```typescript
const router = createRouter({
  '/docs/*path': { page: 'docs-catchall' },
  '/docs/:id': { page: 'docs-single' },
  '/docs': { page: 'docs-index' },
  '/docs/search': { page: 'docs-search' },
})

router.match('/docs')?.route           // { page: 'docs-index' }       — static
router.match('/docs/search')?.route    // { page: 'docs-search' }      — static, more segments
router.match('/docs/abc')?.route       // { page: 'docs-single' }      — parametric
router.match('/docs/a/b/c')?.route     // { page: 'docs-catchall' }    — wildcard, last resort
```

### Trailing Slashes

Trailing slashes are normalized away (except for root `/`). `/users/` matches the same routes as `/users`.

### No Match

`router.match()` returns `null` when no route matches.

## Query Strings

Separate subpath export for query string parsing and serialization:

```typescript
import { parseQuery, stringifyQuery } from 'navigonia/query'
```

### Parsing

```typescript
parseQuery('?foo=bar&baz=1')
// { foo: 'bar', baz: '1' }

parseQuery('?arr=1&arr=2&arr=3')
// { arr: ['1', '2', '3'] }

parseQuery('?key=hello%20world')
// { key: 'hello world' }

parseQuery('?flag')
// { flag: '' }
```

Repeated keys are automatically collected into arrays. URI-encoded values are decoded.

### Serializing

```typescript
stringifyQuery({ foo: 'bar', arr: ['1', '2'] })
// 'foo=bar&arr=1&arr=2'

stringifyQuery({ q: 'hello world' })
// 'q=hello%20world'
```

Parse and stringify are roundtrip-safe.

### With Router

Query strings integrate with `router.build()`:

```typescript
router.build('/users/:id', { id: '42' }, { tab: 'posts', sort: 'date' })
// '/users/42?tab=posts&sort=date'
```

## Filesystem Route Discovery

Automatically discover routes from a directory structure, following conventions similar to Next.js and SvelteKit:

```typescript
import { discoverRoutes } from 'navigonia/discover'

const routes = await discoverRoutes('./pages')
```

### Conventions

| File | Route |
|---|---|
| `index.html` | `/` |
| `about.html` | `/about` |
| `users/index.html` | `/users` |
| `users/[id].html` | `/users/:id` |
| `docs/[...slug].html` | `/docs/*slug` |
| `_layout.html` | Layout (not a route) |

Files starting with `_` or `.` are excluded from routes.

### Layouts

Layout files (`_layout.*`) are not routes themselves. They are resolved by proximity: each route is assigned the nearest `_layout` file in its directory ancestry.

```
pages/
  _layout.html           ← root layout
  index.html              → /          (layout: _layout.html)
  about.html              → /about     (layout: _layout.html)
  docs/
    _layout.html          ← docs layout
    index.html            → /docs      (layout: docs/_layout.html)
    [slug].html           → /docs/:slug (layout: docs/_layout.html)
```

### Options

```typescript
const routes = await discoverRoutes('./pages', {
  extensions: ['.html', '.tsx', '.jsx'],  // file types to include (default)
  ignore: ['.*'],                          // patterns to skip (default)
})
```

### Output

Returns a flat map of patterns to discovered route objects:

```typescript
{
  '/': { page: '/abs/path/pages/index.html', layout: '/abs/path/pages/_layout.html' },
  '/docs/:slug': { page: '/abs/path/pages/docs/[slug].html', layout: '/abs/path/pages/docs/_layout.html' },
}
```

Feed this directly into `createRouter()` or use it to drive your own route registration.

## Gonia Integration

Navigonia is designed to work with the gonia SSR framework, but has no dependency on it. Use it standalone or as part of the full stack:

```typescript
import { render } from 'gonia/server'
import { createRouter } from 'navigonia'

const router = createRouter({
  '/': { template: 'home.html' },
  '/users/:id': { template: 'user.html' },
})

function handleRequest(url: string) {
  const match = router.match(url)

  if (!match) {
    return render('404.html', { state: {} })
  }

  return render(match.route.template, {
    state: { params: match.params },
  })
}
```

## API Reference

### `createRouter(routes): Router`

Create a router from a route definition map.

```typescript
function createRouter<T extends RouteDefinition>(routes: T): Router<T>
```

The `routes` object maps pattern strings to arbitrary config objects. Navigonia doesn't prescribe what goes in the config -- attach whatever metadata your application needs (`page`, `layout`, `middleware`, `auth`, etc).

### `Router.match(pathname): MatchResult | null`

Match a pathname against all defined routes.

```typescript
interface MatchResult<T, P = Record<string, string>> {
  route: T           // The matched route config
  params: P          // Extracted parameter values
  chain: T[]         // Full hierarchy (for nested routes)
  pathname: string   // The matched pathname
}
```

### `Router.build(pattern, params, query?): string`

Build a URL from a pattern and parameters. Both `pattern` and `params` are type-checked at compile time.

Throws if a required parameter is missing at runtime.

### `Router.routes: ParsedRoute[]`

Read-only access to parsed routes for debugging or introspection.

### `parseQuery(query): QueryParams`

Parse a query string into `Record<string, string | string[]>`. Handles leading `?`, URI decoding, and repeated keys.

```typescript
import { parseQuery } from 'navigonia/query'
```

### `stringifyQuery(params): string`

Serialize `Record<string, string | string[]>` into a query string. Handles URI encoding and array expansion.

```typescript
import { stringifyQuery } from 'navigonia/query'
```

### `discoverRoutes(dir, options?): Promise<Record<string, DiscoveredRoute>>`

Walk a directory tree and produce a route map using filesystem conventions.

```typescript
import { discoverRoutes } from 'navigonia/discover'

interface DiscoverOptions {
  extensions?: string[]  // default: ['.html', '.tsx', '.jsx']
  ignore?: string[]      // default: ['.*']
}

interface DiscoveredRoute {
  page: string
  layout?: string
}
```

### Type Utilities

```typescript
import type { ExtractParams, InferParams, RouteConfig, RouteDefinition, MatchResult } from 'navigonia'
```

| Type | Purpose |
|---|---|
| `ExtractParams<Pattern>` | Infer param types from any pattern string |
| `InferParams<Router, Pattern>` | Infer param types for a pattern within a specific router |
| `RouteConfig` | Base route config interface (`Record<string, unknown>`) |
| `RouteDefinition` | Map of patterns to configs |
| `MatchResult<T, P>` | Shape returned by `router.match()` |

## Module Structure

Navigonia ships three independent entry points:

| Import | Purpose | Environment |
|---|---|---|
| `navigonia` | Router core (create, match, build) | Universal |
| `navigonia/query` | Query string parse/stringify | Universal |
| `navigonia/discover` | Filesystem route discovery | Node.js |

The core and query modules have zero Node.js dependencies and run anywhere. The discover module uses `node:fs` and is intended for build-time or server-side use.

## Development

```bash
pnpm install
pnpm test          # run tests
pnpm test:watch    # watch mode
pnpm build         # compile to dist/
pnpm typecheck     # type-check without emit
```

## License

MIT
