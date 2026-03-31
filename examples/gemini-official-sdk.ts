import { GoogleGenAI } from "@google/genai";
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

const ai = new GoogleGenAI({
  apiKey: requireEnv("GEMINI_API_KEY"),
});

const milkeyClient = milkey.createClient({
  baseUrl: requireEnv("MILKEY_BASE_URL"),
  apiKey: requireEnv("MILKEY_API_KEY"),
});

const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const maxTurns = numberFromEnv("MAX_TOOL_TURNS", 4);
const initialContents = [
  {
    role: "user",
    parts: [
      {
        text:
          process.env.TEST_PROMPT ??
          "Find the best Milkey skill for PostgreSQL query optimization.",
      },
    ],
  },
];

let contents: any[] = initialContents;

for (let turn = 1; turn <= maxTurns; turn += 1) {
  const response = await ai.models.generateContent({
    model,
    contents,
    config: milkey.gemini.config({
      client: milkeyClient,
      allowedTools: ["resolve-skill"],
    }) as any,
  }) as any;

  const calls = milkey.gemini.extractFunctionCalls(response);
  if (calls.length === 0) {
    console.log(response.text ?? "");
    process.exit(0);
  }

  const toolResponse = await milkey.gemini.parts(calls, milkeyClient);
  contents = milkey.gemini.followUpContents(contents, response, toolResponse);
}

throw new Error(
  `Model did not finish within ${maxTurns} tool turns. The conversation kept requesting tools.`,
);
