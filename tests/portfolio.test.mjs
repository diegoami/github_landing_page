import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { CATEGORIES, applyPortfolio } from "../assets/portfolio.mjs";

const readJSON = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const inventory = await readJSON("../data/repositories.json");
const config = await readJSON("../config/portfolio.json");

test("the checked-in configuration is valid and refers to current public repos", () => {
  const repos = applyPortfolio(inventory.repositories, config);
  for (const repo of inventory.repositories) assert.ok(repos.some((r) => r.name === repo.name));
  const names = new Set(repos.map((r) => r.name));
  for (const name of Object.keys(config.projects)) assert.ok(names.has(name), name);
  for (const repo of repos) assert.ok(CATEGORIES.some((c) => c.id === repo.status));
});

test("overrides survive inventory refreshes without changing source records or adding repos", () => {
  const source = [{ name: "example", summary: "Generated", curated: false, featured: true }];
  const result = applyPortfolio(source, { version: 1, projects: {
    example: { status: "mature", summary: "My public copy", curated: true, featured: false },
    absent: { status: "demo", curated: true },
  } });
  assert.deepEqual(result, [{ name: "example", status: "mature", visible: false, summary: "My public copy", curated: true, featured: false }]);
  assert.equal(source[0].summary, "Generated");
  assert.deepEqual(applyPortfolio(source, { version: 1, projects: {} }), [{ ...source[0], status: "unclassified", visible: false }]);
});

test("invalid config fails visibly rather than silently misclassifying projects", () => {
  for (const status of ["complete", "", null, 3]) {
    assert.throws(() => applyPortfolio([], { version: 1, projects: { example: { status } } }));
  }
  for (const settings of [{ curated: "false" }, { summary: 3 }, { featured: 1 }, { typo: true },
    { tags: "game" }, { tags: null }, { tags: {} }, { tags: [1] }, { tags: [" "] },
    { liveUrl: "javascript:alert(1)" }, { downloadUrl: "/relative" }, { repositoryUrl: "https://user:pass@example.com" }, null, []]) {
    assert.throws(() => applyPortfolio([], { version: 1, projects: { example: settings } }));
  }
  for (const bad of [null, {}, { version: 2, projects: {} }, { version: 1, projects: [] }]) {
    assert.throws(() => applyPortfolio([], bad));
  }
});

test("explicit supplemental projects render and merge cleanly when the inventory catches up", () => {
  const settings = { version: 1, projects: { newProject: {
    repositoryUrl: "https://github.com/diegoami/newProject", status: "wip", summary: "In development",
  } } };
  const added = applyPortfolio([], settings);
  assert.equal(added.length, 1);
  assert.equal(added[0].name, "newProject");
  assert.equal(added[0].curated, true);
  assert.deepEqual(added[0].tags, []);
  const merged = applyPortfolio([{ name: "newProject", tags: ["game"], curated: true }], settings);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0].tags, ["game"]);
});

// Exercise the actual renderer and its event handlers without third-party deps.
async function renderSite(portfolio, responseOK = true) {
  portfolio = { ...portfolio, projects: {
    ...Object.fromEntries(inventory.repositories.map((r) => [r.name, { visible: true }])),
    ...Object.fromEntries(Object.entries(portfolio.projects).map(([name, value]) => [name, { visible: true, ...value }])),
  } };
  const elements = new Map();
  for (const id of ["app", "stats", "nav", "search", "statusFilter", "langFilter", "tagFilter", "sortFilter"]) {
    elements.set(id, { innerHTML: "", value: "", listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; } });
  }
  const document = {
    querySelector: (sel) => elements.get(sel.slice(1)),
    querySelectorAll: () => [],
    getElementById: (id) => elements.get(id) || (elements.get("app").innerHTML.includes(`id="${id}"`) ? {} : null),
  };
  const context = vm.createContext({
    document, window: {}, CATEGORIES, applyPortfolio,
    fetch: async (url) => ({ ok: url.includes("repositories") || responseOK, status: 404,
      json: async () => url.includes("repositories") ? inventory : portfolio }),
  });
  const source = (await readFile(new URL("../assets/app.js", import.meta.url), "utf8"))
    .replace(/^import .*;\n/, "");
  vm.runInContext(source, context);
  await new Promise((resolve) => setImmediate(resolve));
  const change = (id, value, type = "change") => {
    const element = elements.get(id);
    element.value = value;
    element.listeners[type]({ target: element });
  };
  return { elements, change, html: () => elements.get("app").innerHTML };
}

