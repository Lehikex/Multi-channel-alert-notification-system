import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { Source, SourceCategory } from "./types.js";
import type { SourceRepository } from "./source-repository.js";
import type { IngestionManager } from "./ingestion.js";
import type { MessageQueueSettings } from "./message-queue.js";
import type { DispatchServiceSettings } from "./dispatch-settings.js";

const categories: SourceCategory[] = ["news", "market", "disaster"];
const statuses = ["pending_authorization", "active", "disabled", "degraded"] as const;
type SourceStatus = (typeof statuses)[number];

export function createSourceApiServer(
  repository: SourceRepository,
  ingestion?: IngestionManager,
  messageQueue?: MessageQueueSettings,
  dispatchSettings?: DispatchServiceSettings
): Server {
  return createServer(async (request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (request.method === "OPTIONS") {
      response.writeHead(204).end();
      return;
    }

    try {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
      if (request.method === "GET" && url.pathname === "/api/ingestion") {
        sendJson(response, 200, { data: ingestion?.states() ?? [] });
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/settings/message-queue") {
        sendJson(response, 200, { data: messageQueue ?? null });
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/settings/dispatch") {
        sendJson(response, 200, { data: dispatchSettings ?? null });
        return;
      }
      const match = url.pathname.match(/^\/api\/sources(?:\/([^/]+))?$/);
      if (!match) {
        sendJson(response, 404, { error: "Route not found" });
        return;
      }

      const id = match[1];
      if (request.method === "GET" && !id) {
        sendJson(response, 200, { data: await repository.list() });
        return;
      }
      if (request.method === "GET" && id) {
        const source = await repository.getById(id);
        sendJson(response, source ? 200 : 404, source ? { data: source } : { error: "Source not found" });
        return;
      }
      if (request.method === "POST" && !id) {
        const body = await readJson(request);
        const source = await repository.create(validateCreate(body));
        await ingestion?.reconcile(source.id);
        sendJson(response, 201, { data: source });
        return;
      }
      if (request.method === "PATCH" && id) {
        const body = await readJson(request);
        const source = await repository.update(id, validateUpdate(body));
        if (source) await ingestion?.reconcile(source.id);
        sendJson(response, source ? 200 : 404, source ? { data: source } : { error: "Source not found" });
        return;
      }
      if (request.method === "DELETE" && id) {
        const deleted = await repository.delete(id);
        ingestion?.stop(id);
        sendJson(response, deleted ? 204 : 404, deleted ? undefined : { error: "Source not found" });
        return;
      }
      sendJson(response, 405, { error: "Method not allowed" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed";
      const isClientError = message.startsWith("Invalid") || message.startsWith("Missing");
      sendJson(response, isClientError ? 400 : 500, { error: message });
    }
  });
}

function validateCreate(value: unknown): Omit<Source, "id"> {
  if (!isRecord(value)) throw new Error("Invalid request body");
  const name = requiredString(value.name, "name");
  const category = requiredCategory(value.category);
  const adapterClass = requiredString(value.adapterClass, "adapterClass");
  const config = value.config;
  if (!isRecord(config)) throw new Error("Invalid config: expected an object");
  return {
    name,
    category,
    adapterClass,
    status: value.status === undefined ? "pending_authorization" : requiredStatus(value.status),
    config,
    supportsFiltering: requiredBoolean(value.supportsFiltering, "supportsFiltering"),
    health: emptyHealth()
  };
}

function validateUpdate(value: unknown): Partial<Omit<Source, "id">> {
  if (!isRecord(value)) throw new Error("Invalid request body");
  const changes: Partial<Omit<Source, "id">> = {};
  if (value.name !== undefined) changes.name = requiredString(value.name, "name");
  if (value.category !== undefined) changes.category = requiredCategory(value.category);
  if (value.adapterClass !== undefined) changes.adapterClass = requiredString(value.adapterClass, "adapterClass");
  if (value.config !== undefined) {
    if (!isRecord(value.config)) throw new Error("Invalid config: expected an object");
    changes.config = value.config;
  }
  if (value.status !== undefined) changes.status = requiredStatus(value.status);
  if (value.supportsFiltering !== undefined) changes.supportsFiltering = requiredBoolean(value.supportsFiltering, "supportsFiltering");
  return changes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`Invalid ${field}: expected a non-empty string`);
  return value.trim();
}
function requiredBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw new Error(`Invalid ${field}: expected a boolean`);
  return value;
}
function requiredCategory(value: unknown): SourceCategory {
  if (typeof value !== "string" || !categories.includes(value as SourceCategory)) throw new Error("Invalid category");
  return value as SourceCategory;
}
function requiredStatus(value: unknown): SourceStatus {
  if (typeof value !== "string" || !statuses.includes(value as SourceStatus)) throw new Error("Invalid status");
  return value as SourceStatus;
}
function emptyHealth(): Source["health"] {
  return { lastSuccessfulPull: null, consecutiveFailures: 0, lastError: null };
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error("Invalid request body: payload too large");
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Invalid request body: expected JSON");
  }
}

function sendJson(response: ServerResponse, status: number, body?: unknown): void {
  response.statusCode = status;
  if (body === undefined) {
    response.end();
    return;
  }
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}
