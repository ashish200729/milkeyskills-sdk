# `@milkeyskills/sdk`

Milkey Skills SDK helps teams connect Milkey skills infrastructure into existing AI products and agent workflows.

Use it when you want to:

- plug Milkey skills into existing OpenAI-compatible clients
- add reusable skill execution to Anthropic, Gemini, or other AI stacks
- keep your model provider client while adding Milkey-managed skills as tools

## Install

```bash
npm install @milkeyskills/sdk
```

If your app already uses the OpenAI SDK:

```bash
npm install @milkeyskills/sdk openai
```

## Quick Start

```ts
import OpenAI from "openai";
import { milkey } from "@milkeyskills/sdk";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const milkeyClient = milkey.createClient({
  baseUrl: process.env.MILKEY_BASE_URL!,
  apiKey: process.env.MILKEY_API_KEY!,
});

const tools = milkey.openai.chat.tools({
  client: milkeyClient,
});

const messages = [
  {
    role: "user",
    content: "Find the best Milkey skill for PostgreSQL query optimization.",
  },
];

const first = await openai.chat.completions.create({
  model: "gpt-5",
  messages,
  tools,
});

const assistant = first.choices[0]?.message;
if (!assistant) {
  throw new Error("No assistant message returned.");
}

messages.push({
  role: "assistant",
  content: assistant.content ?? "",
  tool_calls: assistant.tool_calls?.map((toolCall) => ({
    id: toolCall.id,
    type: "function",
    function: {
      name: toolCall.function.name,
      arguments: toolCall.function.arguments,
    },
  })),
});

if (assistant.tool_calls?.length) {
  const toolMessages = await milkey.openai.chat.messages(assistant, milkeyClient);
  for (const toolMessage of toolMessages) {
    messages.push(toolMessage);
  }

  const second = await openai.chat.completions.create({
    model: "gpt-5",
    messages,
    tools,
  });

  console.log(second.choices[0]?.message?.content ?? "");
} else {
  console.log(assistant.content ?? "");
}
```

For production use, keep iterating until the model stops returning `tool_calls` and enforce a max turn count or request timeout. See the OpenAI chat completion examples for a bounded loop.

## Supported Integrations

- OpenAI-compatible chat completions
- OpenAI responses and realtime-style hosted tool delivery
- Anthropic inline and hosted MCP integrations
- Gemini function-calling integrations, Gemini Interactions hosted MCP helpers, and helpers for the official Google Gen AI SDK
- AI SDK native inline tool helpers

Hosted remote MCP delivery is currently best supported through OpenAI Responses, Anthropic, and Gemini Interactions. OpenAI Chat, Gemini generateContent, and AI SDK default to inline tools for portability and predictability.

## Provider Matrix

| Provider | API Variant | `mode: "auto"` | Supported Modes | Recommended Helper |
| --- | --- | --- | --- | --- |
| OpenAI | Chat Completions | `inline` | `inline`, `hosted` | `milkey.openai.chat.tools(...)` |
| OpenAI | Responses API | `hosted` | `inline`, `hosted` | `milkey.openai.responses.tools(...)` |
| OpenAI | Realtime | `hosted` | `hosted` | `milkey.openai.realtime.tools(...)` |
| Anthropic | Messages API | `hosted` | `inline`, `hosted` | `milkey.anthropic.config(...)` |
| Gemini | `generateContent` | `inline` | `inline` | `milkey.gemini.config(...)` |
| Gemini | Interactions API | `hosted` | `hosted` | `milkey.gemini.interactions.config(...)` |
| AI SDK | Inline tools | `inline` | `inline` | `milkey.aiSdk.tools(...)` |

## Migration Notes

- Existing `delivery` options continue to work.
- New `mode` options are additive and support `inline`, `hosted`, and `auto` where meaningful.
- `mode: "auto"` now resolves to the best-path adapter mode for that exact provider/API variant.
- OpenAI inline tool schemas now normalize optional properties for `strict: true` compatibility.
- Anthropic hosted users can prefer `milkey.anthropic.config(...)` to get the required MCP beta automatically.
- Gemini users now have two documented paths:
  - `milkey.gemini.config(...)` for `generateContent` inline function calling
  - `milkey.gemini.interactions.config(...)` for hosted MCP on the Interactions API
- AI SDK users now have two paths:
  - `milkey.aiSdk.tools(...)` for inline tools

## Versioning

This package follows Semantic Versioning.

- `0.1.0` = first public release
- `0.1.1` = bug fixes
- `0.2.0` = backward-compatible feature updates
- `1.0.0` = stable major release

Update to the latest version with:

```bash
npm update @milkeyskills/sdk
```

Pin a specific version with:

```bash
npm install @milkeyskills/sdk@0.1.4
```

## Verify Availability

Check that the package is live on npm:

```bash
npm view @milkeyskills/sdk --registry=https://registry.npmjs.org
```

Install it into a project:

```bash
npm install @milkeyskills/sdk
```

Verify the package resolves locally:

```ts
import { milkey } from "@milkeyskills/sdk";

console.log(typeof milkey.createClient);
```

If that prints `"function"`, the SDK is installed correctly.
