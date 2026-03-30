import { access } from "node:fs/promises";
import OpenAI from "openai";

const sdkEntry = new URL("./dist/index.js", import.meta.url);
await access(sdkEntry).catch(() => {
  throw new Error("Build the SDK first with `npm run build` before running node test.mjs.");
});

const { milkey } = await import(sdkEntry.href);

const openAiApiKey = requireEnv("OPENAI_API_KEY");
const milkeyApiKey = requireEnv("MILKEY_API_KEY");
const milkeyBaseUrl = requireEnv("MILKEY_BASE_URL");

const openai = new OpenAI({
  apiKey: openAiApiKey,
  baseURL: process.env.OPENAI_BASE_URL ?? "https://opencode.ai/zen/v1",
  timeout: numberFromEnv("OPENAI_TIMEOUT_MS", 30_000),
  maxRetries: numberFromEnv("OPENAI_MAX_RETRIES", 0),
});

const milkeyClient = milkey.createClient({
  baseUrl: milkeyBaseUrl,
  apiKey: milkeyApiKey,
  timeoutMs: numberFromEnv("MILKEY_TIMEOUT_MS", 15_000),
});

const model = process.env.OPENAI_MODEL ?? "minimax-m2.5-free";
const maxTurns = numberFromEnv("MAX_TOOL_TURNS", 4);
const prompt =
  process.env.TEST_PROMPT ??
  "Find the best Milkey skill for PostgreSQL query optimization.";

const tools = milkey.openai.chat.tools({
  client: milkeyClient,
});

const messages = [
  {
    role: "user",
    content: prompt,
  },
];

try {
  const finalMessage = await runToolLoop({
    openai,
    milkeyClient,
    model,
    tools,
    messages,
    maxTurns,
  });

  console.log(finalMessage.content ?? "");
} catch (error) {
  console.error(formatError(error));
  process.exitCode = 1;
}

async function runToolLoop({
  openai,
  milkeyClient,
  model,
  tools,
  messages,
  maxTurns,
}) {
  const transcript = [...messages];

  for (let turn = 1; turn <= maxTurns; turn += 1) {
    const completion = await openai.chat.completions.create({
      model,
      messages: transcript,
      tools,
      tool_choice: "auto",
    });

    const assistantMessage = completion.choices[0]?.message;
    if (!assistantMessage) {
      throw new Error(`No assistant message returned on turn ${turn}.`);
    }

    transcript.push(toAssistantMessage(assistantMessage));

    if (!assistantMessage.tool_calls?.length) {
      return assistantMessage;
    }

    const toolMessages = await milkey.openai.chat.messages(
      assistantMessage,
      milkeyClient,
    );

    for (const toolMessage of toolMessages) {
      transcript.push({
        role: "tool",
        tool_call_id: toolMessage.tool_call_id,
        content: toolMessage.content,
      });
    }
  }

  throw new Error(
    `Model did not finish within ${maxTurns} tool turns. The conversation kept requesting tools.`,
  );
}

function toAssistantMessage(message) {
  return {
    role: "assistant",
    content: message.content ?? "",
    tool_calls: message.tool_calls?.map((toolCall) => ({
      id: toolCall.id,
      type: "function",
      function: {
        name: toolCall.function.name,
        arguments: toolCall.function.arguments,
      },
    })),
  };
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Export it before running node test.mjs.`,
    );
  }
  return value;
}

function numberFromEnv(name, fallback) {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number. Received: ${value}`);
  }
  return parsed;
}

function formatError(error) {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}
