/* Portfolio renderer for diegoami's repositories.
 * Shared by the public page and the private admin page; the only difference
 * is window.__SITE_MODE__ ("public" | "admin") and which data file is loaded.
 */
(() => {
  "use strict";

  const MODE = window.__SITE_MODE__ === "admin" ? "admin" : "public";
  const ADMIN = MODE === "admin";
  const DATA_URL = "data/repositories.json";

  const LANG_COLORS = {
    Python: "#3572A5", JavaScript: "#f1e05a", TypeScript: "#3178c6", "C#": "#178600",
    GDScript: "#355570", Pascal: "#E3F171", Java: "#b07219", Scala: "#c22d40",
    HTML: "#e34c26", Astro: "#ff5a03", Shell: "#89e051", "Jupyter Notebook": "#DA5B0B",
    PHP: "#4F5D95", "C++": "#f34b7d", TeX: "#3D6117", "Vim Script": "#199f4b",
    Dockerfile: "#384d54", HCL: "#844FBA", YAML: "#cb171e", MDX: "#fcb32c",
    Jinja: "#a52a2a", Mustache: "#724b3b", XSLT: "#EB8CEB", Roff: "#ecdebe",
    PLpgSQL: "#336790", "DIGITAL Command Language": "#8b949e",
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const state = { all: [], filtered: [], query: "", tag: "", lang: "", vis: "all", sort: "name" };

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function langDot(lang) {
    if (!lang) return "";
    const c = LANG_COLORS[lang] || "#8b949e";
    return `<span class="lang-dot" style="background:${c}"></span>`;
  }

  function badges(r) {
    const b = [];
    if (ADMIN) {
      if (r.recommendMakePublic) b.push(`<span class="badge make-public">Make public</span>`);
      if (r.githubPrivate) b.push(`<span class="badge private">Private</span>`);
      if (r.githubArchived) b.push(`<span class="badge archived">Archived</span>`);
      if (r.isFork) b.push(`<span class="badge fork">Fork</span>`);
    } else if (r.featured) {
      b.push(`<span class="badge make-public">Featured</span>`);
    }
    return b.length ? `<div class="badges">${b.join("")}</div>` : "";
  }

  function links(r) {
    const out = [`<a href="${esc(r.links.repo)}" target="_blank" rel="noopener">Repository</a>`];
    if (r.links.pages) out.push(`<a class="live" href="${esc(r.links.pages)}" target="_blank" rel="noopener">Live site</a>`);
    if (r.links.homepage && r.links.homepage !== r.links.pages)
      out.push(`<a href="${esc(r.links.homepage)}" target="_blank" rel="noopener">Homepage</a>`);
    return `<div class="links">${out.join("")}</div>`;
  }

  function card(r) {
    const cls = ["card"];
    if (r.featured) cls.push("featured");
    if (ADMIN) {
      if (r.githubPrivate) cls.push("is-private");
      else if (r.githubArchived || r.visibility === "archived") cls.push("is-archived");
      if (r.isFork) cls.push("is-fork");
    }
    const tags = r.tags.map((t) => `<span class="tag" data-tag="${esc(t)}">${esc(t)}</span>`).join("");
    const meta = [
      r.language ? `<span>${langDot(r.language)}${esc(r.language)}</span>` : "",
      r.stars ? `<span>★ ${r.stars}</span>` : "",
      r.pushedAt ? `<span>updated ${fmtDate(r.pushedAt)}</span>` : "",
      ADMIN ? `<span>${esc(r.visibility)}</span>` : "",
    ]
      .filter(Boolean)
      .join("");

    const reason = ADMIN && r.reason ? `<div class="reason"><b>Why:</b> ${esc(r.reason)}</div>` : "";

    return `
      <article class="${cls.join(" ")}" data-name="${esc(r.name)}">
        <div class="card-top">
          <h4><a href="${esc(r.links.repo)}" target="_blank" rel="noopener">${esc(r.name)}</a></h4>
          ${badges(r)}
        </div>
        <p class="summary">${esc(r.summary)}</p>
        <div class="meta">${meta}</div>
        ${tags ? `<div class="tags">${tags}</div>` : ""}
        ${reason}
        ${links(r)}
      </article>`;
  }

  function matches(r) {
    if (state.query) {
      const q = state.query.toLowerCase();
      const hay = [r.name, r.summary, r.description, r.language, r.subsection, ...(r.tags || [])]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (state.tag && !(r.tags || []).includes(state.tag)) return false;
    if (state.lang && r.language !== state.lang) return false;
    if (ADMIN && state.vis !== "all") {
      if (state.vis === "make-public") { if (!r.recommendMakePublic) return false; }
      else if (state.vis === "public") { if (r.visibility !== "public") return false; }
      else if (state.vis === "private") { if (r.visibility !== "private") return false; }
      else if (state.vis === "archived") { if (r.visibility !== "archived" && !r.githubArchived) return false; }
      else if (state.vis === "fork") { if (!r.isFork) return false; }
    }
    return true;
  }

  function sortRepos(list) {
    const by = {
      name: (a, b) => a.name.localeCompare(b.name),
      pushed: (a, b) => (b.pushedAt || "").localeCompare(a.pushedAt || ""),
      stars: (a, b) => b.stars - a.stars || a.name.localeCompare(b.name),
    };
    return [...list].sort(by[state.sort] || by.name);
  }

  function sectionList(meta) {
    return (meta.sections || []).filter((s) => s.id !== "featured" && (ADMIN || s.public));
  }

  function render() {
    const root = $("#app");
    const meta = state.meta;
    state.filtered = state.all.filter(matches);

    const featured = ADMIN
      ? []
      : sortRepos(state.filtered.filter((r) => r.featured));

    const usedSections = sectionList(meta);
    const featuredNames = new Set(featured.map((r) => r.name));

    let html = `<div class="result-count" style="margin-bottom:14px">Showing <b>${state.filtered.length}</b> of ${state.all.length} projects</div>`;

    if (featured.length && !state.query && !state.tag && !state.lang && state.sort === "name") {
      html += `<section class="section"><div class="section-head"><h2>Featured Projects</h2><p>Hand-picked highlights.</p></div><div class="grid featured">${featured.map(card).join("")}</div></section>`;
    }

    for (const s of usedSections) {
      const repos = sortRepos(
        state.filtered.filter(
          (r) => r.section === s.id && !(featuredNames.has(r.name))
        )
      );
      if (!repos.length) continue;

      const subs = {};
      for (const r of repos) (subs[r.subsection || "General"] ??= []).push(r);

      let inner = "";
      const subKeys = Object.keys(subs).sort();
      for (const k of subKeys) {
        inner += `<div class="subsection"><h3>${esc(k)}</h3><div class="grid">${subs[k].map(card).join("")}</div></div>`;
      }

      html += `<section class="section" id="sec-${esc(s.id)}">
        <div class="section-head">
          <h2>${esc(s.title)} <span class="count">${repos.length}</span></h2>
          <p>${esc(s.blurb || "")}</p>
        </div>
        ${inner}
      </section>`;
    }

    if (!state.filtered.length) html += `<p class="empty">No projects match your filters.</p>`;
    root.innerHTML = html;

    document.querySelectorAll(".tag").forEach((el) =>
      el.addEventListener("click", () => {
        state.tag = el.dataset.tag === state.tag ? "" : el.dataset.tag;
        const sel = $("#tagFilter");
        if (sel) sel.value = state.tag;
        render();
      })
    );
  }

  function buildNav(meta) {
    const nav = $("#nav");
    if (!nav) return;
    const links = sectionList(meta)
      .map((s) => `<a class="stat" href="#sec-${esc(s.id)}">${esc(s.title)}</a>`)
      .join("");
    nav.innerHTML = links;
  }

  function fillSelects(meta) {
    const langs = [...new Set(state.all.map((r) => r.language).filter(Boolean))].sort();
    const tags = [...new Set(state.all.flatMap((r) => r.tags || []))].sort();
    const langSel = $("#langFilter");
    const tagSel = $("#tagFilter");
    if (langSel) langSel.innerHTML = `<option value="">All languages</option>` + langs.map((l) => `<option value="${esc(l)}">${esc(l)}</option>`).join("");
    if (tagSel) tagSel.innerHTML = `<option value="">All tags</option>` + tags.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join("");
  }

  function wire() {
    $("#search").addEventListener("input", (e) => { state.query = e.target.value.trim(); render(); });
    $("#langFilter").addEventListener("change", (e) => { state.lang = e.target.value; render(); });
    $("#tagFilter").addEventListener("change", (e) => { state.tag = e.target.value; render(); });
    const sortSel = $("#sortFilter");
    if (sortSel) sortSel.addEventListener("change", (e) => { state.sort = e.target.value; render(); });
    const visSel = $("#visFilter");
    if (visSel) visSel.addEventListener("change", (e) => { state.vis = e.target.value; render(); });
  }

  async function main() {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) {
      $("#app").innerHTML = `<p class="empty">Could not load ${DATA_URL} (${res.status}).</p>`;
      return;
    }
    const data = await res.json();
    state.meta = data.meta;
    state.all = data.repositories;

    const c = data.meta.counts || {};
    const stats = $("#stats");
    if (stats) {
      const items = ADMIN
        ? [
            ["Projects", data.meta.totalRepos],
            ["Public", c.public],
            ["Private", c.private],
            ["Archived", c.archived],
            ["To make public", c.recommendMakePublic],
          ]
        : [
            ["Projects", state.all.length],
            ["Languages", new Set(state.all.map((r) => r.language).filter(Boolean)).size],
            ["With live site", state.all.filter((r) => r.links.pages).length],
            ["Sections", sectionList(data.meta).length],
          ];
      stats.innerHTML = items.map(([k, v]) => `<span class="stat"><b>${v ?? 0}</b> ${esc(k)}</span>`).join("");
    }

    fillSelects(data.meta);
    buildNav(data.meta);
    wire();
    render();
  }

  main().catch((e) => {
    const root = $("#app");
    if (root) root.innerHTML = `<p class="empty">Error: ${esc(e.message)}</p>`;
  });
})();
