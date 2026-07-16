// src/site.js — Small Business Forms Hub
// In-site instant search + 32 interactive business calculators.
// Zero dependencies, vanilla JS. Loaded as a module-free classic script.

(function () {
  'use strict';

  // ---------------- Helpers ----------------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const fmtMoney = (n) => {
    if (!isFinite(n)) return '—';
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const fmtPct = (n) => (isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%' : '—');
  const fmtNum = (n, d = 2) => (isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
  const num = (v) => parseFloat(v);

  // ---------------- Calculator registry ----------------
  // Each function receives an object of named inputs and returns a number.
  const CALCULATORS = {
    'profit-margin': (i) => (num(i.revenue) - num(i.cost)) / num(i.revenue) * 100,
    'pricing': (i) => num(i.cost) * (1 + num(i.markup) / 100),
    'loan-payment': (i) => {
      const r = num(i.rate) / 100 / 12, n = num(i.years) * 12, p = num(i.principal);
      return r === 0 ? p / n : p * r / (1 - Math.pow(1 + r, -n));
    },
    'paycheck': (i) => num(i.salary) * (1 - num(i.rate) / 100) / 12,
    'roi': (i) => num(i.gain) / num(i.cost) * 100,
    'depreciation': (i) => (num(i.cost) - num(i.salvage)) / num(i.life),
    'break-even': (i) => num(i.fixed) / (num(i.price) - num(i.vc)),
    'inventory-turnover': (i) => num(i.cogs) / num(i.avg),
    'aov': (i) => num(i.revenue) / num(i.orders),
    'conversion-rate': (i) => num(i.conversions) / num(i.visitors) * 100,
    'cac': (i) => num(i.spend) / num(i.customers),
    'ltv': (i) => num(i.arpu) * num(i.lifespan),
    'cash-flow': (i) => num(i.net) + num(i.depreciation) + num(i.wc),
    'tax-rate': (i) => num(i.tax) / num(i.income) * 100,
    'discount': (i) => num(i.price) * (1 - num(i.discount) / 100),
    'tip': (i) => num(i.bill) * num(i.tip) / 100,
    'overtime': (i) => num(i.rate) * 1.5 * num(i.ot),
    'commission': (i) => num(i.sales) * num(i.rate) / 100,
    'rental-yield': (i) => num(i.rent) / num(i.value) * 100,
    'cap-rate': (i) => num(i.noi) / num(i.value) * 100,
    'mortgage': (i) => {
      const r = num(i.rate) / 100 / 12, n = num(i.years) * 12, p = num(i.principal);
      return r === 0 ? p / n : p * r / (1 - Math.pow(1 + r, -n));
    },
    'compound-interest': (i) => num(i.principal) * Math.pow(1 + num(i.rate) / 100, num(i.years)),
    'savings-goal': (i) => {
      const r = num(i.rate) / 100 / 12, n = num(i.years) * 12, g = num(i.goal);
      return r === 0 ? g / n : g * r / (Math.pow(1 + r, n) - 1);
    },
    'dti': (i) => num(i.debt) / num(i.income) * 100,
    'gross-margin': (i) => (num(i.revenue) - num(i.cogs)) / num(i.revenue) * 100,
    'net-margin': (i) => num(i.net) / num(i.revenue) * 100,
    'ebitda': (i) => num(i.net) + num(i.interest) + num(i.tax) + num(i.dep) + num(i.amor),
    'unit-economics': (i) => num(i.price) - num(i.cost),
    'payback': (i) => num(i.cost) / num(i.cash),
    'npv': (i) => {
      const r = num(i.rate) / 100, cf = num(i.cashflow), y = num(i.years), init = num(i.initial);
      let pv = 0;
      for (let t = 1; t <= y; t++) pv += cf / Math.pow(1 + r, t);
      return pv - init;
    },
    'irr': (i) => {
      // Solve NPV(rate)=0 for rate via bisection. Cash flows: -init then cf per year.
      const cf = num(i.cashflow), y = num(i.years), init = num(i.initial);
      const npv = (rate) => { let pv = 0; for (let t = 1; t <= y; t++) pv += cf / Math.pow(1 + rate, t); return pv - init; };
      let lo = -0.99, hi = 10, mid = 0;
      if (npv(lo) * npv(hi) > 0) return 0;
      for (let k = 0; k < 100; k++) {
        mid = (lo + hi) / 2;
        const v = npv(mid);
        if (Math.abs(v) < 1e-6) break;
        if (v > 0) lo = mid; else hi = mid;
      }
      return mid * 100;
    },
    'markup': (i) => (num(i.price) - num(i.cost)) / num(i.cost) * 100,
  };

  // Decide formatting from the output label.
  function formatResult(outLabel, val) {
    if (outLabel.includes('%')) return fmtPct(val);
    if (outLabel.includes('$')) return fmtMoney(val);
    if (/years|units|ratio/i.test(outLabel)) return fmtNum(val, 2);
    return fmtNum(val, 2);
  }

  // Wire every calculator card on the page.
  function wireCalculators() {
    $$('.calc-card[data-calculator]').forEach((card) => {
      const key = card.getAttribute('data-calculator');
      const fn = CALCULATORS[key];
      const outLabelEl = $('.out-label', card);
      const outValEl = $('[data-result]', card);
      if (!fn || !outValEl) return;
      const outLabel = outLabelEl ? outLabelEl.textContent : '';
      const gather = () => {
        const inputs = {};
        $$('input[data-key]', card).forEach((inp) => { inputs[inp.getAttribute('data-key')] = inp.value; });
        return inputs;
      };
      const run = () => {
        try {
          const val = fn(gather());
          outValEl.textContent = formatResult(outLabel, val);
        } catch (e) {
          outValEl.textContent = '—';
        }
      };
      $$('input[data-key]', card).forEach((inp) => inp.addEventListener('input', run));
      const btn = $('.calc-btn', card);
      if (btn) btn.addEventListener('click', run);
      run(); // initial compute with defaults
    });
  }

  // ---------------- In-site search ----------------
  let DATA = null;
  let dataPromise = null;

  function loadData() {
    if (dataPromise) return dataPromise;
    dataPromise = fetch('/site-data.json').then((r) => r.json()).then((d) => { DATA = d; return d; }).catch(() => { DATA = []; return []; });
    return dataPromise;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return escapeHtml(text);
    return escapeHtml(text.slice(0, idx)) + '<mark>' + escapeHtml(text.slice(idx, idx + q.length)) + '</mark>' + escapeHtml(text.slice(idx + q.length));
  }

  function search(q) {
    if (!DATA) return [];
    const ql = q.toLowerCase().trim();
    if (!ql) return [];
    const scored = [];
    for (const item of DATA) {
      const title = item.t || '';
      const d = item.d || '';
      const sec = item.sec || '';
      const tl = title.toLowerCase();
      let score = 0;
      if (tl.startsWith(ql)) score += 10;
      else if (tl.includes(ql)) score += 5;
      if (d.toLowerCase().includes(ql)) score += 2;
      if (sec.toLowerCase().includes(ql)) score += 2;
      if (score > 0) scored.push({ item, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8).map((s) => s.item);
  }

  function renderResults(container, results, q) {
    if (!results.length) {
      container.innerHTML = '<div class="sr-empty">No results. Try another keyword.</div>';
      return;
    }
    container.innerHTML = results.map((it) =>
      '<a href="' + it.u + '">' +
        '<div class="sr-title">' + highlight(it.t, q) + '</div>' +
        '<div class="sr-meta">' + escapeHtml(it.sec) + ' · ' + escapeHtml(it.typ) + '</div>' +
      '</a>'
    ).join('');
  }

  function wireSearch() {
    $$('.search-box').forEach((box) => {
      const wrap = box.closest('.search-wrap');
      if (!wrap) return;
      const results = $('.search-results', wrap);
      if (!results) return;
      loadData();
      box.addEventListener('focus', () => { loadData(); });
      box.addEventListener('input', () => {
        const q = box.value;
        if (!q.trim()) { results.classList.remove('active'); results.innerHTML = ''; return; }
        const res = search(q);
        renderResults(results, res, q);
        results.classList.add('active');
      });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const first = $('a', results);
          if (first) window.location.href = first.getAttribute('href');
        }
        if (e.key === 'Escape') { results.classList.remove('active'); box.blur(); }
      });
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrap')) {
        $$('.search-results').forEach((r) => r.classList.remove('active'));
      }
    });
  }

  // ---------------- Boot ----------------
  function boot() {
    wireCalculators();
    wireSearch();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
