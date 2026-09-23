import assert from "node:assert/strict";
import test from "node:test";
import { InMemorySourceRepository, createSourceApiServer } from "../src/index.js";

async function withServer<T>(run: (baseUrl: string) => Promise<T>): Promise<T> {
  const server = createSourceApiServer(new InMemorySourceRepository());
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not start");
  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("source API supports list, create, update, and delete", async () => {
  await withServer(async (baseUrl) => {
    const list = await fetch(`${baseUrl}/api/sources`);
    assert.equal(list.status, 200);
    const listed = await list.json() as { data: Array<{ id: string }> };
    assert.equal(listed.data.length, 4);

    const create = await fetch(`${baseUrl}/api/sources`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Example News",
        category: "news",
        adapterClass: "rss",
        config: { feed_url: "https://example.test/feed.xml" },
        supportsFiltering: false
      })
    });
    assert.equal(create.status, 201);
    const created = await create.json() as { data: { id: string; status: string } };
    assert.equal(created.data.status, "pending_authorization");

    const update = await fetch(`${baseUrl}/api/sources/${created.data.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "active", name: "Example News Updated" })
    });
    assert.equal(update.status, 200);
    const updated = await update.json() as { data: { name: string; status: string } };
    assert.equal(updated.data.name, "Example News Updated");
    assert.equal(updated.data.status, "active");

    const remove = await fetch(`${baseUrl}/api/sources/${created.data.id}`, { method: "DELETE" });
    assert.equal(remove.status, 204);
    const missing = await fetch(`${baseUrl}/api/sources/${created.data.id}`);
    assert.equal(missing.status, 404);
  });
});

test("source API rejects invalid source payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/sources`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "", category: "unknown" })
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Invalid name: expected a non-empty string" });
  });
});