test("featured and ordinary cards render once in their assigned groups; filters combine", async () => {
  const [a, b, c] = inventory.repositories.filter((r) => r.curated);
  const site = await renderSite({ version: 1, projects: {
    [a.name]: { status: "mature", featured: true, summary: "Unique portfolio copy <script>alert(1)</script>", tags: ["custom-topic"] },
    [b.name]: { status: "wip" },
    [c.name]: { status: "demo" },
  } });
  const html = site.html();
  for (const [repo, status] of [[a, "mature"], [b, "wip"], [c, "demo"]]) {
    const group = html.match(new RegExp(`id="sec-${status}"[\\s\\S]*?</section>`))[0];
    assert.ok(group.includes(`data-name="${repo.name}"`));
    assert.equal(html.split(`data-name="${repo.name}"`).length - 1, 1);
  }
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.ok(site.elements.get("tagFilter").innerHTML.includes("custom-topic"));
  site.change("tagFilter", "custom-topic");
  assert.ok(site.html().includes(`data-name="${a.name}"`));
  assert.ok(!site.html().includes(`data-name="${b.name}"`));
  site.change("tagFilter", "");
  site.change("search", "Unique portfolio copy", "input");
  assert.ok(site.html().includes(`data-name="${a.name}"`), "featured cards remain visible in searches");
  assert.ok(!site.html().includes(`data-name="${b.name}"`));
  assert.ok(site.html().includes('<span class="idx-desc">Unique portfolio copy'));
  site.change("statusFilter", "demo");
  assert.ok(site.html().includes("No projects match your filters."));
  site.change("search", "", "input");
  assert.ok(site.html().includes(`data-name="${c.name}"`));
  assert.ok(!site.html().includes('id="sec-mature"'));
  assert.ok(!site.elements.get("nav").innerHTML.includes("#sec-mature"));
  site.change("langFilter", "nonexistent-language");
  assert.ok(site.html().includes("No projects match your filters."));
});

test("config can promote index entries to cards and keep others index-only", async () => {
  const a = inventory.repositories.find((r) => !r.curated);
  const b = inventory.repositories.find((r) => r.curated);
  const site = await renderSite({ version: 1, projects: {
    [a.name]: { status: "demo", curated: true },
    [b.name]: { status: "mature", curated: false, summary: "Index-only custom description" },
  } });
  assert.ok(site.html().includes(`data-name="${a.name}"`));
  assert.ok(!site.html().includes(`data-name="${b.name}"`));
  assert.ok(site.html().includes("Index-only custom description"));
});

test("hidden projects disappear from cards, the index, search and filter options", async () => {
  const repo = inventory.repositories.find((r) => r.curated);
  const site = await renderSite({ version: 1, projects: {
    [repo.name]: { visible: false, language: "HiddenLanguage", summary: "HiddenUniqueCopy" },
  } });
  assert.ok(!site.html().includes(`data-name="${repo.name}"`));
  assert.ok(!site.html().includes("HiddenUniqueCopy"));
  assert.ok(!site.elements.get("langFilter").innerHTML.includes("HiddenLanguage"));
  site.change("search", "HiddenUniqueCopy", "input");
  assert.ok(site.html().includes("No projects match your filters."));
});

test("missing or malformed configuration displays an actionable error", async () => {
  const missing = await renderSite(config, false);
  assert.ok(missing.html().includes("Could not load config/portfolio.json (404)"));
  const malformed = await renderSite({ version: 1, projects: { example: { status: "typo" } } });
  assert.ok(malformed.html().includes("Invalid status for example"));
});
