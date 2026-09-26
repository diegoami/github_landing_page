/* Encrypted admin dashboard.
 *
 * The full repository inventory ships as AES-GCM ciphertext
 * (data/repositories.admin.enc.json); this page asks for the passphrase,
 * derives the key with PBKDF2-SHA256 (WebCrypto) and renders the dashboard in
 * the browser. Nothing sensitive is ever served in the clear.
 */
(() => {
  "use strict";

  const DATA = "data/repositories.admin.enc.json";
  const LANG_COLORS = {
    Python: "#3572A5", JavaScript: "#f1e05a", TypeScript: "#3178c6", "C#": "#178600",
    GDScript: "#355570", Pascal: "#E3F171", Java: "#b07219", Scala: "#c22d40",
    HTML: "#e34c26", Astro: "#ff5a03", Shell: "#89e051", "Jupyter Notebook": "#DA5B0B",
    PHP: "#4F5D95", "C++": "#f34b7d", TeX: "#3D6117", "Vim Script": "#199f4b",
    Dockerfile: "#384d54", HCL: "#844FBA", YAML: "#cb171e", MDX: "#fcb32c",
    Jinja: "#a52a2a", Mustache: "#724b3b", XSLT: "#EB8CEB", Roff: "#ecdebe",
    PLpgSQL: "#336790",
  };

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let META = null;
  let ALL = [];
  const state = { query: "", vis: "all", lang: "", section: "", sort: "name" };

  const b64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "");

  async function decrypt(payload, passphrase) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: b64ToBytes(payload.salt), iterations: payload.iterations, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(payload.iv) },
      key,
      b64ToBytes(payload.ciphertext)
    );
    return JSON.parse(new TextDecoder().decode(pt));
  }

  // ---------------------------------------------------------------- gate
  function renderGate(message) {
    $("#app").innerHTML = `
      <form class="gate" id="gateForm" autocomplete="off">
        <h2>Admin overview</h2>
        <p>Enter the passphrase to decrypt your full repository inventory.</p>
        <label for="pass">Passphrase</label>
        <input id="pass" type="password" autocomplete="current-password" />
        <button type="submit">Unlock</button>
        <div class="error" id="gateError">${message ? esc(message) : ""}</div>
        <p class="hint">The data is encrypted (AES-GCM, PBKDF2-SHA256). Nothing is readable without the passphrase.</p>
      </form>`;
    $("#gateForm").addEventListener("submit", onUnlock);
  }

  let PAYLOAD = null;

  async function onUnlock(e) {
    e.preventDefault();
    const pass = $("#pass").value;
    if (!pass) return;
    $("#gateError").textContent = "";
    try {
      const data = await decrypt(PAYLOAD, pass);
      META = data.meta;
      ALL = data.repositories;
      sessionStorage.setItem("adminPass", pass);
      renderDashboard();
    } catch (err) {
      renderGate("Wrong passphrase.");
    }
  }

  // ------------------------------------------------------------ dashboard
  function barPanel(title, entries) {
    const max = Math.max(1, ...entries.map((e) => e[1]));
    const rows = entries
      .map(
        ([label, n]) =>
          `<div class="bar-row"><span class="bar-label" title="${esc(label)}">${esc(label)}</span><span class="bar-track"><span class="bar-fill" style="width:${(n / max) * 100}%"></span></span><span class="bar-num">${n}</span></div>`
      )
      .join("");
    return `<div class="panel"><h3>${esc(title)}</h3>${rows || '<p class="empty">—</p>'}</div>`;
  }

  function countBy(fn) {
    const m = new Map();
    for (const r of ALL) {
      const k = fn(r) || "—";
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }

  function sectionTitle(id) {
    const s = (META.sections || []).find((x) => x.id === id);
    return s ? s.title : id;
  }

  function matches(r) {
    if (state.query) {
      const q = state.query.toLowerCase();
      const hay = [r.name, r.summary, r.description, r.language, r.section, r.subsection, ...(r.tags || []), r.reason].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (state.vis !== "all") {
      if (state.vis === "make-public") { if (!r.recommendMakePublic) return false; }
      else if (state.vis === "public") { if (!(r.visibility === "public" && !r.githubPrivate)) return false; }
      else if (state.vis === "private") { if (r.visibility !== "private") return false; }
      else if (state.vis === "archived") { if (!(r.visibility === "archived" || r.githubArchived)) return false; }
      else if (state.vis === "fork") { if (!r.isFork) return false; }
    }
    if (state.lang && r.language !== state.lang) return false;
    if (state.section && r.section !== state.section) return false;
    return true;
  }

  function sortRows(list) {
    const by = {
      name: (a, b) => a.name.localeCompare(b.name),
      pushed: (a, b) => (b.pushedAt || "").localeCompare(a.pushedAt || ""),
      stars: (a, b) => b.stars - a.stars || a.name.localeCompare(b.name),
      section: (a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name),
    };
    return [...list].sort(by[state.sort] || by.name);
  }

  function recBadge(r) {
    if (r.visibility === "public" && r.githubPrivate) return `<span class="badge make-public">Publish</span>`;
    if (r.visibility === "public") return `<span class="badge archived">Public</span>`;
    if (r.visibility === "private") return `<span class="badge private">Private</span>`;
    return `<span class="badge archived">Archived</span>`;
  }

  function ghState(r) {
    const b = [];
    if (r.githubPrivate) b.push(`<span class="badge private">private</span>`);
    if (r.githubArchived) b.push(`<span class="badge archived">archived</span>`);
    if (r.isFork) b.push(`<span class="badge fork">fork</span>`);
    return b.length ? b.join(" ") : `<span class="badge archived">public</span>`;
  }

  function tableRows(list) {
    if (!list.length) return `<tr><td colspan="9">No repositories match the filters.</td></tr>`;
    return list
      .map(
        (r) => `<tr>
          <td class="name"><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}</a></td>
          <td>${recBadge(r)}</td>
          <td>${ghState(r)}</td>
          <td>${esc(r.language || "—")}</td>
          <td>${esc(sectionTitle(r.section))}<br><span class="cell-tags">${esc(r.subsection || "")}</span></td>
          <td class="cell-tags">${esc((r.tags || []).join(", ") || "—")}</td>
          <td>${r.stars ? "★ " + r.stars : "—"}</td>
          <td>${fmtDate(r.pushedAt)}</td>
          <td><a href="${esc(r.url)}" target="_blank" rel="noopener">repo</a>${r.links.pages ? ` · <a href="${esc(r.links.pages)}" target="_blank" rel="noopener">live</a>` : ""}</td>
          <td class="why">${esc(r.reason || "")}</td>
        </tr>`
      )
      .join("");
  }

  function renderDashboard() {
    const c = META.counts;
    const langs = [...new Set(ALL.map((r) => r.language).filter(Boolean))].sort();
    const sections = (META.sections || []).filter((s) => s.id !== "featured");
    const filtered = sortRows(ALL.filter(matches));

    const stats = [
      ["Total", META.totalRepos],
      ["Public (curated)", c.public],
      ["Private", c.private],
      ["Archived", c.archived],
      ["Archived on GitHub", ALL.filter((r) => r.githubArchived).length],
      ["Forks", c.forks],
      ["To publish", c.recommendMakePublic],
    ];

    $("#app").innerHTML = `
      <div class="stats" style="margin-bottom:22px">
        ${stats.map(([k, v]) => `<span class="stat"><b>${v ?? 0}</b> ${esc(k)}</span>`).join("")}
      </div>
      <div class="panels">
        ${barPanel("By section", countBy((r) => sectionTitle(r.section)))}
        ${barPanel("By language (top 12)", countBy((r) => r.language).slice(0, 12))}
        ${barPanel("By recommendation", [["public", c.public], ["private", c.private], ["archived", c.archived]])}
      </div>
      <div class="controls" style="position:static;margin:0 0 14px;border:1px solid var(--border);border-radius:var(--radius);padding:12px">
        <div class="controls-inner">
          <input id="search" type="search" placeholder="Search all repositories…" />
          <select id="visFilter">
            <option value="all">All visibilities</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="archived">Archived</option>
            <option value="fork">Forks</option>
            <option value="make-public">Recommended to publish</option>
          </select>
          <select id="langFilter"><option value="">All languages</option>${langs.map((l) => `<option value="${esc(l)}">${esc(l)}</option>`).join("")}</select>
          <select id="sectionFilter"><option value="">All sections</option>${sections.map((s) => `<option value="${esc(s.id)}">${esc(s.title)}</option>`).join("")}</select>
          <select id="sortFilter">
            <option value="name">Sort: name</option>
            <option value="pushed">Sort: recently updated</option>
            <option value="stars">Sort: stars</option>
            <option value="section">Sort: section</option>
          </select>
          <button class="btn" id="lockBtn" type="button">Lock</button>
          <span class="result-count" id="count"></span>
        </div>
      </div>
      <div class="table-wrap">
        <table class="repos">
          <thead><tr>
            <th>Repository</th><th>Recommended</th><th>GitHub</th><th>Language</th>
            <th>Section</th><th>Tags</th><th>★</th><th>Updated</th><th>Links</th><th>Why</th>
          </tr></thead>
          <tbody id="tbody">${tableRows(filtered)}</tbody>
        </table>
      </div>
      <p class="appendix-note" style="margin-top:12px">Decrypted locally in your browser. Generated ${esc(fmtDate(META.generatedAt))}.</p>`;

    $("#count").textContent = `${filtered.length} of ${ALL.length}`;
    $("#search").addEventListener("input", (e) => { state.query = e.target.value.trim(); refresh(); });
    $("#visFilter").addEventListener("change", (e) => { state.vis = e.target.value; refresh(); });
    $("#langFilter").addEventListener("change", (e) => { state.lang = e.target.value; refresh(); });
    $("#sectionFilter").addEventListener("change", (e) => { state.section = e.target.value; refresh(); });
    $("#sortFilter").addEventListener("change", (e) => { state.sort = e.target.value; refresh(); });
    $("#lockBtn").addEventListener("click", () => {
      sessionStorage.removeItem("adminPass");
      ALL = []; META = null;
      renderGate();
      window.scrollTo(0, 0);
    });
  }

  function refresh() {
    const filtered = sortRows(ALL.filter(matches));
    $("#tbody").innerHTML = tableRows(filtered);
    $("#count").textContent = `${filtered.length} of ${ALL.length}`;
  }

  // ---------------------------------------------------------------- boot
  async function main() {
    renderGate();
    const res = await fetch(DATA, { cache: "no-store" });
    if (!res.ok) {
      renderGate(`Could not load ${DATA} (${res.status}).`);
      return;
    }
    PAYLOAD = await res.json();
    const saved = sessionStorage.getItem("adminPass");
    if (saved) {
      try {
        const data = await decrypt(PAYLOAD, saved);
        META = data.meta;
        ALL = data.repositories;
        renderDashboard();
      } catch {
        sessionStorage.removeItem("adminPass");
      }
    }
  }

  main().catch((e) => renderGate(e.message));
})();
