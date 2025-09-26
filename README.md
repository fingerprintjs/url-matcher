<p align="center">
  <a href="https://fingerprint.com">
    <picture>
     <source media="(prefers-color-scheme: dark)" srcset="https://fingerprintjs.github.io/home/resources/logo_light.svg" />
     <source media="(prefers-color-scheme: light)" srcset="https://fingerprintjs.github.io/home/resources/logo_dark.svg" />
     <img src="https://fingerprintjs.github.io/home/resources/logo_dark.svg" alt="Fingerprint logo" width="312px" />
   </picture>
  </a>
</p>
<p align="center">
  <a href="https://github.com/fingerprintjs/url-matcher/actions/workflows/build.yml"><img src="https://github.com/fingerprintjs/url-matcher/actions/workflows/build.yml/badge.svg" alt="Build status"></a>
  <a href="https://fingerprintjs.github.io/url-matcher/coverage/"><img src="https://fingerprintjs.github.io/url-matcher/coverage/badges.svg" alt="coverage"></a>
  <a href="https://github.com/fingerprintjs/url-matcher/actions/workflows/release.yml"><img src="https://github.com/fingerprintjs/url-matcher/actions/workflows/release.yml/badge.svg" alt="Release status"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/:license-mit-blue.svg" alt="MIT license"></a>
  <a href="https://discord.gg/39EpE2neBg"><img src="https://img.shields.io/discord/852099967190433792?style=logo&label=Discord&logo=Discord&logoColor=white" alt="Discord server"></a>
  <a href="https://fingerprintjs.github.io/url-matcher/docs/"><img src="https://img.shields.io/badge/-Documentation-green" alt="Documentation"></a>
</p>

> ⚠️ **Work in progress**: This is a beta version of the library.

