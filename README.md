# Small Business Forms Hub — Static Site Generator

A data-driven, zero-dependency Node.js (ESM) static site generator that produces **2000 content topics** and **2150+ pure static HTML pages** for a Small Business Forms Hub.

- No frontend framework. Plain HTML/CSS/JS rendered via Node.js template strings.
- No runtime dependencies. Uses only Node built-in modules: `node:fs`, `node:path`, `node:zlib`, `node:http`, `node:crypto`.
- Deterministic: a fixed-seed PRNG (`mulberry32`) makes every build reproducible.

## Quick start

```bash
# Build the site (writes dist/ and content_topics_2000.csv)
node build-site.mjs

# Preview locally at http://localhost:8080
node serve.mjs
```

On Windows with Node not on PATH, use the full path:

```powershell
& "C:\Program Files\nodejs\node.exe" build-site.mjs
& "C:\Program Files\nodejs\node.exe" serve.mjs
```

## Project structure

```
2000-page-site-plan/
├── build-site.mjs          # Main build script (CSV + HTML + PNG + SEO + link check)
├── serve.mjs               # Minimal static file server for dist/
├── package.json            # type:module, scripts: build / preview
├── content_topics_2000.csv # Generated at build time (2000 rows + header)
├── .gitignore
├── README.md
├── src/
│   ├── topics.mjs          # generateTopics() -> 2000 deterministic topic objects
│   ├── site.css            # Site-wide styles (dark slate theme)
│   ├── site.js             # In-site search + 30+ calculators
│   └── assets/             # (build copies fonts/css/js here)
└── dist/                   # Build output (regenerated each build)
    ├── index.html
    ├── {section}/index.html            # 20 section pages
    ├── {section}/{slug}/index.html     # 2000 content pages
    ├── clusters/{slug}/index.html      # ~120 cluster aggregation pages
    ├── types/{type}/index.html         # 5 type archive pages
    ├── {about,contact,...}/index.html  # 8 static pages
    ├── assets/site.css, assets/site.js, assets/og-cover.png
    ├── examples/{slug}.csv             # ~1000 template example CSVs
    ├── site-data.json                  # Front-end search index (2000)
    ├── sitemap.xml
    ├── robots.txt
    └── ads.txt
```

## Data model

Each topic object (and CSV row) includes:

`ID, Section, Cluster, Type, TopicTitle, Keywords, Format, Industry, Difficulty, UseTime`

plus pre-generated fields: `slug` (site-unique kebab-case), `summary`, `description` (150–160 chars).

## Page types

| Type        | Count | Notes                                              |
|-------------|-------|----------------------------------------------------|
| template    | ~1000 | Field table (6–10 rows) + sample preview + CSV dl  |
| tutorial    | ~400  | Numbered steps (5–8) + tips                        |
| calculator  | ~200  | Interactive calculator wired to site.js registry   |
| roundup     | ~240  | Ordered card list (8–15 items)                     |
| comparison  | ~160  | Multi-column comparison table + recommendation     |

## SEO / quality

- Unique `<title>`, meta description, canonical, Open Graph + Twitter Card per page.
- JSON-LD: `WebPage` + `BreadcrumbList` + `FAQPage` (templates also add `Article`).
- Authority sources block citing real `.gov`/`.org` sites (SBA.gov, IRS.gov, ...).
- Related pages computed by cluster similarity (not a fixed list).
- `sitemap.xml` with `<loc>` + `<lastmod>` for all 2150+ URLs.
- Internal link integrity verified at build time (broken links = 0).

## Performance targets

- Full build ≤ 30s.
- Single page HTML ≤ 30KB.
- ≥ 10 internal links per page.

## Disclaimer

This site's templates are for reference only and do not constitute legal, financial, tax, or employment advice. Please consult a licensed professional before use.
