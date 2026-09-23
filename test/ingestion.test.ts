import assert from "node:assert/strict";
import test from "node:test";
import { IngestionManager, RestPollAdapter, SourceRegistry, ValidatingSourceRepository, InMemorySourceRepository } from "../src/index.js";

test("source configuration is validated against the adapter schema", async () => {
  const registry = new SourceRegistry();
  registry.register("rest-poll", RestPollAdapter);
  const repository = new ValidatingSourceRepository(new InMemorySourceRepository([]), registry);
  await assert.rejects(
    repository.create({
      name: "Missing interval",
      category: "news",
      adapterClass: "rest-poll",
      status: "active",
      config: { endpoint: "https://example.test" },
      supportsFiltering: false,
      health: { lastSuccessfulPull: null, consecutiveFailures: 0, lastError: null }
    }),
    /Missing source config field: poll_interval_sec/
  );
});

test("ingestion manager starts active sources and stops disabled sources", async () => {
  const registry = new SourceRegistry();
  registry.register("rest-poll", RestPollAdapter);
  const repository = new InMemorySourceRepository([{
    id: "source-1",
    name: "Test source",
    category: "news",
    adapterClass: "rest-poll",
    status: "active",
    config: { endpoint: "https://example.test", poll_interval_sec: 60 },
    supportsFiltering: false,
    health: { lastSuccessfulPull: null, consecutiveFailures: 0, lastError: null }
  }]);
  const manager = new IngestionManager(repository, registry);
  await manager.startAll();
  assert.equal(manager.states().length, 1);
  await repository.update("source-1", { status: "disabled" });
  await manager.reconcile("source-1");
  assert.equal(manager.states().length, 0);
});
