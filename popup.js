// Block Websites — popup UI logic.

const api = typeof browser !== "undefined" ? browser : chrome;
const ALL_URLS = { origins: ["<all_urls>"] };

const els = {
  enabled: document.getElementById("enabled"),
  input: document.getElementById("siteInput"),
  addBtn: document.getElementById("addBtn"),
  blockCurrentBtn: document.getElementById("blockCurrentBtn"),
  list: document.getElementById("list"),
  empty: document.getElementById("empty"),
  status: document.getElementById("status"),
  permBanner: document.getElementById("permBanner"),
  grantBtn: document.getElementById("grantBtn"),
};

// Turn arbitrary user input ("https://www.Foo.com/bar?x=1") into a bare,
// lower-cased registrable host ("foo.com"). Returns null if it isn't a domain.
function normalizeDomain(raw) {
  if (!raw) return null;
  let s = String(raw).trim().toLowerCase();
  if (!s) return null;
  let host;
  try {
    const u = new URL(/^[a-z]+:\/\//.test(s) ? s : "http://" + s);
    host = u.hostname;
  } catch {
    host = s.replace(/^[a-z]+:\/\//, "").split(/[/?#]/)[0];
  }
  if (!host) return null;
  if (host.startsWith("www.")) host = host.slice(4);
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return null;
  return host;
}

async function getState() {
  const { blocklist = [], enabled = true } =
    await api.storage.local.get(["blocklist", "enabled"]);
  return { blocklist, enabled };
}

async function setBlocklist(list) {
  const unique = [...new Set(list)].sort();
  await api.storage.local.set({ blocklist: unique });
  api.runtime.sendMessage("sync").catch(() => {});
  return unique;
}

let statusTimer;
function flash(msg) {
  els.status.textContent = msg;
  clearTimeout(statusTimer);
  if (msg) statusTimer = setTimeout(() => { els.status.textContent = ""; }, 2200);
}

function render(state) {
  els.enabled.checked = state.enabled;
  els.list.innerHTML = "";
  if (!state.blocklist.length) {
    els.empty.classList.remove("hidden");
  } else {
    els.empty.classList.add("hidden");
    for (const domain of state.blocklist) {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.className = "domain";
      span.textContent = domain;
      const btn = document.createElement("button");
      btn.className = "remove";
      btn.title = `Remove ${domain}`;
      btn.textContent = "✕";
      btn.addEventListener("click", () => removeDomain(domain));
      li.append(span, btn);
      els.list.append(li);
    }
  }
  els.list.classList.toggle("disabled", !state.enabled);
}

async function refresh() {
  render(await getState());
}

async function addDomain(raw) {
  const domain = normalizeDomain(raw);
  if (!domain) { flash("Enter a valid domain, e.g. example.com"); return; }
  const { blocklist } = await getState();
  if (blocklist.includes(domain)) { flash(`${domain} is already blocked`); return; }
  await setBlocklist([...blocklist, domain]);
  els.input.value = "";
  flash(`Blocked ${domain}`);
  refresh();
}

async function removeDomain(domain) {
  const { blocklist } = await getState();
  await setBlocklist(blocklist.filter((d) => d !== domain));
  flash(`Removed ${domain}`);
  refresh();
}

els.addBtn.addEventListener("click", () => addDomain(els.input.value));
els.input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addDomain(els.input.value);
});

els.enabled.addEventListener("change", async () => {
  await api.storage.local.set({ enabled: els.enabled.checked });
  api.runtime.sendMessage("sync").catch(() => {});
  flash(els.enabled.checked ? "Blocking on" : "Blocking off");
  refresh();
});

els.blockCurrentBtn.addEventListener("click", async () => {
  try {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    const domain = tab && tab.url ? normalizeDomain(tab.url) : null;
    if (!domain) { flash("This page can't be blocked"); return; }
    addDomain(domain);
  } catch {
    flash("Can't read the current tab");
  }
});

els.grantBtn.addEventListener("click", async () => {
  try {
    const granted = await api.permissions.request(ALL_URLS);
    if (granted) {
      els.permBanner.classList.add("hidden");
      api.runtime.sendMessage("sync").catch(() => {});
      flash("Blocking enabled");
    }
  } catch { /* user dismissed */ }
});

async function checkPermission() {
  try {
    const has = await api.permissions.contains(ALL_URLS);
    els.permBanner.classList.toggle("hidden", has);
  } catch {
    els.permBanner.classList.add("hidden");
  }
}

checkPermission();
refresh();
