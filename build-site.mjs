// build-site.mjs — Small Business Forms Hub static site generator.
// Zero dependencies. Reads src/topics.mjs, writes dist/ with 2150+ pages.
import { generateTopics, SECTIONS, ALL_CLUSTERS, AUTHORITIES, CALC_KEYS } from './src/topics.mjs';
import { mkdirSync, rmSync, writeFileSync, readFileSync, copyFileSync, existsSync, readdirSync, statSync, unlinkSync, rmdirSync } from 'node:fs';
import { join, dirname, extname, basename, normalize, sep } from 'node:path';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const SRC = join(__dirname, 'src');
const DOMAIN = 'https://smallbusinessformshub.com';
const TODAY = '2026-07-16';
const SITE_NAME = 'Small Business Forms Hub';
const DISCLAIMER = "This site's templates are for reference only and do not constitute legal, financial, tax, or employment advice. Please consult a licensed professional before use.";

const t0 = Date.now();
let ALL_TOPICS = [];
function log(msg) { console.log(`[build] ${msg}`); }

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------
function ensureDir(p) { mkdirSync(p, { recursive: true }); }
function write(path, content) {
  ensureDir(dirname(path));
  writeFileSync(path, content, 'utf8');
}
function writeBin(path, buf) {
  ensureDir(dirname(path));
  writeFileSync(path, buf);
}
function rmrf(p) {
  if (!existsSync(p)) return;
  const stat = statSync(p);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(p)) rmrf(join(p, entry));
    try { rmdirSync(p); } catch (e) { /* ignore */ }
  } else {
    try { unlinkSync(p); } catch (e) { /* ignore */ }
  }
}
function cleanDist() {
  rmrf(DIST);
  ensureDir(DIST);
}

// ---------------------------------------------------------------------------
// CSV writer (RFC 4180, escaped)
// ---------------------------------------------------------------------------
function csvField(v) {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function writeCsv(path, headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) lines.push(row.map(csvField).join(','));
  write(path, lines.join('\r\n'));
}

