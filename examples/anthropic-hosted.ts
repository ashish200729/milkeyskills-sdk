import Anthropic from "@anthropic-ai/sdk";
import { milkey } from "../src/index.js";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

const anthropic = new Anthropic({
  apiKey: requireEnv("ANTHROPIC_API_KEY"),
});

const milkeyClient = milkey.createClient({
  baseUrl: requireEnv("MILKEY_BASE_URL"),
  apiKey: requireEnv("MILKEY_API_KEY"),
});

const response = await anthropic.beta.messages.create({
  model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
  max_tokens: 800,
  messages: [
    {
      role: "user",
      content: "Find the best Milkey skill for PostgreSQL query optimization.",
    },
  ],
  ...milkey.anthropic.config({
    client: milkeyClient,
    mode: "auto",
  }) as any,
});

console.log(JSON.stringify(response.content, null, 2));
