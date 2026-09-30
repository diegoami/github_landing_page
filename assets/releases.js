/* Public directory of software release repositories for beta testers. */
(() => {
  "use strict";

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));

  function projectName(repository) {
    return repository.replace(/-releases$/i, "").replace(/[-_]+/g, " ")
      .replace(/\bjs\b/gi, "JS")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function render(repository, allRepositories) {
    const name = projectName(repository.name);
    const source = allRepositories.find((candidate) =>
      candidate.name.toLowerCase() === repository.name.replace(/-releases$/i, "").toLowerCase()
    );
    const summary = repository.description || source?.summary ||
      `Beta builds and release notes for ${name}.`;
    const repoUrl = repository.links?.repo || repository.url;
    const releasesUrl = `${repoUrl.replace(/\/$/, "")}/releases`;

    return `<article class="card release-card">
      <div class="card-top">
        <h3>${esc(name)}</h3>
        <span class="badge release-badge">Beta</span>
      </div>
      <p class="summary">${esc(summary)}</p>
      <p class="release-hint">Browse versions, download the build for your device, and check the release notes.</p>
      <div class="links">
        <a class="live" href="${esc(releasesUrl)}" target="_blank" rel="noopener">Browse releases &amp; downloads</a>
        <a href="${esc(repoUrl)}" target="_blank" rel="noopener">Repository</a>
      </div>
    </article>`;
  }

  async function main() {
    const root = document.querySelector("#releases");
    const stats = document.querySelector("#release-stats");
    try {
      const response = await fetch("data/repositories.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Could not load release directory (${response.status}).`);
      const data = await response.json();
      const repositories = data.repositories || [];
      const releases = repositories
        .filter((repository) => /-releases$/i.test(repository.name) && repository.links?.repo)
        .sort((a, b) => a.name.localeCompare(b.name));

      stats.innerHTML = `<span class="stat"><b>${releases.length}</b> beta channels</span>`;
      root.innerHTML = releases.length
        ? releases.map((repository) => render(repository, repositories)).join("")
        : `<p class="empty">No release repositories are listed yet.</p>`;
    } catch (error) {
      root.innerHTML = `<p class="empty">${esc(error.message)}</p>`;
      stats.innerHTML = "";
    }
  }

  main();
})();
