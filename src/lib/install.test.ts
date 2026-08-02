import { describe, expect, it } from "vitest";
import { channelsForOs, detectOs, INSTALL_CHANNELS } from "./install";

const MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const LINUX = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36";

describe("detectOs", () => {
  it("recognises the desktop platforms", () => {
    expect(detectOs(MAC)).toBe("macos");
    expect(detectOs(WINDOWS)).toBe("windows");
    expect(detectOs(LINUX)).toBe("linux");
  });

  // Both carry a desktop platform in their UA — iOS says "Mac OS X", Android
  // says "Linux" — so a naive substring match would offer brew or apt on a
  // phone.
  it("does not mistake phones for the desktop platform in their user agent", () => {
    expect(detectOs(IPHONE)).toBe("unknown");
    expect(detectOs(ANDROID)).toBe("unknown");
  });

  it("falls back to unknown for anything unrecognised", () => {
    expect(detectOs("")).toBe("unknown");
    expect(detectOs("curl/8.4.0")).toBe("unknown");
  });
});

describe("channelsForOs", () => {
  it("offers brew on macOS and never the Windows managers", () => {
    const ids = channelsForOs("macos").map((c) => c.id);
    expect(ids).toContain("brew");
    expect(ids).not.toContain("winget");
    expect(ids).not.toContain("choco");
    expect(ids).not.toContain("scoop");
  });

  it("offers the Windows managers and never brew or the shell script", () => {
    const ids = channelsForOs("windows").map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(["winget", "scoop", "choco"]));
    expect(ids).not.toContain("brew");
    // The installer is a POSIX shell script.
    expect(ids).not.toContain("script");
  });

  it("offers the Linux repositories and never brew", () => {
    const ids = channelsForOs("linux").map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(["apt", "aur"]));
    expect(ids).not.toContain("brew");
  });

  // What the server renders, and what a visitor without JavaScript keeps.
  it("falls back to channels that work on any platform", () => {
    const ids = channelsForOs("unknown").map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(["npm", "bun", "go"]));
    expect(ids).not.toContain("brew");
    expect(ids).not.toContain("winget");
  });

  it("leads with the platform's most idiomatic channel", () => {
    expect(channelsForOs("macos")[0]?.id).toBe("brew");
    expect(channelsForOs("windows")[0]?.id).toBe("winget");
    expect(channelsForOs("linux")[0]?.id).toBe("apt");
  });

  it("gives every platform something to install with", () => {
    for (const os of ["macos", "linux", "windows", "unknown"] as const) {
      expect(channelsForOs(os).length).toBeGreaterThan(0);
    }
  });
});

describe("install commands", () => {
  // These are the names the release pipeline actually publishes under; they
  // differ from "wharf" for reasons documented in wharf-tui/docs/PACKAGING.md,
  // so a plausible-looking guess here would ship a command that 404s.
  it("uses the published package names", () => {
    const byId = Object.fromEntries(INSTALL_CHANNELS.map((c) => [c.id, c.command]));
    expect(byId.brew).toBe("brew install Janne6565/tap/wharf");
    expect(byId.aur).toBe("yay -S wharf-tui-bin");
    expect(byId.winget).toBe("winget install Janne6565.Wharf");
    expect(byId.choco).toBe("choco install wharf");
    expect(byId.npm).toBe("npm i -g wharf-tui");
    expect(byId.bun).toBe("bun i -g wharf-tui");
  });

  it("keeps scoop's bucket step, without which the install fails", () => {
    const scoop = INSTALL_CHANNELS.find((c) => c.id === "scoop");
    expect(scoop?.command).toContain("scoop bucket add janne6565");
    expect(scoop?.command).toContain("scoop install wharf");
  });
});
