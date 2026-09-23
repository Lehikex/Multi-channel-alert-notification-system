import { InMemorySourceRepository } from "./source-repository.js";
import { createSourceApiServer } from "./source-api.js";

const port = Number(process.env.PORT ?? 3000);
const server = createSourceApiServer(new InMemorySourceRepository());

server.listen(port, "0.0.0.0", () => {
  console.log(`Source API listening on http://localhost:${port}`);
});
