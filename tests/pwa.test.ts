import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

interface WorkerEvent {
  request?: { url: string; method: string; mode: string };
  respondWith?: (value: Promise<Response>) => void;
  waitUntil?: (value: Promise<unknown>) => void;
}

function worker(online = true) {
  const handlers = new Map<string, (event: WorkerEvent) => void>();
  const writes: string[] = [];
  const deleted: string[] = [];
  const cached = new Response("offline page");
  const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  vm.runInNewContext(source, {
    self: {
      location: { origin: "https://persona.test" },
      addEventListener: (name: string, fn: (event: WorkerEvent) => void) => handlers.set(name, fn),
      clients: { claim: async () => {} },
      skipWaiting: async () => {},
    },
    URL,
    fetch: async () => {
      if (!online) throw new Error("offline");
      return new Response("private page");
    },
    caches: {
      open: async () => ({ addAll: async (urls: string[]) => writes.push(...urls), match: async () => cached }),
      keys: async () => ["unrelated-cache", "persona-offline-v0", "persona-offline-v1"],
      delete: async (key: string) => {
        deleted.push(key);
        return true;
      },
    },
  });
  for (const event of ["fetch", "install", "activate"]) assert.ok(handlers.has(event), `worker handles ${event}`);
  return { handlers, writes, deleted };
}

test("service worker never intercepts API, mutations or cross-origin traffic", () => {
  const { handlers } = worker();
  for (const request of [
    { url: "https://persona.test/api/coach", method: "GET", mode: "navigate" },
    { url: "https://persona.test/", method: "POST", mode: "navigate" },
    { url: "https://elsewhere.test/", method: "GET", mode: "navigate" },
    { url: "https://persona.test/", method: "GET", mode: "cors" },
  ]) {
    let intercepted = false;
    handlers.get("fetch")!({
      request,
      respondWith: () => {
        intercepted = true;
      },
    });
    assert.equal(intercepted, false);
  }
});

test("offline page icons are served from the public asset cache without network", async () => {
  const { handlers } = worker(false);
  let response: Promise<Response> | undefined;
  handlers.get("fetch")!({
    request: { url: "https://persona.test/icons/icon-192.png", method: "GET", mode: "no-cors" },
    respondWith: (value) => {
      response = value;
    },
  });
  assert.ok(response, "public icon request is intercepted");
  assert.equal(await (await response).text(), "offline page");
});

test("navigation uses network without saving page contents and falls back offline", async () => {
  for (const online of [true, false]) {
    const { handlers, writes } = worker(online);
    let response: Promise<Response> | undefined;
    handlers.get("fetch")!({
      request: { url: "https://persona.test/", method: "GET", mode: "navigate" },
      respondWith: (value: Promise<Response>) => {
        response = value;
      },
    });
    assert.equal(await (await response!).text(), online ? "private page" : "offline page");
    assert.deepEqual(writes, []);
  }
});

test("install only stores public offline assets and activation preserves foreign caches", async () => {
  const { handlers, writes, deleted } = worker();
  let pending: Promise<unknown> | undefined;
  handlers.get("install")!({
    waitUntil: (value: Promise<unknown>) => {
      pending = value;
    },
  });
  await pending;
  assert.deepEqual(writes, ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-512.png"]);
  handlers.get("activate")!({
    waitUntil: (value: Promise<unknown>) => {
      pending = value;
    },
  });
  await pending;
  assert.deepEqual(deleted, ["persona-offline-v0"]);
});
