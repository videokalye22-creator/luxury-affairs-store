/* ============================================================
   LUXURY AFFAIRS — "MAISON" · main.js
   Single plain script — NO import/export — works on file://
   Data + render logic, plus the motion layer.
   ============================================================ */

var LA = (function () {

  var WA_NUM = '17175385671';

  /* ── Utility ─────────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function $q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function reduced() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches; }
  function fine() { return window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches; }

  var ESC_MAP = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC_MAP[c]; }); }

  function currentPageName() {
    var page = window.location.pathname.split('/').pop();
    if (!page) return 'index.html';
    return page.indexOf('.') === -1 ? page + '.html' : page;
  }

  function waURL(text) {
    return 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(text);
  }

  /* ── CSV Parser ──────────────────────────────────────────── */
  function parseCSV(text) {
    var lines = text.trim().split('\n');
    var headers = lines[0].split(',').map(function (h) { return h.trim(); });
    return lines.slice(1).map(function (line) {
      var vals = []; var cur = ''; var inQ = false;
      for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (ch === '"') { inQ = !inQ; continue; }
        if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      vals.push(cur.trim());
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = vals[i] || ''; });
      return obj;
    });
  }

  /* ── Catalog files (per-category, well under CF asset limit) ── */
  var CATALOG_FILES = {
    handbags: [
      'data/products-handbags-bottega.csv',
      'data/products-handbags-celine.csv',
      'data/products-handbags-chanel.csv',
      'data/products-handbags-dior.csv',
      'data/products-handbags-fendi.csv',
      'data/products-handbags-goyard.csv',
      'data/products-handbags-gucci.csv',
      'data/products-handbags-hermes.csv',
      'data/products-handbags-loewe.csv',
      'data/products-handbags-loro-piana.csv',
      'data/products-handbags-miumiu.csv',
      'data/products-handbags-prada.csv',
      'data/products-handbags-the-row.csv',
      'data/products-handbags-ysl.csv'
    ],
    footwear: [],
    jewelry: [],
    watches: ['data/products-watches-rolex.csv'],
    accessories: []
  };

  function fetchCSV(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function () {
      cb((xhr.status === 200 || xhr.status === 0) ? parseCSV(xhr.responseText) : []);
    };
    xhr.onerror = function () { cb([]); };
    xhr.send();
  }

  /* loadProducts([category,] cb) — results cached so search doesn't
     re-download the whole catalog on every keystroke. */
  var _cache = {};
  function loadProducts(category, cb) {
    if (typeof category === 'function') { cb = category; category = null; }
    var key = category || '__all__';
    if (_cache[key]) { cb(_cache[key]); return; }

    var files = [];
    if (category && CATALOG_FILES[category]) {
      files = CATALOG_FILES[category];
    } else {
      Object.keys(CATALOG_FILES).forEach(function (k) { files = files.concat(CATALOG_FILES[k]); });
    }

    var remaining = files.length;
    if (!remaining) { _cache[key] = []; cb([]); return; }

    var all = [];
    files.forEach(function (url) {
      fetchCSV(url, function (rows) {
        all = all.concat(rows);
        if (--remaining === 0) { _cache[key] = all; cb(all); }
      });
    });
  }

  /* ── Brand Data ──────────────────────────────────────────── */
  var BRANDS = {
    handbags: [
      { id:'chanel',   label:'Chanel',         logo:'CHANEL',          style:'' },
      { id:'hermes',   label:'Hermès',          logo:'HERMÈS',          style:'serif' },
      { id:'dior',     label:'Dior',            logo:'DIOR',            style:'' },
      { id:'gucci',    label:'Gucci',           logo:'GUCCI',           style:'' },
      { id:'prada',    label:'Prada',           logo:'PRADA',           style:'' },
      { id:'louis-vuitton', label:'Louis Vuitton', logo:'LV',          style:'' },
      { id:'ysl',      label:'Saint Laurent',   logo:'YSL',             style:'' },
      { id:'celine',   label:'Céline',          logo:'CÉLINE',          style:'serif' },
      { id:'bottega',  label:'Bottega Veneta',  logo:'BOTTEGA\nVENETA', style:'italic' },
      { id:'goyard',   label:'Goyard',          logo:'GOYARD',          style:'serif' },
      { id:'miumiu',   label:'Miu Miu',         logo:'MIU MIU',         style:'' },
      { id:'loewe',    label:'Loewe',           logo:'LOEWE',           style:'serif' },
      { id:'fendi',    label:'Fendi',           logo:'FENDI',           style:'' },
      { id:'loro-piana',label:'Loro Piana',     logo:'LORO\nPIANA',     style:'italic' },
      { id:'the-row',  label:'The Row',         logo:'THE ROW',         style:'serif' }
    ],
    footwear: [
      { id:'chanel',    label:'Chanel',        logo:'CHANEL',    style:'' },
      { id:'hermes',    label:'Hermès',         logo:'HERMÈS',    style:'serif' },
      { id:'gucci',     label:'Gucci',          logo:'GUCCI',     style:'' },
      { id:'prada',     label:'Prada',          logo:'PRADA',     style:'' },
      { id:'dior',      label:'Dior',           logo:'DIOR',      style:'' },
      { id:'valentino', label:'Valentino',      logo:'VALENTINO', style:'' },
      { id:'ysl',       label:'Saint Laurent',  logo:'YSL',       style:'' },
      { id:'alaia',     label:'Alaïa',          logo:'ALAÏA',     style:'serif' },
      { id:'fendi',     label:'Fendi',          logo:'FENDI',     style:'' },
      { id:'celine',    label:'Céline',         logo:'CÉLINE',    style:'serif' },
      { id:'loro-piana',label:'Loro Piana',     logo:'LORO\nPIANA',style:'italic' },
      { id:'louboutin', label:'Louboutin',      logo:'LOUBOUTIN', style:'' },
      { id:'jimmy-choo',label:'Jimmy Choo',     logo:'JIMMY\nCHOO', style:'italic' },
      { id:'loewe',     label:'Loewe',          logo:'LOEWE',     style:'serif' },
      { id:'miumiu',    label:'Miu Miu',        logo:'MIU MIU',   style:'' },
      { id:'rene-caovilla', label:'René Caovilla', logo:'RENÉ\nCAOVILLA', style:'italic' }
    ],
    jewelry: [
      { id:'cartier',   label:'Cartier',        logo:'Cartier',         style:'italic serif' },
      { id:'van-cleef', label:'Van Cleef & Arpels', logo:'VAN CLEEF\n& ARPELS', style:'italic' },
      { id:'hermes',    label:'Hermès',         logo:'HERMÈS',          style:'serif' },
      { id:'chanel',    label:'Chanel',         logo:'CHANEL',          style:'' },
      { id:'tiffany',   label:'Tiffany & Co.',  logo:'TIFFANY\n& CO.',  style:'italic' },
      { id:'dior',      label:'Dior',           logo:'DIOR',            style:'' },
      { id:'messika',   label:'Messika',        logo:'MESSIKA',         style:'' },
      { id:'graff',     label:'Graff',          logo:'GRAFF',           style:'italic serif' },
      { id:'chaumet',   label:'Chaumet',        logo:'Chaumet',         style:'italic serif' },
      { id:'gucci',     label:'Gucci',          logo:'GUCCI',           style:'' },
      { id:'chopard',   label:'Chopard',        logo:'Chopard',         style:'italic serif' },
      { id:'fendi',     label:'Fendi',          logo:'FENDI',           style:'' },
      { id:'loewe',     label:'Loewe',          logo:'LOEWE',           style:'' },
      { id:'bulgari',   label:'Bulgari',        logo:'BVLGARI',         style:'' },
      { id:'louis-vuitton', label:'Louis Vuitton', logo:'LV',          style:'' },
      { id:'chrome-hearts', label:'Chrome Hearts', logo:'CHROME\nHEARTS', style:'italic' }
    ],
    watches: [
      { id:'rolex',         label:'Rolex',           logo:'ROLEX',          style:'' },
      { id:'cartier',       label:'Cartier',         logo:'Cartier',        style:'italic serif' },
      { id:'omega',         label:'Omega',           logo:'ΩMEGA',          style:'serif' },
      { id:'chanel',        label:'Chanel',          logo:'CHANEL',         style:'' },
      { id:'audemars',      label:'Audemars Piguet', logo:'AP',             style:'' },
      { id:'patek',         label:'Patek Philippe',  logo:'PATEK\nPHILIPPE',style:'italic' },
      { id:'richard-mille', label:'Richard Mille',   logo:'RM',             style:'' },
      { id:'hublot',        label:'Hublot',          logo:'HUBLOT',         style:'' }
    ],
    accessories: [
      { id:'chanel',          label:'Chanel',        logo:'CHANEL',         style:'' },
      { id:'dior',            label:'Dior',          logo:'DIOR',           style:'' },
      { id:'gucci',           label:'Gucci',         logo:'GUCCI',          style:'' },
      { id:'prada',           label:'Prada',         logo:'PRADA',          style:'' },
      { id:'celine',          label:'Céline',        logo:'CÉLINE',         style:'serif' },
      { id:'saint-laurent',   label:'Saint Laurent', logo:'YSL',            style:'' },
      { id:'balenciaga',      label:'Balenciaga',    logo:'BALENCIAGA',     style:'' },
      { id:'cartier',         label:'Cartier',       logo:'Cartier',        style:'italic serif' },
      { id:'miumiu',          label:'Miu Miu',       logo:'miu miu',        style:'italic' },
      { id:'bottega-veneta',  label:'Bottega Veneta',logo:'BV',             style:'' },
      { id:'gentle-monster',  label:'Gentle Monster',logo:'GENTLE\nMONSTER',style:'' }
    ]
  };

  function uniqueMaisonCount() {
    var seen = {};
    Object.keys(BRANDS).forEach(function (cat) {
      BRANDS[cat].forEach(function (b) { seen[b.id] = true; });
    });
    return Object.keys(seen).length;
  }

  /* ── Essentials category cards (homepage) ────────────────── */
  var ESSENTIALS = [
    { id:'sunglasses',     label:'Sunglasses',          icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="7" cy="14" r="4"/><circle cx="17" cy="14" r="4"/><path d="M11 14h2M3 14h0M21 14h0"/></svg>' },
    { id:'belts',          label:'Belts',               icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4" y="10" width="16" height="4" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>' },
    { id:'wallets',        label:'Wallets',             icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="7" width="18" height="12" rx="2"/><path d="M16 13h4"/></svg>' },
    { id:'winter-clothes', label:'Winter Coats',        icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 8l4-3 4 3v12H8V8z"/><path d="M6 10l2-2M18 10l-2-2"/></svg>' },
    { id:'caps-hats',      label:'Caps & Hats',         icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><ellipse cx="12" cy="14" rx="8" ry="3"/><path d="M4 14c0-4 3.5-7 8-7s8 3 8 7"/></svg>' },
    { id:'scarves',        label:'Silk Scarves',        icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 4c4 2 8 2 12 0v16c-4-2-8-2-12 0V4z"/></svg>' },
    { id:'mens-clothing',  label:"Men's Ready-to-Wear", icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 3l3 4h5l-2 14H6L4 7h5l3-4z"/></svg>' },
    { id:'womens-clothing',label:"Women's Ready-to-Wear",icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 3l-4 6h3v12h2V9h3l-4-6z"/></svg>' },
    { id:'matching-sets',  label:'Matching Sets',       icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 18l4-10 4 6 4-8 4 12"/><circle cx="8" cy="6" r="2"/></svg>' },
    { id:'mens-bags',      label:"Men's Bags",          icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M8 8V6a4 4 0 018 0v2"/></svg>' },
    { id:'pocket-squares', label:'Pocket Squares',      icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 18l6-12 6 12H6z"/></svg>' }
  ];

  function renderEssentialsGrid(containerId) {
    var el = $(containerId);
    if (!el) return;
    el.className = 'essentials-grid';
    el.innerHTML = ESSENTIALS.map(function (item) {
      var href, target;
      if (item.id === 'sunglasses') {
        href = 'accessories.html'; target = '_self';
      } else {
        href = waURL('Hi, I am looking for ' + item.label + '. Can you help?'); target = '_blank';
      }
      return '<a href="' + href + '" target="' + target + '" class="essential-card">'
        + '<div class="essential-icon">' + item.icon + '</div>'
        + '<div class="essential-label">' + esc(item.label) + '</div>'
        + '</a>';
    }).join('');
  }

  /* ── Render Brand Grid (anchors — a11y + SEO friendly) ───── */
  function renderBrandGrid(category, containerId) {
    var el = $(containerId);
    if (!el) return;
    var brands = BRANDS[category] || [];
    var base = category + '.html';
    el.innerHTML = brands.map(function (b) {
      var logoHtml = esc(b.logo).replace(/\n/g, '<br>');
      var styleClass = b.style ? ' ' + b.style : '';
      return '<a class="brand-card" data-magnetic href="' + base + '?brand=' + b.id + '">'
        + '<div class="brand-logo-circle"><div class="brand-logo-text' + styleClass + '">' + logoHtml + '</div></div>'
        + '<div class="brand-card-label">' + esc(b.label) + '</div>'
        + '</a>';
    }).join('');
  }

  /* ── Render Product Grid with Pagination ─────────────────── */
  var _prodState = { products:[], page:1, perPage:12, containerId:'', paginationId:'' };

  function renderProductGrid(products, containerId, paginationId, perPage) {
    _prodState.products = products;
    _prodState.page = 1;
    _prodState.perPage = perPage || 12;
    _prodState.containerId = containerId;
    _prodState.paginationId = paginationId;
    _renderPage();
  }

  function setPerPage(n) {
    if (!n) return;
    _prodState.perPage = n;
    _prodState.page = 1;
    _renderPage();
  }

  function _renderPage() {
    var s = _prodState;
    var el = $(s.containerId);
    var pgEl = $(s.paginationId);
    if (!el) return;

    var total = s.products.length;
    var totalPages = Math.max(1, Math.ceil(total / s.perPage));
    var start = (s.page - 1) * s.perPage;
    var slice = s.products.slice(start, start + s.perPage);

    if (!slice.length) {
      el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:48px;grid-column:1/-1;">No pieces found.</p>';
      if (pgEl) pgEl.innerHTML = '';
      return;
    }

    el.innerHTML = slice.map(function (p) {
      var params = new URLSearchParams({
        name: p.name, brand: p.brand, image: p.image, images: p.images,
        cat: p.category, wa: p.whatsapp_text, badge: p.badge || ''
      });
      return '<a class="prod-card" href="product.html?' + params.toString() + '">'
        + '<div class="prod-card-img"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="this.src=\'images/logo.png\'"></div>'
        + '<div class="prod-card-name">' + esc(p.name) + '</div>'
        + '</a>';
    }).join('');

    if (!pgEl) return;

    var from = start + 1, to = Math.min(start + s.perPage, total);
    var nums = '';
    _pageRange(s.page, totalPages).forEach(function (r) {
      if (r === '...') nums += '<span style="color:var(--muted);padding:0 4px">…</span>';
      else nums += '<button class="page-btn' + (r === s.page ? ' active' : '') + '" data-pg="' + r + '">' + r + '</button>';
    });

    pgEl.innerHTML = '<div class="page-info">Showing ' + from + '–' + to + ' of ' + total + '</div>'
      + '<div class="page-nums">'
      + '<button class="page-btn" data-pg="' + (s.page - 1) + '" ' + (s.page <= 1 ? 'disabled' : '') + '>←</button>'
      + nums
      + '<button class="page-btn" data-pg="' + (s.page + 1) + '" ' + (s.page >= totalPages ? 'disabled' : '') + '>→</button>'
      + '</div>'
      + '<div class="page-goto">Page <input type="number" min="1" max="' + totalPages + '" value="' + s.page + '" id="pg-input"> of ' + totalPages
      + ' <button onclick="LA.goToPage()">Go</button></div>';

    pgEl.querySelectorAll('.page-btn[data-pg]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pg = parseInt(this.getAttribute('data-pg'));
        if (pg >= 1 && pg <= totalPages) { _prodState.page = pg; _renderPage(); window.scrollTo({ top:0, behavior:'smooth' }); }
      });
    });
  }

  function goToPage() {
    var inp = $('pg-input');
    if (!inp) return;
    var pg = parseInt(inp.value);
    var total = Math.ceil(_prodState.products.length / _prodState.perPage);
    if (pg >= 1 && pg <= total) { _prodState.page = pg; _renderPage(); window.scrollTo({ top:0, behavior:'smooth' }); }
  }

  function _pageRange(cur, total) {
    if (total <= 7) { var arr = []; for (var i = 1; i <= total; i++) arr.push(i); return arr; }
    var pages = [1];
    if (cur > 3) pages.push('...');
    for (var j = Math.max(2, cur - 1); j <= Math.min(total - 1, cur + 1); j++) pages.push(j);
    if (cur < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  }

  /* ── Theme Toggle ────────────────────────────────────────── */
  function initTheme() {
    var tog = $('theme-input');
    var icon = $q('.theme-icon');
    if (!tog) return;
    var saved = localStorage.getItem('la-theme') || 'dark';
    if (saved === 'light') {
      document.body.classList.add('light'); tog.checked = true;
      if (icon) icon.textContent = '☀️';
    }
    tog.addEventListener('change', function () {
      var light = tog.checked;
      document.body.classList.toggle('light', light);
      localStorage.setItem('la-theme', light ? 'light' : 'dark');
      if (icon) icon.textContent = light ? '☀️' : '🌙';
    });
  }

  /* ── Navbar Hamburger + scroll state ─────────────────────── */
  function initHamburger() {
    var overlay = $('nav-overlay'), drawer = $('nav-drawer'), ham = $('nav-ham'), closeBtn = $('drawer-close');
    if (overlay && drawer) {
      ham && ham.addEventListener('click', function () { overlay.classList.add('open'); drawer.classList.add('open'); document.body.classList.add('no-scroll'); });
      function close() { overlay.classList.remove('open'); drawer.classList.remove('open'); document.body.classList.remove('no-scroll'); }
      closeBtn && closeBtn.addEventListener('click', close);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      var page = currentPageName();
      $qa('.nav-drawer a').forEach(function (a) {
        var href = a.getAttribute('href');
        if (href === page || (page === 'index.html' && href === 'index.html')) a.classList.add('active');
      });
    }
    var nav = $q('.navbar');
    if (nav) {
      var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 24); };
      window.addEventListener('scroll', onScroll, { passive:true }); onScroll();
    }
  }

  /* ── Search Overlay (loads catalog once, then filters cache) ── */
  function initSearch() {
    var searchIcon = $('nav-search-btn'), overlay = $('search-overlay'), closeBtn = $('search-close-btn');
    var input = $('search-input'), resultsWrap = $('search-results');
    if (!searchIcon || !overlay) return;

    searchIcon.addEventListener('click', function () { overlay.classList.add('open'); if (input) input.focus(); });
    closeBtn && closeBtn.addEventListener('click', function () { overlay.classList.remove('open'); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.classList.remove('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') overlay.classList.remove('open'); });

    if (!input || !resultsWrap) return;
    var timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var q = input.value.trim().toLowerCase();
        if (!q) { resultsWrap.innerHTML = ''; return; }
        loadProducts(function (products) {
          var hits = products.filter(function (p) {
            return p.name.toLowerCase().indexOf(q) > -1 || p.brand.toLowerCase().indexOf(q) > -1 || p.category.toLowerCase().indexOf(q) > -1;
          }).slice(0, 8);
          resultsWrap.innerHTML = hits.map(function (p) {
            var params = new URLSearchParams({ name:p.name, brand:p.brand, image:p.image, images:p.images, cat:p.category, wa:p.whatsapp_text });
            return '<a class="search-result-item" href="product.html?' + params.toString() + '">'
              + '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" onerror="this.style.display=\'none\'">'
              + '<span>' + esc(p.name) + '</span></a>';
          }).join('') || '<p style="color:var(--muted);font-size:.82rem;text-align:center;padding:12px;">No results found.</p>';
        });
      }, 300);
    });
  }

  /* ── Marquee (ticker) — honest lines, no invented numbers ── */
  function initTicker() {
    var messages = [
      'Private Client Sourcing',
      'Worldwide Insured Delivery',
      'WhatsApp Concierge',
      'Authenticated & Certified',
      'By Appointment',
      'Established MMXX'
    ];
    var set = messages.map(function (m) {
      return '<span class="ticker-item"><span class="ticker-dot">◆</span>' + esc(m) + '</span>';
    }).join('');
    $qa('.ticker-track').forEach(function (track) { track.innerHTML = set + set; });
  }

  /* ── Happy Clients & Transactions Strips ─────────────────── */
  function initHappyClients() {
    var el = $('clients-track');
    if (!el) return;
    var imgs = [
      'moneycheetah7-20211027-0001-1024x1024.jpg','moneycheetah7-20211027-0002-1024x1024.jpg',
      'moneycheetah7-20211027-0003-1024x1024.jpg','moneycheetah7-20211027-0004-1024x1024.jpg',
      'moneycheetah7-20211027-0005-819x1024.jpg','moneycheetah7-20211027-0006-819x1024.jpg',
      'moneycheetah7-20211027-0007-1024x1024.jpg','moneycheetah7-20211027-0008-819x1024.jpg'
    ];
    var base = 'images/proof/Happy%20Client';
    function card(img, idx) {
      return '<div class="client-card" data-realidx="' + idx + '">'
        + '<img src="' + base + '/' + img + '" alt="Client delivery" loading="lazy">'
        + '<div class="client-card-overlay"><span>🔍</span></div></div>';
    }
    el.innerHTML = imgs.map(card).join('') + imgs.map(card).join(''); // duplicate for seamless loop
    el.querySelectorAll('.client-card').forEach(function (c) {
      c.addEventListener('click', function () { openLightbox(imgs, parseInt(c.getAttribute('data-realidx')), base); });
    });
  }

  var TXN_PROOF_IMAGES = ['txn-1.webp','txn-2.webp','txn-3.webp','txn-4.webp','txn-5.webp','txn-6.webp'];
  var TXN_PROOF_BASE = 'images/transactions';
  function initTransactions() {
    var el = $('txn-grid');
    if (!el) return;
    el.innerHTML = TXN_PROOF_IMAGES.map(function (file) {
      return '<a href="trust.html" class="txn-proof-card">'
        + '<img src="' + TXN_PROOF_BASE + '/' + file + '" alt="Verified delivery" loading="lazy">'
        + '<div class="txn-proof-overlay"><span>Open the Archive →</span></div></a>';
    }).join('');
  }

  /* ── FAQ Accordion ───────────────────────────────────────── */
  function initFAQ() {
    $qa('.faq-q').forEach(function (q) {
      q.addEventListener('click', function () {
        var item = q.closest('.faq-item');
        var ans = item.querySelector('.faq-a');
        var open = item.classList.contains('open');
        $qa('.faq-item.open').forEach(function (o) { o.classList.remove('open'); o.querySelector('.faq-a').classList.remove('open'); });
        if (!open) { item.classList.add('open'); ans.classList.add('open'); }
      });
    });
  }

  /* ── Gallery (product page) ──────────────────────────────── */
  var _gallery = { images:[], cur:0 };
  function initGallery() {
    var mainImg = $('gal-main'), counter = $('gal-counter');
    if (!mainImg) return;
    var thumbs = $qa('.g-thumb');
    var total = thumbs.length;
    if (!total) return;

    _gallery.images = thumbs.map(function (t) { return t.getAttribute('data-img'); });
    _gallery.cur = 0;

    function go(idx) {
      if (idx < 0) idx = total - 1;
      if (idx >= total) idx = 0;
      _gallery.cur = idx;
      mainImg.style.opacity = '0';
      setTimeout(function () { mainImg.src = _gallery.images[idx]; mainImg.style.opacity = '1'; }, 150);
      thumbs.forEach(function (t, i) { t.classList.toggle('active', i === idx); });
      if (counter) counter.textContent = (idx + 1) + ' / ' + total;
    }
    mainImg.style.transition = 'opacity .15s ease';
    thumbs.forEach(function (t, i) { t.addEventListener('click', function () { go(i); }); });
    var prev = $('gal-prev'), next = $('gal-next');
    if (prev) prev.addEventListener('click', function () { go(_gallery.cur - 1); });
    if (next) next.addEventListener('click', function () { go(_gallery.cur + 1); });

    var fsBtn = $('gal-fs'), lb = $('lightbox'), lbImg = $('lightbox-img');
    if (fsBtn && lb && lbImg) {
      fsBtn.addEventListener('click', function () { lbImg.src = _gallery.images[_gallery.cur]; lb.classList.add('open'); });
      var lc = $('lb-close'); if (lc) lc.addEventListener('click', function () { lb.classList.remove('open'); });
      lb.addEventListener('click', function (e) { if (e.target === lb) lb.classList.remove('open'); });
    }
  }

  /* ── Category meta (breadcrumbs + product path) ─────────── */
  var CATEGORY_META = {
    handbags:    { page:'handbags.html',    label:'BAGS',        path:'BAGS' },
    footwear:    { page:'footwear.html',    label:'FOOTWEAR',    path:'FOOTWEAR' },
    jewelry:     { page:'jewelry.html',     label:'JEWELRY',     path:'JEWELRY' },
    watches:     { page:'watches.html',     label:'WATCHES',     path:'WATCHES' },
    accessories: { page:'accessories.html', label:'ACCESSORIES', path:'ACCESSORIES' }
  };
  function formatBrand(slug) { return slug.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  function getBrandLabel(category, brandSlug) {
    var list = BRANDS[category];
    if (list) { for (var i = 0; i < list.length; i++) if (list[i].id === brandSlug) return list[i].label; }
    return formatBrand(brandSlug);
  }

  /* ── Product Page Init ───────────────────────────────────── */
  function initProductPage() {
    var p = new URLSearchParams(window.location.search);
    var name = p.get('name') || 'Luxury Piece';
    var brand = p.get('brand') || '';
    var cat = p.get('cat') || 'handbags';
    var image = p.get('image') || 'images/logo.png';
    var images = (p.get('images') || image).split('|').filter(Boolean);
    if (!images.length) images = [image];
    var waText = p.get('wa') || 'Hi, I would like to enquire about ' + name;

    var meta = CATEGORY_META[cat] || CATEGORY_META.handbags;
    var brandLabel = brand ? getBrandLabel(cat, brand) : '';

    document.title = name + ' — Luxury Affairs';

    var nameEl = $('prod-name'), catEl = $('prod-cat');
    var bcProd = $('bc-product'), bcBrand = $('bc-brand'), bcCat = $('bc-category');
    if (nameEl) nameEl.textContent = name;
    if (catEl) catEl.textContent = meta.path + (brandLabel ? ' • ' + brandLabel : '');
    if (bcProd) bcProd.textContent = name.length > 32 ? name.slice(0, 32) + '…' : name;
    if (bcCat) { bcCat.href = meta.page; bcCat.textContent = meta.label; }
    if (bcBrand) { bcBrand.textContent = brandLabel || 'Maison'; bcBrand.href = brand ? meta.page + '?brand=' + encodeURIComponent(brand) : meta.page; }

    var mainImg = $('gal-main');
    if (mainImg) { mainImg.src = images[0]; mainImg.alt = name; }

    var thumbsWrap = $('gal-thumbs');
    if (thumbsWrap) {
      thumbsWrap.innerHTML = images.map(function (img, i) {
        return '<div class="g-thumb' + (i === 0 ? ' active' : '') + '" data-img="' + esc(img) + '">'
          + '<img src="' + esc(img) + '" alt="' + esc(name) + ' ' + (i + 1) + '" loading="lazy"></div>';
      }).join('');
    }
    var ctr = $('gal-counter');
    if (ctr) ctr.textContent = '1 / ' + images.length;

    var link = waURL(waText);
    $qa('.prod-wa-link').forEach(function (a) { a.href = link; a.target = '_blank'; });

    // Detail rows (honest, derived from data)
    var details = $('prod-details');
    if (details) {
      var rows = [
        ['Maison', brandLabel || '—'],
        ['Category', meta.path.charAt(0) + meta.path.slice(1).toLowerCase()],
        ['Sourcing', 'Direct · Private Client'],
        ['Delivery', 'Insured Worldwide · 3–5 Days']
      ];
      details.innerHTML = rows.map(function (r) {
        return '<div class="row"><span class="k">' + esc(r[0]) + '</span><span class="v">' + esc(r[1]) + '</span></div>';
      }).join('');
    }

    initGallery();
    initFAQ();
  }

  /* ── Collection Page Init ────────────────────────────────── */
  function initCollectionPage(category, pageTitle) {
    var urlBrand = new URLSearchParams(window.location.search).get('brand') || 'all';
    var bcBrand = $('bc-brand-name'), heading = $('col-heading'), countEl = $('col-count');
    var toolbar = $q('.col-toolbar'), brandOverview = $('brand-overview');
    var prodGrid = $('prod-grid'), pagination = $('pagination');

    if (bcBrand) bcBrand.textContent = urlBrand === 'all' ? 'All ' + pageTitle : getBrandLabel(category, urlBrand) + ' ' + pageTitle;

    loadProducts(category, function (products) {
      var filtered = products.filter(function (p) { return p.category === category; });
      var display = urlBrand === 'all' ? filtered : filtered.filter(function (p) { return p.brand === urlBrand; });

      if (urlBrand === 'all') {
        if (toolbar) toolbar.style.display = 'none';
        if (prodGrid) prodGrid.style.display = 'none';
        if (pagination) pagination.style.display = 'none';

        var catBrands = BRANDS[category] || [];
        if (heading) heading.textContent = pageTitle;
        if (countEl) countEl.textContent = filtered.length + ' pieces · ' + catBrands.length + ' maisons';

        if (brandOverview) {
          var brandCounts = {};
          filtered.forEach(function (p) { brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1; });
          var base = category + '.html';
          brandOverview.className = 'brand-overview-grid';
          brandOverview.innerHTML = catBrands.map(function (b) {
            var logoHtml = esc(b.logo).replace(/\n/g, '<br>');
            var styleClass = b.style ? ' ' + b.style : '';
            var cnt = brandCounts[b.id] || 0;
            return '<a class="brand-overview-card" data-magnetic href="' + base + '?brand=' + b.id + '">'
              + '<div class="brand-overview-logo"><div class="brand-overview-logo-text' + styleClass + '">' + logoHtml + '</div></div>'
              + '<div class="brand-overview-name">' + esc(b.label) + '</div>'
              + (cnt ? '<div class="brand-overview-count">' + cnt + ' pieces</div>' : '')
              + '</a>';
          }).join('');
          initMagnetic();
        }
      } else {
        if (brandOverview) brandOverview.style.display = 'none';
        if (heading) heading.textContent = getBrandLabel(category, urlBrand);
        if (countEl) countEl.textContent = display.length + ' pieces · ' + pageTitle;
        var sel = $('per-page-sel');
        var per = sel ? parseInt(sel.value) || 12 : 12;
        renderProductGrid(display, 'prod-grid', 'pagination', per);
      }
    });

    // per-page selector (was previously inert)
    var sel = $('per-page-sel');
    if (sel) sel.addEventListener('change', function () { setPerPage(parseInt(sel.value) || 12); });

    $qa('.grid-toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $qa('.grid-toggle-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var grid = $('prod-grid');
        if (grid) grid.classList.toggle('cols4', btn.getAttribute('data-cols') === '4');
      });
    });
  }

  /* ── Trust Page (archive) ────────────────────────────────── */
  var PROOF_BASE = 'images/proof';
  var ARCHIVE_TIMELINE = [
    {label:'MAY-26',emoji:'📦'},{label:'APR-26',emoji:'💳'},{label:'MAR-26',emoji:'📱'},
    {label:'FEB-26',emoji:'📸'},{label:'JAN-26',emoji:'📸'},{label:'DEC-25',emoji:'💳'},
    {label:'NOV-25',emoji:'📱'},{label:'OCT-25',emoji:'📸'},{label:'SEP-25',emoji:'📦'},
    {label:'AUG-25',emoji:'💳'},{label:'JUL-25',emoji:'📱'},{label:'JUN-25',emoji:'📸'},
    {label:'MAY-25',emoji:'📦'},{label:'APR-25',emoji:'💳'},{label:'MAR-25',emoji:'📱'},
    {label:'2024',emoji:'📸'},{label:'2023',emoji:'📦'}
  ];
  var ARCHIVE_MONTHS = ARCHIVE_TIMELINE.map(function (t) { return { label:t.label, emoji:t.emoji, images:[] }; });
  var PROOF_PLACEHOLDER = [
    {type:'PAYMENT',city:'New York',emoji:'💳'},{type:'DELIVERY',city:'Miami',emoji:'📦'},
    {type:'INVOICE',city:'Chicago',emoji:'📄'},{type:'TRACKING',city:'LA',emoji:'🗂️'},
    {type:'PAYMENT',city:'Dallas',emoji:'💳'},{type:'DELIVERY',city:'Houston',emoji:'📦'},
    {type:'INVOICE',city:'Atlanta',emoji:'📄'},{type:'TRACKING',city:'Seattle',emoji:'🗂️'}
  ];

  function proofImageBase(m) {
    var host = window.location.hostname;
    var isLocal = !host || host === 'localhost' || host === '127.0.0.1';
    if (isLocal && m.localBase) return m.localBase;
    if (m.baseUrl) return m.baseUrl;
    if (m.localBase) return m.localBase;
    if (m.folder) return PROOF_BASE + '/' + m.folder;
    return PROOF_BASE + '/' + m.label.toLowerCase();
  }
  function mergeProofManifest(manifest) {
    var byLabel = {};
    if (manifest && manifest.months) manifest.months.forEach(function (m) { byLabel[m.label] = m; });
    return ARCHIVE_TIMELINE.map(function (t) {
      var m = byLabel[t.label];
      if (!m) return { label:t.label, emoji:t.emoji, images:[] };
      return { label:t.label, emoji:m.emoji || t.emoji, folder:m.folder, baseUrl:m.baseUrl, localBase:m.localBase, images:m.images || [] };
    });
  }
  function defaultArchiveIndex(months) {
    for (var i = 0; i < months.length; i++) if (months[i].images && months[i].images.length > 0) return i;
    return 3;
  }
  function renderProofGrid(m) {
    var grid = $('proof-grid');
    if (!grid) return;
    if (m.images && m.images.length > 0) {
      var imgBase = proofImageBase(m);
      grid.innerHTML = m.images.map(function (img, idx) {
        return '<div class="proof-card proof-card-photo" data-idx="' + idx + '">'
          + '<img src="' + imgBase + '/' + img + '" alt="' + esc(m.label) + ' proof" loading="lazy" style="width:100%;height:100%;object-fit:cover">'
          + '<div class="proof-card-overlay"><span>🔍</span></div></div>';
      }).join('');
      grid.querySelectorAll('.proof-card-photo').forEach(function (card) {
        card.addEventListener('click', function () { openLightbox(m.images, parseInt(card.getAttribute('data-idx')), imgBase); });
      });
    } else {
      grid.innerHTML = PROOF_PLACEHOLDER.map(function (p) {
        return '<div class="proof-card"><div class="proof-card-img">' + p.emoji + '</div>'
          + '<div class="proof-card-cap"><div class="pc-type">' + p.type + ' PROOF</div>'
          + '<div class="pc-city">📍 ' + esc(p.city) + '</div></div></div>';
      }).join('');
    }
  }
  function openLightbox(images, startIdx, imgBase) {
    var lb = $('lightbox'), lbImg = $('lightbox-img');
    if (!lb || !lbImg) return;
    var current = startIdx;
    function show(i) { current = (i + images.length) % images.length; lbImg.src = imgBase + '/' + images[current]; }
    show(current);
    lb.classList.add('open');
    if (!lb.querySelector('.lb-prev')) {
      var prev = document.createElement('button'); prev.className = 'lb-prev lightbox-nav'; prev.innerHTML = '&#8592;';
      prev.addEventListener('click', function (e) { e.stopPropagation(); show(current - 1); }); lb.appendChild(prev);
    }
    if (!lb.querySelector('.lb-next')) {
      var next = document.createElement('button'); next.className = 'lb-next lightbox-nav'; next.innerHTML = '&#8594;';
      next.addEventListener('click', function (e) { e.stopPropagation(); show(current + 1); }); lb.appendChild(next);
    }
    var lc = $('lb-close'); if (lc) lc.onclick = function () { lb.classList.remove('open'); };
    lb.onclick = function (e) { if (e.target === lb) lb.classList.remove('open'); };
  }
  function initArchiveUI(months, activeIdx) {
    var tlEl = $('timeline-track');
    if (tlEl) {
      tlEl.innerHTML = months.map(function (m, i) {
        var has = m.images && m.images.length > 0;
        return '<div class="tl-item' + (i === activeIdx ? ' active' : '') + '" data-idx="' + i + '">'
          + '<div class="tl-circle' + (has ? ' tl-has-images' : '') + '">' + m.emoji + '</div>'
          + '<div class="tl-label">' + esc(m.label) + '</div>'
          + (has ? '<div class="tl-count">' + m.images.length + '</div>' : '') + '</div>';
      }).join('');
      tlEl.addEventListener('click', function (e) {
        var item = e.target.closest('.tl-item'); if (!item) return;
        $qa('.tl-item').forEach(function (t) { t.classList.remove('active'); });
        item.classList.add('active');
        renderProofGrid(months[parseInt(item.getAttribute('data-idx'))]);
      });
    }
    renderProofGrid(months[activeIdx]);
  }
  function initArchive() {
    fetch('data/proof-manifest.json').then(function (r) { return r.json(); })
      .then(function (manifest) { var months = mergeProofManifest(manifest); ARCHIVE_MONTHS = months; initArchiveUI(months, defaultArchiveIndex(months)); })
      .catch(function () { initArchiveUI(ARCHIVE_MONTHS, defaultArchiveIndex(ARCHIVE_MONTHS)); });
  }

  /* ══════════════════════════════════════════════════════════
     MOTION LAYER
     ══════════════════════════════════════════════════════════ */

  /* Intro curtain — once per session, homepage only */
  function initIntro() {
    var intro = $('intro');
    if (!intro) return;
    if (reduced() || sessionStorage.getItem('la-intro')) { intro.parentNode && intro.parentNode.removeChild(intro); return; }
    sessionStorage.setItem('la-intro', '1');
    document.body.classList.add('no-scroll');
    var countEl = $('intro-count');
    var n = 0;
    var timer = setInterval(function () {
      n = Math.min(100, n + Math.floor(Math.random() * 9) + 4);
      if (countEl) countEl.textContent = (n < 10 ? '0' : '') + n;
      if (n >= 100) clearInterval(timer);
    }, 90);
    function finish() {
      intro.classList.add('done');
      document.body.classList.remove('no-scroll');
      setTimeout(function () { intro.parentNode && intro.parentNode.removeChild(intro); }, 1200);
    }
    var t = setTimeout(finish, 1900);
    intro.addEventListener('click', function () { clearTimeout(t); clearInterval(timer); finish(); });
  }

  /* Custom magnetic cursor */
  function initCursor() {
    if (!fine() || reduced()) return;
    var ring = document.createElement('div'); ring.className = 'cursor';
    var dot = document.createElement('div'); dot.className = 'cursor-dot';
    document.body.appendChild(ring); document.body.appendChild(dot);
    var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      ring.classList.add('on'); dot.classList.add('on');
    });
    document.addEventListener('mousedown', function () { ring.classList.add('down'); });
    document.addEventListener('mouseup', function () { ring.classList.remove('down'); });
    var hoverSel = 'a,button,.brand-card,.prod-card,[data-cursor],.maison-tab,.filter-tab,.tl-item,input,select,.client-card,.txn-proof-card,.g-thumb';
    document.addEventListener('mouseover', function (e) { if (e.target.closest(hoverSel)) ring.classList.add('hover'); });
    document.addEventListener('mouseout', function (e) { if (e.target.closest(hoverSel)) ring.classList.remove('hover'); });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
  }

  /* Magnetic pull on [data-magnetic] */
  function initMagnetic() {
    if (!fine() || reduced()) return;
    $qa('[data-magnetic]').forEach(function (el) {
      if (el._mag) return; el._mag = true;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.28;
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* Scroll reveals + count-up.
     Count-up is driven off the reveal (a separate observer would starve:
     ancestors clipped by the mask reveal report zero intersection area). */
  function runCount(el) {
    if (el._counted) return; el._counted = true;
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var pad = el.getAttribute('data-pad') === '1';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduced()) { el.textContent = (pad && target < 10 ? '0' : '') + target + suffix; return; }
    var start = performance.now(), dur = 1400;
    (function step(now) {
      var t = Math.min(1, (now - start) / dur);
      var v = Math.floor((1 - Math.pow(1 - t, 3)) * target);
      el.textContent = (pad && v < 10 ? '0' : '') + v + suffix;
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }

  function reveal(el) {
    el.classList.add('in');
    if (el.hasAttribute('data-count')) runCount(el);
    $qa('[data-count]', el).forEach(runCount);
  }

  function initReveal() {
    var els = $qa('[data-reveal]');
    if (!els.length || !('IntersectionObserver' in window) || reduced()) {
      els.forEach(reveal);
      $qa('[data-count]').forEach(runCount);
      return;
    }
    // threshold 0: mask-revealed elements are clipped to a 3% sliver, so
    // their intersection ratio can never exceed 0.03 until revealed
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); } });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });

    // Jump-scrolls (anchors, programmatic) can skip an element between
    // observer frames; sweep anything already scrolled past.
    var sweeping = false;
    window.addEventListener('scroll', function () {
      if (sweeping) return; sweeping = true;
      setTimeout(function () {
        sweeping = false;
        $qa('[data-reveal]:not(.in)').forEach(function (el) {
          if (el.getBoundingClientRect().bottom < 0) { reveal(el); io.unobserve(el); }
        });
      }, 200);
    }, { passive: true });

    // Count-ups that live outside any reveal container
    $qa('[data-count]').forEach(function (el) {
      if (!el.closest('[data-reveal]')) runCount(el);
    });
  }

  /* Some engines refuse muted autoplay until nudged (low-power mode etc.) */
  function initVideoNudge() {
    $qa('video[autoplay]').forEach(function (v) {
      if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    });
  }

  /* Subtle parallax on [data-parallax] */
  function initParallax() {
    if (reduced()) return;
    var items = $qa('[data-parallax]').map(function (el) { return { el:el, s:parseFloat(el.getAttribute('data-parallax')) || 0.12 }; });
    if (!items.length) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      items.forEach(function (it) {
        var r = it.el.getBoundingClientRect();
        var off = (r.top + r.height / 2 - vh / 2) / vh;
        it.el.style.transform = 'translate3d(0,' + (off * it.s * 100).toFixed(1) + 'px,0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive:true });
    update();
  }

  /* Maison directory tabs (homepage) */
  function initMaisonDirectory() {
    var tabs = $qa('.maison-tab');
    if (!tabs.length) return;
    var order = ['handbags','watches','footwear','jewelry','accessories'];
    order.forEach(function (cat) { renderBrandGrid(cat, 'maison-' + cat); });
    initMagnetic();
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var cat = tab.getAttribute('data-cat');
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        $qa('.maison-panel').forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-cat') === cat); });
      });
    });
  }

  /* ── Homepage Init ───────────────────────────────────────── */
  function initHomepage() {
    initMaisonDirectory();
    renderEssentialsGrid('essentials-grid');
    initHappyClients();
    initTransactions();
    var maisonStat = $('stat-maisons');
    if (maisonStat) maisonStat.setAttribute('data-count', uniqueMaisonCount());
  }

  /* ── Boot ────────────────────────────────────────────────── */
  function boot() {
    initIntro();
    initTheme();
    initHamburger();
    initSearch();
    initTicker();
    initFAQ();
    initCursor();

    var page = currentPageName();
    if (page === 'index.html' || page === '') initHomepage();
    else if (page === 'handbags.html') initCollectionPage('handbags', 'Handbags');
    else if (page === 'footwear.html') initCollectionPage('footwear', 'Footwear');
    else if (page === 'jewelry.html') initCollectionPage('jewelry', 'Jewelry');
    else if (page === 'watches.html') initCollectionPage('watches', 'Watches');
    else if (page === 'accessories.html') initCollectionPage('accessories', 'Accessories');
    else if (page === 'product.html') initProductPage();
    else if (page === 'trust.html') initArchive();

    initReveal();
    initParallax();
    initMagnetic();
    initVideoNudge();
  }

  document.addEventListener('DOMContentLoaded', boot);

  return { goToPage: goToPage };

})();
