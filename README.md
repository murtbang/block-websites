# Block Websites

A simple, private website blocker for **Firefox**. Add sites to your blocklist and any visit to them (and their subdomains) is redirected to a clean local block page.

> 🤖 **Vibecoded with [Claude](https://claude.com/claude-code).** Planned, written, linted, and packaged through a conversation with Anthropic's Claude Code — see [Credits](#credits).

## Features

- Add or remove sites from a toolbar popup, or **block the current site** in one click.
- Blocks a domain **and all its subdomains** (e.g. `facebook.com` also covers `www.` and `m.facebook.com`).
- Redirects blocked visits to a local "Site blocked" page.
- Master **on/off toggle** — pause blocking without losing your list.
- **No data collection.** Your blocklist is stored locally and never leaves your device. No network requests, no tracking, no accounts.

## Install

### From Firefox Add-ons
_Pending review on [addons.mozilla.org](https://addons.mozilla.org/) — link will go here once published._

### Temporary install (development)

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select `manifest.json` from this folder.

Temporary add-ons are removed when Firefox restarts (your saved blocklist persists).

## How it works

Blocking uses Firefox's [`declarativeNetRequest`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/declarativeNetRequest) API. For each domain on your list, the background script creates a dynamic rule that redirects top-level navigations (for the domain and its subdomains) to the bundled `blocked.html` page. The blocklist lives in `storage.local`. There are **no content scripts** and the extension makes **no network requests**.

## Permissions

| Permission | Why |
|------------|-----|
| `declarativeNetRequest` | Redirect blocked domains to the local block page. |
| `storage` | Save your blocklist and on/off setting locally. |
| `<all_urls>` | Required so the redirect rules can act on any site you choose to block. Used **only** for redirecting — never to read page content. |

## Project structure

| File | Role |
|------|------|
| `manifest.json` | MV3 config, permissions, add-on metadata |
| `background.js` | Syncs the blocklist into `declarativeNetRequest` rules |
| `popup.html` / `.js` / `.css` | Toolbar UI: add/remove sites, on-off toggle, "block current site" |
| `blocked.html` / `.js` / `.css` | The "Site blocked" page shown on a blocked visit |
| `icons/icon.svg` | Toolbar / add-on icon |

## Build & validate

The extension is plain JS/HTML/CSS — **no build step**. To validate and package:

```sh
npx web-ext lint     # validate against Mozilla's rules
npx web-ext build    # produce a distributable .zip
```

## License

[MIT](LICENSE)

## Credits

🤖 Vibecoded with [Claude](https://claude.com/claude-code), Anthropic's agentic coding tool. The design, code, security review, and AMO packaging were all done in a single conversation with Claude.
