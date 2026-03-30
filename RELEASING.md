# Releasing

This repository is the source of truth for `@milkeyskills/sdk`.

## Before publishing

Always publish from this repository, not from the old monorepo copy.

Check the current version:

```bash
cat package.json | grep '"version"'
```

Check the latest version on npm:

```bash
npm run release:status
```

Verify the package before publishing:

```bash
npm install
npm run release:check
```

## Local publish

Publish the current version:

```bash
npm publish --access public
```

If npm asks for 2FA, publish with your current OTP:

```bash
npm publish --access public --otp=YOUR_6_DIGIT_CODE
```

## Version bumps

Patch release:

```bash
npm version patch --no-git-tag-version
```

Minor release:

```bash
npm version minor --no-git-tag-version
```

Major release:

```bash
npm version major --no-git-tag-version
```

After bumping:

1. update `CHANGELOG.md`
2. run `npm run release:check`
3. commit the changes
4. create a matching git tag
5. push `main` and the tag
6. publish to npm

## GitHub automation

This repository includes:

- `CI` workflow for typecheck, tests, and build
- `Release` workflow for automated versioning and npm publishing

For automated npm publishing, configure one of these in the GitHub repo:

- `NPM_TOKEN` secret with publish access
- npm trusted publishing for this repository

Trusted publishing support changes over time. Keep the publish job on a Node.js version that satisfies npm's current trusted publishing requirements. The workflow in this repo uses Node 22 for the publish job for that reason.

Without one of those, GitHub can run CI and prepare releases, but it cannot publish to npm.
