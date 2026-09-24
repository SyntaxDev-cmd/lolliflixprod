// DoraPlay - Integracao TMDB (organizacao: capas, sinopses, backdrops, notas)
window.TMDB = (function () {
  var C = window.APP_CONFIG.tmdb;

  function getJson(url) {
    return window.native.get(url, 15000).then(function (r) {
      if (!r || !r.ok || !r.text) return null;
      try { return JSON.parse(r.text); } catch (e) { return null; }
    });
  }

  // limpa o titulo do painel para casar melhor no TMDB
  function cleanTitle(t) {
    t = (t || '').toString();
    t = t.replace(/\[[^\]]*\]/g, ' ').replace(/\([^\)]*\)/g, ' ');
    t = t.replace(/\b(19|20)\d{2}\b/g, ' ');
    t = t.replace(/\bS\d{1,2}\s?E\d{1,3}\b/ig, ' ');
    t = t.replace(/\bT\d{1,2}\s?(E|EP|C)?\d{0,3}\b/ig, ' ');
    t = t.replace(/\btemporada\s*\d+\b/ig, ' ').replace(/\b\d+\s*temporada\b/ig, ' ');
    t = t.replace(/\bepis[oó]dio\s*\d+\b/ig, ' ');
    t = t.replace(/\b(4k|fhd|hd|sd|h265|h264|x265|dual|dublad[oa]|legendad[oa]|leg|dub|nacional|complet[oa])\b/ig, ' ');
    t = t.replace(/[|:_]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    return t;
  }

  function img(path, size) {
    if (!path) return '';
    return C.img + (size || 'w500') + path;
  }

  function toMeta(r) {
    if (!r) return null;
    var date = r.first_air_date || r.release_date || '';
    return {
      tmdbId: r.id,
      title: r.name || r.title || '',
      poster: img(r.poster_path, 'w500'),
      backdrop: img(r.backdrop_path, 'w1280'),
      overview: r.overview || '',
      rating: r.vote_average ? (Math.round(r.vote_average * 10) / 10).toFixed(1) : '',
      year: date ? date.slice(0, 4) : '',
      country: (r.origin_country && r.origin_country[0]) || ''
    };
  }

  function searchOne(type, title) {
    var url = C.base + '/search/' + type + '?api_key=' + C.apiKey +
      '&language=' + encodeURIComponent(C.language) +
      '&include_adult=false&page=1&query=' + encodeURIComponent(title);
    return getJson(url).then(function (j) {
      if (j && j.results && j.results.length) return j.results[0];
      return null;
    });
  }

  // Enriquecer um item do painel. Retorna Promise<meta|null> (com cache).
  function enrich(item) {
    if (!item) return Promise.resolve(null);
    var title = cleanTitle(item.title);
    if (!title) return Promise.resolve(null);
    var isTv = (item.kind === 'series' || item.kind === 'episode');
    var key = (isTv ? 'tv:' : 'mv:') + title.toLowerCase();
    var cached = window.Store.getTmdb(key);
    if (cached) return Promise.resolve(cached.none ? null : cached);

    var primary = isTv ? 'tv' : 'movie';
    var secondary = isTv ? 'movie' : 'tv';
    return searchOne(primary, title).then(function (r) {
      if (r) return r;
      return searchOne(secondary, title);
    }).then(function (r) {
      var meta = toMeta(r);
      window.Store.setTmdb(key, meta || { none: true });
      return (meta && !meta.none) ? meta : null;
    }).catch(function () { return null; });
  }

  return { enrich: enrich, cleanTitle: cleanTitle, img: img };
})();
