import { GoogleGenAI } from "@google/genai";
import { milkey } from "../src/index.js";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

const ai = new GoogleGenAI({
  apiKey: requireEnv("GEMINI_API_KEY"),
});

const milkeyClient = milkey.createClient({
  baseUrl: requireEnv("MILKEY_BASE_URL"),
  apiKey: requireEnv("MILKEY_API_KEY"),
});

const response = await ai.interactions.create({
  model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  input: "Find the best Milkey skill for PostgreSQL query optimization.",
  system_instruction: "Be concise and explain why the selected skill fits.",
  ...milkey.gemini.interactions.config({
    client: milkeyClient,
    mode: "auto",
  }) as any,
});

const lastOutput = response.outputs?.[response.outputs.length - 1] as { text?: string } | undefined;
console.log(lastOutput?.text ?? JSON.stringify(response, null, 2));
