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

const tools = milkey.openai.responses.tools({
  client: milkeyClient,
});

const response = await openai.responses.create({
  model: process.env.OPENAI_MODEL ?? "minimax-m2.5-free",
  input: "Find the best Milkey skill for PostgreSQL query optimization.",
  tools,
});

console.log(response.output_text);
