// Block Websites — block page logic.
// The background rule redirects here with ?from=<the full blocked URL>.
// We extract just the hostname to show the user which site was blocked.

const from = new URLSearchParams(location.search).get("from") || "";
let host = "";
try { host = new URL(from).hostname; } catch { /* malformed or missing */ }

if (host) {
  document.getElementById("site").textContent = host;
}

document.getElementById("back").addEventListener("click", () => {
  if (history.length > 1) {
    history.back();
  } else {
    location.replace("about:blank");
  }
});
