import OpenAI from "openai";
import { milkey } from "../src/index.js";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

function numberFromEnv(name: string, fallback: number): number {
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

const openai = new OpenAI({
  apiKey: requireEnv("OPENAI_API_KEY"),
  baseURL: process.env.OPENAI_BASE_URL ?? "https://opencode.ai/zen/v1",
  timeout: numberFromEnv("OPENAI_TIMEOUT_MS", 30_000),
  maxRetries: numberFromEnv("OPENAI_MAX_RETRIES", 0),
});

const milkeyClient = milkey.createClient({
  baseUrl: requireEnv("MILKEY_BASE_URL"),
  apiKey: requireEnv("MILKEY_API_KEY"),
  timeoutMs: numberFromEnv("MILKEY_TIMEOUT_MS", 15_000),
});

const model = process.env.OPENAI_MODEL ?? "minimax-m2.5-free";
const maxTurns = numberFromEnv("MAX_TOOL_TURNS", 4);

const tools = milkey.openai.chat.tools({
  client: milkeyClient,
});

const messages: Array<{
  role: "user" | "assistant" | "tool";
  content?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}> = [
  {
    role: "user",
    content: "Find the best Milkey skill for PostgreSQL query optimization.",
  },
];

const finalMessage = await runToolLoop({
  openai,
  milkeyClient,
  model,
  tools,
  messages,
  maxTurns,
});

console.log(finalMessage.content ?? "");

async function runToolLoop({
  openai,
  milkeyClient,
  model,
  tools,
  messages,
  maxTurns,
}: {
  openai: OpenAI;
  milkeyClient: Parameters<typeof milkey.openai.chat.tools>[0]["client"];
  model: string;
  tools: ReturnType<typeof milkey.openai.chat.tools>;
  messages: Array<{
    role: "user" | "assistant" | "tool";
    content?: string;
    tool_calls?: Array<{
      id: string;
      type: "function";
      function: { name: string; arguments: string };
    }>;
    tool_call_id?: string;
  }>;
  maxTurns: number;
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

    transcript.push({
      role: "assistant",
      content: assistantMessage.content ?? "",
      tool_calls: assistantMessage.tool_calls?.map((toolCall) => ({
        id: toolCall.id,
        type: "function",
        function: {
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
        },
      })),
    });

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
