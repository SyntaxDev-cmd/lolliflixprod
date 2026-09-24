// ============================================================
//  DoraPlay - Controlador da interface (SPA)
//  Foco: Doramas, Novelas e Novelas Turcas (catalogo completo liberado)
//  TMDB para organizar capas/sinopses/backdrops.
// ============================================================
(function () {
  var CFG = window.APP_CONFIG, appEl, toastEl, clockTimer = null;
  var state = { servers: [], branding: {}, server: null, userInfo: {}, adultUnlocked: false, seriesCats: [], movieCats: [] };
  var nav = [];

  var IC = {
    search: svg('<circle cx="11" cy="11" r="7"/><line x1="16.2" y1="16.2" x2="21" y2="21"/>'),
    back: svg('<line x1="20" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5" fill="none"/>'),
    play: svg('<polygon points="6,4 20,12 6,20" fill="currentColor" stroke="none"/>'),
    star: svg('<polygon points="12,3 14.6,9 21,9.5 16,13.8 17.6,20 12,16.5 6.4,20 8,13.8 3,9.5 9.4,9" fill="none"/>'),
    starFill: '<svg class="ic" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12,3 14.6,9 21,9.5 16,13.8 17.6,20 12,16.5 6.4,20 8,13.8 3,9.5 9.4,9"/></svg>',
    settings: svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2.1 2.1M16.9 16.9L19 19M19 5l-2.1 2.1M7.1 16.9L5 19" fill="none"/>'),
    liveTv: svg('<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M8 3l4 3 4-3" fill="none"/><polygon points="11,10 11,17 16.5,13.5" fill="currentColor" stroke="none"/>'),
    movies: svg('<rect x="4" y="4" width="16" height="16" rx="2.5"/><line x1="12" y1="4" x2="12" y2="20"/>'),
    series: svg('<rect x="6" y="3" width="14" height="14" rx="2.5"/><path d="M4 8v11a2 2 0 0 0 2 2h11" fill="none"/><polygon points="11,7 11,13 16,10" fill="currentColor" stroke="none"/>'),
    reload: svg('<path d="M20 11a8 8 0 1 0-1.9 6.3" fill="none"/><polyline points="20,4 20,11 13,11" fill="none"/>')
  };
  function applyTheme(t) {
    if (t !== 'red' && t !== 'dora') t = CFG.defaultTheme || 'red';
    try { document.documentElement.setAttribute('data-theme', t); } catch (e) {}
  }
  function svg(inner) { return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>'; }
  var POSTER_PH = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="#15111f"/><text x="100" y="155" font-size="15" text-anchor="middle" fill="#6b6480">DoraFlix</text></svg>');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function h(html) { appEl.innerHTML = html; }
  function qs(s) { return appEl.querySelector(s); }
  function qsa(s) { return Array.prototype.slice.call(appEl.querySelectorAll(s)); }
  function on(s, ev, fn) { qsa(s).forEach(function (n) { n.addEventListener(ev, fn); }); }
  function toast(m) { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2200); }
  function nowClock() { var d = new Date(); function p(n) { return (n < 10 ? '0' : '') + n; } return p(d.getHours()) + ':' + p(d.getMinutes()); }
  function go(fn, p) { nav.push({ fn: fn, params: p }); fn(p); }
  function replace(fn, p) { nav = [{ fn: fn, params: p }]; fn(p); }
  function back() { if (window.Player.isOpen()) { window.Player.close(); return; } if (nav.length > 1) { nav.pop(); var t = nav[nav.length - 1]; t.fn(t.params); } }
  function pickRandom(a) { return a[Math.floor(Math.random() * a.length)]; }
  function notAdult(it) { return state.adultUnlocked || !window.API.isAdult(it.title); }
  function filterCats(cats, incl, excl) {
    return (cats || []).filter(function (c) {
      if (excl && window.API.matchAny(c.name, excl)) return false;
      return window.API.matchAny(c.name, incl);
    });
  }

  // ---------- Boot ----------
  function boot() {
    appEl = document.getElementById('app'); toastEl = document.getElementById('toast');
    applyTheme(window.Store.getTheme() || CFG.defaultTheme);
    setupNativeUI();
    fitStage();
    window.addEventListener('resize', fitStage);
    window.addEventListener('orientationchange', function () { setTimeout(fitStage, 250); });
    // PC: roda do mouse rola os trilhos horizontais
    document.addEventListener('wheel', function (e) {
      var t = e.target; var rail = (t && t.closest) ? t.closest('.rail') : null;
      if (rail && e.deltaY && !e.shiftKey) { rail.scrollLeft += e.deltaY; e.preventDefault(); }
    }, { passive: false });
    wirePlayer(); wireKeys();
    splash(); loadConfig();
  }
  // Escala o palco 1280x720 para caber em qualquer tela (layout identico em todos)
  function fitStage() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var s = Math.min(vw / 1280, vh / 720); if (!isFinite(s) || s <= 0) s = 1;
    var ox = Math.round((vw - 1280 * s) / 2), oy = Math.round((vh - 720 * s) / 2);
    appEl.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + s + ')';
  }
  function setupNativeUI() {
    try {
      var C = window.Capacitor;
      if (C && C.Plugins && C.Plugins.StatusBar) { if (C.Plugins.StatusBar.setOverlaysWebView) C.Plugins.StatusBar.setOverlaysWebView({ overlay: true }); if (C.Plugins.StatusBar.hide) C.Plugins.StatusBar.hide(); }
      if (C && C.Plugins && C.Plugins.ScreenOrientation && C.Plugins.ScreenOrientation.lock) C.Plugins.ScreenOrientation.lock({ orientation: 'landscape' });
    } catch (e) {}
  }
  function winCall(f) { try { if (window.native && window.native.win && window.native.win[f]) window.native.win[f](); } catch (e) {} }

  function applyBranding() {
    var b = state.branding || {}; var bg = document.getElementById('appbg');
    if (bg && b.fondo) bg.style.backgroundImage = "url('" + b.fondo + "')";
  }
  function splash(msg) { h('<div class="view splash"><h1>' + esc(CFG.brand) + '</h1><div class="spinner"></div><p id="splashMsg">' + esc(msg || 'Conectando...') + '</p></div>'); }
  function splashMsg(m) { var e = document.getElementById('splashMsg'); if (e) e.textContent = m; }

  function loadConfig(retry) {
    retry = retry || 0;
    window.API.getConfig().then(function (res) {
      if (!res.ok) { splashMsg((res.error || 'Falha') + ' - tentativa ' + (retry + 1)); setTimeout(function () { loadConfig(retry + 1); }, 4000); return; }
      state.servers = res.servers; state.branding = res.branding; applyBranding();
      var sess = window.Store.getSession();
      if (sess && sess.user && sess.pass) {
        splashMsg('Entrando como ' + sess.user + '...');
        window.API.login(state.servers, sess.user, sess.pass).then(function (lr) { lr.ok ? onLoggedIn(lr) : screenLogin(); });
      } else screenLogin();
    });
  }
  function onLoggedIn(lr) {
    state.server = lr.server; state.userInfo = lr.userInfo || {};
    state.seriesCats = []; state.movieCats = [];
    window.Store.setSession({ user: lr.server.user, pass: lr.server.pass });
    window.Store.addProfile(lr.server.user, lr.server.pass, CFG.maxProfiles);
    replace(screenHome, {});
  }

  // ---------- Login ----------
  function screenLogin() {
    var b = state.branding || {}, profiles = window.Store.getProfiles();
    var profHtml = '';
    if (profiles.length) profHtml = '<div class="profiles"><div class="ptitle">Contas salvas</div>' + profiles.map(function (p, i) { return '<div class="profile-row"><button class="btn ghost" data-prof="' + i + '">' + esc(p.user) + '</button><button class="profile-del" data-del="' + i + '">&#10005;</button></div>'; }).join('') + '</div>';
    var logo = b.logologin ? ('<img src="' + esc(b.logologin) + '" style="max-height:82px;display:block;margin:0 auto" onerror="this.style.display=\'none\'"/>') : esc(CFG.brand);
    h('<div class="view login-wrap"><div class="login-card">' +
      '<div class="login-logo">' + logo + '</div><h2>ENTRAR</h2><div class="welcome">' + esc(b.welcome || 'Doramas, Novelas e muito mais') + '</div>' +
      '<div class="field"><label>Usuario</label><input id="inUser" type="text" autocomplete="off" spellcheck="false"/></div>' +
      '<div class="field"><label>Senha</label><input id="inPass" type="password" autocomplete="off"/></div>' +
      '<button class="btn" id="btnLogin">ENTRAR</button><div class="login-error" id="loginErr"></div>' + profHtml + '</div></div>');
    qs('#btnLogin').addEventListener('click', doLogin);
    qs('#inPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
    qs('#inUser').addEventListener('keydown', function (e) { if (e.key === 'Enter') qs('#inPass').focus(); });
    on('[data-prof]', 'click', function (e) { var p = profiles[+e.currentTarget.getAttribute('data-prof')]; if (p) doLoginWith(p.user, p.pass); });
    on('[data-del]', 'click', function (e) { var p = profiles[+e.currentTarget.getAttribute('data-del')]; if (p) { window.Store.removeProfile(p.user); screenLogin(); } });
    setTimeout(function () { var u = qs('#inUser'); if (u) u.focus(); }, 60);
  }
  function doLogin() { doLoginWith((qs('#inUser').value || '').trim(), (qs('#inPass').value || '').trim()); }
  function doLoginWith(u, p) {
    var err = qs('#loginErr'); if (!u || !p) { if (err) err.textContent = 'Informe usuario e senha.'; return; }
    if (err) err.textContent = ''; var btn = qs('#btnLogin'); if (btn) { btn.disabled = true; btn.textContent = 'ENTRANDO...'; }
    window.API.login(state.servers, u, p).then(function (lr) { if (lr.ok) onLoggedIn(lr); else { if (err) err.textContent = lr.error || 'Falha no login.'; if (btn) { btn.disabled = false; btn.textContent = 'ENTRAR'; } } });
  }

  // ---------- Home ----------
  function topnavHtml() {
    var b = state.branding || {};
    var brand = b.logomenu ? ('<img class="tn-logo" src="' + esc(b.logomenu) + '" onerror="this.replaceWith(document.createTextNode(\'' + esc(CFG.brand) + '\'))"/>') : ('<span class="tn-brand">' + esc(CFG.brand) + '</span>');
    var links = [['home', 'Inicio'], ['dorama', 'Doramas'], ['novela', 'Novelas'], ['turca', 'Turcas'], ['movies', 'Filmes'], ['series', 'Series'], ['live', 'TV'], ['fav', 'Favoritos']];
    return '<div class="topnav">' + brand +
      '<div class="tn-links">' + links.map(function (l) { return '<button class="tn-link" data-nav="' + l[0] + '">' + esc(l[1]) + '</button>'; }).join('') + '</div>' +
      '<div class="tn-right"><button class="icon-btn" data-nav="search" title="Buscar">' + IC.search + '</button>' +
      '<button class="icon-btn" data-nav="settings" title="Ajustes">' + IC.settings + '</button>' +
      '<span class="tn-user">' + esc(state.server ? state.server.user : '') + '</span></div></div>';
  }

  function screenHome() {
    var layout = window.Store.getLayout() || CFG.defaultLayout || 'rails';
    if (layout === 'tiles') screenHomeTiles(); else screenHomeRails();
  }

  function screenHomeRails() {
    h('<div class="view scroll home2">' + topnavHtml() +
      '<div id="hero" class="hero"></div>' +
      '<div class="rows">' +
      section('secContinue', 'Continuar assistindo', 'railContinue') +
      section('secDorama', 'Doramas', 'railDorama', 'dorama') +
      section('secNovela', 'Novelas', 'railNovela', 'novela') +
      section('secTurca', 'Novelas Turcas', 'railTurca', 'turca') +
      section('secFilmes', 'Filmes', 'railFilmes', 'movies') +
      '</div></div>');
    on('[data-nav]', 'click', function (e) { onNav(e.currentTarget.getAttribute('data-nav')); });
    on('[data-more]', 'click', function (e) { onNav(e.currentTarget.getAttribute('data-more')); });
    startClock();

    var hist = window.Store.getHistory();
    if (hist.length) { fillRail('railContinue', hist); showSec('secContinue'); }

    var ready = (state.seriesCats.length || state.movieCats.length)
      ? Promise.resolve()
      : Promise.all([window.API.categories(state.server, 'series'), window.API.categories(state.server, 'movie')]).then(function (r) { state.seriesCats = r[0] || []; state.movieCats = r[1] || []; });
    ready.then(buildRails);
  }

  function section(secId, title, railId, moreKey) {
    var more = moreKey ? ('<button class="see-more" data-more="' + moreKey + '">Ver mais</button>') : '';
    return '<section class="row-sec hide" id="' + secId + '"><div class="row-head"><h2>' + esc(title) + '</h2>' + more + '</div><div class="rail" id="' + railId + '"></div></section>';
  }
  function showSec(id) { var s = document.getElementById(id); if (s) s.classList.remove('hide'); }

  function buildRails() {
    var kw = CFG.keywords;
    loadBucket(filterCats(state.seriesCats, kw.dorama), 'series', 'railDorama', 'secDorama', true);
    loadBucket(filterCats(state.seriesCats, kw.novela, kw.turca), 'series', 'railNovela', 'secNovela', false);
    loadBucket(filterCats(state.seriesCats, kw.turca), 'series', 'railTurca', 'secTurca', false);
    var mc = state.movieCats.filter(function (c) { return notAdult({ title: c.name }); });
    if (mc.length) loadBucket([mc[0]], 'movie', 'railFilmes', 'secFilmes', false);
  }

  function loadBucket(cats, kind, railId, secId, doHero) {
    if (!cats || !cats.length) return;
    window.API.streams(state.server, kind, cats[0].id).then(function (items) {
      items = (items || []).filter(notAdult);
      if (!items.length) return;
      fillRail(railId, items); showSec(secId);
      if (doHero) setHero(pickRandom(items.slice(0, Math.min(12, items.length))));
    }).catch(function () {});
  }

  function fillRail(railId, items) {
    var rail = document.getElementById(railId); if (!rail) return;
    rail.innerHTML = items.map(function (it, i) {
      return '<div class="card" tabindex="0" data-rail="' + i + '"><div class="card-img"><img src="' + esc(it.poster || '') + '" loading="lazy" onerror="this.src=\'' + POSTER_PH + '\'"/></div><div class="card-t">' + esc(it.title) + '</div></div>';
    }).join('');
    Array.prototype.forEach.call(rail.querySelectorAll('[data-rail]'), function (n) {
      n.addEventListener('click', function () { go(screenDetails, { item: items[+n.getAttribute('data-rail')] }); });
      n.addEventListener('keydown', function (e) { if (e.key === 'Enter') n.click(); });
    });
  }

  function setHero(item) {
    var hero = document.getElementById('hero'); if (!hero || !item) return;
    function render(meta) {
      var bd = (meta && meta.backdrop) || item.poster || '';
      var over = (meta && meta.overview) || item.plot || '';
      var rating = (meta && meta.rating) || item.rating || '';
      var year = (meta && meta.year) || '';
      hero.style.backgroundImage = "linear-gradient(90deg, rgba(10,8,16,0.92) 0%, rgba(10,8,16,0.4) 60%, rgba(10,8,16,0.2) 100%), url('" + bd + "')";
      hero.innerHTML = '<div class="hero-in"><div class="hero-badge">DESTAQUE</div>' +
        '<h1 class="hero-title">' + esc(item.title) + '</h1>' +
        '<div class="hero-meta">' + (year ? esc(year) + '  •  ' : '') + (rating ? ('★ ' + esc(rating)) : '') + '</div>' +
        '<p class="hero-plot">' + esc((over || '').slice(0, 220)) + '</p>' +
        '<div class="hero-actions"><button class="btn" id="heroPlay">' + IC.play + ' Assistir</button>' +
        '<button class="btn ghost" id="heroInfo">Detalhes</button></div></div>';
      hero.classList.add('ready');
      var hp = document.getElementById('heroPlay'), hi = document.getElementById('heroInfo');
      if (hp) hp.addEventListener('click', function () { go(screenDetails, { item: item }); });
      if (hi) hi.addEventListener('click', function () { go(screenDetails, { item: item }); });
    }
    render(null);
    window.TMDB.enrich(item).then(function (meta) { if (meta) render(meta); }).catch(function () {});
  }

  // ---------- Home LADRILHOS (estilo classico) ----------
  function screenHomeTiles() {
    var b = state.branding || {};
    var brand = b.logomenu ? ('<img class="hdr-logo" src="' + esc(b.logomenu) + '" onerror="this.replaceWith(document.createTextNode(\'' + esc(CFG.brand) + '\'))"/>') : ('<span class="hdr-brand">' + esc(CFG.brand) + '</span>');
    var exp = window.API.formatExpire(state.userInfo && state.userInfo.expire);
    h('<div class="view scroll tiles-home">' +
      '<div class="hdr">' + brand + '<div class="spacer"></div>' +
      '<button class="icon-btn" data-nav="fav" title="Favoritos">' + IC.star + '</button>' +
      '<button class="icon-btn" data-nav="search" title="Buscar">' + IC.search + '</button>' +
      '<button class="icon-btn" data-nav="settings" title="Ajustes">' + IC.settings + '</button>' +
      '<div class="info"><div class="clock">' + nowClock() + '</div><div class="exp">EXPIRACAO: ' + esc(exp) + '</div><div class="user">Usuario: ' + esc(state.server ? state.server.user : '') + '</div></div>' +
      '</div>' +
      '<div class="home">' +
      '<div class="home-grid">' +
      '<button class="tile big" data-nav="live"><span>' + IC.liveTv + '</span><span class="lbl">TV AO VIVO</span></button>' +
      '<div class="grid2">' +
      '<button class="tile sm" data-nav="movies">' + IC.movies + '<span class="lbl">FILMES</span></button>' +
      '<button class="tile sm" data-nav="series">' + IC.series + '<span class="lbl">SERIES</span></button>' +
      '<button class="tile sm" data-nav="dorama">' + IC.play + '<span class="lbl">DORAMAS</span></button>' +
      '<button class="tile sm" data-nav="reload">' + IC.reload + '<span class="lbl">ATUALIZAR</span></button>' +
      '</div></div>' +
      '<div class="section-title">FILMES RECEM ADICIONADOS</div>' +
      '<div class="rail" id="railRecentTiles"></div>' +
      '<div class="empty-note hide" id="recentEmptyTiles">Nenhum filme disponivel.</div>' +
      '</div></div>');
    on('[data-nav]', 'click', function (e) { onNav(e.currentTarget.getAttribute('data-nav')); });
    loadRecentTiles();
  }
  function loadRecentTiles() {
    var ready = state.movieCats.length ? Promise.resolve() : window.API.categories(state.server, 'movie').then(function (r) { state.movieCats = r || []; });
    ready.then(function () {
      var mc = state.movieCats.filter(function (c) { return notAdult({ title: c.name }); });
      if (!mc.length) { var e0 = document.getElementById('recentEmptyTiles'); if (e0) e0.classList.remove('hide'); return; }
      window.API.streams(state.server, 'movie', mc[0].id).then(function (items) {
        items = (items || []).filter(notAdult);
        items.sort(function (a, b) { return (parseInt(b.added, 10) || 0) - (parseInt(a.added, 10) || 0); });
        if (!items.length) { var e1 = document.getElementById('recentEmptyTiles'); if (e1) e1.classList.remove('hide'); return; }
        fillRail('railRecentTiles', items.slice(0, 18));
      }).catch(function () {});
    });
  }

  function onNav(dest) {
    var kw = CFG.keywords;
    if (dest === 'home') replace(screenHome, {});
    else if (dest === 'reload') { state.seriesCats = []; state.movieCats = []; searchCache = null; toast('Atualizando...'); replace(screenHome, {}); }
    else if (dest === 'dorama') go(screenCatalog, { kind: 'series', title: 'Doramas', incl: kw.dorama });
    else if (dest === 'novela') go(screenCatalog, { kind: 'series', title: 'Novelas', incl: kw.novela, excl: kw.turca });
    else if (dest === 'turca') go(screenCatalog, { kind: 'series', title: 'Novelas Turcas', incl: kw.turca });
    else if (dest === 'movies') go(screenCatalog, { kind: 'movie', title: 'Filmes' });
    else if (dest === 'series') go(screenCatalog, { kind: 'series', title: 'Series' });
    else if (dest === 'live') go(screenLive, {});
    else if (dest === 'fav') go(screenFavorites, {});
    else if (dest === 'search') go(screenSearch, {});
    else if (dest === 'settings') go(screenSettings, {});
  }
  function startClock() { if (clockTimer) clearInterval(clockTimer); clockTimer = setInterval(function () {}, 60000); }

  // ---------- Catalogo (tudo liberado) ----------
  function screenCatalog(params) {
    var kind = params.kind, title = params.title;
    h('<div class="view col"><div class="subhdr"><button class="back-btn" data-back>' + IC.back + '</button><h2>' + esc(title) + '</h2></div>' +
      '<div class="cat"><div class="side"><h3>CATEGORIAS</h3><div id="catList"></div></div>' +
      '<div class="main" id="main"><div class="center-mid"><div class="spinner"></div></div></div></div></div>');
    qs('[data-back]').addEventListener('click', back);
    window.API.categories(state.server, kind).then(function (list) {
      list = list || [];
      if (params.incl) list = filterCats(list, params.incl, params.excl);
      var cats = [{ id: '@fav', name: 'Favoritos', virtual: 'fav' }].concat(list.map(function (c) { return { id: c.id, name: c.name, virtual: '' }; }));
      renderCats(cats, function (cat) { openCat(kind, cat); });
      selectCat(cats.length > 1 ? 1 : 0, cats, function (cat) { openCat(kind, cat); });
    });
  }
  function renderCats(cats, onPick) {
    var list = qs('#catList');
    list.innerHTML = cats.map(function (c, i) { return '<div class="cat-item" data-ci="' + i + '">' + esc(c.name) + '</div>'; }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('[data-ci]'), function (n) { n.addEventListener('click', function () { selectCat(+n.getAttribute('data-ci'), cats, onPick); }); });
  }
  function selectCat(idx, cats, onPick) { qsa('.cat-item').forEach(function (n, i) { n.classList.toggle('active', i === idx); }); if (cats[idx]) onPick(cats[idx]); }

  function guardAdult(cat) {
    if (state.adultUnlocked || !window.API.isAdult(cat.name)) return Promise.resolve(true);
    var pin = window.Store.getAdultPin(); if (!pin) return Promise.resolve(true);
    return askPin().then(function (t) { if (t === null) return false; if (t === pin) { state.adultUnlocked = true; return true; } toast('PIN incorreto.'); return false; });
  }
  function askPin() {
    return new Promise(function (resolve) {
      var ov = document.createElement('div'); ov.className = 'modal-ov';
      ov.innerHTML = '<div class="modal"><h3>Conteudo adulto</h3><p>Digite o PIN</p><input id="mPin" type="password" maxlength="8"/><div class="modal-actions"><button class="btn ghost" id="mCancel" style="width:auto;padding:0 22px">Cancelar</button><button class="btn" id="mOk" style="width:auto;padding:0 28px">OK</button></div></div>';
      document.body.appendChild(ov); var inp = ov.querySelector('#mPin');
      function done(v) { document.body.removeChild(ov); resolve(v); }
      ov.querySelector('#mOk').addEventListener('click', function () { done(inp.value || ''); });
      ov.querySelector('#mCancel').addEventListener('click', function () { done(null); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') done(inp.value || ''); if (e.key === 'Escape') done(null); });
      setTimeout(function () { inp.focus(); }, 50);
    });
  }
  function openCat(kind, cat) { var main = qs('#main'); if (!main) return; guardAdult(cat).then(function (ok) { if (ok) openCatDo(kind, cat, main); }); }
  function openCatDo(kind, cat, main) {
    main.innerHTML = '<div class="center-mid"><div class="spinner"></div></div>';
    var p = (cat.virtual === 'fav') ? Promise.resolve(window.Store.getFavorites().filter(function (f) { return f.kind === kind; })) : window.API.streams(state.server, kind, cat.id);
    p.then(function (items) {
      items = (items || []).filter(notAdult);
      if (!items.length) { main.innerHTML = '<div class="empty-note">Nenhum item aqui.</div>'; return; }
      main.innerHTML = '<div class="pgrid">' + items.map(function (it, i) { return '<div class="pcard" tabindex="0" data-gi="' + i + '"><img src="' + esc(it.poster || '') + '" loading="lazy" onerror="this.src=\'' + POSTER_PH + '\'"/><div class="cap">' + esc(it.title) + '</div></div>'; }).join('') + '</div>';
      Array.prototype.forEach.call(main.querySelectorAll('[data-gi]'), function (n) { n.addEventListener('click', function () { go(screenDetails, { item: items[+n.getAttribute('data-gi')] }); }); n.addEventListener('keydown', function (e) { if (e.key === 'Enter') n.click(); }); });
    }).catch(function () { main.innerHTML = '<div class="empty-note">Erro ao carregar.</div>'; });
  }

  function screenFavorites() {
    h('<div class="view col"><div class="subhdr"><button class="back-btn" data-back>' + IC.back + '</button><h2>Favoritos</h2></div><div class="main scroll" id="main" style="padding:18px 24px"></div></div>');
    qs('[data-back]').addEventListener('click', back);
    var favs = window.Store.getFavorites(), main = qs('#main');
    if (!favs.length) { main.innerHTML = '<div class="empty-note">Voce ainda nao tem favoritos. Toque na estrela para adicionar.</div>'; return; }

    var groups = [
      { key: 'live', label: 'Canais', items: favs.filter(function (f) { return f.kind === 'live'; }) },
      { key: 'movie', label: 'Filmes', items: favs.filter(function (f) { return f.kind === 'movie'; }) },
      { key: 'series', label: 'Series e Novelas', items: favs.filter(function (f) { return f.kind === 'series'; }) }
    ];
    var html = '';
    groups.forEach(function (g, gi) {
      if (!g.items.length) return;
      html += '<div class="fav-group"><h3 class="fav-h">' + esc(g.label) + ' <span>(' + g.items.length + ')</span></h3><div class="pgrid">' +
        g.items.map(function (it, i) { return '<div class="pcard" tabindex="0" data-g="' + gi + '" data-i="' + i + '"><img src="' + esc(it.poster || '') + '" onerror="this.src=\'' + POSTER_PH + '\'"/><div class="cap">' + esc(it.title) + '</div></div>'; }).join('') + '</div></div>';
    });
    main.innerHTML = html || '<div class="empty-note">Voce ainda nao tem favoritos.</div>';
    Array.prototype.forEach.call(main.querySelectorAll('[data-i]'), function (n) {
      n.addEventListener('click', function () {
        var g = groups[+n.getAttribute('data-g')], it = g.items[+n.getAttribute('data-i')];
        if (it.kind === 'live') playLive(it); else go(screenDetails, { item: it });
      });
    });
  }

  // ---------- TV ao vivo ----------
  function screenLive() {
    h('<div class="view col"><div class="subhdr"><button class="back-btn" data-back>' + IC.back + '</button><h2>TV ao vivo</h2></div>' +
      '<div class="cat"><div class="side"><h3>CATEGORIAS</h3><div id="catList"></div></div><div class="main" id="main"><div class="center-mid"><div class="spinner"></div></div></div></div></div>');
    qs('[data-back]').addEventListener('click', back);
    window.API.categories(state.server, 'live').then(function (list) {
      var cats = [{ id: '@fav', name: 'Favoritos', virtual: 'fav' }].concat((list || []).map(function (c) { return { id: c.id, name: c.name, virtual: '' }; }));
      renderCats(cats, function (cat) { openLiveCat(cat); });
      selectCat(cats.length > 1 ? 1 : 0, cats, function (cat) { openLiveCat(cat); });
    });
  }
  function openLiveCat(cat) { var main = qs('#main'); if (!main) return; guardAdult(cat).then(function (ok) { if (ok) openLiveCatDo(cat, main); }); }
  function openLiveCatDo(cat, main) {
    main.innerHTML = '<div class="center-mid"><div class="spinner"></div></div>';
    var p = (cat.virtual === 'fav') ? Promise.resolve(window.Store.getFavorites().filter(function (f) { return f.kind === 'live'; })) : window.API.streams(state.server, 'live', cat.id);
    p.then(function (chs) {
      chs = (chs || []).filter(notAdult);
      if (!chs.length) { main.innerHTML = '<div class="empty-note">Nenhum canal.</div>'; return; }
      main.innerHTML = '<div class="live-cols"><div class="chan-list" id="chanList">' + chs.map(function (c, i) {
        var fav = window.Store.isFavorite(c);
        return '<div class="chan" tabindex="0" data-ch="' + i + '"><div class="num">' + esc(c.num || (i + 1)) + '</div>' +
          '<img class="logo" src="' + esc(c.poster || '') + '" onerror="this.style.visibility=\'hidden\'"/>' +
          '<div class="nm">' + esc(c.title) + '</div>' +
          '<button class="chan-fav' + (fav ? ' on' : '') + '" data-favch="' + i + '" title="Favoritar">' + (fav ? IC.starFill : IC.star) + '</button></div>';
      }).join('') + '</div>' +
        '<div class="epg-panel" id="epgPanel"><div class="epg-empty">Toque em um canal para ver a programacao.<br><br>Dica: segure no canal para favoritar.</div></div>' +
        '</div>';

      Array.prototype.forEach.call(main.querySelectorAll('.chan'), function (n) {
        var i = +n.getAttribute('data-ch'), lp = false, timer = null;
        function start() { lp = false; timer = setTimeout(function () { lp = true; toggleChanFav(chs[i], n); }, 550); }
        function cancel() { if (timer) { clearTimeout(timer); timer = null; } }
        n.addEventListener('touchstart', start, { passive: true });
        n.addEventListener('touchend', cancel);
        n.addEventListener('touchmove', cancel);
        n.addEventListener('mousedown', start);
        n.addEventListener('mouseup', cancel);
        n.addEventListener('mouseleave', cancel);
        n.addEventListener('click', function () { if (lp) { lp = false; return; } selectChannel(chs[i]); });
        n.addEventListener('keydown', function (e) { if (e.key === 'Enter') selectChannel(chs[i]); });
      });
      Array.prototype.forEach.call(main.querySelectorAll('[data-favch]'), function (n) {
        n.addEventListener('click', function (e) { e.stopPropagation(); toggleChanFav(chs[+n.getAttribute('data-favch')], n.parentNode); });
      });
    }).catch(function () { main.innerHTML = '<div class="empty-note">Erro ao carregar canais.</div>'; });
  }
  function toggleChanFav(ch, rowEl) {
    var on = window.Store.toggleFavorite(ch);
    var btn = rowEl && rowEl.querySelector ? rowEl.querySelector('.chan-fav') : null;
    if (btn) { btn.classList.toggle('on', on); btn.innerHTML = on ? IC.starFill : IC.star; }
    toast(on ? 'Canal favoritado' : 'Removido dos favoritos');
  }
  function selectChannel(ch) { loadEpg(ch); playLive(ch); }
  function loadEpg(ch) {
    var panel = document.getElementById('epgPanel'); if (!panel) return;
    panel.innerHTML = '<div class="epg-head">' + esc(ch.title) + '</div><div class="epg-empty">Carregando programacao...</div>';
    function hm(s) { s = (s || '').toString(); var m = s.match(/\d{2}:\d{2}/); return m ? m[0] : ''; }
    window.API.epg(state.server, ch.streamId || ch.id).then(function (list) {
      if (!list || !list.length) { panel.innerHTML = '<div class="epg-head">' + esc(ch.title) + '</div><div class="epg-empty">Sem programacao (EPG) para este canal.</div>'; return; }
      var now = list[0], nx = list[1];
      var html = '<div class="epg-head">' + esc(ch.title) + '</div>';
      html += '<div class="epg-item epg-live"><span class="epg-tag">NO AR AGORA</span><b>' + esc(now.title || '-') + '</b>' +
        (hm(now.start) ? '<span class="epg-time">' + esc(hm(now.start)) + ' - ' + esc(hm(now.stop)) + '</span>' : '') +
        (now.description ? '<p>' + esc(now.description.slice(0, 220)) + '</p>' : '') + '</div>';
      if (nx) html += '<div class="epg-item"><span class="epg-tag next">A SEGUIR</span><b>' + esc(nx.title || '-') + '</b>' +
        (hm(nx.start) ? '<span class="epg-time">' + esc(hm(nx.start)) + ' - ' + esc(hm(nx.stop)) + '</span>' : '') + '</div>';
      if (list[2]) html += '<div class="epg-item"><span class="epg-tag next">DEPOIS</span><b>' + esc(list[2].title || '-') + '</b>' + (hm(list[2].start) ? '<span class="epg-time">' + esc(hm(list[2].start)) + '</span>' : '') + '</div>';
      panel.innerHTML = html;
    }).catch(function () { panel.innerHTML = '<div class="epg-head">' + esc(ch.title) + '</div><div class="epg-empty">Erro ao carregar EPG.</div>'; });
  }
  function playLive(ch) {
    var url = window.API.liveUrl(state.server, ch.streamId || ch.id);
    if (window.Player.isOpen() && window.Player.currentUrl() === url && window.Player.mode() === 'mini') { window.Player.expandFull(); return; }
    window.Store.addHistory(ch);
    window.Player.open(url, ch.title, 'mini');
    toast('Pre-visualizacao • toque de novo para tela cheia');
  }

  // ---------- Detalhes (com TMDB) ----------
  function screenDetails(params) {
    var it = params.item, isSeries = (it.kind === 'series');
    var favLabel = window.Store.isFavorite(it) ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
    h('<div class="view details">' +
      '<div class="backdrop" id="dBack" style="background-image:url(\'' + esc(it.poster || '') + '\')"></div><div class="scrim"></div>' +
      '<div class="content"><div class="cover-big"><img id="dCover" src="' + esc(it.poster || '') + '" onerror="this.src=\'' + POSTER_PH + '\'"/></div>' +
      '<div class="meta"><div class="tag">' + (isSeries ? 'SERIE / NOVELA' : 'FILME') + '</div>' +
      '<h1>' + esc(it.title) + '</h1><div class="sub" id="dSub">' + (it.rating ? ('★ ' + esc(it.rating)) : '') + '</div>' +
      '<div class="plot" id="dPlot">' + esc(it.plot || 'Carregando informacoes...') + '</div>' +
      '<div class="actions"><button class="btn" id="dPrimary">' + IC.play + ' ' + (isSeries ? 'Ver episodios' : 'Assistir') + '</button>' +
      '<button class="btn ghost" id="dFav" style="width:auto;padding:0 22px">' + esc(favLabel) + '</button>' +
      '<button class="btn ghost" id="dBackBtn" style="width:auto;padding:0 22px">Voltar</button></div></div></div></div>');
    qs('#dBackBtn').addEventListener('click', back);
    qs('#dFav').addEventListener('click', function () { var f = window.Store.toggleFavorite(it); qs('#dFav').textContent = f ? 'Remover dos favoritos' : 'Adicionar aos favoritos'; toast(f ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.'); });

    // TMDB: backdrop, sinopse, nota
    window.TMDB.enrich(it).then(function (meta) {
      if (!meta) return;
      if (meta.backdrop) { var db = qs('#dBack'); if (db) db.style.backgroundImage = "url('" + meta.backdrop + "')"; }
      if (meta.poster && !it.poster) { var dc = qs('#dCover'); if (dc) dc.src = meta.poster; }
      if (meta.overview) { var dp = qs('#dPlot'); if (dp) dp.textContent = meta.overview; }
      var sub = []; if (meta.year) sub.push(meta.year); if (meta.rating) sub.push('★ ' + meta.rating);
      if (sub.length) { var ds = qs('#dSub'); if (ds) ds.textContent = sub.join('   •   '); }
    }).catch(function () {});

    if (isSeries) {
      var btn = qs('#dPrimary'); btn.disabled = true;
      window.API.seriesInfo(state.server, it.seriesId || it.id).then(function (info) {
        if (info.info && info.info.plot && (!it.plot)) { var dp = qs('#dPlot'); if (dp && dp.textContent.indexOf('Carregando') >= 0) dp.textContent = info.info.plot; }
        var seasons = info.seasons || []; btn.disabled = false;
        btn.addEventListener('click', function () { if (!seasons.length) { toast('Nenhum episodio.'); return; } window.Store.addHistory(it); go(screenEpisodes, { item: it, seasons: seasons }); });
      }).catch(function () { btn.disabled = false; });
    } else {
      qs('#dPrimary').addEventListener('click', function () { window.Store.addHistory(it); window.Player.open(it.url || window.API.vodUrl(state.server, it.streamId || it.id, it.ext), it.title); });
    }
  }

  // ---------- Episodios ----------
  function screenEpisodes(params) {
    var it = params.item, seasons = params.seasons || [];
    h('<div class="view col"><div class="subhdr"><button class="back-btn" data-back>' + IC.back + '</button><h2>' + esc(it.title) + '</h2></div><div class="main scroll" style="padding:20px 24px"><div class="seasons-tabs" id="seasonTabs"></div><div class="ep-list" id="epList"></div></div></div>');
    qs('[data-back]').addEventListener('click', back);
    var tabs = qs('#seasonTabs');
    tabs.innerHTML = seasons.map(function (s, i) { return '<button class="season-tab" data-se="' + i + '">Temporada ' + esc(s.season) + '</button>'; }).join('');
    Array.prototype.forEach.call(tabs.querySelectorAll('[data-se]'), function (n) { n.addEventListener('click', function () { selSeason(+n.getAttribute('data-se'), seasons); }); });
    if (seasons.length) selSeason(0, seasons); else qs('#epList').innerHTML = '<div class="empty-note">Nenhum episodio.</div>';
  }
  function selSeason(idx, seasons) {
    qsa('.season-tab').forEach(function (n, i) { n.classList.toggle('active', i === idx); });
    var eps = (seasons[idx] && seasons[idx].episodes) || [], list = qs('#epList');
    list.innerHTML = eps.map(function (ep, i) { return '<div class="ep" data-ep="' + i + '"><img src="' + esc(ep.poster || '') + '" onerror="this.style.visibility=\'hidden\'"/><div class="txt"><b>' + esc(ep.episodeNum ? (ep.episodeNum + '. ') : '') + esc(ep.title) + '</b><span>' + esc((ep.plot || '').slice(0, 150)) + '</span></div></div>'; }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('[data-ep]'), function (n) { n.addEventListener('click', function () { var ep = eps[+n.getAttribute('data-ep')]; window.Player.open(ep.url, ep.title); }); });
  }

  // ---------- Busca ----------
  var searchCache = null;
  function screenSearch() {
    h('<div class="view col"><div class="subhdr"><button class="back-btn" data-back>' + IC.back + '</button><input class="search-input" id="q" placeholder="Buscar doramas, novelas, filmes..."/><button class="btn" id="btnQ" style="width:auto;padding:0 22px;height:44px">Buscar</button></div><div class="main scroll" id="main" style="padding:20px 24px"><div class="empty-note">Digite um termo e pressione Buscar.</div></div></div>');
    qs('[data-back]').addEventListener('click', back);
    qs('#btnQ').addEventListener('click', doSearch);
    qs('#q').addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });
    setTimeout(function () { qs('#q').focus(); }, 60);
  }
  function doSearch() {
    var term = (qs('#q').value || '').trim().toLowerCase(), main = qs('#main');
    if (term.length < 2) { main.innerHTML = '<div class="empty-note">Digite ao menos 2 letras.</div>'; return; }
    main.innerHTML = '<div class="center-mid"><div class="spinner"></div></div>';
    var ready = searchCache ? Promise.resolve(searchCache) : Promise.all([window.API.streams(state.server, 'series', ''), window.API.streams(state.server, 'movie', '')]).then(function (r) { searchCache = (r[0] || []).concat(r[1] || []); return searchCache; });
    ready.then(function (all) {
      var res = all.filter(function (it) { return notAdult(it) && (it.title || '').toLowerCase().indexOf(term) >= 0; }).slice(0, 120);
      if (!res.length) { main.innerHTML = '<div class="empty-note">Nada encontrado.</div>'; return; }
      main.innerHTML = '<div class="pgrid">' + res.map(function (it, i) { return '<div class="pcard" tabindex="0" data-gi="' + i + '"><img src="' + esc(it.poster || '') + '" onerror="this.src=\'' + POSTER_PH + '\'"/><div class="cap">' + esc(it.title) + '</div></div>'; }).join('') + '</div>';
      Array.prototype.forEach.call(main.querySelectorAll('[data-gi]'), function (n) { n.addEventListener('click', function () { go(screenDetails, { item: res[+n.getAttribute('data-gi')] }); }); });
    }).catch(function () { main.innerHTML = '<div class="empty-note">Erro na busca.</div>'; });
  }

  // ---------- Ajustes ----------
  function screenSettings() {
    var pin = window.Store.getAdultPin();
    var theme = window.Store.getTheme() || CFG.defaultTheme;
    var layout = window.Store.getLayout() || CFG.defaultLayout;
    var accUi = state.userInfo || {};
    h('<div class="view col"><div class="subhdr"><button class="back-btn" data-back>' + IC.back + '</button><h2>Ajustes</h2></div>' +
      '<div class="main scroll" style="padding:24px; max-width:680px">' +

      '<div class="set-card"><div class="set-title">Tema do app</div><div class="set-desc">Escolha o visual padrao.</div>' +
      '<div class="theme-row">' +
      '<button class="theme-opt' + (theme === 'red' ? ' active' : '') + '" data-theme-opt="red"><span class="tsw tsw-red"></span>LOLLIFLIX (Vermelho)</button>' +
      '<button class="theme-opt' + (theme === 'dora' ? ' active' : '') + '" data-theme-opt="dora"><span class="tsw tsw-dora"></span>Doramas (Rosa/Roxo)</button>' +
      '</div></div>' +

      '<div class="set-card"><div class="set-title">Layout do app</div><div class="set-desc">Escolha o estilo da tela inicial.</div>' +
      '<div class="theme-row">' +
      '<button class="theme-opt' + (layout === 'tiles' ? ' active' : '') + '" data-layout-opt="tiles">Ladrilhos (classico)</button>' +
      '<button class="theme-opt' + (layout === 'rails' ? ' active' : '') + '" data-layout-opt="rails">Streaming (doramas)</button>' +
      '</div></div>' +

      '<div class="set-card"><div class="set-title">Conteudo adulto</div><div class="set-desc">Defina um PIN para bloquear categorias adultas (vazio = sem bloqueio).</div>' +
      '<div class="row" style="gap:10px"><input id="pin" class="set-input" type="text" inputmode="numeric" value="' + esc(pin) + '" maxlength="8" placeholder="PIN"/><button class="btn" id="savePin" style="width:auto;padding:0 22px">Salvar</button></div></div>' +

      '<div class="set-card"><div class="set-title">Minha conta</div>' +
      '<div class="acc-grid">' +
      '<div><span>Usuario</span><b>' + esc(state.server ? state.server.user : '-') + '</b></div>' +
      '<div><span>Servidor</span><b>' + esc(state.server ? state.server.name : '-') + '</b></div>' +
      '<div><span>Vencimento</span><b>' + esc(window.API.formatExpire(accUi.expire)) + '</b></div>' +
      '<div><span>Status</span><b>' + esc((accUi.status || '-')) + '</b></div>' +
      '<div><span>Conexoes</span><b>' + esc((accUi.activeCon || '0') + ' / ' + (accUi.maxCon || '-')) + '</b></div>' +
      '<div><span>Teste (trial)</span><b>' + (String(accUi.trial) === '1' ? 'Sim' : 'Nao') + '</b></div>' +
      '</div>' +
      '<div class="row" style="gap:10px; margin-top:14px; flex-wrap:wrap"><button class="btn" id="addProfile" style="width:auto;padding:0 22px">Adicionar / trocar perfil</button>' +
      '<button class="btn ghost" id="logout" style="width:auto;padding:0 22px">Sair da conta</button></div></div>' +

      '<div class="set-card"><div class="set-title">Dados e cache</div><div class="set-desc">Atualize as listas do painel ou limpe o cache de imagens/dados (TMDB e recentes).</div>' +
      '<div class="row" style="gap:10px; flex-wrap:wrap"><button class="btn" id="reloadLists" style="width:auto;padding:0 22px">Recarregar listas</button>' +
      '<button class="btn ghost" id="clearCache" style="width:auto;padding:0 22px">Limpar cache</button></div></div>' +

      '<div class="set-foot">' + esc(CFG.brand) + ' v1.0.0 • Organizacao via TMDB</div>' +
      '</div></div>');
    qs('[data-back]').addEventListener('click', back);

    on('[data-theme-opt]', 'click', function (e) {
      var t = e.currentTarget.getAttribute('data-theme-opt');
      window.Store.setTheme(t); applyTheme(t);
      qsa('[data-theme-opt]').forEach(function (n) { n.classList.remove('active'); });
      e.currentTarget.classList.add('active');
      toast('Tema aplicado.');
    });
    on('[data-layout-opt]', 'click', function (e) {
      var l = e.currentTarget.getAttribute('data-layout-opt');
      window.Store.setLayout(l);
      qsa('[data-layout-opt]').forEach(function (n) { n.classList.remove('active'); });
      e.currentTarget.classList.add('active');
      toast('Layout aplicado.');
      setTimeout(function () { replace(screenHome, {}); }, 400);
    });
    qs('#savePin').addEventListener('click', function () { window.Store.setAdultPin((qs('#pin').value || '').trim()); toast('PIN salvo.'); });
    qs('#addProfile').addEventListener('click', function () { state.adultUnlocked = false; replace(screenLogin, {}); });
    qs('#logout').addEventListener('click', function () { window.Store.clearSession(); state.server = null; state.adultUnlocked = false; if (clockTimer) clearInterval(clockTimer); replace(screenLogin, {}); });
    qs('#reloadLists').addEventListener('click', function () { state.seriesCats = []; state.movieCats = []; searchCache = null; toast('Atualizando listas...'); replace(screenHome, {}); });
    qs('#clearCache').addEventListener('click', function () { window.Store.clearCaches(); state.seriesCats = []; state.movieCats = []; searchCache = null; toast('Cache limpo.'); });
  }

  // ---------- Player + teclado ----------
  function wirePlayer() {
    document.getElementById('plBack').addEventListener('click', function () { window.Player.close(); });
    document.getElementById('plPlay').addEventListener('click', function () { window.Player.togglePlay(); });
    document.getElementById('plMute').addEventListener('click', function () { window.Player.toggleMute(); });
    document.getElementById('plFull').addEventListener('click', function () { try { var v = document.getElementById('videoEl'); if (v && v.requestFullscreen) v.requestFullscreen(); } catch (e) {} });
    var mx = document.getElementById('miniX'); if (mx) mx.addEventListener('click', function (e) { e.stopPropagation(); window.Player.close(); });
    var pl = document.getElementById('player');
    pl.addEventListener('mousemove', function () { window.Player.resetHideTimer(); });
    pl.addEventListener('click', function () { if (window.Player.mode() === 'mini') window.Player.expandFull(); });
    document.getElementById('videoEl').addEventListener('click', function (e) {
      if (window.Player.mode() === 'mini') { window.Player.expandFull(); return; }
      window.Player.togglePlay();
    });
  }
  function wireKeys() {
    document.addEventListener('keydown', function (e) {
      if (window.Player.isOpen()) {
        if (e.key === 'Escape') window.Player.close();
        else if (e.key === ' ') { e.preventDefault(); window.Player.togglePlay(); }
        else if (e.key === 'ArrowRight') window.Player.seek(10);
        else if (e.key === 'ArrowLeft') window.Player.seek(-10);
        window.Player.resetHideTimer(); return;
      }
      if (e.key === 'Escape' || e.key === 'Backspace') { var t = (e.target && e.target.tagName) || ''; if (t !== 'INPUT' && t !== 'TEXTAREA') { e.preventDefault(); back(); } }
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
