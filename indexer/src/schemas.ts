import { schema, ZodValidationError } from "./zod.js";
import type { infer as Infer } from "./zod.js";

function parseMarketId(value: unknown): number {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new ZodValidationError("market_id must be a non-negative safe integer");
    }
    return value;
  }

  if (typeof value === "bigint" || typeof value === "string") {
    const text = value.toString();
    if (!/^\d+$/.test(text)) {
      throw new ZodValidationError("market_id must be an unsigned integer string");
    }
    const parsed = Number(text);
    if (!Number.isSafeInteger(parsed)) {
      throw new ZodValidationError("market_id exceeds JavaScript safe integer range");
    }
    return parsed;
  }

  throw new ZodValidationError("market_id is required");
}

export const marketCancelledPayloadSchema = schema((value: unknown) => {
  const candidate = Array.isArray(value) ? { market_id: value[0] } : value;

  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw new ZodValidationError("market_cancelled payload must be an object or single-value tuple");
  }

  const keys = Object.keys(candidate);
  if (keys.some((key) => key !== "market_id")) {
    throw new ZodValidationError("market_cancelled payload contains unknown fields");
  }

  return { market_id: parseMarketId((candidate as { market_id?: unknown }).market_id) };
});

export type MarketCancelledPayload = Infer<typeof marketCancelledPayloadSchema>;

const MARKET_CATEGORIES = ["Crypto", "Sports", "Politics", "Entertainment", "Science", "Other"] as const;
type MarketCategory = (typeof MARKET_CATEGORIES)[number];

function parseUnsignedInteger(value: unknown, field: string): number {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new ZodValidationError(`${field} must be a non-negative safe integer`);
    }
    return value;
  }

  if (typeof value === "bigint" || typeof value === "string") {
    const text = value.toString();
    if (!/^\d+$/.test(text)) {
      throw new ZodValidationError(`${field} must be an unsigned integer string`);
    }
    const parsed = Number(text);
    if (!Number.isSafeInteger(parsed)) {
      throw new ZodValidationError(`${field} exceeds JavaScript safe integer range`);
    }
    return parsed;
  }

  throw new ZodValidationError(`${field} is required`);
}

function parseStellarAddress(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^[GC][A-Z2-7]{55}$/.test(value)) {
    throw new ZodValidationError(`${field} must be a valid Stellar address`);
  }
  return value;
}

function parseMarketCategory(value: unknown): MarketCategory {
  const category = typeof value === "string" ? value : String(value);
  if (!(MARKET_CATEGORIES as readonly string[]).includes(category)) {
    throw new ZodValidationError(`category must be one of: ${MARKET_CATEGORIES.join(", ")}`);
  }
  return category as MarketCategory;
}

function parseQuestion(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ZodValidationError("question must be a non-empty string");
  }
  return value;
}

function parseOptionalImageUrl(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new ZodValidationError("image_url must be a string");
  }
  return value;
}

export const marketCreatedPayloadSchema = schema((value: unknown) => {
  let candidate: Record<string, unknown>;

  if (Array.isArray(value)) {
    candidate = {
      market_id: value[0],
      question: value[1],
      category: value[2],
      end_time: value[3],
      creator: value[4],
      image_url: value[5],
    };
  } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    candidate = value as Record<string, unknown>;
  } else {
    throw new ZodValidationError("market_created payload must be an object or tuple");
  }

  const allowedKeys = new Set(["market_id", "question", "category", "end_time", "creator", "image_url"]);
  for (const key of Object.keys(candidate)) {
    if (!allowedKeys.has(key)) {
      throw new ZodValidationError("market_created payload contains unknown fields");
    }
  }

  return {
    market_id: parseMarketId(candidate.market_id),
    question: parseQuestion(candidate.question),
    category: parseMarketCategory(candidate.category),
    end_time: parseUnsignedInteger(candidate.end_time, "end_time"),
    creator: parseStellarAddress(candidate.creator, "creator"),
    image_url: parseOptionalImageUrl(candidate.image_url),
  };
});

export type MarketCreatedPayload = Infer<typeof marketCreatedPayloadSchema>;

export const referralRewardPayloadSchema = schema((value: unknown) => {
  let candidate: any = value;
  if (Array.isArray(value)) {
    candidate = {
      referrer: value[0],
      points: value[1] !== undefined ? value[1] : undefined
    };
  }

  if (candidate === null || typeof candidate !== "object") {
    throw new ZodValidationError("referral_reward payload must be an object or tuple");
  }

  const referrer = candidate.referrer;
  if (typeof referrer !== "string" || !/^[GC][A-Z2-7]{55}$/.test(referrer)) {
    throw new ZodValidationError("referrer must be a valid Stellar address");
  }

  let points = 3;
  if (candidate.points !== undefined && candidate.points !== null) {
    const p = Number(candidate.points);
    if (!Number.isSafeInteger(p) || p <= 0) {
      throw new ZodValidationError("points must be a positive integer");
    }
    points = p;
  }

  return { referrer, points };
});

export type ReferralRewardPayload = Infer<typeof referralRewardPayloadSchema>;

