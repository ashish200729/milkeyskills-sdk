import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { milkey } from "../src/index.js";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

const milkeyClient = milkey.createClient({
  baseUrl: requireEnv("MILKEY_BASE_URL"),
  apiKey: requireEnv("MILKEY_API_KEY"),
});

const result = await generateText({
  model: openai(process.env.OPENAI_MODEL ?? "gpt-5"),
  prompt: "Find the best Milkey skill for PostgreSQL query optimization.",
  tools: milkey.aiSdk.tools({
    client: milkeyClient,
    mode: "inline",
    allowedTools: ["resolve-skill"],
  }) as any,
});

console.log(result.text);
