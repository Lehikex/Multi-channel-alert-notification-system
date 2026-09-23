export type SourceCategory = "news" | "market" | "disaster";
export type RuleMode = "structured" | "fuzzy";

export interface ConfigSchema {
  type: "object";
  required: string[];
  properties: Record<string, { type: string; description?: string }>;
}

export interface SourceCriteria {
  mode: RuleMode;
  query: Record<string, unknown>;
}

export interface Source {
  id: string;
  name: string;
  category: SourceCategory;
  adapterClass: string;
  status: "pending_authorization" | "active" | "disabled" | "degraded";
  config: Record<string, unknown>;
  supportsFiltering: boolean;
  health: {
    lastSuccessfulPull: string | null;
    consecutiveFailures: number;
    lastError: string | null;
  };
}

export interface Event {
  eventId: string;
  sourceId: string;
  category: SourceCategory;
  occurredAt: string;
  ingestedAt: string;
  dedupKey: string;
  payload: Record<string, unknown>;
}

export interface AlertRule {
  ruleId: string;
  userId: string;
  searchText: string;
  sources: string[];
  channels: string[];
  active: boolean;
  translatedQueries: Record<string, SourceCriteria>;
}

export interface Notification {
  notificationId: string;
  ruleId: string;
  eventId: string;
  userId: string;
  channels: string[];
  matchConfidence: number;
  createdAt: string;
}

export interface UserChannelConfig {
  userId: string;
  channel: string;
  config: Record<string, unknown>;
  verified: boolean;
}

export type DeliveryStatus = "sent" | "failed" | "retrying";

export interface DeliveryAttempt {
  deliveryId: string;
  notificationId: string;
  channel: string;
  status: DeliveryStatus;
  attemptCount: number;
  lastError: string | null;
}
