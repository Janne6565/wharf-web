// Framework-agnostic constants and decorative demo data for the landing page.

// Static illustration of the wharf TUI shown beside the hero. This mirrors a
// screenshot — literal demo output rather than localizable product copy — so it
// lives here as data instead of in the i18n resources.
export const TERMINAL_TITLE = "wharf — deniz@wharf.sh";
export const TERMINAL_SYNCED = "● synced";

export interface TerminalHost {
  readonly name: string;
  readonly target: string;
  readonly tags: string;
  readonly status: string;
  readonly online: boolean;
  readonly selected?: boolean;
}

export const TERMINAL_HOSTS: readonly TerminalHost[] = [
  {
    name: "prod-api-01",
    target: "deploy@10.4.1.12:22",
    tags: "#prod #api",
    status: "online",
    online: true,
    selected: true,
  },
  {
    name: "db-primary",
    target: "postgres@10.4.2.5:5522",
    tags: "#prod #db",
    status: "online",
    online: true,
  },
  {
    name: "staging-web",
    target: "deploy@staging.acme.io:22",
    tags: "#staging",
    status: "unknown",
    online: false,
  },
  {
    name: "edge-lb-euw1",
    target: "root@edge-euw1.acme.io:22",
    tags: "#edge #lb",
    status: "online",
    online: true,
  },
  {
    name: "homelab",
    target: "deniz@homelab.local:22",
    tags: "#personal",
    status: "online",
    online: true,
  },
];

export interface TerminalKey {
  readonly key: string;
  readonly label: string;
}

export const TERMINAL_KEYS: readonly TerminalKey[] = [
  { key: "j/k", label: "move" },
  { key: "/", label: "filter" },
  { key: "enter", label: "connect" },
];

export const TERMINAL_HELP: TerminalKey = { key: "?", label: "help" };
