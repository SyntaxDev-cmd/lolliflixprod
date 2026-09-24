// DoraPlay - Persistencia local (localStorage com try/catch)
window.Store = (function () {
  var PREFIX = 'doraflix.';
  function readRaw(k) { try { return localStorage.getItem(PREFIX + k); } catch (e) { return null; } }
  function writeRaw(k, v) { try { localStorage.setItem(PREFIX + k, v); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(PREFIX + k); } catch (e) {} }
  function getJson(k, f) { var r = readRaw(k); if (!r) return f; try { var v = JSON.parse(r); return (v == null) ? f : v; } catch (e) { return f; } }
  function setJson(k, v) { writeRaw(k, JSON.stringify(v)); }
  function itemKey(it) { if (!it) return ''; return (it.kind || 'x') + ':' + (it.id || ''); }

  return {
    getJson: getJson, setJson: setJson, del: del,
    getSession: function () { return getJson('session', null); },
    setSession: function (s) { setJson('session', s); },
    clearSession: function () { del('session'); },

    getProfiles: function () { var p = getJson('profiles', []); return Array.isArray(p) ? p : []; },
    addProfile: function (u, p, max) {
      var list = this.getProfiles().filter(function (x) { return x.user !== u; });
      list.unshift({ user: u, pass: p });
      while (list.length > (max || 5)) list.pop();
      setJson('profiles', list);
    },
    removeProfile: function (u) { setJson('profiles', this.getProfiles().filter(function (x) { return x.user !== u; })); },

    getFavorites: function () { var f = getJson('favorites', []); return Array.isArray(f) ? f : []; },
    isFavorite: function (it) { var k = itemKey(it); return this.getFavorites().some(function (f) { return itemKey(f) === k; }); },
    toggleFavorite: function (it) {
      var k = itemKey(it), list = this.getFavorites();
      var found = list.some(function (f) { return itemKey(f) === k; });
      list = found ? list.filter(function (f) { return itemKey(f) !== k; }) : [it].concat(list);
      setJson('favorites', list); return !found;
    },

    getHistory: function () { var h = getJson('history', []); return Array.isArray(h) ? h : []; },
    addHistory: function (it) {
      if (!it || !it.id) return;
      var k = itemKey(it);
      var list = this.getHistory().filter(function (h) { return itemKey(h) !== k; });
      list.unshift(it); while (list.length > 40) list.pop();
      setJson('history', list);
    },

    getAdultPin: function () { return getJson('adultPin', ''); },
    setAdultPin: function (p) { setJson('adultPin', p); },

    getTheme: function () { return getJson('theme', ''); },
    setTheme: function (t) { setJson('theme', t); },
    getLayout: function () { return getJson('layout', ''); },
    setLayout: function (l) { setJson('layout', l); },

    // cache TMDB (por titulo)
    getTmdb: function (key) { return getJson('tmdb:' + key, null); },
    setTmdb: function (key, val) { setJson('tmdb:' + key, val); },

    // limpa caches (TMDB + recentes), mantendo sessao/favoritos/config
    clearCaches: function () {
      try {
        var rm = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && (k.indexOf(PREFIX + 'tmdb:') === 0 || k === PREFIX + 'recentCache')) rm.push(k);
        }
        rm.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
      } catch (e) {}
    },

    itemKey: itemKey
  };
})();