URL matching library that is equivalent to the matching behavior Cloudflare uses
for [worker routes](https://developers.cloudflare.com/workers/configuration/routing/routes/#matching-behavior).
It's designed to work both in browser and in Node.js.

> **Note**: This repository isn’t part of our core product. It’s kindly shared “as-is” without any guaranteed level of support from Fingerprint. We warmly welcome community contributions.

## Installation

Using [npm](https://npmjs.org):

```sh
npm install @fingerprintjs/url-matcher
```

Using [yarn](https://yarnpkg.com):

```sh
yarn add @fingerprintjs/url-matcher
```

Using [pnpm](https://pnpm.js.org):

```sh
pnpm add @fingerprintjs/url-matcher
```

## Usage

### Basic Pattern Matching

The simplest way to use the library is with the `matchesPatterns` function, which takes an array of URL patterns and
checks if a given URL matches any of them:

```typescript
import {matchesPatterns} from '@fingerprintjs/url-matcher'

const patterns = [
    'example.com/api/*',
    '*.example.com/users/*',
    'https://app.example.com/dashboard'
]

const url = new URL('https://api.example.com/users/123')

if (matchesPatterns(url, patterns)) {
    console.log('URL matches one of the patterns!')
}
```

### Advanced Route Matching

For more control, use `parseRoutes` and `findMatchingRoute` to work with parsed route objects:

```typescript
import {parseRoutes, findMatchingRoute} from '@fingerprintjs/url-matcher'

const routes = parseRoutes([
    'example.com/api/*',
    '*.example.com/users/*',
    'https://app.example.com/dashboard'
])

const url = new URL('https://api.example.com/users/123')
const matchedRoute = findMatchingRoute(url, routes)

if (matchedRoute) {
    console.log(`Matched route: ${matchedRoute.route}`)
    console.log(`Hostname: ${matchedRoute.hostname}`)
    console.log(`Path: ${matchedRoute.path}`)
}
```

### Working with Route Metadata

You can associate metadata with routes for easier handling of the matched route:

```typescript
import {parseRoutes, findMatchingRoute, RouteWithMetadata} from '@fingerprintjs/url-matcher'

// Include metadata that contains a specific route type that we need to match.
const routesWithTypes: RouteWithMetadata<{
    type: 'public' | 'admin' | 'api'
}>[] = [
    {url: 'example.com/api/*', metadata: {type: 'api'}},
    {url: 'example.com/admin/*', metadata: {type: 'admin'}},
    {url: 'example.com/*', metadata: {type: 'public'}}
]

const routes = parseRoutes(routesWithTypes)
const url = new URL('https://example.com/api/users')
const matchedRoute = findMatchingRoute(url, routes)

// matchedRoute.metadata is of type {type: 'api'} | {type: 'admin'} | {type: 'public'}
switch (matchedRoute?.metadata?.type) {
    case 'api':
        console.log('Handle API request')
        break
    case 'admin':
        console.log('Handle admin request')
        break
    case 'public':
        console.log('Handle public request')
        break
}
```

### Sorting by Specificity

Routes can be sorted by specificity to ensure more specific patterns are matched first:

```typescript
import {parseRoutes, findMatchingRoute} from '@fingerprintjs/url-matcher'

const routes = parseRoutes([
    'example.com/*',           // Less specific
    'example.com/api/*',       // More specific
    'example.com/api/users'    // Most specific
], {sortBySpecificity: true})

const url = new URL('https://example.com/api/users')
const matchedRoute = findMatchingRoute(url, routes)

// Will match the most specific route: 'example.com/api/users'
console.log(matchedRoute?.route)
```

### Wildcard Patterns

The library supports Cloudflare-style wildcards:

- **Hostname wildcards**: Use `*` as a subdomain prefix
  ```typescript
  '*.example.com'     // Matches sub.example.com, api.example.com, etc.
  '*'                 // Matches any hostname
  ```

- **Path wildcards**: Use `*` as a path suffix
  ```typescript
  'example.com/api/*'    // Matches /api/users, /api/posts/123, etc.
  'example.com/*'        // Matches any path on example.com
  ```

> ⚠️ Infix wildcards are not supported. Passing them will throw an `InvalidPatternError`

### Protocol Matching

Specify protocols explicitly or let routes match any protocol:

```typescript
const routes = parseRoutes([
  'https://secure.example.com/*',  // Only HTTPS
  'http://legacy.example.com/*',   // Only HTTP
  'example.com/*'                  // Any protocol (HTTP or HTTPS)
])
```
> 💡 Only HTTP and HTTPS protocols are supported.

### Error Handling

The library validates URLs and patterns, throwing specific errors for invalid inputs:

```typescript
import {matchesPatterns, InvalidProtocolError, InvalidPatternError} from '@fingerprintjs/url-matcher'

try {
    const url = new URL('ftp://example.com')  // Invalid protocol
    matchesPatterns(url, ['example.com'])
} catch (error) {
    if (error instanceof InvalidProtocolError) {
        console.log('Only HTTP and HTTPS protocols are supported')
    }
}

try {
    // Invalid pattern with query string
    matchesPatterns(new URL('https://example.com'), ['example.com/path?query=value'])
} catch (error) {
    if (error instanceof InvalidPatternError) {
        console.log(error.code) // ERR_QUERY_STRING
        console.log('Query strings are not allowed in patterns')
    }
}

try {
    // Invalid pattern with infix wildcard
    matchesPatterns(new URL('https://example.com'), ['example.com/*/path'])
} catch (error) {
    if (error instanceof InvalidPatternError) {
        console.log(error.code) // ERR_INFIX_WILDCARD
        console.log('Infix wildcards are not allowed in patterns')
    }
}

try {
    // Invalid pattern URL
    matchesPatterns(new URL('https://example.com'), ['exa mple.com/*/path'])
} catch (error) {
    if (error instanceof InvalidPatternError) {
        console.log(error.code) // ERR_INVALID_URL
        console.log('Patterns must be valid URLs')
    }
}
```

## API Reference

See the full [generated API reference](https://fingerprintjs.github.io/url-matcher/).