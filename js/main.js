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

  /* ── Load Products ───────────────────────────────────────── */
  function loadProducts(cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/products.csv');
    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 0) {
        cb(parseCSV(xhr.responseText));
      } else {
        cb([]);
      }
    };
    xhr.onerror = function() { cb([]); };
    xhr.send();
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
      { id:'bottega',  label:'Bottega Veneta Bags',  logo:'BOTTEGA\nVENETA', style:'italic' }
    ],
    footwear: [
      { id:'chanel',    label:'Chanel Shoes',        logo:'CHANEL',    style:'' },
      { id:'hermes',    label:'Hermes Shoes',         logo:'HERMÈS',    style:'serif' },
      { id:'gucci',     label:'Gucci Shoes',          logo:'GUCCI',     style:'' },
      { id:'dior',      label:'Dior Shoes',           logo:'DIOR',      style:'' },
      { id:'prada',     label:'Prada Shoes',          logo:'PRADA',     style:'' },
      { id:'valentino', label:'Valentino Shoes',      logo:'VALENTINO', style:'' },
      { id:'ysl',       label:'YSL Shoes',            logo:'YSL',       style:'' },
      { id:'alaia',     label:'Alaia Shoes',          logo:'ALAÏA',     style:'serif' },
      { id:'loro-piana',label:'Loro Piana Shoes',     logo:'LORO\nPIANA',style:'italic' }
    ],
    jewelry: [
      { id:'cartier',   label:'Cartier Jewelry',     logo:'Cartier',   style:'italic serif' },
      { id:'chanel',    label:'Chanel Jewelry',      logo:'CHANEL',    style:'' },
      { id:'gucci',     label:'Gucci Jewelry',       logo:'GUCCI',     style:'' },
      { id:'bulgari',   label:'BVLGARI Jewelry',     logo:'BVLGARI',   style:'' },
      { id:'van-cleef', label:'Van Cleef Jewelry',   logo:'VAN CLEEF\n& ARPELS', style:'italic' },
      { id:'louis-vuitton', label:'LV Jewelry',      logo:'LV',        style:'' },
      { id:'hermes',    label:'Hermes Jewelry',      logo:'HERMÈS',    style:'serif' },
      { id:'tiffany',   label:'Tiffany Jewelry',     logo:'TIFFANY\n& CO.', style:'italic' },
      { id:'chrome-hearts', label:'Chrome Hearts',   logo:'CHROME\nHEARTS', style:'italic' }
    ]
  };

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
        + '<div class="brand-logo-text' + styleClass + '">' + logoHtml + '</div>'
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
  var CLIENT_EMOJIS = ['👜','👛','💍','👠','💎','🧣','🕶️','🧤','👒','✨','🛍️','💼'];
  var TXN_DATA = [
    { city:'New York',    item:'Chanel Classic Bag',    amount:'$850',  time:'2 min ago'  },
    { city:'Miami',       item:'LV Neverfull',           amount:'$620',  time:'5 min ago'  },
    { city:'Los Angeles', item:'Hermès Birkin 25',       amount:'$1,200',time:'8 min ago'  },
    { city:'Chicago',     item:'Cartier Bracelet',       amount:'$480',  time:'11 min ago' },
    { city:'Houston',     item:'Gucci GG Marmont',       amount:'$960',  time:'14 min ago' },
    { city:'Dallas',      item:'Tiffany Diamond Ring',   amount:'$340',  time:'18 min ago' },
    { city:'Atlanta',     item:'Prada Saffiano Tote',    amount:'$780',  time:'22 min ago' },
    { city:'Seattle',     item:'Dior Lady Bag',          amount:'$920',  time:'26 min ago' },
    { city:'Boston',      item:'Valentino Pumps',        amount:'$520',  time:'30 min ago' },
    { city:'Las Vegas',   item:'Bulgari Watch',          amount:'$1,100',time:'35 min ago' }
  ];

  function initHappyClients() {
    var el = $('clients-track');
    if (!el) return;
    var items = '';
    for (var i = 0; i < 16; i++) {
      var emoji = CLIENT_EMOJIS[i % CLIENT_EMOJIS.length];
      items += '<div class="client-card">' + emoji + '</div>';
    }
    el.innerHTML = items + items;
  }

  function initTransactions() {
    var el = $('txn-track');
    if (!el) return;
    var all = TXN_DATA.concat(TXN_DATA);
    el.innerHTML = all.map(function(t) {
      return '<div class="txn-card">'
        + '<div class="txn-icon">📄</div>'
        + '<div class="txn-amount">' + t.amount + ' — Verified</div>'
        + '<div class="txn-city">📍 ' + t.city + '</div>'
        + '<div class="txn-time">⏱ ' + t.time + '</div>'
        + '</div>';
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

  /* ── Product Page Init ───────────────────────────────────── */
  function initProductPage() {
    var p = new URLSearchParams(window.location.search);
    var name   = p.get('name')   || 'Luxury Product';
    var brand  = p.get('brand')  || '';
    var cat    = p.get('cat')    || '';
    var image  = p.get('image')  || 'images/logo.png';
    var images = (p.get('images') || image).split('|').filter(Boolean);
    if (!images.length) images = [image];
    var waText = p.get('wa')     || 'Hi I want ' + name;
    var badge  = p.get('badge')  || '';

    // Title
    document.title = name + ' — Luxury Affairs Store';

    // Set text fields
    var nameEl  = $('prod-name');
    var catEl   = $('prod-cat');
    var bcProd  = $('bc-product');
    var bcBrand = $('bc-brand');

    if (nameEl)  nameEl.textContent  = name;
    if (catEl)   catEl.textContent   = (cat.toUpperCase() + ' • ' + brand.replace(/-/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}) + ' Bags').trim();
    if (bcProd)  bcProd.textContent  = name.length > 32 ? name.slice(0,32)+'…' : name;
    if (bcBrand) bcBrand.textContent = brand.replace(/-/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});

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

    // Update breadcrumb brand
    var bcBrand = $('bc-brand-name');
    if (bcBrand) {
      bcBrand.textContent = urlBrand === 'all'
        ? 'All ' + pageTitle
        : urlBrand.replace(/-/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}) + ' ' + pageTitle;
    }

    var heading  = $('col-heading');
    var countEl  = $('col-count');

    loadProducts(function(products) {
      var filtered = products.filter(function(p){ return p.category === category; });
      var display  = urlBrand === 'all' ? filtered : filtered.filter(function(p){ return p.brand === urlBrand; });

      // Build brand filter tabs
      var tabsEl = $('brand-tabs');
      if (tabsEl) {
        var brands = ['all'].concat([...new Set(filtered.map(function(p){ return p.brand; }))]);
        tabsEl.innerHTML = brands.map(function(b) {
          var label = b === 'all' ? 'All' : b.replace(/-/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});
          return '<button class="brand-tab' + (b===urlBrand?' active':'') + '" data-brand="' + b + '">' + label + '</button>';
        }).join('');

        tabsEl.addEventListener('click', function(e) {
          var btn = e.target.closest('.brand-tab');
          if (!btn) return;
          var brand = btn.getAttribute('data-brand');
          $qa('.brand-tab').forEach(function(t){ t.classList.toggle('active', t===btn); });
          var show = brand === 'all' ? filtered : filtered.filter(function(p){ return p.brand === brand; });
          if (countEl) countEl.textContent = show.length + ' products';
          renderProductGrid(show, 'prod-grid', 'pagination', 12);
        });
      }

      if (heading) heading.textContent = urlBrand === 'all'
        ? pageTitle
        : urlBrand.replace(/-/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}) + ' ' + pageTitle;

      if (countEl) countEl.textContent = display.length + ' products';

      renderProductGrid(display, 'prod-grid', 'pagination', 12);
    });

    // Grid toggle
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

  var ARCHIVE_MONTHS = [
    {label:'MAY-26',emoji:'📦', images:[]},
    {label:'APR-26',emoji:'💳', images:[]},
    {label:'MAR-26',emoji:'📱', images:[]},
    {
      label:'FEB-26',emoji:'📸',
      images:[
        'imgi_100_IMG_9597.webp','imgi_101_IMG_9595.webp','imgi_102_IMG_9580.webp',
        'imgi_103_IMG_9577.webp','imgi_104_IMG_9578.webp','imgi_105_IMG_9579.webp',
        'imgi_106_IMG_9576.webp','imgi_107_IMG_9575.webp','imgi_108_IMG_9574.webp',
        'imgi_109_IMG_9718.webp','imgi_110_IMG_9712.webp','imgi_111_IMG_9716.webp',
        'imgi_112_IMG_9704.webp','imgi_113_IMG_9593.webp','imgi_114_IMG_9719.webp',
        'imgi_115_IMG_9714.webp','imgi_116_IMG_9720.webp','imgi_117_IMG_9708.webp',
        'imgi_118_IMG_9587.webp','imgi_119_IMG_9707.webp','imgi_120_IMG_9717.webp',
        'imgi_121_IMG_9713.webp','imgi_122_IMG_9711.webp','imgi_123_IMG_9709.webp',
        'imgi_124_IMG_9715.webp','imgi_125_IMG_9710.webp','imgi_126_IMG_9706.webp',
        'imgi_127_IMG_9705.webp','imgi_128_IMG_9702.webp','imgi_129_IMG_9588.webp',
        'imgi_130_IMG_9703.webp','imgi_131_IMG_9589.webp','imgi_132_IMG_9592.webp',
        'imgi_133_IMG_9591.webp','imgi_134_IMG_9590.webp','imgi_135_IMG-20260128-WA0025.webp',
        'imgi_136_IMG-20260128-WA0027.webp','imgi_137_IMG-20260128-WA0024.webp',
        'imgi_16_IMG_9788.webp','imgi_18_IMG_9539.webp','imgi_19_IMG_9081.webp',
        'imgi_20_IMG_8629.webp','imgi_21_IMG_8093.webp','imgi_22_IMG_7203.webp',
        'imgi_23_IMG_5879.webp','imgi_24_IMG_6818.webp','imgi_25_IMG-20250808-WA0020.webp',
        'imgi_26_IMG-20250518-WA0083.webp','imgi_27_IMG-20250701-WA0036.webp',
        'imgi_28_IMG-20250513-WA0029.webp','imgi_29_IMG-20250917-WA0370.webp',
        'imgi_30_IMG-20250207-WA0052.webp','imgi_31_reviews(96).webp',
        'imgi_32_IMG_9790.webp','imgi_33_IMG_9795.webp','imgi_34_IMG_9793.webp',
        'imgi_35_IMG_9794.webp','imgi_36_IMG_9791.webp','imgi_37_IMG_9792.webp',
        'imgi_38_IMG_9787.webp','imgi_39_IMG_9789.webp','imgi_40_IMG_9769.webp',
        'imgi_41_IMG_9767.webp','imgi_42_IMG_9766.webp','imgi_43_IMG_9768.webp',
        'imgi_44_IMG_9749.webp','imgi_45_IMG_9750.webp','imgi_46_IMG_9747.webp',
        'imgi_47_IMG_9748.webp','imgi_48_IMG_9746.webp','imgi_49_IMG_9744.webp',
        'imgi_50_IMG_9745.webp','imgi_51_IMG_9742.webp','imgi_52_IMG_9743.webp',
        'imgi_53_IMG_9741.webp','imgi_54_IMG_9736.webp','imgi_55_IMG_9737.webp',
        'imgi_56_IMG_9740.webp','imgi_57_IMG_9738.webp','imgi_58_IMG_9739.webp',
        'imgi_59_IMG_9735.webp','imgi_60_IMG_9733.webp','imgi_61_IMG_9732.webp',
        'imgi_62_IMG_9734.webp','imgi_63_IMG_9730.webp','imgi_64_IMG_9731.webp',
        'imgi_65_IMG_9729.webp','imgi_66_IMG_9728.webp','imgi_67_IMG_9689.webp',
        'imgi_68_IMG_9683.webp','imgi_69_IMG_9688.webp','imgi_70_IMG_9687.webp',
        'imgi_71_IMG_9686.webp','imgi_72_IMG_9685.webp','imgi_73_IMG_9682.webp',
        'imgi_74_IMG_9681.webp','imgi_75_IMG_9677.webp','imgi_76_IMG_9678.webp',
        'imgi_77_IMG_9680.webp','imgi_78_IMG_9675.webp','imgi_79_IMG_9679.webp',
        'imgi_80_IMG_9676.webp','imgi_81_IMG_9654.webp','imgi_82_IMG_9653.webp',
        'imgi_83_IMG_9652.webp','imgi_84_IMG_9648.webp','imgi_85_IMG_9642.webp',
        'imgi_86_IMG_9647.webp','imgi_87_IMG_9646.webp','imgi_88_IMG_9643.webp',
        'imgi_89_IMG_9645.webp','imgi_90_IMG_9644.webp','imgi_91_IMG_9600.webp',
        'imgi_92_IMG_9639.webp','imgi_93_IMG_9641.webp','imgi_94_IMG_9640.webp',
        'imgi_95_IMG_9638.webp','imgi_96_IMG_9601.webp','imgi_97_IMG_9599.webp',
        'imgi_98_IMG_9596.webp','imgi_99_IMG_9598.webp'
      ]
    },
    {label:'JAN-26',emoji:'📦', images:[]},
    {label:'DEC-25',emoji:'💳', images:[]},
    {label:'NOV-25',emoji:'📱', images:[]},
    {label:'OCT-25',emoji:'📸', images:[]},
    {label:'SEP-25',emoji:'📦', images:[]},
    {label:'AUG-25',emoji:'💳', images:[]},
    {label:'JUL-25',emoji:'📱', images:[]},
    {label:'JUN-25',emoji:'📸', images:[]},
    {label:'MAY-25',emoji:'📦', images:[]},
    {label:'APR-25',emoji:'💳', images:[]},
    {label:'MAR-25',emoji:'📱', images:[]},
    {label:'2024',  emoji:'📸', images:[]},
    {label:'2023',  emoji:'📦', images:[]}
  ];

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

  function renderProofGrid(monthData) {
    var grid = $('proof-grid');
    if (!grid) return;

    if (monthData.images && monthData.images.length > 0) {
      var folder = monthData.label.toLowerCase().replace('-', '-');
      grid.innerHTML = monthData.images.map(function(img, idx) {
        var url = PROOF_BASE + '/' + folder + '/' + img;
        return '<div class="proof-card proof-card-photo" data-idx="' + idx + '" data-month="' + monthData.label + '">'
          + '<img src="' + url + '" alt="' + monthData.label + ' proof" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius);">'
          + '<div class="proof-card-overlay"><span class="proof-zoom-icon">🔍</span></div>'
          + '</div>';
      }).join('');

      grid.querySelectorAll('.proof-card-photo').forEach(function(card) {
        card.addEventListener('click', function() {
          var idx = parseInt(card.getAttribute('data-idx'));
          openLightbox(monthData.images, idx, 'feb-26');
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

  function openLightbox(images, startIdx, folder) {
    var lb = $('lightbox');
    var lbImg = $('lightbox-img');
    if (!lb || !lbImg) return;
    var current = startIdx;

    function show(i) {
      current = (i + images.length) % images.length;
      lbImg.src = PROOF_BASE + '/' + folder + '/' + images[current];
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

  function initArchive() {
    var tlEl = $('timeline-track');
    var activeIdx = 3;
    if (tlEl) {
      tlEl.innerHTML = ARCHIVE_MONTHS.map(function(m, i) {
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
        renderProofGrid(ARCHIVE_MONTHS[idx]);
      });
    }

    renderProofGrid(ARCHIVE_MONTHS[activeIdx]);
  }

  /* ── Homepage Init ───────────────────────────────────────── */
  function initHomepage() {
    renderBrandGrid('handbags', 'handbags-grid');
    renderBrandGrid('footwear', 'footwear-grid');
    renderBrandGrid('jewelry',  'jewelry-grid');
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
