# Taxonomy

The public portfolio groups projects by status first. Edit
[`config/portfolio.json`](../config/portfolio.json) to choose a status and write
public summaries; see the [configuration guide](../README.md#configure-the-portfolio).

| Status | Meaning |
|---|---|
| `mature` | Mature projects, ready to use. |
| `wip` | Work in progress. |
| `demo` | Prototypes, experiments and demonstrations. |
| `prototyping` | Game prototypes and engine rebuilds in progress. |
| `tools` | Reusable libraries and practical utilities. |
| `documentation` | Study guides, exercises and reference material. |
| `unclassified` | No status assigned yet; the fallback for new repositories. |

Work in progress and Prototyping... show their subjects as subheadings; the
other groups use a single grid without them. A project without a subject is
listed as a plain card above the subheadings. Language and domain tags
provide independent filters, alongside status and search. Override `tags` in
`config/portfolio.json` to maintain the public tags without editing generated data.

The subjects below come from the generated inventory. Two more are
hand-maintained in `assets/portfolio.mjs` and set with `section` in
`config/portfolio.json`: Learning and Angband.

| Subject | What belongs here |
|---|---|
| Games & Interactive | Playable games, game tooling and reimplementations. |
| Chess & Analysis | Chess collections, analysis pipelines and chess apps. |
| Crusader Kings & Strategy | Save-file parsers, chronicles and mods for Paradox titles. |
| AI, ML & Data | Machine learning, NLP, scrapers and data engineering. |
| Language Learning | Vocabulary, listening and speech tools. |
| DevOps, Cloud & Kubernetes | Certification prep, containers and cloud infrastructure. |
| Developer Tooling & Templates | Reusable harnesses, templates and developer utilities. |
| Web & Media Tools | Web apps, APIs and small media utilities. |
| Other | Uncategorised projects. |
| Learning | Click-driven study apps for languages and technical knowledge. |
| Angband | Neo Angband ports, defect trackers and native Borg consumers. |

## Tags

- `astro`
- `chess`
- `ck3`
- `csharp`
- `game`
- `godot`
- `html`
- `javascript`
- `kubernetes`
- `ml`
- `pascal`
- `php`
- `python`
- `scraping`
- `shell`
- `template`
- `typescript`

## Visibility policy

- Public: original, non-archived projects with portfolio value.
- Private: personal data, interview/recruitment tests, or third-party material.
- Archived: course work, experiments and the upstream forks kept for reference.
