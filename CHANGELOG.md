# Changelog

All notable changes to `@milkeyskills/sdk` will be documented in this file.

The format is based on Keep a Changelog and the project follows Semantic Versioning.

## [0.1.5](https://github.com/ashish200729/milkeyskills-sdk/compare/v0.1.4...v0.1.5) (2026-03-31)


### Features

* add provider best-path adapter modes ([3d748d5](https://github.com/ashish200729/milkeyskills-sdk/commit/3d748d566584a04fd857a548f378131137c7a1ab))


### Bug Fixes

* harden sdk tool execution and release flow ([2412404](https://github.com/ashish200729/milkeyskills-sdk/commit/24124041ef7b43402b5ce69ea95575112952a9ad))

## [0.1.4] - 2026-03-31

### Added
- internal provider capability metadata and best-path mode resolution
- additive `mode` support for provider adapters where `auto`, `inline`, and `hosted` are meaningful
- Gemini official SDK helpers for `generateContent` and hosted MCP helpers for the Interactions API
- Anthropic hosted request config helper with MCP beta support
- additional provider examples and adapter coverage

### Changed
- improved OpenAI strict-schema compatibility for inline tool definitions
- expanded README with a provider support matrix and migration notes

## [0.1.3](https://github.com/ashish200729/milkeyskills-sdk/compare/v0.1.2...v0.1.3) (2026-03-30)


### Bug Fixes

* harden sdk tool execution and release flow ([2412404](https://github.com/ashish200729/milkeyskills-sdk/commit/24124041ef7b43402b5ce69ea95575112952a9ad))

## [0.1.2] - 2026-03-30

### Changed
- Pointed package metadata at the dedicated `ashish200729/milkeyskills-sdk` repository
- Added standalone GitHub Actions CI and release automation for the dedicated SDK repo
- Added maintainer documentation for the automated release flow

## [0.1.1] - 2026-03-30

### Changed
- Reworked the public README for the npm package page
- Removed internal backend-oriented release and test details from the published package README
- Tightened package metadata and publish readiness for public distribution

## [0.1.0] - 2026-03-30

### Added
- Initial public release of `@milkeyskills/sdk`
- Typed Milkey API client for `/v1/tools`, `/v1/tools/call`, `/v1/skill-resolutions`, and `/v1/skills/*`
- OpenAI adapters for chat completions, responses, and realtime-style hosted tool configuration
- Anthropic, Gemini, and AI SDK adapters
- Provider-safe Milkey tool aliases for inline tool execution
- Example scripts for OpenAI-compatible integrations
- Release validation scripts for public npm publication
