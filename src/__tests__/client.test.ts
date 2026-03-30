import { describe, expect, it, vi } from "vitest";

import { createClient } from "../client";
import { MilkeyProblemError, MilkeyTimeoutError } from "../errors";

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

  it("rejects invalid runtime config before any request is made", () => {
    expect(() =>
      createClient({
        baseUrl: "",
        apiKey: "mk_sk_test_secret",
        fetch: vi.fn() as unknown as typeof fetch,
      }),
    ).toThrowError("Milkey baseUrl is required.");

    expect(() =>
      createClient({
        baseUrl: "https://api.milkey.ai",
        apiKey: "   ",
        fetch: vi.fn() as unknown as typeof fetch,
      }),
    ).toThrowError("Milkey API key is required.");

    expect(() =>
      createClient({
        baseUrl: "https://api.milkey.ai",
        apiKey: "mk_sk_test_secret",
        timeoutMs: 0,
        fetch: vi.fn() as unknown as typeof fetch,
      }),
    ).toThrowError("Milkey timeoutMs must be a positive number.");
  });

  it("throws a timeout error when a request exceeds timeoutMs", async () => {
    vi.useFakeTimers();

    try {
      const fetchMock = vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(init.signal?.reason ?? new DOMException("Aborted", "AbortError"));
            });
          }),
      );

      const client = createClient({
        baseUrl: "https://api.milkey.ai",
        apiKey: "mk_sk_test_secret",
        timeoutMs: 25,
        fetch: fetchMock as typeof fetch,
      });

      const pending = client.listTools();
      const caught = pending.catch((reason) => reason);
      await vi.advanceTimersByTimeAsync(25);

      const error = await caught;

      expect(error).toBeInstanceOf(MilkeyTimeoutError);
      expect(error).toMatchObject({
        timeoutMs: 25,
        path: "v1/tools",
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
