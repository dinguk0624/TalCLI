import pc from "picocolors";
import ora, { type Ora } from "ora";

export { pc };
export type { Ora };

export function showBanner(): void {
  const art = [
    "████████╗ █████╗ ██╗ ██████╗██╗     ██╗",
    "╚══██╔══╝██╔══██╗██║██╔════╝██║     ██║",
    "   ██║   ███████║██║██║     ██║     ██║",
    "   ██║   ██╔══██║██║██║     ██║     ██║",
    "   ██║   ██║  ██║███████╗╚██████╗███████╗██║",
    "   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝╚══════╝╚═╝",
  ];
  for (const line of art) {
    console.log(pc.cyan(line));
  }
  console.log(pc.dim("  Your chill companion for the terminal\n"));
}

export function showTip(): void {
  console.log(pc.dim("Tip: run ") + pc.cyan("tal --help") + pc.dim(" to see every command.\n"));
}

export function spinner(text: string): Ora {
  return ora({ text, discardStdin: false });
}
