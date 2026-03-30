import OpenAI from "openai";
import { milkey } from "../dist/index.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL ?? "https://opencode.ai/zen/v1",
});

const milkeyClient = milkey.createClient({
  baseUrl: process.env.MILKEY_BASE_URL,
  apiKey: process.env.MILKEY_API_KEY,
});

const model = process.env.OPENAI_MODEL ?? "minimax-m2.5-free";

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
  model,
  messages,
  tools,
});

const assistantMessage = first.choices[0]?.message;
if (!assistantMessage) {
  throw new Error("No assistant message returned.");
}

messages.push({
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

if (assistantMessage.tool_calls?.length) {
  const toolMessages = await milkey.openai.chat.messages(assistantMessage, milkeyClient);

  for (const toolMessage of toolMessages) {
    messages.push({
      role: "tool",
      tool_call_id: toolMessage.tool_call_id,
      content: toolMessage.content,
    });
  }

  const second = await openai.chat.completions.create({
    model,
    messages,
    tools,
  });

  console.log(second.choices[0]?.message?.content ?? "");
  process.exit(0);
} else {
  console.log(assistantMessage.content ?? "");
  process.exit(0);
}
