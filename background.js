// Block Websites — background event page.
// Keeps the browser's declarativeNetRequest (DNR) dynamic rules in sync with
// the user's blocklist in storage. Each blocked domain becomes one rule that
// redirects top-level page loads (and any subdomain) to the local block page.

const api = typeof browser !== "undefined" ? browser : chrome;

// Escape a string so it is safe to embed literally inside a regex.
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Build one DNR rule for a domain.
// regexFilter matches: scheme://[any.sub.]domain[ :port | /path | ?query | #frag ]
// regexSubstitution sends the *whole* matched URL (\0) to the block page so it
// can show which site was blocked.
function buildRule(domain, id, blockPageBase) {
  const d = escapeRegex(domain);
  return {
    id,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { regexSubstitution: blockPageBase + "?from=\\0" }
    },
    condition: {
      regexFilter: `^https?://([^/?#]*\\.)?${d}([/:?#].*)?$`,
      resourceTypes: ["main_frame"]
    }
  };
}

// Replace every dynamic rule with a fresh set built from current storage.
async function syncRules() {
  const { blocklist = [], enabled = true } =
    await api.storage.local.get(["blocklist", "enabled"]);

  const existing = await api.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);

  let addRules = [];
  if (enabled && blocklist.length) {
    const blockPageBase = api.runtime.getURL("blocked.html");
    addRules = blocklist.map((domain, i) => buildRule(domain, i + 1, blockPageBase));
  }

  await api.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
}

// Re-sync whenever the extension starts...
api.runtime.onInstalled.addListener(syncRules);
api.runtime.onStartup.addListener(syncRules);

// ...whenever the blocklist or on/off flag changes...
api.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.blocklist || changes.enabled)) {
    syncRules();
  }
});

// ...and when the popup explicitly asks (e.g. after a permission grant).
api.runtime.onMessage.addListener((msg) => {
  if (msg === "sync") syncRules();
});
