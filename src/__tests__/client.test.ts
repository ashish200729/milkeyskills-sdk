import { describe, expect, it, vi } from "vitest";

import { createClient } from "../client";
import { MilkeyProblemError } from "../errors";

describe("createClient", () => {
  it("calls the tools endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const client = createClient({
      baseUrl: "https://api.milkey.ai/",
      apiKey: "mk_sk_test_secret",
      fetch: fetchMock as typeof fetch,
    });

    const items = await client.listTools();

    expect(items).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls.at(0) as unknown[] | undefined;
    const requestUrl = firstCall ? firstCall[0] : undefined;
    expect(String(requestUrl)).toBe("https://api.milkey.ai/v1/tools");
  });

  it("parses problem responses", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          type: "https://milkey.ai/problems/invalid_api_key",
          title: "Unauthorized",
          status: 401,
          detail: "The bearer API key is invalid or inactive.",
        }),
        {
          status: 401,
          headers: { "content-type": "application/problem+json" },
        },
      ),
    );

    const client = createClient({
      baseUrl: "https://api.milkey.ai",
      apiKey: "mk_sk_test_secret",
      fetch: fetchMock as typeof fetch,
    });

    await expect(client.listTools()).rejects.toBeInstanceOf(MilkeyProblemError);
  });
});
