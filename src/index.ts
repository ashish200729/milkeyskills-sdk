import { anthropic } from "./anthropic";
import { aiSdk } from "./ai-sdk";
import { createClient } from "./client";
import { MilkeyConfigError, MilkeyError, MilkeyProblemError, MilkeyResponseError } from "./errors";
import { gemini } from "./gemini";
import { openai } from "./openai";

export { createClient } from "./client";
export { anthropic } from "./anthropic";
export { aiSdk } from "./ai-sdk";
export { gemini } from "./gemini";
export { openai } from "./openai";
export { MilkeyConfigError, MilkeyError, MilkeyProblemError, MilkeyResponseError } from "./errors";
export * from "./types";

export const milkey = {
  createClient,
  openai,
  anthropic,
  gemini,
  aiSdk,
};
