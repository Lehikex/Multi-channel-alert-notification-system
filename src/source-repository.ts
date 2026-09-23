import { randomUUID } from "node:crypto";
import type { Source } from "./types.js";
import type { SourceRegistry } from "./registries.js";

export interface SourceRepository {
  list(): Promise<Source[]>;
  getById(id: string): Promise<Source | null>;
  create(source: Omit<Source, "id">): Promise<Source>;
  update(id: string, changes: Partial<Omit<Source, "id">>): Promise<Source | null>;
  delete(id: string): Promise<boolean>;
}

function copy(source: Source): Source {
  return {
    ...source,
    config: { ...source.config },
    health: { ...source.health }
  };
}

export class InMemorySourceRepository implements SourceRepository {
  private readonly sources = new Map<string, Source>();

  constructor(seed: Source[] = mockSources) {
    for (const source of seed) this.sources.set(source.id, copy(source));
  }

  async list(): Promise<Source[]> {
    return [...this.sources.values()].map(copy);
  }

  async getById(id: string): Promise<Source | null> {
    const source = this.sources.get(id);
    return source ? copy(source) : null;
  }

  async create(source: Omit<Source, "id">): Promise<Source> {
    const created = { ...source, id: randomUUID() };
    this.sources.set(created.id, copy(created));
    return copy(created);
  }

  async update(id: string, changes: Partial<Omit<Source, "id">>): Promise<Source | null> {
    const current = this.sources.get(id);
    if (!current) return null;
    const updated: Source = {
      ...current,
      ...changes,
      config: changes.config ? { ...changes.config } : current.config,
      health: changes.health ? { ...changes.health } : current.health
    };
    this.sources.set(id, copy(updated));
    return copy(updated);
  }

  async delete(id: string): Promise<boolean> {
    return this.sources.delete(id);
  }
}

export class ValidatingSourceRepository implements SourceRepository {
  constructor(
    private readonly delegate: SourceRepository,
    private readonly registry: SourceRegistry
  ) {}

  list(): Promise<Source[]> { return this.delegate.list(); }
  getById(id: string): Promise<Source | null> { return this.delegate.getById(id); }
  async create(source: Omit<Source, "id">): Promise<Source> {
    this.validate({ ...source, id: "validation" });
    return this.delegate.create(source);
  }
  async update(id: string, changes: Partial<Omit<Source, "id">>): Promise<Source | null> {
    const current = await this.delegate.getById(id);
    if (!current) return null;
    const merged = { ...current, ...changes, config: changes.config ?? current.config };
    this.validate(merged);
    return this.delegate.update(id, changes);
  }
  delete(id: string): Promise<boolean> { return this.delegate.delete(id); }

  private validate(source: Source): void {
    this.registry.validate(source);
  }
}

const mockSources: Source[] = [
  {
    id: "usgs-earthquakes",
    name: "USGS Earthquakes",
    category: "disaster",
    adapterClass: "rest-poll",
    status: "active",
    config: { endpoint: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson", poll_interval_sec: 60 },
    supportsFiltering: false,
    health: { lastSuccessfulPull: "2026-09-23T17:58:00Z", consecutiveFailures: 0, lastError: null }
  },
  {
    id: "gdelt-global-news",
    name: "GDELT Global News",
    category: "news",
    adapterClass: "gdelt",
    status: "active",
    config: { endpoint: "https://api.gdeltproject.org/api/v2/doc/doc", poll_interval_sec: 300 },
    supportsFiltering: true,
    health: { lastSuccessfulPull: "2026-09-23T17:56:00Z", consecutiveFailures: 0, lastError: null }
  },
  {
    id: "polygon-market-data",
    name: "Polygon Market Data",
    category: "market",
    adapterClass: "websocket",
    status: "degraded",
    config: { endpoint: "wss://socket.polygon.io/stocks", heartbeat_interval_sec: 30 },
    supportsFiltering: true,
    health: { lastSuccessfulPull: "2026-09-23T17:50:00Z", consecutiveFailures: 3, lastError: "Provider connection timed out" }
  },
  {
    id: "nws-alerts",
    name: "NWS Alerts",
    category: "disaster",
    adapterClass: "webhook",
    status: "pending_authorization",
    config: { inbound_path: "/webhooks/nws" },
    supportsFiltering: false,
    health: { lastSuccessfulPull: null, consecutiveFailures: 0, lastError: null }
  }
];
