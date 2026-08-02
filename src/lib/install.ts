// Install channels for the landing page's install box.
//
// These are literal shell commands, not localizable copy, so they live here as
// data rather than in the i18n resources. Every command is one wharf actually
// publishes — wharf-tui/docs/PACKAGING.md is the source of truth for the
// package names. They disagree on purpose: the npm package is `wharf-tui`
// because `wharf` was taken, the AUR package carries the `-bin` suffix its
// convention requires for a prebuilt binary, and Homebrew needs the tap prefix
// because the cask is not in homebrew-core.

export type Os = "macos" | "linux" | "windows" | "unknown";

export interface InstallChannel {
  readonly id: string;
  // Shown on the tab. Package-manager names are proper nouns — not translated.
  readonly label: string;
  // May span several lines: adding the apt repository genuinely takes several
  // commands, and collapsing it to a fake one-liner would hand people something
  // that does not work. The box renders each line with its own prompt.
  readonly command: string;
  readonly platforms: readonly Os[];
}

const APT_COMMAND = [
  "sudo install -d -m 0755 /etc/apt/keyrings",
  "curl -fsSL https://janne6565.github.io/wharf-tui/wharf-archive-keyring.gpg \\",
  "  | sudo tee /etc/apt/keyrings/wharf-archive-keyring.gpg > /dev/null",
  'echo "deb [signed-by=/etc/apt/keyrings/wharf-archive-keyring.gpg] \\',
  '  https://janne6565.github.io/wharf-tui stable main" \\',
  "  | sudo tee /etc/apt/sources.list.d/wharf.list",
  "sudo apt update && sudo apt install wharf",
].join("\n");

const SCOOP_COMMAND = [
  "scoop bucket add janne6565 https://github.com/Janne6565/scoop-bucket",
  "scoop install wharf",
].join("\n");

// Ordered most-idiomatic-first per platform: the box selects the head of the
// filtered list, so a Mac defaults to brew and Windows to winget.
export const INSTALL_CHANNELS: readonly InstallChannel[] = [
  {
    id: "brew",
    label: "brew",
    command: "brew install Janne6565/tap/wharf",
    platforms: ["macos"],
  },
  {
    id: "apt",
    label: "apt",
    command: APT_COMMAND,
    platforms: ["linux"],
  },
  {
    id: "aur",
    label: "aur",
    command: "yay -S wharf-tui-bin",
    platforms: ["linux"],
  },
  {
    id: "winget",
    label: "winget",
    command: "winget install Janne6565.Wharf",
    platforms: ["windows"],
  },
  {
    id: "scoop",
    label: "scoop",
    command: SCOOP_COMMAND,
    platforms: ["windows"],
  },
  {
    id: "choco",
    label: "choco",
    command: "choco install wharf",
    platforms: ["windows"],
  },
  {
    id: "npm",
    label: "npm",
    command: "npm i -g wharf-tui",
    platforms: ["macos", "linux", "windows", "unknown"],
  },
  {
    id: "bun",
    label: "bun",
    command: "bun i -g wharf-tui",
    platforms: ["macos", "linux", "windows", "unknown"],
  },
  {
    id: "script",
    // No Windows: the installer is a POSIX shell script.
    label: "script",
    command:
      "curl -fsSL https://raw.githubusercontent.com/Janne6565/wharf-tui/main/scripts/install.sh | sh",
    platforms: ["macos", "linux", "unknown"],
  },
  {
    id: "go",
    label: "go",
    command: "go install github.com/Janne6565/wharf-tui/cmd/wharf@latest",
    platforms: ["macos", "linux", "windows", "unknown"],
  },
];

// channelsForOs narrows the tabs to what the visitor can actually run, so a Mac
// never advertises choco. "unknown" is what the server renders — it cannot know
// the platform — and covers the channels that work anywhere.
export function channelsForOs(os: Os): readonly InstallChannel[] {
  return INSTALL_CHANNELS.filter((channel) => channel.platforms.includes(os));
}

// detectOs takes the user-agent string rather than reading navigator itself, so
// it stays pure and testable and the caller decides when it is safe to run.
export function detectOs(userAgent: string): Os {
  const ua = userAgent.toLowerCase();
  // Order matters: iOS and Android carry "mac"/"linux" in their user agents,
  // and a phone is not somewhere you install a terminal SSH client — fall
  // through to the cross-platform set rather than claiming a desktop platform.
  if (/iphone|ipad|ipod|android/.test(ua)) return "unknown";
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux") || ua.includes("x11")) return "linux";
  return "unknown";
}

// The single-line one-liner used where there is no room for the tabbed box: the
// landing footer and the device-pairing screen's "install wharf" hint.
export const INSTALL_COMMAND =
  "curl -fsSL https://raw.githubusercontent.com/Janne6565/wharf-tui/main/scripts/install.sh | sh";
