import { InMemorySourceRepository, ValidatingSourceRepository } from "./source-repository.js";
import { createSourceApiServer } from "./source-api.js";
import { SourceRegistry } from "./registries.js";
import { GDELTAdapter, RestPollAdapter, RSSAdapter, WebhookAdapter, WebSocketAdapter } from "./adapters.js";
import { IngestionManager } from "./ingestion.js";

const port = Number(process.env.PORT ?? 3000);
const registry = new SourceRegistry();
registry.register("rest-poll", RestPollAdapter);
registry.register("rss", RSSAdapter);
registry.register("websocket", WebSocketAdapter);
registry.register("webhook", WebhookAdapter);
registry.register("gdelt", GDELTAdapter);
const repository = new ValidatingSourceRepository(new InMemorySourceRepository(), registry);
const ingestion = new IngestionManager(repository, registry);
const server = createSourceApiServer(repository, ingestion);

void ingestion.startAll().then(() => {
  server.listen(port, "0.0.0.0", () => {
    console.log(`Source API listening on http://localhost:${port}`);
  });
});
