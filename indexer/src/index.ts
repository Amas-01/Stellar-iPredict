// Import config first to validate environment variables on boot
import { config } from "./config/index.js";
import { runBackfill, writeEventToDb } from "./backfill.js";
import { rpc, scValToNative } from "@stellar/stellar-sdk";

export async function startLivePolling(fromLedger: number): Promise<void> {
  console.log(`[ipredict-indexer] Starting live polling loop from ledger ${fromLedger}...`);
  let currentLedger = fromLedger;
  const server = new rpc.Server(config.SOROBAN_RPC_URL);

  while (true) {
    try {
      const latest = await server.getLatestLedger();
      if (latest.sequence > currentLedger) {
        console.log(`[live-poll] Fetching events from ${currentLedger + 1} to ${latest.sequence}`);
        const response = await server.getEvents({
          filters: [{ type: "contract" as const, contractIds: [config.MARKET_CONTRACT_ID] }],
          startLedger: currentLedger + 1,
          limit: config.EVENTS_PER_PAGE,
        });

        for (const event of response.events || []) {
          const topics = event.topic.map((t) => scValToNative(t));
          const data = scValToNative(event.value);
          await writeEventToDb(event.ledger, event.txHash, topics, data);
        }
        currentLedger = response.latestLedger;
      }
    } catch (err) {
      console.error("[live-poll] Error in polling loop:", err);
    }
    if (process.env.NODE_ENV === "test") {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, config.POLL_INTERVAL_MS));
  }
}

export async function main(): Promise<void> {
  const isBackfill = process.argv.includes("--backfill");

  if (isBackfill) {
    console.log("[ipredict-indexer] Backfill mode enabled via CLI flag.");
    const lastLedger = await runBackfill();
    await startLivePolling(lastLedger);
  } else {
    console.log("[ipredict-indexer] Live polling mode enabled (no backfill).");
    await startLivePolling(config.START_LEDGER);
  }
}

// Only invoke main when run directly, not when imported in tests
if (process.env.NODE_ENV !== "test") {
  main().catch((err) => {
    console.error("[ipredict-indexer] fatal:", err);
    process.exit(1);
  });
}
