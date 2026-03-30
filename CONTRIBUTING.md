# Contributing

## Development

```bash
npm install
npm run check
npm run test
npm run build
```

## Release Flow

This repository uses `release-please` for automated versioning and changelog management.

### Maintainer workflow

1. Push changes to `main`.
2. GitHub Actions updates or opens a release PR with the next version and changelog.
3. Merge the release PR.
4. GitHub Actions publishes the new version to npm.

### Commit guidance

Use clear commit messages. Conventional commits are recommended because they improve release note quality:

- `feat: add new provider adapter`
- `fix: handle problem responses correctly`
- `docs: improve quick start`

## Required one-time setup

For automated npm publishing, configure one of these:

- npm trusted publishing for this GitHub repository, or
- an `NPM_TOKEN` repository secret with publish access

The release workflow is set up to support either approach. Keep the publish job on a Node.js version that matches npm's current trusted publishing requirements.
