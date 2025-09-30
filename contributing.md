# Contributing to URL Matcher.

## Working with code

We prefer using [pnpm](https://pnpm.io/) for installing dependencies and running scripts.

The main branch is locked for the push action. For proposing changes, use the standard [pull request approach](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request). It's recommended to discuss fixes or new functionality in the Issues, first.

### How to build

Just run:

```shell 
pnpm build
```

### Code style

The code style is controlled by [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/). Run to check that the code style is ok:

```shell
pnpm lint
```

You aren't required to run the check manually, the CI will do it. Run the following command to fix style issues (not all issues can be fixed automatically):

```shell
pnpm lint:fix
```

### How to test

Tests are located in `__tests__` folder and run by [jest](https://jestjs.io/) in both [jsdom](https://github.com/jsdom/jsdom) and Node.js environments.

To run tests you can use IDE instruments or just run:

```shell
pnpm test
```

To check the distributive TypeScript declarations, build the project and run:

```shell
pnpm test:dts
```

### How to publish

The library is automatically released and published to NPM on every push to the main branch if there are relevant changes using [semantic-release](https://github.com/semantic-release/semantic-release) with following plugins:

- [@semantic-release/commit-analyzer](https://github.com/semantic-release/commit-analyzer)
- [@semantic-release/release-notes-generator](https://github.com/semantic-release/release-notes-generator)
- [@semantic-release/changelog](https://github.com/semantic-release/changelog)
- [@semantic-release/npm](https://github.com/semantic-release/npm)
- [@semantic-release/github](https://github.com/semantic-release/github)

The workflow must be approved by one of the maintainers, first.