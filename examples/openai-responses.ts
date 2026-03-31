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

const tools = milkey.openai.responses.tools({
  client: milkeyClient,
});

const response = await openai.responses.create({
  model: process.env.OPENAI_MODEL ?? "minimax-m2.5-free",
  input:
    process.env.TEST_PROMPT ??
    "Find the best Milkey skill for PostgreSQL query optimization.",
  tools: tools as any,
});

console.log(response.output_text);
