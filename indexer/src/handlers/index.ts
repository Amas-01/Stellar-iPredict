import { handleClaim, REWARD_CLAIMED_TOPIC } from "./claim.js";
import { handleTokenMint, TOKEN_MINT_TOPIC } from "./token_mint.js";
import type { DecodedEvent, EventHandler, HandlerContext } from "./types.js";

export const eventHandlers = {
  [REWARD_CLAIMED_TOPIC]: handleClaim,
  [TOKEN_MINT_TOPIC]: handleTokenMint,
} satisfies Record<string, EventHandler>;

export type EventTopic = keyof typeof eventHandlers;

export function getEventTopic(event: DecodedEvent): string | undefined {
  const [topic] = event.topics;
  return typeof topic === "string" ? topic : undefined;
}

export async function dispatchEvent(
  event: DecodedEvent,
  context: HandlerContext,
  registry: Record<string, EventHandler> = eventHandlers,
): Promise<void> {
  const topic = getEventTopic(event);
  const handler = topic ? registry[topic] : undefined;

  if (!topic || !handler) {
    context.logger.warn("Skipping unknown indexer event type", {
      topic,
      topics: event.topics,
      ledger: event.ledger,
      txHash: event.txHash,
    });
    return;
  }

  await handler(event, context);
}

export type { DecodedEvent, EventHandler, HandlerContext } from "./types.js";
export { decodeClaim, handleClaim, REWARD_CLAIMED_TOPIC } from "./claim.js";
export { decodeTokenMint, handleTokenMint, TOKEN_MINT_TOPIC } from "./token_mint.js";
