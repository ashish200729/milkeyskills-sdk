# Project Summary

## Overview

`@milkeyskills/sdk` is a public TypeScript SDK that helps developers connect Milkey skills infrastructure into existing AI products without replacing their current model provider client.

Current package version: `0.1.4`

Core product idea:
- adapter-first
- provider-native
- thin SDK surface
- app remains in control of prompts, state, retries, and tool-loop orchestration

This package is not:
- a model abstraction layer
- an agent runtime
- a chat framework
- a Milkey backend implementation

## Core Exports

The main public exports are defined in `src/index.ts`:

- `createClient`
- `openai`
- `anthropic`
- `gemini`
- `aiSdk`
- public types
- typed error classes
- capability helpers from `src/capabilities.ts`

## Milkey Client

`src/client.ts` implements the typed Milkey HTTP client.

Key methods:
- `getMcpUrl()`
- `listTools()`
- `callTool()`
- `resolveSkill()`
- `getSkill()`
- `listSkillReferences()`
- `getSkillReference()`

Client config supports:
- `baseUrl`
- `apiKey`
- `timeoutMs`
- `headers`
- `userAgent`
- `fetch`

Built-in behavior:
- validates config
- handles timeouts
- preserves caller abort signals
- parses RFC 9457 problem responses
- throws typed SDK errors

## Canonical Tools

Milkey’s canonical tools are defined in `src/tooling.ts`:

- `resolve-skill`
- `get-skill`
- `get-skill-reference`

Provider-safe aliases:
- `milkey_resolve_skill`
- `milkey_get_skill`
- `milkey_get_skill_reference`

Canonical names remain the source of truth.

## Error Model

Defined in `src/errors.ts`:

- `MilkeyError`
- `MilkeyProblemError`
- `MilkeyResponseError`
- `MilkeyConfigError`
- `MilkeyTimeoutError`
- `MilkeyToolCallError`

These cover:
- invalid config
- backend problem responses
- generic HTTP failures
- request timeouts
- malformed provider tool arguments

## Capability Model

`src/capabilities.ts` introduces a shared provider capability table and mode resolver.

Public concepts:
- `AdapterMode = "auto" | "hosted" | "inline"`
- `ResolvedMode = "hosted" | "inline"`
- `getCapability(...)`
- `resolveMode(...)`
- `resolveRequestedMode(...)`

Purpose:
- expose best-path defaults
- keep `mode: "auto"` predictable and inspectable
- validate unsupported provider/mode combinations
- avoid hidden magic

## Provider Adapters

### OpenAI

Implemented in `src/openai.ts`.

Supported surfaces:
- `milkey.openai.chat.tools(...)`
- `milkey.openai.chat.messages(...)`
- `milkey.openai.responses.tools(...)`
- `milkey.openai.responses.outputs(...)`
- `milkey.openai.realtime.tools(...)`
- `resolveMode(...)` helpers for chat, responses, realtime

Best-path defaults:
- Chat: `inline`
- Responses: `hosted`
- Realtime: `hosted`

Important implementation details:
- hosted MCP config is generated in provider-native shape
- inline tool schemas are normalized for OpenAI strict mode
- tool-call arguments are validated before Milkey execution

### Anthropic

Implemented in `src/anthropic.ts`.

Supported surfaces:
- `milkey.anthropic.tools(...)`
- `milkey.anthropic.config(...)`
- `milkey.anthropic.messages(...)`
- `milkey.anthropic.resolveMode(...)`
- `milkey.anthropic.mcpBeta`

Best-path default:
- Messages API: `hosted`

Important implementation details:
- hosted config includes MCP server config
- `config(...)` includes the required Anthropic MCP beta helper
- inline tool results are converted into `tool_result` blocks

### Gemini

Implemented in `src/gemini.ts`.

Supported surfaces:
- top-level compatibility helpers:
  - `milkey.gemini.tools(...)`
  - `milkey.gemini.config(...)`
  - `milkey.gemini.parts(...)`
  - `milkey.gemini.extractFunctionCalls(...)`
  - `milkey.gemini.responseContent(...)`
  - `milkey.gemini.followUpContents(...)`
- provider-specific namespaces:
  - `milkey.gemini.generateContent.*`
  - `milkey.gemini.interactions.*`

Best-path defaults:
- `generateContent`: `inline`
- `interactions`: `hosted`

Important implementation details:
- official Google Gen AI SDK inline helper path is supported
- Gemini Interactions hosted MCP helper is supported
- hosted MCP uses provider-native `mcp_server` config with `headers`

### AI SDK

Implemented in `src/ai-sdk.ts`.

Supported surfaces:
- `milkey.aiSdk.tools(...)`
- `milkey.aiSdk.resolveMode(...)`
- `milkey.aiSdk.capabilities`

Best-path default:
- AI SDK: `inline`

Important implementation details:
- returns provider-native AI SDK tool objects
- keeps AI SDK support thin and inline-focused
- MCP client support is not currently advertised as a supported public path

## Current Supported Integration Paths

The SDK currently supports 9 public integration paths:

1. OpenAI Chat inline
2. OpenAI Chat hosted
3. OpenAI Responses inline
4. OpenAI Responses hosted
5. OpenAI Realtime hosted
6. Anthropic inline
7. Anthropic hosted
8. Gemini `generateContent` inline
9. Gemini Interactions hosted

AI SDK inline tools are also supported as a provider-native helper surface.

## Supported Modes

The SDK now supports additive `mode` selection where meaningful:
- `inline`
- `hosted`
- `auto`

`auto` chooses the best supported path for the exact provider/API variant.

Existing `delivery` options remain supported for backwards compatibility.

## Examples

Examples live under `examples/`.

Current examples:
- `openai-chat-completions.ts`
- `openai-chat-completions.mjs`
- `openai-inline-loop.ts`
- `openai-responses.ts`
- `anthropic-hosted.ts`
- `gemini-official-sdk.ts`
- `gemini-interactions-hosted.ts`
- `ai-sdk-inline.ts`

Examples use:
- environment variables
- bounded loops where needed
- provider-native request shapes
- no hardcoded secrets

## Tests

Tests live under `src/__tests__/`.

Coverage includes:
- client behavior
- tool name mapping
- OpenAI adapter behavior
- Anthropic adapter behavior
- Gemini adapter behavior
- capability/mode selection
- timeout/config errors
- malformed tool argument handling

Verification commands:

```bash
npm run check
npm run test
npm run build
npm run release:check
```

These all pass in the current repo state.

## Packaging and Release

Package metadata:
- name: `@milkeyskills/sdk`
- version: `0.1.4`
- runtime: Node `>=20`
- build output: `dist/`

Release flow:
- CI validates typecheck, tests, and build
- release automation uses `release-please`
- manual publishing remains possible when npm auth is configured locally

## Product Boundaries

What the SDK does:
- expose typed Milkey backend contracts
- map Milkey tools into provider-native formats
- provide helper functions for provider follow-up messages/results
- provide best-path mode defaults

What the SDK does not do:
- own prompts
- own memory
- own model routing
- own full conversation runtime
- reimplement Milkey backend logic

This boundary is intentional and should be preserved in future work.

## Recommended Next Docs

The best docs to build from this state are:
- provider support matrix
- inline vs hosted guide
- provider quick starts
- enterprise integration guide
- troubleshooting guide

## Key Takeaway

This SDK is now a stronger adapter-first integration layer:
- easier setup
- clearer defaults
- better provider compatibility
- stronger typing
- still thin and provider-native
