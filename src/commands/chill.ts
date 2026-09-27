import pc from "picocolors";
import { showBanner } from "../banner.js";
import { loadConfig } from "../config.js";
import { displayName } from "../utils.js";
import { runQuote } from "./quote.js";
import { runFocus } from "./focus.js";
import { runBreathe } from "./breathe.js";

export interface ChillOptions {
  noBanner?: boolean;
}

export async function runChill(opts: ChillOptions = {}): Promise<void> {
  if (!opts.noBanner) {
    showBanner();
  }
  const config = loadConfig();
  console.log(
    pc.dim(`  Chill mode: quote → focus → breathe. The full reset, ${displayName(config.name)}.\n`),
  );
  await runQuote({ noBanner: true });
  await runFocus({ noBanner: true });
  await runBreathe({ noBanner: true });
}
