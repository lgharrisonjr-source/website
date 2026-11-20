// v30 public-page nav: session-aware Account menu. Register/Welcome header block removed;
// signed-in name shows as a line inside the Account dropdown (customer-supplied name only).
// Read-only session check: uses the account app's sessionStorage token; never writes auth state.
(async () => {
  const $ = (id) => document.getElementById(id);
  const btn = $("nav-settings-btn"), list = $("nav-settings-list"), ll = $("nav-loginlogout"),
        per = $("nav-personal"), dash = $("nav-dashboard"), menu = $("nav-settings"),
        menuName = $("nav-menu-name");
  if (!btn || !list || !ll) return;
  const nt = document.querySelector(".nav-toggle");
  const nav = $("site-nav");
  let navOpenedByMenu = false;
  const collapsed = () => window.matchMedia("(max-width:1240px)").matches;
  const openNavForMenu = () => {
    if (!collapsed() || !nav || nav.classList.contains("open")) return;
    nav.classList.add("open");
    if (nt) nt.setAttribute("aria-expanded", "true");
    navOpenedByMenu = true;
  };
  const closeNavForMenu = () => {
    if (!navOpenedByMenu || !nav) return;
    navOpenedByMenu = false;
    nav.classList.remove("open");
    if (nt) nt.setAttribute("aria-expanded", "false");
  };
  if (nt) nt.addEventListener("click", function () {
    const open = this.getAttribute("aria-expanded") !== "true";
    this.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
    if (!open) close();
  });
  const close = () => { list.hidden = true; btn.setAttribute("aria-expanded", "false"); closeNavForMenu(); };
  const toggle = () => {
    const opening = list.hidden;
    if (opening) openNavForMenu();
    list.hidden = !opening;
    btn.setAttribute("aria-expanded", String(opening));
    if (!opening) closeNavForMenu();
  };
  btn.onclick = toggle;
  document.addEventListener("click", (e) => { if (!list.hidden && !menu.contains(e.target)) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !list.hidden) { close(); btn.focus(); } });
  const setState = (loggedIn, name) => {
    ll.textContent = loggedIn ? "Log out" : "Login";
    per.hidden = !loggedIn; dash.hidden = !loggedIn;
    if (menuName) { const show = !!(loggedIn && name); menuName.hidden = !show; menuName.textContent = show ? name : ""; }
  };
  ll.onclick = () => {
    close();
    if (ll.textContent === "Login") { window.location.href = "login.html"; return; }
    // Sign-out runs only in the account app, which owns the session. Send the user there.
    window.location.href = "login.html#signout";
  };
  per.onclick = () => { close(); window.location.href = "login.html#details"; };
  try {
    const cfg = await (await fetch("config.json", { cache: "no-store" })).json();
    if (!cfg.url) { setState(false); return; }
    const key = Object.keys(sessionStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
    if (!key) { setState(false); return; }
    const raw = JSON.parse(sessionStorage.getItem(key) || "null");
    const tok = raw && raw.access_token;
    if (!tok) { setState(false); return; }
    const r = await fetch(cfg.url + "/auth/v1/user", { headers: { authorization: "Bearer " + tok, apikey: cfg.key } });
    if (!r.ok) { setState(false); return; }
    let name = null;
    try {
      const pr = await fetch(cfg.url + "/rest/v1/rpc/ft360_profile_get", { method: "POST", headers: { authorization: "Bearer " + tok, apikey: cfg.key, "content-type": "application/json" }, body: "{}" });
      if (pr.ok) { const pd = await pr.json(); if (pd && pd.name) name = String(pd.name); }
    } catch (e2) { }
    setState(true, name);
  } catch (e) { setState(false); }
})();
