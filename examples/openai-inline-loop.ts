import OpenAI from "openai";
import { milkey } from "../src";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL ?? "https://opencode.ai/zen/v1",
});
const milkeyClient = milkey.createClient({
  baseUrl: process.env.MILKEY_BASE_URL!,
  apiKey: process.env.MILKEY_API_KEY!,
});

const tools = milkey.openai.chat.tools({
  client: milkeyClient,
});

const first = await openai.responses.create({
  model: process.env.OPENAI_MODEL ?? "minimax-m2.5-free",
  input: "Find the best Milkey skill for PostgreSQL query optimization.",
  tools: milkey.openai.responses.tools({
    client: milkeyClient,
    delivery: "inline",
  }),
});

const outputs = await milkey.openai.responses.outputs(first, milkeyClient);

if (outputs.length > 0) {
  const second = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "minimax-m2.5-free",
    previous_response_id: first.id,
    input: outputs,
    tools: milkey.openai.responses.tools({
      client: milkeyClient,
      delivery: "inline",
    }),
  });

  console.log(second.output_text);
}

console.log(tools.length);
