import { describe, expect, it, vi } from "vitest";

import { createClient } from "../client";
import { openai } from "../openai";

describe("openai adapters", () => {
  it("builds hosted response tools", () => {
    const client = createClient({
      baseUrl: "https://api.milkey.ai",
      apiKey: "mk_sk_test_secret",
      fetch: vi.fn() as unknown as typeof fetch,
    });

    const tools = openai.responses.tools({ client });
    const hostedTool = tools[0] as { type: string; server_url: string };

    expect(tools).toHaveLength(1);
    expect(hostedTool.type).toBe("mcp");
    expect(hostedTool.server_url).toBe("https://api.milkey.ai/mcp");
  });

  it("builds inline chat tools with provider-safe aliases", () => {
    const client = createClient({
      baseUrl: "https://api.milkey.ai",
      apiKey: "mk_sk_test_secret",
      fetch: vi.fn() as unknown as typeof fetch,
    });

    const tools = openai.chat.tools({ client });
    const firstTool = tools[0] as { function: { name: string } };

    expect(tools).toHaveLength(3);
    expect(firstTool.function.name).toBe("milkey_resolve_skill");
  });
});
