export type EmailProvider = "ses" | "sendgrid" | "smtp";

export interface EmailDispatchSettings {
  provider: EmailProvider;
  fromAddress: string;
  region: string;
  apiKeyConfigured: boolean;
  smtpHost: string;
  smtpPort: number;
  maxPerSecond: number;
}

export interface SlackDispatchSettings {
  provider: "incoming_webhook";
  webhookConfigured: boolean;
  requestTimeoutMs: number;
  maxPerSecond: number;
}

export interface DispatchServiceSettings {
  email: EmailDispatchSettings;
  slack: SlackDispatchSettings;
}

export function loadDispatchServiceSettings(env: NodeJS.ProcessEnv = process.env): DispatchServiceSettings {
  const provider = env.DISPATCH_EMAIL_PROVIDER ?? "ses";
  if (provider !== "ses" && provider !== "sendgrid" && provider !== "smtp") {
    throw new Error(`Invalid DISPATCH_EMAIL_PROVIDER: ${provider}`);
  }
  return {
    email: {
      provider,
      fromAddress: env.DISPATCH_EMAIL_FROM_ADDRESS ?? "alerts@example.com",
      region: env.DISPATCH_EMAIL_REGION ?? env.AWS_REGION ?? "us-east-1",
      apiKeyConfigured: Boolean(env.DISPATCH_EMAIL_API_KEY || env.DISPATCH_SMTP_PASSWORD),
      smtpHost: env.DISPATCH_SMTP_HOST ?? "",
      smtpPort: positiveInt(env.DISPATCH_SMTP_PORT, 587),
      maxPerSecond: positiveInt(env.DISPATCH_EMAIL_MAX_PER_SECOND, 10)
    },
    slack: {
      provider: "incoming_webhook",
      webhookConfigured: Boolean(env.DISPATCH_SLACK_WEBHOOK_URL),
      requestTimeoutMs: positiveInt(env.DISPATCH_SLACK_TIMEOUT_MS, 5000),
      maxPerSecond: positiveInt(env.DISPATCH_SLACK_MAX_PER_SECOND, 5)
    }
  };
}

function positiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`Invalid positive integer: ${value}`);
  return parsed;
}
