# BMC — Live Multiplayer Business Model Canvas

An interactive, multiplayer Business Model Canvas tool for live, in-person workshops. Participants join over the same WiFi, see each other's cursors move in real time (Figma-style), and collaboratively fill in the real Osterwalder 9-block canvas together — no accounts, no cloud.

**Live site:** [gvapp.sitemys.com/bmc](https://gvapp.sitemys.com/bmc/) · **Setup guide:** [gvapp.sitemys.com/bmc/content/setup-guide](https://gvapp.sitemys.com/bmc/content/setup-guide)

![Board canvas](https://gvapp.sitemys.com/bmc/assets/screenshots/board-canvas.png)

## Not a Developer? Just Want to Run a Workshop?

Download the ready-to-run Windows build — no PHP, Node, or Composer needed on your machine.

**[⬇ Download BMC-Windows.zip](https://github.com/ashranhelmi/bmc/releases/latest/download/BMC-Windows.zip)** · [Full setup guide →](https://gvapp.sitemys.com/bmc/content/setup-guide)

Extract the zip and double-click `Start BMC.vbs` — your browser opens automatically. Everyone else on the same WiFi joins with a PIN or QR code. A macOS build isn't packaged yet.

> ⚠️ **This is a LAN-only tool, built to be reachable by whoever's in the room — nothing more.** Only run it on a WiFi network you trust (home, office, or a personal hotspot), and never port-forward it or deploy it to a public server. It has no TLS and only a 6-digit PIN gating access, which is fine for a private workshop and not fine for the open internet.

## Features

- **Live multiplayer canvas** — real-time cursors and note sync via Laravel Reverb
- **The real BMC grid** — the actual Osterwalder 9-block layout, grouped into Supply/Value/Demand/Financial zones
- **Join with a PIN or QR code** — no accounts, no sign-up
- **Interactive framework guide** — click any block in the built-in diagram to see what it's for
- **PIC / assigned-to tags** — separate from authorship, for tracking follow-up ownership
- **Host controls** — Lock (freeze + enable printing), Export (JSON snapshot), Import, Reset
- **Print export** — clean A4 landscape PDF once the board is locked

## Stack

- **Laravel 12** + **Inertia v2** + **React 19** + **Tailwind v4** + **shadcn/ui**
- **Laravel Reverb** — self-hosted WebSocket server for realtime sync
- **SQLite** — zero-friction local database, no MySQL/Sail setup needed
- **@dnd-kit/sortable** — cross-section drag-and-drop for notes

No accounts/auth system — participants are identified via plain session values (name, color, host flag), not a login flow.

## Developer Setup

```bash
git clone https://github.com/ashranhelmi/bmc.git
cd bmc
composer run setup    # composer install, .env, app key, sqlite db, migrate, npm install, build
composer run board    # serves on 0.0.0.0 so other devices on your LAN can reach it
```

Then open `http://localhost:8000`. Use `composer run dev` instead of `composer run board` for hot-reload during active development (binds to `localhost` only — not reachable from other LAN devices).

### Windows packaging

The self-contained Windows build is produced by `packaging/windows/build.sh` (run on macOS/Linux) — it downloads a portable PHP runtime, builds production assets, and assembles a zip with hidden `.vbs` launchers. See that script for details if you want to build your own release.

## License

MIT
