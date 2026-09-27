import pc from "picocolors";
import { pickQuote } from "../quotes.js";
import { showBanner } from "../banner.js";

export interface QuoteOptions {
  noBanner?: boolean;
}

export async function runQuote(opts: QuoteOptions = {}): Promise<void> {
  if (!opts.noBanner) {
    showBanner();
  }
  const quote = pickQuote();
  console.log("");
  console.log(pc.cyan(`  "${quote.text}"`));
  console.log(pc.dim(`   — ${quote.author}\n`));
}
