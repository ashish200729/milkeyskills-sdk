# Changelog

All notable changes to `@milkeyskills/sdk` will be documented in this file.

The format is based on Keep a Changelog and the project follows Semantic Versioning.

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