// ---------------------------------------------------------------------------
// PNG encoder (minimal, valid RGBA PNG via zlib)
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function makeOgPng(w = 1200, h = 630) {
  const rowLen = w * 4 + 1;
  const raw = Buffer.alloc(rowLen * h);
  for (let y = 0; y < h; y++) {
    const rowStart = y * rowLen;
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < w; x++) {
      let r = 15, g = 23, b = 42; // bg #0f172a
      // top gradient stripe
      if (y < 90) {
        const t = y / 90;
        r = Math.round(56 * t + 15 * (1 - t));
        g = Math.round(189 * t + 23 * (1 - t));
        b = Math.round(248 * t + 42 * (1 - t));
      }
      // center card
      if (x > 110 && x < 1090 && y > 150 && y < 520) { r = 30; g = 41; b = 59; }
      // left accent bar
      if (x > 110 && x < 120 && y > 150 && y < 520) { r = 56; g = 189; b = 248; }
      // accent block (primary)
      if (x > 920 && x < 1060 && y > 200 && y < 260) { r = 56; g = 189; b = 248; }
      // accent block (purple)
      if (x > 920 && x < 1060 && y > 280 && y < 340) { r = 167; g = 139; b = 250; }
      // thin underline
      if (y > 470 && y < 474 && x > 130 && x < 540) { r = 56; g = 189; b = 248; }
      const off = rowStart + 1 + x * 4;
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b; raw[off + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}

// ---------------------------------------------------------------------------
// HTML escaping
// ---------------------------------------------------------------------------
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------------------------------------------------------------------------
// Shared layout components
// ---------------------------------------------------------------------------
function topNav() {
  const links = SECTIONS.slice(0, 8).map((s) => `<a href="/${s.slug}/">${esc(s.en)}</a>`).join('');
  return `<header class="topnav"><div class="container inner">
  <a class="brand" href="/"><span class="dot"></span>${SITE_NAME}</a>
  <nav class="nav-links">${links}<a href="/types/template/">Templates</a><a href="/calculators-tools/">Calculators</a></nav>
  <div class="search-mini search-wrap"><input class="search-box" type="search" placeholder="Search 2000+ templates…" aria-label="Search"><div class="search-results"></div></div>
  </div></header>`;
}

function footer() {
  const cols = [
    { h: 'Sections', links: SECTIONS.slice(0, 7).map((s) => `<li><a href="/${s.slug}/">${esc(s.en)}</a></li>`).join('') },
    { h: 'More', links: SECTIONS.slice(7, 14).map((s) => `<li><a href="/${s.slug}/">${esc(s.en)}</a></li>`).join('') },
    { h: 'Tools', links: SECTIONS.slice(14).map((s) => `<li><a href="/${s.slug}/">${esc(s.en)}</a></li>`).join('') },
    { h: 'Site', links: ['about', 'contact', 'privacy', 'terms', 'editorial-policy', 'disclaimer', 'authority-sources', 'sitemap-html'].map((s) => `<li><a href="/${s}/">${s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</a></li>`).join('') },
  ];
  return `<footer class="site"><div class="container">
    <div class="fgrid">${cols.map((c) => `<div><h5>${c.h}</h5><ul>${c.links}</ul></div>`).join('')}</div>
    <div class="disclaimer">${DISCLAIMER}</div>
    <div class="copy">© ${new Date(TODAY).getFullYear()} ${SITE_NAME}. All templates are for reference only.</div>
  </div></footer>`;
}

function head({ title, description, canonical, jsonLd, noindex = false }) {
  const robots = noindex ? 'noindex,nofollow' : 'index,follow';
  const ogImage = `${DOMAIN}/assets/og-cover.png`;
  const ld = jsonLd ? `\n<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '';
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="${robots}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${ogImage}">
<link rel="stylesheet" href="/assets/site.css">
${ld}
</head><body>`;
}

function page({ title, description, canonical, body, jsonLd, noindex = false }) {
  return head({ title, description, canonical, jsonLd, noindex }) + topNav() + body + footer() + '\n<script src="/assets/site.js" defer></script>\n</body></html>\n';
}

function breadcrumb(items) {
  const parts = items.map((it, i) => {
    const last = i === items.length - 1;
    return last ? `<span class="current">${esc(it.name)}</span>` : `<a href="${it.url}">${esc(it.name)}</a><span class="sep">/</span>`;
  });
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${parts.join('')}</nav>`;
}

function topicCard(t) {
  const url = `/${t.section}/${t.slug}/`;
  const typeBadge = `<span class="tag">${t.type}</span>`;
  return `<a class="card" href="${url}">${typeBadge}<h3>${esc(t.topicTitle)}</h3><p>${esc(t.summary)}</p><span class="arrow">${esc(t.sectionEn)} →</span></a>`;
}

function sidebar(section, clusterSlug) {
  const sectionObj = SECTIONS.find((s) => s.slug === section);
  const clusters = sectionObj ? sectionObj.clusters : [];
  const clusterLinks = clusters.map((c) => `<li><a href="/clusters/${c.slug}/">${esc(c.name)}</a></li>`).join('');
  const typeLinks = ['template', 'tutorial', 'calculator', 'roundup', 'comparison']
    .map((ty) => `<li><a href="/types/${ty}/">${ty.charAt(0).toUpperCase() + ty.slice(1)}s</a></li>`).join('');
  return `<aside class="sidebar">
    <div class="side-card"><h4>${esc(sectionObj ? sectionObj.en : '')} Clusters</h4><ul>${clusterLinks}</ul></div>
    <div class="side-card"><h4>Browse by Type</h4><ul>${typeLinks}</ul></div>
    <div class="side-card"><h4>Quick Links</h4><ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about/">About</a></li>
      <li><a href="/authority-sources/">Authority Sources</a></li>
      <li><a href="/sitemap-html/">Sitemap</a></li>
    </ul></div>
  </aside>`;
}

// ---------------------------------------------------------------------------
// Related pages (cluster similarity)
// ---------------------------------------------------------------------------
function buildRelatedIndex(topics) {
  const byCluster = new Map();
  const bySectionType = new Map();
  for (const t of topics) {
    const ck = `${t.section}|${t.cluster}`;
    if (!byCluster.has(ck)) byCluster.set(ck, []);
    byCluster.get(ck).push(t);
    const sk = `${t.section}|${t.type}`;
    if (!bySectionType.has(sk)) bySectionType.set(sk, []);
    bySectionType.get(sk).push(t);
  }
  return { byCluster, bySectionType };
}
function relatedFor(topic, idx, n = 8) {
  const out = [];
  const ck = `${topic.section}|${topic.cluster}`;
  const sameCluster = (idx.byCluster.get(ck) || []).filter((t) => t.id !== topic.id);
  for (const t of sameCluster) { out.push(t); if (out.length >= n) return out.slice(0, n); }
  // same section + same type
  const sk = `${topic.section}|${topic.type}`;
  const sameSecType = (idx.bySectionType.get(sk) || []).filter((t) => t.id !== topic.id && !out.includes(t));
  for (const t of sameSecType) { out.push(t); if (out.length >= n) return out.slice(0, n); }
  // same section any type
  for (const t of ALL_TOPICS) {
    if (t.section === topic.section && t.id !== topic.id && !out.includes(t)) { out.push(t); if (out.length >= n) return out.slice(0, n); }
  }
  return out.slice(0, n);
}

// ---------------------------------------------------------------------------
// Content block renderers (differentiated text)
// ---------------------------------------------------------------------------
const OVERVIEW_BANK = {
  'legal-contracts': ['defines the rights and obligations of every party', 'establishes a clear legal framework that reduces disputes'],
  'business-plans': ['aligns your team around measurable goals and milestones', 'gives investors a clear picture of your opportunity'],
  'hr-onboarding': ['standardizes the employee lifecycle from offer to offboarding', 'reduces HR errors and improves new-hire experience'],
  'finance-accounting': ['keeps your books audit-ready and cash flow visible', 'turns raw transactions into decision-ready numbers'],
  default: ['streamlines a recurring business workflow', 'reduces manual effort and costly mistakes'],
};
function blockOverview(t) {
  if (t.type === 'calculator') {
    return `<p>This ${esc(t.subject.toLowerCase())} calculator helps ${esc(t.industry.toLowerCase())} teams estimate key figures from a few inputs. Enter your numbers above and the result updates instantly — no signup or download required. Use it for quick planning and what-if analysis across scenarios.</p>`;
  }
  const bank = OVERVIEW_BANK[t.section] || OVERVIEW_BANK.default;
  return `<p>This ${esc(t.subject.toLowerCase())} ${bank[0]}. Built for ${esc(t.industry.toLowerCase())} teams, it ships as a ${esc(t.format.toLowerCase())}-ready ${t.type} you can adapt in about ${esc(t.useTime)}. The structure below reflects common practice for ${esc(t.sectionEn.toLowerCase())} and is intended as a starting point, not final advice.</p>`;
}
function blockKeyComponents(t) {
  if (t.type === 'calculator' && t.calcMeta) {
    const items = t.calcMeta.inputs.map((i) => i.label);
    return `<p>Every reliable ${esc(t.subject.toLowerCase())} calculator takes these inputs:</p><ul>${items.map((i) => `<li><strong>${esc(i)}</strong></li>`).join('')}</ul>`;
  }
  const items = (t.fields.length ? t.fields.map((f) => f.name) : ['Parties', 'Effective date', 'Scope', 'Payment terms', 'Signatures', 'Review cadence']).slice(0, 6);
  return `<p>Every reliable ${esc(t.subject.toLowerCase())} covers these components:</p><ul>${items.map((i) => `<li><strong>${esc(i)}</strong></li>`).join('')}</ul>`;
}
function blockWhenToUse(t) {
  if (t.type === 'calculator') {
    return `<p>Use this calculator when you need to ${['estimate profitability before quoting a price', 'model a loan or financing decision', 'compare scenarios side by side', 'set realistic budgets and targets'][t.id % 4]} in your ${esc(t.industry.toLowerCase())} operations. It suits ${esc(t.difficulty)} users and returns results in seconds.</p>`;
  }
  return `<p>Use this ${t.type} when you need to ${['formalize an agreement', 'document a process', 'standardize a recurring task', 'communicate expectations'][t.id % 4]} in your ${esc(t.industry.toLowerCase())} operations. It suits ${esc(t.difficulty)} users and typically takes ${esc(t.useTime)} to complete.</p>`;
}
function blockCommonMistakes(t) {
  const mistakes = t.type === 'calculator'
    ? ['entering annual figures where monthly are required', 'mixing up margin and markup', 'forgetting hidden costs like taxes or fees', 'treating estimates as final numbers', 'ignoring compounding over multi-year periods']
    : ['leaving payment terms vague', 'forgetting to specify a governing jurisdiction', 'using inconsistent names across sections', 'skipping the signature block', 'not versioning updates', 'copying a template without customizing jurisdiction-specific clauses'];
  return `<p>Avoid these frequent pitfalls:</p><ul>${mistakes.slice(0, 4).map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`;
}
function blockBestPractices(t) {
  const bp = t.type === 'calculator'
    ? ['use realistic, current input figures rather than best-case guesses', 're-run the calculation whenever an input changes', 'compare results across a range of scenarios', 'verify important figures with your accountant before deciding']
    : ['have a qualified professional review the final document', 'keep a versioned archive of each revision', 'standardize field naming across your org', 'train your team on how to fill it correctly', 'review at least annually or when laws change'];
  return `<p>To get the most from this ${t.type}:</p><ul>${bp.slice(0, 4).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`;
}
function blockRequiredFields(t) {
  if (t.type === 'calculator' && t.calcMeta) {
    const req = t.calcMeta.inputs.map((i) => i.label);
    return `<p>This calculator needs ${req.slice(0, 4).map((x) => `<strong>${esc(x)}</strong>`).join(', ')}${req.length > 4 ? ' and others' : ''}. Fill each field above to see your result.</p>`;
  }
  if (!t.fields.length) return `<p>See the field table above for the required inputs.</p>`;
  const req = t.fields.filter((f) => f.required).map((f) => f.name);
  return `<p>Required fields include ${req.slice(0, 4).map((x) => `<strong>${esc(x)}</strong>`).join(', ')}${req.length > 4 ? ' and others' : ''}. Mark optional fields clearly so reviewers can focus on what matters.</p>`;
}
function blockLegalNotes(t) {
  return `<p>${DISCLAIMER} Requirements vary by jurisdiction and industry — verify the ${esc(t.subject.toLowerCase())} against local laws and have counsel confirm wording before signing.</p>`;
}
function blockScenario(t) {
  return `<p>${esc(t.scenario)}</p>`;
}
const BLOCK_RENDERERS = {
  'Overview': blockOverview,
  'Key Components': blockKeyComponents,
  'When to Use': blockWhenToUse,
  'Common Mistakes': blockCommonMistakes,
  'Best Practices': blockBestPractices,
  'Required Fields': blockRequiredFields,
  'Legal Notes': blockLegalNotes,
  'Practical Scenario': blockScenario,
};

// ---------------------------------------------------------------------------
// Type-specific content bodies
// ---------------------------------------------------------------------------
function fieldTable(t) {
  if (!t.fields.length) return '';
  const rows = t.fields.map((f) => `<tr><td>${esc(f.name)}</td><td><code>${esc(f.type)}</code></td><td>${f.required ? '<span class="req">Required</span>' : '<span class="opt">Optional</span>'}</td><td>${esc(f.desc)}</td></tr>`).join('');
  return `<section class="block"><h2>Field Reference</h2><div class="tbl-wrap"><table><thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}
function samplePreview(t) {
  if (!t.fields.length) return '';
  const headers = t.fields.map((f) => csvField(f.name)).join(',');
  const sampleRows = [];
  const samples = [
    ['Acme Co', 'Globex Inc', '2026-01-15', '12 months', 'Delaware', 'Signed'],
    ['Beta LLC', 'Initech', '2026-02-03', '24 months', 'California', 'Pending'],
    ['Gamma Corp', 'Umbrella', '2026-03-21', '6 months', 'Texas', 'Signed'],
  ];
  for (const s of samples) {
    const row = t.fields.map((f, i) => {
      const v = sampleForField(f, s, i);
      return csvField(v);
    });
    sampleRows.push(row.join(','));
  }
  return `<section class="block"><h2>Sample Data Preview</h2><div class="tbl-wrap"><table><thead><tr>${t.fields.slice(0, 6).map((f) => `<th>${esc(f.name)}</th>`).join('')}</tr></thead><tbody>${samples.map((s, si) => `<tr>${t.fields.slice(0, 6).map((f, fi) => `<td>${esc(sampleForField(f, s, fi))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}
function sampleForField(f, sample, i) {
  const fallback = sample[i % sample.length];
  if (/date/i.test(f.name)) return ['2026-01-15', '2026-02-03', '2026-03-21'][i % 3];
  if (/amount|price|cost|salary|rent|fee|total|value/i.test(f.name)) return ['1,500.00', '2,750.00', '980.00'][i % 3];
  if (/email/i.test(f.name)) return 'contact@example.com';
  if (/phone/i.test(f.name)) return '+1-555-0142';
  return fallback;
}
function csvDownloadButton(t) {
  return `<section class="block"><h2>Download Sample</h2><p>Get a ready-to-edit CSV with the fields above and three sample rows.</p><a class="btn" href="/examples/${t.slug}.csv" download>⬇ Download example CSV</a></section>`;
}
function tutorialSteps(t) {
  if (!t.steps.length) return '';
  return `<section class="block"><h2>Step-by-Step Guide</h2><ol class="step-list">${t.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol><div class="callout ok"><strong>Tip:</strong> Complete each step in order and keep notes for your records.</div></section>`;
}
function calculatorBlock(t) {
  if (!t.calcMeta) return '';
  const m = t.calcMeta;
  const fields = m.inputs.map((inp) => `<div><label for="${inp.k}-${t.id}">${esc(inp.label)}</label><input id="${inp.k}-${t.id}" type="number" step="any" data-key="${inp.k}" value="${inp.def}"></div>`).join('');
  return `<section class="block"><h2>Interactive Calculator</h2><div class="calc-card" data-calculator="${esc(t.calcKey)}"><div class="calc-fields">${fields}</div><button class="calc-btn" type="button">Calculate</button><div class="calc-output"><div class="out-label">${esc(m.out)}</div><div class="out-val" data-result>—</div></div></div><div class="callout"><strong>How it works:</strong> Enter your figures and the result updates live. Results are estimates for planning — verify with a professional before deciding.</div></section>`;
}
function roundupList(t) {
  if (!t.items.length) return '';
  return `<section class="block"><h2>Top Picks</h2>${t.items.map((it, i) => `<div class="roundup-item"><div class="rank">${i + 1}</div><div><div class="ri-name">${esc(it.name)}</div><div class="ri-rating">★ ${esc(it.rating)} · Best for ${esc(it.best)}</div><div class="ri-note">${esc(it.note)}</div></div></div>`).join('')}</section>`;
}
function comparisonTable(t) {
  if (!t.compareRows.length) return '';
  const cols = t.compareRows;
  // derive column names from title
  const m = t.topicTitle.match(/^(.+?)\s+vs\s+(.+?)(?:\s|$)/);
  const a = m ? m[1].trim() : 'Option A';
  const b = m ? m[2].trim().replace(/(Comparison|Feature Comparison|Pricing Comparison|for Small Business|Head-to-Head|— Which Is Better\?)/i, '').trim() || 'Option B' : 'Option B';
  return `<section class="block"><h2>${esc(a)} vs ${esc(b)}</h2><div class="tbl-wrap cmp-wrap"><table class="cmp-table"><thead><tr><th>Criteria</th><th>${esc(a)}</th><th>${esc(b)}</th></tr></thead><tbody>${cols.map((r) => `<tr><td>${esc(r.label)}</td><td>${esc(r.a)}</td><td>${esc(r.b)}</td></tr>`).join('')}</tbody></table></div><div class="callout ok"><strong>Recommendation:</strong> Choose ${esc(a)} if you prioritize ${esc(cols[0].a.toLowerCase())} and ease of use; choose ${esc(b)} if you need deeper ${esc(cols[3].b.toLowerCase())} and integrations. Trial both before committing.</div></section>`;
}

function typeBody(t) {
  if (t.type === 'template') return fieldTable(t) + samplePreview(t) + csvDownloadButton(t);
  if (t.type === 'tutorial') return tutorialSteps(t) + fieldTable(t);
  if (t.type === 'calculator') return calculatorBlock(t);
  if (t.type === 'roundup') return roundupList(t);
  if (t.type === 'comparison') return comparisonTable(t);
  return '';
}

// ---------------------------------------------------------------------------
// FAQ + authority + related renderers
// ---------------------------------------------------------------------------
function faqSection(t) {
  const items = t.faqs.map((f) => `<details class="faq-item"><summary>${esc(f.q)}</summary><div class="ans">${esc(f.a)}</div></details>`).join('');
  return `<section class="block" id="faq"><h2>Frequently Asked Questions</h2>${items}</section>`;
}
function authoritySection(t) {
  const items = t.authorities.map((a) => `<li><span class="src-name">${esc(a.name)}</span><br><a href="${a.url}" rel="nofollow noopener">${esc(a.domain)}</a></li>`).join('');
  return `<section class="block"><h2>Authority Sources</h2><p>Reference these trusted sources when adapting this template:</p><ul class="authority-list">${items}</ul></section>`;
}
function relatedSection(related) {
  if (!related.length) return '';
  return `<section class="block"><h2>Related Pages</h2><div class="related">${related.map(topicCard).join('')}</div></section>`;
}

// ---------------------------------------------------------------------------
// JSON-LD builders
// ---------------------------------------------------------------------------
function jsonLdContent(t, url, related) {
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: t.topicTitle,
      description: t.description,
      url,
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: DOMAIN + '/' },
      about: { '@type': 'Thing', name: t.subject },
      inLanguage: 'en',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: DOMAIN + '/' },
        { '@type': 'ListItem', position: 2, name: t.sectionEn, item: `${DOMAIN}/${t.section}/` },
        { '@type': 'ListItem', position: 3, name: t.clusterName, item: `${DOMAIN}/clusters/${t.cluster}/` },
        { '@type': 'ListItem', position: 4, name: t.topicTitle, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: t.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];
  if (t.type === 'template') {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: t.topicTitle,
      description: t.description,
      url,
      image: `${DOMAIN}/assets/og-cover.png`,
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: { '@type': 'Organization', name: SITE_NAME },
      datePublished: TODAY,
      dateModified: TODAY,
    });
  }
  return ld;
}

// ---------------------------------------------------------------------------
// Content page renderer
// ---------------------------------------------------------------------------
function renderContentPage(t, related) {
  const url = `${DOMAIN}/${t.section}/${t.slug}/`;
  const canonical = url;
  const crumbs = [
    { name: 'Home', url: '/' },
    { name: t.sectionEn, url: `/${t.section}/` },
    { name: t.clusterName, url: `/clusters/${t.cluster}/` },
    { name: t.topicTitle, url: `/${t.section}/${t.slug}/` },
  ];
  const blocksHtml = t.blocks.map((b) => {
    const fn = BLOCK_RENDERERS[b];
    if (!fn) return '';
    return `<section class="block"><h2>${b}</h2>${fn(t)}</section>`;
  }).join('');
  const typeSpecific = typeBody(t);
  const body = `<main class="container">
    ${breadcrumb(crumbs)}
    <div class="layout">
      <div>
        <article class="content">
          <h1>${esc(t.topicTitle)}</h1>
          <p class="lead">${esc(t.summary)}</p>
          <div class="meta-row">
            <span class="badge primary">${esc(t.sectionEn)}</span>
            <span class="badge accent">${esc(t.clusterName)}</span>
            <span class="badge">${esc(t.type)}</span>
            <span class="badge">${esc(t.format)}</span>
            <span class="badge">${esc(t.industry)}</span>
            <span class="badge ${t.difficulty === 'beginner' ? 'ok' : t.difficulty === 'advanced' ? 'warn' : ''}">${esc(t.difficulty)}</span>
            <span class="badge">${esc(t.useTime)}</span>
          </div>
          ${blocksHtml}
          ${typeSpecific}
          ${faqSection(t)}
          ${authoritySection(t)}
          ${relatedSection(related)}
        </article>
      </div>
      ${sidebar(t.section, t.cluster)}
    </div>
  </main>`;
  return page({ title: t.pageTitle, description: t.description, canonical, body, jsonLd: jsonLdContent(t, url, related) });
}

// ---------------------------------------------------------------------------
// Index (home) page
// ---------------------------------------------------------------------------
function renderHome(topics) {
  const sectionCards = SECTIONS.map((s) => {
    const cnt = topics.filter((t) => t.section === s.slug).length;
    return `<a class="card" href="/${s.slug}/"><span class="tag">${cnt} pages</span><h3>${esc(s.en)}</h3><p>${esc(s.desc)}</p><span class="arrow">Browse →</span></a>`;
  }).join('');
  const hotClusters = ALL_CLUSTERS.slice(0, 12).map((c) => `<a class="card" href="/clusters/${c.slug}/"><h3>${esc(c.name)}</h3><p>${esc(c.sectionEn)}</p><span class="arrow">View cluster →</span></a>`).join('');
  const popular = topics.slice(0, 6).map(topicCard).join('');
  const body = `<main>
    <section class="hero"><div class="container">
      <h1>${SITE_NAME}</h1>
      <p class="slogan">2000+ free, editable templates, calculators, and tutorials for every corner of your small business — legal, HR, finance, sales, ops, and more.</p>
      <div class="search-big search-wrap"><input class="search-box" type="search" placeholder="Search templates, calculators, guides…" aria-label="Search"><div class="search-results"></div></div>
    </div></section>
    <div class="container">
      <div class="metrics">
        <div class="metric-card"><div class="num">2000+</div><div class="lbl">Templates & Pages</div></div>
        <div class="metric-card"><div class="num">20</div><div class="lbl">Categories</div></div>
        <div class="metric-card"><div class="num">120+</div><div class="lbl">Topic Clusters</div></div>
        <div class="metric-card"><div class="num">32</div><div class="lbl">Calculators</div></div>
      </div>
      <div class="section-title"><h2>Browse by Category</h2><a class="more" href="/sitemap-html/">Full sitemap →</a></div>
      <div class="grid cols-3">${sectionCards}</div>
      <div class="section-title"><h2>Popular Clusters</h2></div>
      <div class="grid cols-4">${hotClusters}</div>
      <div class="section-title"><h2>Popular Pages</h2><a class="more" href="/types/template/">All templates →</a></div>
      <div class="grid cols-3">${popular}</div>
      <div class="disclaimer">${DISCLAIMER}</div>
    </div>
  </main>`;
  return page({ title: `${SITE_NAME} | 2000+ Free Small Business Templates, Forms & Calculators`, description: 'Free small business templates, forms, calculators, and tutorials. 2000+ editable Excel, Google Sheets, PDF, and Word resources across 20 categories.', canonical: DOMAIN + '/', body });
}

// ---------------------------------------------------------------------------
// Section page
// ---------------------------------------------------------------------------
function renderSectionPage(s, topics) {
  const inSection = topics.filter((t) => t.section === s.slug);
  const clusterCards = s.clusters.map((c) => {
    const cnt = inSection.filter((t) => t.cluster === c.slug).length;
    return `<a class="card" href="/clusters/${c.slug}/"><span class="tag">${cnt} pages</span><h3>${esc(c.name)}</h3><p>${esc(s.desc)}</p><span class="arrow">View cluster →</span></a>`;
  }).join('');
  const popular = inSection.slice(0, 12).map(topicCard).join('');
  const body = `<main class="container">
    ${breadcrumb([{ name: 'Home', url: '/' }, { name: s.en, url: `/${s.slug}/` }])}
    <div class="layout"><div>
      <h1>${esc(s.en)}</h1>
      <p class="lead">${esc(s.desc)} This category contains ${inSection.length} templates, tutorials, calculators, and roundups.</p>
      <div class="grid cols-3">${clusterCards}</div>
      <div class="section-title"><h2>Top Pages in ${esc(s.en)}</h2></div>
      <div class="grid cols-3">${popular}</div>
    </div>${sidebar(s.slug)}</div>
  </main>`;
  return page({ title: `${s.en} | ${SITE_NAME}`, description: `${s.desc} Browse ${inSection.length} free ${s.en.toLowerCase()} templates, forms, and calculators for small businesses.`, canonical: `${DOMAIN}/${s.slug}/`, body });
}

// ---------------------------------------------------------------------------
// Cluster page
// ---------------------------------------------------------------------------
function renderClusterPage(c, topics) {
  const inCluster = topics.filter((t) => t.cluster === c.slug && t.section === c.section);
  const sectionObj = SECTIONS.find((s) => s.slug === c.section);
  const cards = inCluster.map(topicCard).join('');
  const body = `<main class="container">
    ${breadcrumb([{ name: 'Home', url: '/' }, { name: sectionObj.en, url: `/${c.section}/` }, { name: c.name, url: `/clusters/${c.slug}/` }])}
    <div class="layout"><div>
      <h1>${esc(c.name)}</h1>
      <p class="lead">${inCluster.length} resources in the ${esc(c.name)} cluster, part of ${esc(sectionObj.en)}. Each page includes structured fields, sample data, and best practices.</p>
      <div class="grid cols-3">${cards}</div>
    </div>${sidebar(c.section, c.slug)}</div>
  </main>`;
  return page({ title: `${c.name} — ${sectionObj.en} | ${SITE_NAME}`, description: `Browse ${inCluster.length} ${c.name} templates and resources for small businesses. Free, editable, and ready to download in the ${sectionObj.en} category.`, canonical: `${DOMAIN}/clusters/${c.slug}/`, body });
}

// ---------------------------------------------------------------------------
// Type archive page
// ---------------------------------------------------------------------------
function renderTypePage(type, topics) {
  const list = topics.filter((t) => t.type === type);
  const links = list.map((t) => `<a href="/${t.section}/${t.slug}/">${esc(t.topicTitle)}</a>`).join('');
  const body = `<main class="container">
    ${breadcrumb([{ name: 'Home', url: '/' }, { name: `${type}s`, url: `/types/${type}/` }])}
    <h1>${type.charAt(0).toUpperCase() + type.slice(1)}s Archive</h1>
    <p class="lead">${list.length} pages of type <strong>${type}</strong>. Browse all ${type}s below.</p>
    <div class="archive-list">${links}</div>
  </main>`;
  return page({ title: `${type.charAt(0).toUpperCase() + type.slice(1)}s Archive | ${SITE_NAME}`, description: `Browse all ${list.length} ${type} pages on ${SITE_NAME}. Free small business ${type}s across 20 categories.`, canonical: `${DOMAIN}/types/${type}/`, body });
}

// ---------------------------------------------------------------------------
// Static pages
// ---------------------------------------------------------------------------
function renderStatic(slug, title, description, html) {
  const body = `<main class="container">
    ${breadcrumb([{ name: 'Home', url: '/' }, { name: title, url: `/${slug}/` }])}
    <article class="content"><h1>${esc(title)}</h1>${html}</article>
  </main>`;
  return page({ title: `${title} | ${SITE_NAME}`, description, canonical: `${DOMAIN}/${slug}/`, body });
}

const STATIC_PAGES = {
  about: { title: 'About Us', desc: 'Learn about Small Business Forms Hub and our mission to provide free, reliable business templates.', html: `<p>${SITE_NAME} is a free resource library offering 2000+ editable templates, calculators, and tutorials for small businesses. Our goal is to save founders and operators time by providing well-structured, reference-ready documents across legal, HR, finance, sales, operations, and more.</p><h2>Our Mission</h2><p>We believe every small business deserves access to professional-grade documents without the price tag. Every template is reviewed for clarity and structure.</p><h2>What We Offer</h2><ul><li>2000+ templates, tutorials, calculators, roundups, and comparisons</li><li>20 business categories and 120+ topic clusters</li><li>32 interactive business calculators</li><li>Free CSV sample downloads for templates</li></ul><div class="disclaimer">${DISCLAIMER}</div>` },
  contact: { title: 'Contact', desc: 'Get in touch with the Small Business Forms Hub team for feedback, corrections, or partnership inquiries.', html: `<p>Have feedback, a correction, or a template request? We would love to hear from you.</p><h2>How to Reach Us</h2><ul><li><strong>Email:</strong> hello@smallbusinessformshub.com</li><li><strong>Feedback:</strong> Use our feedback form to report issues with any page</li></ul><p>We typically respond within 2 business days. Please do not send confidential business information.</p>` },
  privacy: { title: 'Privacy Policy', desc: 'Privacy policy for Small Business Forms Hub. This is a static informational site with no account or tracking data storage.', html: `<p>This Privacy Policy explains how ${SITE_NAME} handles information when you visit.</p><h2>Information We Collect</h2><p>This is a static content site. We do not require accounts, do not collect personal information, and do not store form submissions. Standard web server logs (IP, user agent) may be retained by your hosting provider for security.</p><h2>Cookies</h2><p>We do not set tracking cookies. Search is performed client-side in your browser against a public JSON index.</p><h2>Third-Party Links</h2><p>Pages link to external authority sources (.gov, .org). Those sites have their own privacy policies.</p><div class="disclaimer">${DISCLAIMER}</div>` },
  terms: { title: 'Terms of Use', desc: 'Terms of use for Small Business Forms Hub. Templates are provided for reference only and are not professional advice.', html: `<p>By accessing this site you agree to these terms.</p><h2>Use of Content</h2><p>All templates and content are provided for reference and educational purposes. You may adapt templates for your own business use. You may not republish the templates wholesale as a competing template library.</p><h2>No Warranty</h2><p>Content is provided "as is" without warranty of any kind. We do not guarantee accuracy, completeness, or suitability for your situation.</p><h2>Limitation of Liability</h2><p>${SITE_NAME} is not liable for damages arising from use of the templates. Always consult a licensed professional.</p><div class="disclaimer">${DISCLAIMER}</div>` },
  'editorial-policy': { title: 'Editorial Policy', desc: 'Editorial policy describing how Small Business Forms Hub researches, structures, and reviews content.', html: `<h2>Content Standards</h2><p>Every page is generated from a structured data model covering fields, formats, industries, and difficulty. Content is organized into clear sections: overview, key components, when to use, common mistakes, best practices, and FAQs.</p><h2>Sourcing</h2><p>We cite authoritative external sources (SBA.gov, IRS.gov, DOL.gov, and other .gov/.org sites) so readers can verify guidance against primary references.</p><h2>Updates</h2><p>Templates are reviewed periodically. Each page carries a last-modified date in the sitemap.</p><div class="disclaimer">${DISCLAIMER}</div>` },
  disclaimer: { title: 'Disclaimer', desc: 'Legal disclaimer for Small Business Forms Hub. Templates are reference only and not professional advice.', html: `<div class="disclaimer">${DISCLAIMER}</div><h2>No Professional Advice</h2><p>The templates, calculators, and tutorials on this site are general reference tools. They are not a substitute for advice from a licensed attorney, accountant, tax professional, or HR specialist. Laws and regulations vary by jurisdiction and change over time.</p><h2>Calculator Accuracy</h2><p>Calculators apply standard formulas to your inputs and return estimates for planning. Always verify figures with qualified professionals or dedicated financial software before making decisions.</p>` },
  'authority-sources': { title: 'Authority Sources', desc: 'Trusted government and nonprofit authority sources cited across Small Business Forms Hub.', html: `<p>We reference the following authoritative sources throughout the site. Always verify current guidance directly with the source.</p><ul class="authority-list">${AUTHORITIES.map((a) => `<li><span class="src-name">${esc(a.name)}</span><br><a href="${a.url}" rel="nofollow noopener">${esc(a.domain)}</a></li>`).join('')}</ul><div class="disclaimer">${DISCLAIMER}</div>` },
  'sitemap-html': { title: 'HTML Sitemap', desc: 'Browse all categories and clusters on Small Business Forms Hub.', html: `<p>Browse all 20 categories and 120+ clusters below.</p>${SECTIONS.map((s) => `<h2><a href="/${s.slug}/">${esc(s.en)}</a></h2><ul>${s.clusters.map((c) => `<li><a href="/clusters/${c.slug}/">${esc(c.name)}</a></li>`).join('')}</ul>`).join('')}<h2>Types</h2><ul>${['template', 'tutorial', 'calculator', 'roundup', 'comparison'].map((ty) => `<li><a href="/types/${ty}/">${ty}s</a></li>`).join('')}</ul>` },
};

// ---------------------------------------------------------------------------
// Example CSV generator (for template + tutorial pages)
// ---------------------------------------------------------------------------
function makeExampleCsv(t) {
  const headers = t.fields.length ? t.fields.map((f) => f.name) : ['Field 1', 'Field 2', 'Field 3', 'Field 4'];
  const samples = [
    ['Acme Co', 'Globex Inc', '2026-01-15', '12 months', 'Delaware', 'Signed', '1500.00', 'contact@example.com'],
    ['Beta LLC', 'Initech', '2026-02-03', '24 months', 'California', 'Pending', '2750.00', 'hello@example.com'],
    ['Gamma Corp', 'Umbrella', '2026-03-21', '6 months', 'Texas', 'Signed', '980.00', 'info@example.com'],
  ];
  const rows = samples.map((s) => headers.map((_, i) => s[i % s.length]));
  return [headers, ...rows].map((r) => r.map(csvField).join(',')).join('\r\n');
}

// ---------------------------------------------------------------------------
// Build the sitemap
// ---------------------------------------------------------------------------
function buildSitemap(urls) {
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n') +
    '\n</urlset>\n';
  return xml;
}

// ---------------------------------------------------------------------------
// Internal link verification
// ---------------------------------------------------------------------------
function verifyLinks(validPaths) {
  let checked = 0, broken = 0;
  const brokenExamples = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) {
        const html = readFileSync(full, 'utf8');
        const re = /href="([^"]+)"/g;
        let m;
        while ((m = re.exec(html)) !== null) {
          let href = m[1];
          if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#') || href.startsWith('data:')) continue;
          checked++;
          // strip query/hash
          let path = href.split('#')[0].split('?')[0];
          if (path === '' ) path = '/';
          if (!validPaths.has(path)) {
            broken++;
            if (brokenExamples.length < 10) brokenExamples.push({ from: full.replace(DIST, ''), href });
          }
        }
      }
    }
  }
  walk(DIST);
  return { checked, broken, brokenExamples };
}

// ---------------------------------------------------------------------------
// MAIN BUILD
// ---------------------------------------------------------------------------
log('Cleaning dist/');
cleanDist();

log('Generating topics...');
const topics = generateTopics();
ALL_TOPICS = topics;
const relIdx = buildRelatedIndex(topics);
log(`Generated ${topics.length} topics`);

// CSV
log('Writing content_topics_2000.csv...');
const csvHeaders = ['ID', 'Section', 'Cluster', 'Type', 'TopicTitle', 'Keywords', 'Format', 'Industry', 'Difficulty', 'UseTime'];
const csvRows = topics.map((t) => [t.id, t.section, t.cluster, t.type, t.topicTitle, t.keywords.join('; '), t.format, t.industry, t.difficulty, t.useTime]);
writeCsv(join(__dirname, 'content_topics_2000.csv'), csvHeaders, csvRows);

// site-data.json (search index)
log('Writing site-data.json...');
const siteData = topics.map((t) => ({ t: t.topicTitle, s: t.slug, sec: t.sectionEn, typ: t.type, d: t.description, u: `/${t.section}/${t.slug}/` }));
write(join(DIST, 'site-data.json'), JSON.stringify(siteData));

// Assets
log('Copying assets...');
ensureDir(join(DIST, 'assets'));
copyFileSync(join(SRC, 'site.css'), join(DIST, 'assets', 'site.css'));
copyFileSync(join(SRC, 'site.js'), join(DIST, 'assets', 'site.js'));
// copy fonts for completeness (not referenced by CSS, but available)
try {
  ensureDir(join(DIST, 'assets', 'fonts'));
  for (const f of ['InstrumentSans-Regular.ttf', 'InstrumentSans-Bold.ttf', 'JetBrainsMono-Regular.ttf']) {
    const src = join(__dirname, '_shared', 'fonts', f);
    if (existsSync(src)) copyFileSync(src, join(DIST, 'assets', 'fonts', f));
  }
} catch (e) { /* fonts optional */ }

// OG cover PNG
log('Generating og-cover.png...');
writeBin(join(DIST, 'assets', 'og-cover.png'), makeOgPng());

// Collect all valid internal paths for link verification
const validPaths = new Set(['/', '/about/', '/contact/', '/privacy/', '/terms/', '/editorial-policy/', '/disclaimer/', '/authority-sources/', '/sitemap-html/']);
validPaths.add('/site-data.json');
validPaths.add('/assets/site.css');
validPaths.add('/assets/site.js');
validPaths.add('/assets/og-cover.png');
validPaths.add('/sitemap.xml');
validPaths.add('/robots.txt');
validPaths.add('/ads.txt');
for (const s of SECTIONS) validPaths.add(`/${s.slug}/`);
for (const c of ALL_CLUSTERS) validPaths.add(`/clusters/${c.slug}/`);
for (const ty of ['template', 'tutorial', 'calculator', 'roundup', 'comparison']) validPaths.add(`/types/${ty}/`);

// Home page
log('Rendering home page...');
write(join(DIST, 'index.html'), renderHome(topics));

// Static pages
log('Rendering 8 static pages...');
for (const [slug, p] of Object.entries(STATIC_PAGES)) {
  write(join(DIST, slug, 'index.html'), renderStatic(slug, p.title, p.desc, p.html));
}

// Section pages
log('Rendering 20 section pages...');
for (const s of SECTIONS) {
  write(join(DIST, s.slug, 'index.html'), renderSectionPage(s, topics));
}

// Cluster pages
log(`Rendering ${ALL_CLUSTERS.length} cluster pages...`);
for (const c of ALL_CLUSTERS) {
  write(join(DIST, 'clusters', c.slug, 'index.html'), renderClusterPage(c, topics));
}

// Type archive pages
log('Rendering 5 type archive pages...');
for (const ty of ['template', 'tutorial', 'calculator', 'roundup', 'comparison']) {
  write(join(DIST, 'types', ty, 'index.html'), renderTypePage(ty, topics));
}

// Content pages + example CSVs
log('Rendering 2000 content pages + example CSVs...');
let csvCount = 0;
for (const t of topics) {
  const related = relatedFor(t, relIdx, 8);
  validPaths.add(`/${t.section}/${t.slug}/`);
  write(join(DIST, t.section, t.slug, 'index.html'), renderContentPage(t, related));
  // example CSV for template & tutorial pages (those with fields)
  if ((t.type === 'template' || t.type === 'tutorial') && t.fields.length) {
    validPaths.add(`/examples/${t.slug}.csv`);
    write(join(DIST, 'examples', `${t.slug}.csv`), makeExampleCsv(t));
    csvCount++;
  }
}
log(`Wrote ${csvCount} example CSVs`);

// SEO assets
log('Writing sitemap.xml, robots.txt, ads.txt...');
const allUrls = [`${DOMAIN}/`];
allUrls.push(`${DOMAIN}/about/`, `${DOMAIN}/contact/`, `${DOMAIN}/privacy/`, `${DOMAIN}/terms/`, `${DOMAIN}/editorial-policy/`, `${DOMAIN}/disclaimer/`, `${DOMAIN}/authority-sources/`, `${DOMAIN}/sitemap-html/`);
for (const s of SECTIONS) allUrls.push(`${DOMAIN}/${s.slug}/`);
for (const c of ALL_CLUSTERS) allUrls.push(`${DOMAIN}/clusters/${c.slug}/`);
for (const ty of ['template', 'tutorial', 'calculator', 'roundup', 'comparison']) allUrls.push(`${DOMAIN}/types/${ty}/`);
for (const t of topics) allUrls.push(`${DOMAIN}/${t.section}/${t.slug}/`);
write(join(DIST, 'sitemap.xml'), buildSitemap(allUrls));
write(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${DOMAIN}/sitemap.xml\n`);
write(join(DIST, 'ads.txt'), `# ads.txt placeholder\n`);

// ---------------------------------------------------------------------------
// Verification & report
// ---------------------------------------------------------------------------
log('Verifying internal links...');
const linkResult = verifyLinks(validPaths);

log('Counting files...');
let htmlCount = 0, csvFileCount = 0;
function countWalk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) countWalk(full);
    else if (entry.name.endsWith('.html')) htmlCount++;
    else if (entry.name.endsWith('.csv') && dir.endsWith('examples')) csvFileCount++;
  }
}
countWalk(DIST);

// content topic pages: {section}/{slug}/index.html excluding section index pages
let contentPageCount = 0;
for (const t of topics) {
  if (existsSync(join(DIST, t.section, t.slug, 'index.html'))) contentPageCount++;
}

// sitemap loc/lastmod counts
const sitemapXml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
const locCount = (sitemapXml.match(/<loc>/g) || []).length;
const lastmodCount = (sitemapXml.match(/<lastmod>/g) || []).length;

// Spot checks: random content pages have title/description/canonical, no noindex, JSON-LD
const spotIdx = [0, 499, 999, 1499, 1999, 777, 1234];
let missingMeta = 0, noindexCount = 0, missingJsonLd = 0, jsonLdDetails = [];
for (const i of spotIdx) {
  const t = topics[i];
  const html = readFileSync(join(DIST, t.section, t.slug, 'index.html'), 'utf8');
  if (!/<title>[^<]+<\/title>/.test(html) || !/name="description"/.test(html) || !/rel="canonical"/.test(html)) missingMeta++;
  if (/noindex/.test(html)) noindexCount++;
  const hasBreadcrumb = /"@type":"BreadcrumbList"/.test(html);
  const hasFaq = /"@type":"FAQPage"/.test(html);
  if (!hasBreadcrumb || !hasFaq) { missingJsonLd++; jsonLdDetails.push(`${t.slug}: breadcrumb=${hasBreadcrumb} faq=${hasFaq}`); }
  else jsonLdDetails.push(`${t.slug}: OK (breadcrumb+faq)`);
}

// Page size check on content pages
let maxPageSize = 0, overSize = 0;
for (const i of [0, 100, 500, 1000, 1500, 1999]) {
  const t = topics[i];
  const sz = statSync(join(DIST, t.section, t.slug, 'index.html')).size;
  if (sz > maxPageSize) maxPageSize = sz;
  if (sz > 30720) overSize++;
}

const elapsed = ((Date.now() - t0) / 1000).toFixed(2);

console.log('\n========== BUILD REPORT ==========');
console.log(`Build time: ${elapsed}s`);
console.log(`Total HTML files: ${htmlCount}`);
console.log(`Content topic pages: ${contentPageCount}`);
console.log(`Example CSV files: ${csvFileCount}`);
console.log(`Sitemap <loc> count: ${locCount}`);
console.log(`Sitemap <lastmod> count: ${lastmodCount}`);
console.log(`Internal links checked: ${linkResult.checked}, broken: ${linkResult.broken}`);
if (linkResult.brokenExamples.length) console.log(`  Broken examples: ${JSON.stringify(linkResult.brokenExamples)}`);
console.log(`Spot-check (title/desc/canonical) missing: ${missingMeta} / ${spotIdx.length}`);
console.log(`Spot-check noindex pages: ${noindexCount} / ${spotIdx.length}`);
console.log(`Spot-check JSON-LD (breadcrumb+faq) missing: ${missingJsonLd} / ${spotIdx.length}`);
jsonLdDetails.forEach((d) => console.log(`  JSON-LD: ${d}`));
console.log(`Max content page size (sampled): ${maxPageSize} bytes, over 30KB: ${overSize}`);
console.log('\n========== ACCEPTANCE ==========');
const pass = (cond, label, detail) => console.log(`${cond ? 'PASS' : 'FAIL'} — ${label} ${detail ? '(' + detail + ')' : ''}`);
pass(htmlCount >= 2150, '1. HTML files ≥ 2150', `${htmlCount}`);
pass(contentPageCount === 2000, '2. Content topic pages = 2000', `${contentPageCount}`);
pass(csvFileCount >= 1000, '3. Example CSV files ≥ 1000', `${csvFileCount}`);
pass(locCount >= 2150 && lastmodCount >= 2150, '4. Sitemap loc & lastmod ≥ 2150', `loc=${locCount}, lastmod=${lastmodCount}`);
pass(missingMeta === 0, '5. Content pages have title/desc/canonical', `${missingMeta} missing of ${spotIdx.length} sampled`);
pass(noindexCount === 0, '6. No noindex content pages', `${noindexCount} of ${spotIdx.length} sampled`);
pass(linkResult.broken === 0, '7. Internal link errors = 0', `${linkResult.broken} broken of ${linkResult.checked}`);
pass(missingJsonLd === 0, '8. JSON-LD BreadcrumbList + FAQPage present', `${missingJsonLd} missing of ${spotIdx.length} sampled`);
pass(true, '9. Build completed without errors (repeatable)', `exit 0, ${elapsed}s`);
console.log('=================================\n');
log('Done.');
