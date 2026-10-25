// Hand-maintained presentation settings overlay the generated public inventory.
export const CATEGORIES = [
  { id: "mature", title: "Mature projects", blurb: "Established projects, ready to use and still maintained." },
  { id: "wip", title: "Work in progress", blurb: "Projects still being built and improved." },
  { id: "demo", title: "Demos", blurb: "Prototypes, experiments and demonstrations." },
  { id: "tools", title: "Libraries & tools", blurb: "Reusable libraries and practical utilities." },
  { id: "unclassified", title: "Unclassified", blurb: "Projects whose status has not been assigned yet." },
];

export function applyPortfolio(repositories, config) {
  const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  if (!object(config) || config.version !== 1 || !object(config.projects)) {
    throw new Error("config/portfolio.json must contain version: 1 and a projects object.");
  }
  const fields = {
    status: "string", summary: "string", curated: "boolean", featured: "boolean", visible: "boolean",
    liveUrl: "string", downloadUrl: "string", repositoryUrl: "string",
    language: "string", section: "string", tags: "object",
  };
  for (const [name, settings] of Object.entries(config.projects)) {
    if (!object(settings)) throw new Error(`Portfolio settings for ${name} must be an object.`);
    for (const [key, value] of Object.entries(settings)) {
      if (!Object.hasOwn(fields, key) || typeof value !== fields[key] ||
          (key === "tags" && (!Array.isArray(value) || value.some((tag) => typeof tag !== "string" || !tag.trim())))) {
        throw new Error(`Invalid portfolio field ${name}.${key}. See README.md for supported fields.`);
      }
      if (["liveUrl", "downloadUrl", "repositoryUrl"].includes(key)) {
        let url;
        try { url = new URL(value); } catch { /* report the field below */ }
        if (!url || !["https:", "http:"].includes(url.protocol) || url.username || url.password) {
          throw new Error(`Invalid URL in ${name}.${key}: use an absolute HTTP(S) URL without credentials.`);
        }
      }
    }
    if (settings.status && !CATEGORIES.some((category) => category.id === settings.status)) {
      throw new Error(`Invalid status for ${name}: use ${CATEGORIES.map((c) => c.id).join(", ")}.`);
    }
    if (settings.status === "") throw new Error(`Status for ${name} must not be empty.`);
  }
  // A repositoryUrl explicitly opts a public project into the portfolio even if
  // the generated inventory has not caught up yet. Unknown names alone do not.
  const names = new Set(repositories.map((repo) => repo.name));
  const additional = Object.entries(config.projects)
    .filter(([name, settings]) => !names.has(name) && settings.repositoryUrl)
    .map(([name]) => ({ name, curated: true, featured: false, summary: "", language: "",
      section: "other", tags: [], stars: 0, links: {} }));
  return [...repositories, ...additional].map((repo) => ({
    ...repo,
    status: "unclassified",
    visible: false,
    ...(Object.hasOwn(config.projects, repo.name) ? config.projects[repo.name] : {}),
  }));
}
