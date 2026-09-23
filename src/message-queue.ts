export type EventBusProvider = "msk" | "pubsub" | "confluent";

export interface MessageQueueSettings {
  eventBus: {
    provider: EventBusProvider;
    brokers: string[];
    topic: string;
    consumerGroup: string;
    securityProtocol: "iam" | "sasl_ssl";
  };
  dispatch: {
    provider: "sqs";
    queueUrl: string;
    deadLetterQueueUrl: string;
    visibilityTimeoutSeconds: number;
    maxReceiveCount: number;
    batchSize: number;
  };
}

export function loadMessageQueueSettings(env: NodeJS.ProcessEnv = process.env): MessageQueueSettings {
  const provider = parseProvider(env.MESSAGE_QUEUE_EVENT_BUS_PROVIDER ?? "msk");
  return {
    eventBus: {
      provider,
      brokers: csv(env.MESSAGE_QUEUE_EVENT_BUS_BROKERS),
      topic: env.MESSAGE_QUEUE_EVENT_BUS_TOPIC ?? "world-events",
      consumerGroup: env.MESSAGE_QUEUE_EVENT_BUS_CONSUMER_GROUP ?? "rule-engine",
      securityProtocol: env.MESSAGE_QUEUE_EVENT_BUS_SECURITY_PROTOCOL === "sasl_ssl" ? "sasl_ssl" : "iam"
    },
    dispatch: {
      provider: "sqs",
      queueUrl: env.MESSAGE_QUEUE_DISPATCH_URL ?? "",
      deadLetterQueueUrl: env.MESSAGE_QUEUE_DISPATCH_DLQ_URL ?? "",
      visibilityTimeoutSeconds: positiveInt(env.MESSAGE_QUEUE_VISIBILITY_TIMEOUT_SECONDS, 120),
      maxReceiveCount: positiveInt(env.MESSAGE_QUEUE_MAX_RECEIVE_COUNT, 5),
      batchSize: positiveInt(env.MESSAGE_QUEUE_BATCH_SIZE, 10)
    }
  };
}

function parseProvider(value: string): EventBusProvider {
  if (value === "msk" || value === "pubsub" || value === "confluent") return value;
  throw new Error(`Invalid MESSAGE_QUEUE_EVENT_BUS_PROVIDER: ${value}`);
}

function csv(value: string | undefined): string[] {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
}

function positiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`Invalid positive integer: ${value}`);
  return parsed;
}
