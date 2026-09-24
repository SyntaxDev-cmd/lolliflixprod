// DoraPlay - adaptador de rede (funciona no Electron, no Android/Capacitor e no navegador)
// Define window.native.get(url) sem problemas de CORS/cleartext.
// No Electron o preload ja define window.native; aqui so completamos se faltar.
(function () {
  var UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  function viaCapacitor(url, timeoutMs) {
    var http = window.Capacitor.Plugins.CapacitorHttp;
    return http.get({
      url: url,
      headers: { 'User-Agent': UA_PC, 'Accept': 'application/json, text/plain, */*' },
      connectTimeout: timeoutMs || 20000,
      readTimeout: timeoutMs || 20000
    }).then(function (res) {
      var t = (typeof res.data === 'string') ? res.data : JSON.stringify(res.data);
      return { ok: res.status >= 200 && res.status < 300, status: res.status, text: t, error: '' };
    }).catch(function (e) { return { ok: false, status: 0, text: '', error: String((e && e.message) || e) }; });
  }
  function viaFetch(url) {
    return fetch(url).then(function (r) {
      return r.text().then(function (t) { return { ok: r.ok, status: r.status, text: t, error: '' }; });
    }).catch(function (e) { return { ok: false, status: 0, text: '', error: String(e) }; });
  }

  if (!window.native) {
    window.native = {
      get: function (url, timeoutMs) {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorHttp) return viaCapacitor(url, timeoutMs);
        return viaFetch(url);
      },
      win: { minimize: function () {}, maximize: function () {}, close: function () {}, fullscreen: function () {} }
    };
  }
})();
