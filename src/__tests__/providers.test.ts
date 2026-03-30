import { describe, expect, it, vi } from "vitest";

import { aiSdk } from "../ai-sdk";
import { anthropic } from "../anthropic";
import { createClient } from "../client";
import { gemini } from "../gemini";

describe("provider adapters", () => {
  const client = createClient({
    baseUrl: "https://api.milkey.ai",
    apiKey: "mk_sk_test_secret",
    fetch: vi.fn(async (_url, init) => {
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};

      return new Response(
        JSON.stringify({
          tool: body.name,
          content: "ok",
          structured_content: { result: "ok" },
          is_error: false,
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }) as unknown as typeof fetch,
  });

  it("builds anthropic hosted config", () => {
    const config = anthropic.tools({ client });
    const firstTool = config.tools?.[0] as { type: string } | undefined;

    expect(config.mcp_servers).toHaveLength(1);
    expect(config.mcp_servers?.[0]?.url).toBe("https://api.milkey.ai/mcp");
    expect(firstTool?.type).toBe("mcp_toolset");
  });

  it("builds gemini function declarations", () => {
    const tools = gemini.tools({ client });

    expect(tools).toHaveLength(1);
    expect(tools[0]?.functionDeclarations).toHaveLength(3);
    expect(tools[0]?.functionDeclarations?.[0]?.name).toBe(
      "milkey_resolve_skill",
    );
  });

  it("builds ai sdk tools and executes through the Milkey client", async () => {
    const tools = aiSdk.tools({ client });
    const result = await tools.milkey_resolve_skill.execute({
      query: "postgres",
    });

    expect(Object.keys(tools)).toContain("milkey_resolve_skill");
    expect(result).toEqual({ result: "ok" });
  });

  it("builds anthropic tool results from tool use blocks", async () => {
    const results = await anthropic.messages(
      [
        {
          id: "toolu_123",
          name: "milkey_resolve_skill",
          input: { query: "postgres" },
        },
      ],
      client,
    );

    expect(results).toEqual([
      {
        type: "tool_result",
        tool_use_id: "toolu_123",
        content: JSON.stringify({ result: "ok" }),
      },
    ]);
  });

  it("builds gemini function response parts", async () => {
    const result = await gemini.parts(
      [
        {
          id: "gem_call_1",
          name: "milkey_resolve_skill",
          args: { query: "postgres" },
        },
      ],
      client,
    );

    expect(result).toEqual({
      role: "user",
      parts: [
        {
          functionResponse: {
            id: "gem_call_1",
            name: "milkey_resolve_skill",
            response: {
              result: { result: "ok" },
            },
          },
        },
      ],
    });
  });
});
