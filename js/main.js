/* ============================================================
   LUXURY AFFAIRS STORE — main.js
   Single plain script — NO import/export — works on file://
   ============================================================ */

var LA = (function () {

  var WA_NUM = '17175385671';

  /* ── Utility ─────────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function $q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $qa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  function waURL(text) {
    return 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(text);
  }

  /* ── CSV Parser ──────────────────────────────────────────── */
  function parseCSV(text) {
    var lines = text.trim().split('\n');
    var headers = lines[0].split(',').map(function(h){ return h.trim(); });
    return lines.slice(1).map(function(line) {
      var vals = []; var cur = ''; var inQ = false;
      for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (ch === '"') { inQ = !inQ; continue; }
        if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      vals.push(cur.trim());
      var obj = {};
      headers.forEach(function(h, i){ obj[h] = vals[i] || ''; });
      return obj;
    });
  }

  /* ── Load Products ───────────────────────────────────────────
     products.csv is split into one clean file per category+brand so
     each stays well under Cloudflare's 25 MiB static-asset limit.
     Regenerate these files + this manifest via scripts/split-products.js. */
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
      'data/products-handbags-louis-vuitton.csv',
      'data/products-handbags-miumiu.csv',
      'data/products-handbags-prada.csv',
      'data/products-handbags-the-row.csv',
      'data/products-handbags-ysl.csv'
    ],
    footwear: [
      'data/products-footwear-alaia.csv',
      'data/products-footwear-celine.csv',
      'data/products-footwear-chanel.csv',
      'data/products-footwear-dior.csv',
      'data/products-footwear-fendi.csv',
      'data/products-footwear-gucci.csv',
      'data/products-footwear-hermes.csv',
      'data/products-footwear-jimmy-choo.csv',
      'data/products-footwear-loewe.csv',
      'data/products-footwear-loro-piana.csv',
      'data/products-footwear-louboutin.csv',
      'data/products-footwear-miumiu.csv',
      'data/products-footwear-prada.csv',
      'data/products-footwear-rene-caovilla.csv',
      'data/products-footwear-valentino.csv',
      'data/products-footwear-ysl.csv'
    ],
    jewelry: [
      'data/products-jewelry-bulgari.csv',
      'data/products-jewelry-cartier.csv',
      'data/products-jewelry-chanel.csv',
      'data/products-jewelry-chaumet.csv',
      'data/products-jewelry-chopard.csv',
      'data/products-jewelry-dior.csv',
      'data/products-jewelry-fendi.csv',
      'data/products-jewelry-graff.csv',
      'data/products-jewelry-gucci.csv',
      'data/products-jewelry-hermes.csv',
      'data/products-jewelry-loewe.csv',
      'data/products-jewelry-messika.csv',
      'data/products-jewelry-tiffany.csv',
      'data/products-jewelry-van-cleef.csv'
    ],
    watches: [
      'data/products-watches-audemars.csv',
      'data/products-watches-cartier.csv',
      'data/products-watches-chanel.csv',
      'data/products-watches-hublot.csv',
      'data/products-watches-omega.csv',
      'data/products-watches-patek.csv',
      'data/products-watches-richard-mille.csv',
      'data/products-watches-rolex.csv'
    ],
    accessories: [
      'data/products-accessories-balenciaga.csv',
      'data/products-accessories-bottega-veneta.csv',
      'data/products-accessories-cartier.csv',
      'data/products-accessories-celine.csv',
      'data/products-accessories-chanel.csv',
      'data/products-accessories-dior.csv',
      'data/products-accessories-gentle-monster.csv',
      'data/products-accessories-gucci.csv',
      'data/products-accessories-miumiu.csv',
      'data/products-accessories-prada.csv',
      'data/products-accessories-saint-laurent.csv'
    ]
  };

  function fetchCSV(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
      cb((xhr.status === 200 || xhr.status === 0) ? parseCSV(xhr.responseText) : []);
    };
    xhr.onerror = function() { cb([]); };
    xhr.send();
  }

  /* loadProducts([category,] cb)
     - With a category: loads only that category's file(s).
     - Without one: loads the entire catalog (used by search). */
  function loadProducts(category, cb) {
    if (typeof category === 'function') { cb = category; category = null; }

    var files = [];
    if (category && CATALOG_FILES[category]) {
      files = CATALOG_FILES[category];
    } else {
      Object.keys(CATALOG_FILES).forEach(function(k) { files = files.concat(CATALOG_FILES[k]); });
    }

    var remaining = files.length;
    if (!remaining) { cb([]); return; }

    var all = [];
    files.forEach(function(url) {
      fetchCSV(url, function(rows) {
        all = all.concat(rows);
        if (--remaining === 0) cb(all);
      });
    });
  }

  /* ── Brand Data ──────────────────────────────────────────── */
  var BRANDS = {
    handbags: [
      { id:'chanel',   label:'Chanel Bags',         logo:'CHANEL',          style:'' },
      { id:'hermes',   label:'Hermes Bags',          logo:'HERMÈS',          style:'serif' },
      { id:'dior',     label:'Dior Bags',            logo:'DIOR',            style:'' },
      { id:'gucci',    label:'Gucci Bags',           logo:'GUCCI',           style:'' },
      { id:'prada',    label:'Prada Bags',           logo:'PRADA',           style:'' },
      { id:'louis-vuitton', label:'LV Bags',         logo:'LV',              style:'' },
      { id:'ysl',      label:'YSL Bags',             logo:'YSL',             style:'' },
      { id:'celine',   label:'Celine Bags',          logo:'CÉLINE',          style:'serif' },
      { id:'bottega',  label:'Bottega Veneta Bags',  logo:'BOTTEGA\nVENETA', style:'italic' },
      { id:'goyard',   label:'Goyard Bags',          logo:'GOYARD',          style:'serif' },
      { id:'miumiu',   label:'Miu Miu Bags',         logo:'MIU MIU',         style:'' },
      { id:'loewe',    label:'Loewe Bags',           logo:'LOEWE',           style:'serif' },
      { id:'fendi',    label:'Fendi Bags',           logo:'FENDI',           style:'' },
      { id:'loro-piana',label:'Loro Piana Bags',     logo:'LORO\nPIANA',     style:'italic' },
      { id:'the-row',  label:'The Row Bags',         logo:'THE ROW',         style:'serif' }
    ],
    footwear: [
      { id:'chanel',    label:'Chanel Shoes',        logo:'CHANEL',    style:'' },
      { id:'hermes',    label:'Hermes Shoes',         logo:'HERMÈS',    style:'serif' },
      { id:'gucci',     label:'Gucci Shoes',          logo:'GUCCI',     style:'' },
      { id:'prada',     label:'Prada Shoes',          logo:'PRADA',     style:'' },
      { id:'dior',      label:'Dior Shoes',           logo:'DIOR',      style:'' },
      { id:'valentino', label:'Valentino Shoes',      logo:'VALENTINO', style:'' },
      { id:'ysl',       label:'YSL Shoes',            logo:'YSL',       style:'' },
      { id:'alaia',     label:'Alaia Shoes',          logo:'ALAÏA',     style:'serif' },
      { id:'fendi',     label:'Fendi Shoes',          logo:'FENDI',     style:'' },
      { id:'celine',    label:'Celine Shoes',         logo:'CÉLINE',    style:'serif' },
      { id:'loro-piana',label:'Loro Piana Shoes',     logo:'LORO\nPIANA',style:'italic' },
      { id:'louboutin', label:'Louboutin Shoes',      logo:'LOUBOUTIN', style:'' },
      { id:'jimmy-choo',label:'Jimmy Choo Shoes',     logo:'JIMMY\nCHOO', style:'italic' },
      { id:'loewe',     label:'Loewe Shoes',          logo:'LOEWE',     style:'serif' },
      { id:'miumiu',    label:'Miu Miu Shoes',        logo:'MIU MIU',   style:'' },
      { id:'rene-caovilla', label:'Rene Caovilla',    logo:'RENÉ\nCAOVILLA', style:'italic' }
    ],
    jewelry: [
      { id:'cartier',   label:'Cartier Jewelry',     logo:'Cartier',         style:'italic serif' },
      { id:'van-cleef', label:'Van Cleef & Arpels',  logo:'VAN CLEEF\n& ARPELS', style:'italic' },
      { id:'hermes',    label:'Hermes Jewelry',       logo:'HERMÈS',          style:'serif' },
      { id:'chanel',    label:'Chanel Jewelry',       logo:'CHANEL',          style:'' },
      { id:'tiffany',   label:'Tiffany & Co.',        logo:'TIFFANY\n& CO.',  style:'italic' },
      { id:'dior',      label:'Dior Jewelry',         logo:'DIOR',            style:'' },
      { id:'messika',   label:'Messika Jewelry',      logo:'MESSIKA',         style:'' },
      { id:'graff',     label:'Graff Jewelry',        logo:'GRAFF',           style:'italic serif' },
      { id:'chaumet',   label:'Chaumet Jewelry',      logo:'Chaumet',         style:'italic serif' },
      { id:'gucci',     label:'Gucci Jewelry',        logo:'GUCCI',           style:'' },
      { id:'chopard',   label:'Chopard Jewelry',      logo:'Chopard',         style:'italic serif' },
      { id:'fendi',     label:'Fendi Jewelry',        logo:'FENDI',           style:'' },
      { id:'loewe',     label:'Loewe Jewelry',        logo:'LOEWE',           style:'' },
      { id:'bulgari',   label:'BVLGARI Jewelry',      logo:'BVLGARI',         style:'' },
      { id:'louis-vuitton', label:'LV Jewelry',       logo:'LV',              style:'' },
      { id:'chrome-hearts', label:'Chrome Hearts',    logo:'CHROME\nHEARTS',  style:'italic' }
    ],
    watches: [
      { id:'rolex',         label:'Rolex',            logo:'ROLEX',          style:'' },
      { id:'cartier',       label:'Cartier',          logo:'Cartier',        style:'italic serif' },
      { id:'omega',         label:'Omega',            logo:'ΩMEGA',          style:'serif' },
      { id:'chanel',        label:'Chanel',           logo:'CHANEL',         style:'' },
      { id:'audemars',      label:'Audemars Piguet',  logo:'AP',             style:'' },
      { id:'patek',         label:'Patek Philippe',   logo:'PATEK\nPHILIPPE',style:'italic' },
      { id:'richard-mille', label:'Richard Mille',    logo:'RM',             style:'' },
      { id:'hublot',        label:'Hublot',           logo:'HUBLOT',         style:'' }
    ],
    accessories: [
      { id:'chanel',          label:'Chanel',           logo:'CHANEL',         style:'' },
      { id:'dior',            label:'Dior',             logo:'DIOR',           style:'' },
      { id:'gucci',           label:'Gucci',            logo:'GUCCI',          style:'' },
      { id:'prada',           label:'Prada',            logo:'PRADA',          style:'' },
      { id:'celine',          label:'Celine',           logo:'CÉLINE',         style:'serif' },
      { id:'saint-laurent',   label:'Saint Laurent',    logo:'YSL',            style:'' },
      { id:'balenciaga',      label:'Balenciaga',       logo:'BALENCIAGA',     style:'' },
      { id:'cartier',         label:'Cartier',          logo:'Cartier',        style:'italic serif' },
      { id:'miumiu',          label:'Miu Miu',          logo:'miu miu',        style:'italic' },
      { id:'bottega-veneta',  label:'Bottega Veneta',   logo:'BV',             style:'' },
      { id:'gentle-monster',  label:'Gentle Monster',   logo:'GENTLE\nMONSTER',style:'' }
    ]
  };

  /* ── Essentials category cards (homepage) ────────────────── */
  var ESSENTIALS = [
    { id:'sunglasses',     label:'Sunglasses',          icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="7" cy="14" r="4"/><circle cx="17" cy="14" r="4"/><path d="M11 14h2M3 14h0M21 14h0"/></svg>' },
    { id:'belts',          label:'Belts',               icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4" y="10" width="16" height="4" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>' },
    { id:'wallets',        label:'Wallets',             icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="7" width="18" height="12" rx="2"/><path d="M16 13h4"/></svg>' },
    { id:'winter-clothes', label:'Winter Clothes',      icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 8l4-3 4 3v12H8V8z"/><path d="M6 10l2-2M18 10l-2-2"/></svg>' },
    { id:'caps-hats',      label:'Caps & Hats',         icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><ellipse cx="12" cy="14" rx="8" ry="3"/><path d="M4 14c0-4 3.5-7 8-7s8 3 8 7"/></svg>' },
    { id:'scarves',        label:'Scarves',             icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 4c4 2 8 2 12 0v16c-4-2-8-2-12 0V4z"/></svg>' },
    { id:'mens-clothing',  label:"Men's Clothing",      icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 3l3 4h5l-2 14H6L4 7h5l3-4z"/></svg>' },
    { id:'womens-clothing',label:"Women's Clothing",    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 3l-4 6h3v12h2V9h3l-4-6z"/></svg>' },
    { id:'matching-sets',  label:'Best Matching Sets',  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 18l4-10 4 6 4-8 4 12"/><circle cx="8" cy="6" r="2"/></svg>' },
    { id:'mens-bags',      label:'Mens Bags',           icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M8 8V6a4 4 0 018 0v2"/></svg>' },
    { id:'pocket-squares', label:'Pocket Squares',      icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 18l6-12 6 12H6z"/></svg>' }
  ];

  function renderEssentialsGrid(containerId) {
    var el = $(containerId);
    if (!el) return;
    el.className = 'essentials-grid';
    el.innerHTML = ESSENTIALS.map(function(item) {
      var href, target;
      if (item.id === 'sunglasses') {
        href   = 'accessories.html';
        target = '_self';
      } else {
        var msg = encodeURIComponent('Hi, I am looking for ' + item.label + '. Can you help?');
        href   = 'https://wa.me/17175385671?text=' + msg;
        target = '_blank';
      }
      return '<a href="' + href + '" target="' + target + '" class="essential-card">'
        + '<div class="essential-icon">' + item.icon + '</div>'
        + '<div class="essential-label">' + item.label + '</div>'
        + '</a>';
    }).join('');
  }

  /* ── Render Brand Grid ───────────────────────────────────── */
  function renderBrandGrid(category, containerId) {
    var el = $(containerId);
    if (!el) return;
    var brands = BRANDS[category] || [];
    var page = window.location.pathname.split('/').pop() || 'index.html';
    var base = category + '.html';
    el.innerHTML = brands.map(function(b) {
      var logoHtml = b.logo.replace(/\n/g, '<br>');
      var styleClass = b.style ? ' ' + b.style : '';
      return '<div class="brand-card" onclick="window.location=\'' + base + '?brand=' + b.id + '\'">'
        + '<div class="brand-logo-circle">'
        + '<div class="brand-logo-text' + styleClass + '">' + logoHtml + '</div>'
        + '</div>'
        + '<div class="brand-card-label">' + b.label + '</div>'
        + '</div>';
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
      el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:48px;font-size:.9rem;">No products found.</p>';
      if (pgEl) pgEl.innerHTML = '';
      return;
    }

    el.innerHTML = slice.map(function(p) {
      var params = new URLSearchParams({
        name:   p.name,
        brand:  p.brand,
        image:  p.image,
        images: p.images,
        cat:    p.category,
        wa:     p.whatsapp_text,
        badge:  p.badge || ''
      });
      return '<div class="prod-card" onclick="window.location=\'product.html?' + params.toString() + '\'">'
        + '<div class="prod-card-img"><img src="' + p.image + '" alt="' + p.name + '" loading="lazy" onerror="this.src=\'images/logo.png\'"></div>'
        + '<div class="prod-card-name">' + p.name + '</div>'
        + '</div>';
    }).join('');

    if (!pgEl) return;

    // Pagination HTML
    var from = start + 1, to = Math.min(start + s.perPage, total);
    var nums = '';
    var range = _pageRange(s.page, totalPages);
    range.forEach(function(r) {
      if (r === '...') {
        nums += '<span style="color:var(--muted);padding:0 4px">…</span>';
      } else {
        nums += '<button class="page-btn' + (r === s.page ? ' active' : '') + '" data-pg="' + r + '">' + r + '</button>';
      }
    });

    pgEl.innerHTML = '<div class="page-info">Showing ' + from + '–' + to + ' of ' + total + '</div>'
      + '<div class="page-nums">'
      + '<button class="page-btn" data-pg="' + (s.page - 1) + '" ' + (s.page <= 1 ? 'disabled' : '') + '>←</button>'
      + nums
      + '<button class="page-btn" data-pg="' + (s.page + 1) + '" ' + (s.page >= totalPages ? 'disabled' : '') + '>→</button>'
      + '</div>'
      + '<div class="page-goto">Go to page: <input type="number" min="1" max="' + totalPages + '" value="' + s.page + '" id="pg-input"> of ' + totalPages
      + ' <button onclick="LA.goToPage()">Go</button></div>';

    pgEl.querySelectorAll('.page-btn[data-pg]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var pg = parseInt(this.getAttribute('data-pg'));
        if (pg >= 1 && pg <= totalPages) {
          _prodState.page = pg;
          _renderPage();
          window.scrollTo({ top: 0, behavior:'smooth' });
        }
      });
    });
  }

  function goToPage() {
    var inp = $('pg-input');
    if (!inp) return;
    var pg = parseInt(inp.value);
    var total = Math.ceil(_prodState.products.length / _prodState.perPage);
    if (pg >= 1 && pg <= total) {
      _prodState.page = pg;
      _renderPage();
      window.scrollTo({ top:0, behavior:'smooth' });
    }
  }

  function _pageRange(cur, total) {
    if (total <= 7) {
      var arr = [];
      for (var i = 1; i <= total; i++) arr.push(i);
      return arr;
    }
    var pages = [1];
    if (cur > 3) pages.push('...');
    for (var i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
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
      document.body.classList.add('light');
      tog.checked = true;
      if (icon) icon.textContent = '☀️';
    }
    tog.addEventListener('change', function() {
      var light = tog.checked;
      document.body.classList.toggle('light', light);
      localStorage.setItem('la-theme', light ? 'light' : 'dark');
      if (icon) icon.textContent = light ? '☀️' : '🌙';
    });
  }

  /* ── Navbar Hamburger ────────────────────────────────────── */
  function initHamburger() {
    var overlay = $('nav-overlay');
    var drawer  = $('nav-drawer');
    var ham     = $('nav-ham');
    var closeBtn= $('drawer-close');
    if (!overlay || !drawer) return;

    ham && ham.addEventListener('click', function() {
      overlay.classList.add('open');
      drawer.classList.add('open');
    });
    closeBtn && closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close();
    });
    function close() {
      overlay.classList.remove('open');
      drawer.classList.remove('open');
    }

    // Active link
    var page = window.location.pathname.split('/').pop() || 'index.html';
    $qa('.nav-drawer a').forEach(function(a) {
      var href = a.getAttribute('href');
      if (href === page || (page === '' && href === 'index.html')) a.classList.add('active');
    });
  }

  /* ── Search Overlay ──────────────────────────────────────── */
  function initSearch() {
    var searchIcon   = $('nav-search-btn');
    var overlay      = $('search-overlay');
    var closeBtn     = $('search-close-btn');
    var input        = $('search-input');
    var resultsWrap  = $('search-results');
    if (!searchIcon || !overlay) return;

    searchIcon.addEventListener('click', function() { overlay.classList.add('open'); if(input) input.focus(); });
    closeBtn && closeBtn.addEventListener('click', function() { overlay.classList.remove('open'); });
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.classList.remove('open'); });

    if (!input || !resultsWrap) return;
    var timer;
    input.addEventListener('input', function() {
      clearTimeout(timer);
      timer = setTimeout(function() {
        var q = input.value.trim().toLowerCase();
        if (!q) { resultsWrap.innerHTML = ''; return; }
        loadProducts(function(products) {
          var hits = products.filter(function(p) {
            return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
          }).slice(0, 8);
          resultsWrap.innerHTML = hits.map(function(p) {
            var params = new URLSearchParams({ name:p.name, brand:p.brand, image:p.image, images:p.images, cat:p.category, wa:p.whatsapp_text });
            return '<div class="search-result-item" onclick="window.location=\'product.html?' + params.toString() + '\'">'
              + '<img src="' + p.image + '" alt="' + p.name + '" onerror="this.style.display=\'none\'">'
              + '<span>' + p.name + '</span>'
              + '</div>';
          }).join('') || '<p style="color:var(--muted);font-size:.82rem;text-align:center;padding:12px;">No results found.</p>';
        });
      }, 320);
    });
  }

  /* ── Ticker ──────────────────────────────────────────────── */
  function initTicker() {
    $qa('.ticker-track').forEach(function(t) { t.innerHTML += t.innerHTML; });
  }

  /* ── Happy Clients & Transactions Strips ─────────────────── */
  function initHappyClients() {
    var el = $('clients-track');
    if (!el) return;

    var clientImages = [
      'moneycheetah7-20211027-0001-1024x1024.jpg',
      'moneycheetah7-20211027-0002-1024x1024.jpg',
      'moneycheetah7-20211027-0003-1024x1024.jpg',
      'moneycheetah7-20211027-0004-1024x1024.jpg',
      'moneycheetah7-20211027-0005-819x1024.jpg',
      'moneycheetah7-20211027-0006-819x1024.jpg',
      'moneycheetah7-20211027-0007-1024x1024.jpg',
      'moneycheetah7-20211027-0008-819x1024.jpg'
    ];
    var base = 'images/proof/Happy%20Client';

    function makeCard(img, idx) {
      return '<div class="client-card client-card-img" data-realidx="' + idx + '">'
        + '<img src="' + base + '/' + img + '" alt="Happy Client" loading="lazy">'
        + '<div class="client-card-overlay"><span>🔍</span></div>'
        + '</div>';
    }

    el.innerHTML = clientImages.map(makeCard).join('');

    el.querySelectorAll('.client-card-img').forEach(function(card) {
      card.addEventListener('click', function() {
        var idx = parseInt(card.getAttribute('data-realidx'));
        openLightbox(clientImages, idx, base);
      });
    });
  }

  var TXN_PROOF_IMAGES = [
    'txn-1.webp',
    'txn-2.webp',
    'txn-3.webp',
    'txn-4.webp',
    'txn-5.webp',
    'txn-6.webp'
  ];
  var TXN_PROOF_BASE = 'images/transactions';

  function initTransactions() {
    var el = $('txn-grid');
    if (!el) return;
    el.innerHTML = TXN_PROOF_IMAGES.map(function(file) {
      return '<a href="trust.html" class="txn-proof-card">'
        + '<img src="' + TXN_PROOF_BASE + '/' + file + '" alt="Verified transaction proof" loading="lazy">'
        + '<div class="txn-proof-overlay"><span>View Vault →</span></div>'
        + '</a>';
    }).join('');
  }

  /* ── Just Purchased Popup ────────────────────────────────── */
  var POPUP_PRODUCTS = [
    'Chanel Classic Flap','LV Neverfull MM','Hermès Birkin 25','Gucci GG Marmont',
    'Dior Lady Bag','Prada Saffiano Tote','Cartier Love Bracelet','Tiffany Diamond Ring',
    'Van Cleef Necklace','Bulgari Serpenti Watch','Chanel Slingback Heels',
    'Valentino Rockstud Pumps','Gucci Horsebit Loafers','LV Archlight Sneakers',
    'Prada Block Heel Sandals','Dior J\'Adior Mules','Chanel Pearl Earrings',
    'Hermès Clic H Bracelet','Fendi Baguette Bag','YSL Loulou Bag'
  ];
  var POPUP_CITIES = [
    'New York','Los Angeles','Miami','Chicago','Houston','Phoenix',
    'Philadelphia','San Antonio','San Diego','Dallas','Austin','Jacksonville',
    'San Francisco','Seattle','Denver','Nashville','Boston','Las Vegas','Atlanta','Portland'
  ];
  var POPUP_EMOJIS = ['👜','👛','💍','👠','💎','✨','🛍️','💼'];

  function initPopup() {
    var el = $('popup-buy');
    if (!el) return;

    function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function timeAgo() {
      var m = Math.floor(Math.random()*20)+1;
      return m === 1 ? 'just now' : m + ' min ago';
    }

    function show() {
      var prod  = rand(POPUP_PRODUCTS);
      var city  = rand(POPUP_CITIES);
      var emoji = rand(POPUP_EMOJIS);
      el.querySelector('.popup-buy-icon').textContent = emoji;
      el.querySelector('.pb-prod').textContent = prod;
      el.querySelector('.pb-city').textContent = city + ', USA · ' + timeAgo();
      el.classList.add('show');
      setTimeout(function(){ el.classList.remove('show'); }, 3500);
    }

    var closeBtn = el.querySelector('.popup-buy-close');
    if (closeBtn) closeBtn.addEventListener('click', function(){ el.classList.remove('show'); });

    setTimeout(function(){
      show();
      setInterval(show, 5000);
    }, 3000);
  }

  /* ── FAQ Accordion ───────────────────────────────────────── */
  function initFAQ() {
    $qa('.faq-q').forEach(function(q) {
      q.addEventListener('click', function() {
        var item = q.closest('.faq-item');
        var ans  = item.querySelector('.faq-a');
        var open = item.classList.contains('open');
        $qa('.faq-item.open').forEach(function(o) {
          o.classList.remove('open');
          o.querySelector('.faq-a').classList.remove('open');
        });
        if (!open) { item.classList.add('open'); ans.classList.add('open'); }
      });
    });
  }

  /* ── Gallery (product page) ──────────────────────────────── */
  var _gallery = { images:[], cur:0 };

  function initGallery() {
    var mainImg = $('gal-main');
    var counter = $('gal-counter');
    var thumbsWrap = $('gal-thumbs');
    if (!mainImg) return;

    var thumbs = $qa('.g-thumb');
    var total  = thumbs.length;
    if (!total) return;

    _gallery.images = [];
    thumbs.forEach(function(t) { _gallery.images.push(t.getAttribute('data-img')); });
    _gallery.cur = 0;

    function go(idx) {
      if (idx < 0) idx = total - 1;
      if (idx >= total) idx = 0;
      _gallery.cur = idx;
      mainImg.style.opacity = '0';
      setTimeout(function() {
        mainImg.src = _gallery.images[idx];
        mainImg.style.opacity = '1';
      }, 150);
      thumbs.forEach(function(t,i){ t.classList.toggle('active', i === idx); });
      if (counter) counter.textContent = (idx+1) + ' / ' + total;
    }
    mainImg.style.transition = 'opacity .15s ease';

    thumbs.forEach(function(t,i){ t.addEventListener('click', function(){ go(i); }); });

    var prev = $('gal-prev'), next = $('gal-next');
    if (prev) prev.addEventListener('click', function(){ go(_gallery.cur-1); });
    if (next) next.addEventListener('click', function(){ go(_gallery.cur+1); });

    // Fullscreen
    var fsBtn = $('gal-fs');
    var lb    = $('lightbox');
    var lbImg = $('lightbox-img');
    if (fsBtn && lb && lbImg) {
      fsBtn.addEventListener('click', function() {
        lbImg.src = _gallery.images[_gallery.cur];
        lb.classList.add('open');
      });
      $('lb-close').addEventListener('click', function(){ lb.classList.remove('open'); });
      lb.addEventListener('click', function(e){ if(e.target===lb) lb.classList.remove('open'); });
    }
  }

  /* ── Urgency Counter (product page) ─────────────────────── */
  function initUrgency() {
    var vEl = $('viewing-count');
    var sEl = $('stock-count');
    if (!vEl && !sEl) return;
    var views = Math.floor(Math.random()*12)+3;
    var stock = Math.floor(Math.random()*5)+2;
    if (vEl) vEl.textContent = views;
    if (sEl) sEl.textContent = stock;
    setInterval(function() {
      if (Math.random() > .5) {
        views = Math.max(1, views + (Math.random()>.5?1:-1));
        if (vEl) vEl.textContent = views;
      }
    }, 4500);
  }

  /* ── Category meta (breadcrumbs + product path) ─────────── */
  var CATEGORY_META = {
    handbags:    { page: 'handbags.html',    label: 'BAGS',        path: 'BAGS' },
    footwear:    { page: 'footwear.html',    label: 'FOOTWEAR',    path: 'FOOTWEAR' },
    jewelry:     { page: 'jewelry.html',     label: 'JEWELRY',     path: 'JEWELRY' },
    watches:     { page: 'watches.html',     label: 'WATCHES',     path: 'WATCHES' },
    accessories: { page: 'accessories.html', label: 'ACCESSORIES', path: 'ACCESSORIES' }
  };

  function formatBrand(slug) {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
  }

  function getBrandLabel(category, brandSlug) {
    var list = BRANDS[category];
    if (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === brandSlug) return list[i].label;
      }
    }
    return formatBrand(brandSlug);
  }

  /* ── Product Page Init ───────────────────────────────────── */
  function initProductPage() {
    var p = new URLSearchParams(window.location.search);
    var name   = p.get('name')   || 'Luxury Product';
    var brand  = p.get('brand')  || '';
    var cat    = p.get('cat')    || 'handbags';
    var image  = p.get('image')  || 'images/logo.png';
    var images = (p.get('images') || image).split('|').filter(Boolean);
    if (!images.length) images = [image];
    var waText = p.get('wa')     || 'Hi I want ' + name;
    var badge  = p.get('badge')  || '';

    var meta = CATEGORY_META[cat] || CATEGORY_META.handbags;
    var brandLabel = brand ? getBrandLabel(cat, brand) : '';

    // Title
    document.title = name + ' — Luxury Affairs Store';

    // Set text fields
    var nameEl  = $('prod-name');
    var catEl   = $('prod-cat');
    var bcProd  = $('bc-product');
    var bcBrand = $('bc-brand');
    var bcCat   = $('bc-category');

    if (nameEl)  nameEl.textContent  = name;
    if (catEl)   catEl.textContent   = meta.path + (brandLabel ? ' • ' + brandLabel : '');
    if (bcProd)  bcProd.textContent  = name.length > 32 ? name.slice(0, 32) + '…' : name;
    if (bcCat) {
      bcCat.href = meta.page;
      bcCat.textContent = meta.label;
    }
    if (bcBrand) {
      bcBrand.textContent = brandLabel || 'Brand';
      bcBrand.href = brand ? meta.page + '?brand=' + encodeURIComponent(brand) : meta.page;
    }

    // Main image
    var mainImg = $('gal-main');
    if (mainImg) { mainImg.src = images[0]; mainImg.alt = name; }

    // Thumbnails
    var thumbsWrap = $('gal-thumbs');
    if (thumbsWrap) {
      thumbsWrap.innerHTML = images.map(function(img, i) {
        return '<div class="g-thumb' + (i===0?' active':'') + '" data-img="' + img + '">'
          + '<img src="' + img + '" alt="' + name + ' ' + (i+1) + '" loading="lazy">'
          + '</div>';
      }).join('');
    }

    var ctr = $('gal-counter');
    if (ctr) ctr.textContent = '1 / ' + images.length;

    // WA buttons
    var link = waURL(waText);
    $qa('.prod-wa-link').forEach(function(a) {
      a.href = link; a.target = '_blank';
    });

    // Badge visibility
    if (badge) {
      var bEl = $('mirror-badge');
      if (bEl) bEl.style.display = 'inline-block';
    }

    initGallery();
    initUrgency();
    initFAQ();
  }

  /* ── Collection Page Init ────────────────────────────────── */
  function initCollectionPage(category, pageTitle) {
    var urlBrand = new URLSearchParams(window.location.search).get('brand') || 'all';

    var bcBrand      = $('bc-brand-name');
    var heading      = $('col-heading');
    var countEl      = $('col-count');
    var toolbar      = $q('.col-toolbar');
    var brandOverview = $('brand-overview');
    var prodGrid     = $('prod-grid');
    var pagination   = $('pagination');

    if (bcBrand) {
      bcBrand.textContent = urlBrand === 'all'
        ? 'All ' + pageTitle
        : urlBrand.replace(/-/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}) + ' ' + pageTitle;
    }

    loadProducts(category, function(products) {
      var filtered = products.filter(function(p){ return p.category === category; });
      var display  = urlBrand === 'all' ? filtered : filtered.filter(function(p){ return p.brand === urlBrand; });

      if (urlBrand === 'all') {
        /* ── Brand overview landing view ── */
        if (toolbar)      toolbar.style.display      = 'none';
        if (prodGrid)     prodGrid.style.display     = 'none';
        if (pagination)   pagination.style.display   = 'none';

        var catBrands = BRANDS[category] || [];
        if (heading) {
          heading.style.fontFamily = 'var(--font-d)';
          heading.style.fontStyle  = 'italic';
          heading.style.fontSize   = '2rem';
          heading.textContent      = pageTitle.toUpperCase();
        }
        if (countEl) {
          countEl.textContent = filtered.length + ' products \u2022 ' + catBrands.length + ' brands';
        }

        if (brandOverview) {
          var brandCounts = {};
          filtered.forEach(function(p) { brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1; });

          var base = category + '.html';
          brandOverview.className = 'brand-overview-grid';
          brandOverview.innerHTML = catBrands.map(function(b) {
            var logoHtml   = b.logo.replace(/\n/g, '<br>');
            var styleClass = b.style ? ' ' + b.style : '';
            var cnt        = brandCounts[b.id] || 0;
            return '<div class="brand-overview-card" onclick="window.location=\'' + base + '?brand=' + b.id + '\'">'
              + '<div class="brand-overview-logo">'
              + '<div class="brand-overview-logo-text' + styleClass + '">' + logoHtml + '</div>'
              + '</div>'
              + '<div class="brand-overview-name">' + b.label + '</div>'
              + (cnt ? '<div class="brand-overview-count">' + cnt + ' products</div>' : '')
              + '</div>';
          }).join('');
        }

      } else {
        /* ── Brand-specific product view ── */
        if (brandOverview) brandOverview.style.display = 'none';

        if (heading) heading.textContent = urlBrand.replace(/-/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}) + ' ' + pageTitle;
        if (countEl) countEl.textContent = display.length + ' products';

        renderProductGrid(display, 'prod-grid', 'pagination', 12);
      }
    });

    $qa('.grid-toggle-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        $qa('.grid-toggle-btn').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        var grid = $('prod-grid');
        if (grid) grid.classList.toggle('cols4', btn.getAttribute('data-cols') === '4');
      });
    });
  }

  /* ── Trust Page (archive) ────────────────────────────────── */
  var PROOF_BASE = 'images/proof';

  var ARCHIVE_TIMELINE = [
    {label:'MAY-26',emoji:'📦'},
    {label:'APR-26',emoji:'💳'},
    {label:'MAR-26',emoji:'📱'},
    {label:'FEB-26',emoji:'📸'},
    {label:'JAN-26',emoji:'📸'},
    {label:'DEC-25',emoji:'💳'},
    {label:'NOV-25',emoji:'📱'},
    {label:'OCT-25',emoji:'📸'},
    {label:'SEP-25',emoji:'📦'},
    {label:'AUG-25',emoji:'💳'},
    {label:'JUL-25',emoji:'📱'},
    {label:'JUN-25',emoji:'📸'},
    {label:'MAY-25',emoji:'📦'},
    {label:'APR-25',emoji:'💳'},
    {label:'MAR-25',emoji:'📱'},
    {label:'2024',  emoji:'📸'},
    {label:'2023',  emoji:'📦'}
  ];

  var ARCHIVE_MONTHS = ARCHIVE_TIMELINE.map(function(t) {
    return { label:t.label, emoji:t.emoji, images:[] };
  });

  var PROOF_PLACEHOLDER = [
    {type:'PAYMENT',city:'New York',  emoji:'💳'},
    {type:'DELIVERY',city:'Miami',    emoji:'📦'},
    {type:'INVOICE', city:'Chicago',  emoji:'📄'},
    {type:'TRACKING',city:'LA',       emoji:'🗂️'},
    {type:'PAYMENT', city:'Dallas',   emoji:'💳'},
    {type:'DELIVERY',city:'Houston',  emoji:'📦'},
    {type:'INVOICE', city:'Atlanta',  emoji:'📄'},
    {type:'TRACKING',city:'Seattle',  emoji:'🗂️'}
  ];

  function proofImageBase(monthData) {
    var host = window.location.hostname;
    var isLocal = !host || host === 'localhost' || host === '127.0.0.1';
    if (isLocal && monthData.localBase) return monthData.localBase;
    if (monthData.baseUrl) return monthData.baseUrl;
    if (monthData.localBase) return monthData.localBase;
    if (monthData.folder) return PROOF_BASE + '/' + monthData.folder;
    return PROOF_BASE + '/' + monthData.label.toLowerCase();
  }

  function mergeProofManifest(manifest) {
    var byLabel = {};
    if (manifest && manifest.months) {
      manifest.months.forEach(function(m) { byLabel[m.label] = m; });
    }
    return ARCHIVE_TIMELINE.map(function(t) {
      var m = byLabel[t.label];
      if (!m) return { label:t.label, emoji:t.emoji, images:[] };
      return {
        label: t.label,
        emoji: m.emoji || t.emoji,
        folder: m.folder,
        baseUrl: m.baseUrl,
        localBase: m.localBase,
        images: m.images || []
      };
    });
  }

  function defaultArchiveIndex(months) {
    for (var i = 0; i < months.length; i++) {
      if (months[i].images && months[i].images.length > 0) return i;
    }
    return 3;
  }

  function renderProofGrid(monthData) {
    var grid = $('proof-grid');
    if (!grid) return;

    if (monthData.images && monthData.images.length > 0) {
      var imgBase = proofImageBase(monthData);
      grid.innerHTML = monthData.images.map(function(img, idx) {
        var url = imgBase + '/' + img;
        return '<div class="proof-card proof-card-photo" data-idx="' + idx + '" data-month="' + monthData.label + '">'
          + '<img src="' + url + '" alt="' + monthData.label + ' proof" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius);">'
          + '<div class="proof-card-overlay"><span class="proof-zoom-icon">🔍</span></div>'
          + '</div>';
      }).join('');

      grid.querySelectorAll('.proof-card-photo').forEach(function(card) {
        card.addEventListener('click', function() {
          var idx = parseInt(card.getAttribute('data-idx'));
          openLightbox(monthData.images, idx, imgBase);
        });
      });
    } else {
      grid.innerHTML = PROOF_PLACEHOLDER.map(function(p) {
        return '<div class="proof-card">'
          + '<div class="proof-card-img">' + p.emoji + '</div>'
          + '<div class="proof-card-cap"><div class="pc-type">' + p.type + ' PROOF</div>'
          + '<div class="pc-city">📍 ' + p.city + '</div></div>'
          + '</div>';
      }).join('');
    }
  }

  function openLightbox(images, startIdx, imgBase) {
    var lb = $('lightbox');
    var lbImg = $('lightbox-img');
    if (!lb || !lbImg) return;
    var current = startIdx;

    function show(i) {
      current = (i + images.length) % images.length;
      lbImg.src = imgBase + '/' + images[current];
    }

    show(current);
    lb.classList.add('open');
    lb.style.display = 'flex';

    var existingPrev = lb.querySelector('.lb-prev');
    var existingNext = lb.querySelector('.lb-next');
    if (!existingPrev) {
      var prev = document.createElement('button');
      prev.className = 'lb-prev lightbox-nav';
      prev.innerHTML = '&#8592;';
      prev.addEventListener('click', function(e) { e.stopPropagation(); show(current - 1); });
      lb.appendChild(prev);
    }
    if (!existingNext) {
      var next = document.createElement('button');
      next.className = 'lb-next lightbox-nav';
      next.innerHTML = '&#8594;';
      next.addEventListener('click', function(e) { e.stopPropagation(); show(current + 1); });
      lb.appendChild(next);
    }

    $('lb-close').onclick = function() {
      lb.classList.remove('open');
      lb.style.display = 'none';
    };
    lb.onclick = function(e) {
      if (e.target === lb) { lb.classList.remove('open'); lb.style.display = 'none'; }
    };
  }

  function initArchiveUI(months, activeIdx) {
    var tlEl = $('timeline-track');
    if (tlEl) {
      tlEl.innerHTML = months.map(function(m, i) {
        var hasImages = m.images && m.images.length > 0;
        return '<div class="tl-item' + (i===activeIdx?' active':'') + '" data-idx="' + i + '">'
          + '<div class="tl-circle' + (hasImages ? ' tl-has-images' : '') + '">' + m.emoji + '</div>'
          + '<div class="tl-label">' + m.label + '</div>'
          + (hasImages ? '<div class="tl-count">' + m.images.length + '</div>' : '')
          + '</div>';
      }).join('');

      tlEl.addEventListener('click', function(e) {
        var item = e.target.closest('.tl-item');
        if (!item) return;
        $qa('.tl-item').forEach(function(t){ t.classList.remove('active'); });
        item.classList.add('active');
        var idx = parseInt(item.getAttribute('data-idx'));
        renderProofGrid(months[idx]);
      });
    }

    renderProofGrid(months[activeIdx]);
  }

  function initArchive() {
    fetch('data/proof-manifest.json')
      .then(function(r) { return r.json(); })
      .then(function(manifest) {
        var months = mergeProofManifest(manifest);
        ARCHIVE_MONTHS = months;
        initArchiveUI(months, defaultArchiveIndex(months));
      })
      .catch(function() {
        initArchiveUI(ARCHIVE_MONTHS, defaultArchiveIndex(ARCHIVE_MONTHS));
      });
  }

  /* ── Homepage Init ───────────────────────────────────────── */
  function initHomepage() {
    renderBrandGrid('handbags',    'handbags-grid');
    renderBrandGrid('watches',     'watches-grid');
    renderBrandGrid('footwear',    'footwear-grid');
    renderBrandGrid('jewelry',     'jewelry-grid');
    renderEssentialsGrid('essentials-grid');
    initHappyClients();
    initTransactions();
  }

  /* ── Boot ────────────────────────────────────────────────── */
  function boot() {
    initTheme();
    initHamburger();
    initSearch();
    initTicker();
    initFAQ();
    initPopup();

    var page = window.location.pathname.split('/').pop() || 'index.html';

    if (page === 'index.html' || page === '') {
      initHomepage();
    } else if (page === 'handbags.html') {
      initCollectionPage('handbags', 'Handbags');
    } else if (page === 'footwear.html') {
      initCollectionPage('footwear', 'Footwear');
    } else if (page === 'jewelry.html') {
      initCollectionPage('jewelry', 'Jewelry');
    } else if (page === 'watches.html') {
      initCollectionPage('watches', 'Watches');
    } else if (page === 'accessories.html') {
      initCollectionPage('accessories', 'Accessories');
    } else if (page === 'product.html') {
      initProductPage();
    } else if (page === 'trust.html') {
      initArchive();
    }
  }

  document.addEventListener('DOMContentLoaded', boot);

  // Expose public API
  return { goToPage: goToPage };

})();
