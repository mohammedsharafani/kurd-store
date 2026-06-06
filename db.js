// ═══════════════════════════════════════════
//  KURD STORE — FIREBASE REALTIME DATABASE
// ═══════════════════════════════════════════

(async function() {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getDatabase, ref, get, set, push, onValue } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");

    const app = initializeApp(FIREBASE_CONFIG);
    const db  = getDatabase(app);

    async function _get(path){ const s=await get(ref(db,path)); return s.exists()?s.val():null; }
    async function _set(path,data){ await set(ref(db,path),data); }
    function _listen(path,cb){ onValue(ref(db,path),s=>cb(s.exists()?s.val():null)); }

    // ── IN-MEMORY CACHE (avoids repeated Firebase reads) ──
    const _cache = {};
    const _CACHE_TTL = 30000; // 30 seconds

    async function _getCached(path, fallback){
      const now = Date.now();
      if(_cache[path] && (now - _cache[path].ts) < _CACHE_TTL){
        return _cache[path].data;
      }
      const d = await _get(path);
      const result = d !== null ? d : null;
      _cache[path] = { data: result, ts: now };
      return result;
    }
    function _invalidate(path){ delete _cache[path]; }

    async function getGames()   { const d=await _getCached('store/games',null);   return d?.list?.length?d.list:DEFAULT_GAMES; }
    async function getSubs()    { const d=await _getCached('store/subs',null);    return d?.list?.length?d.list:DEFAULT_SUBS; }
    async function getSettings(){ const d=await _getCached('store/settings',null);return d?Object.assign({},DEFAULT_SETTINGS,d):DEFAULT_SETTINGS; }
    async function getCodes()   { const d=await _getCached('store/codes',null);   return d?.codes?d.codes:{}; }
    async function getReviews() { const d=await _getCached('store/reviews',null); return d?.list?.length?d.list:DEFAULT_REVIEWS; }

    async function saveGames(l)   { _invalidate('store/games');    await _set('store/games',   {list:l}); }
    async function saveSubs(l)    { _invalidate('store/subs');     await _set('store/subs',    {list:l}); }
    async function saveSettings(d){ _invalidate('store/settings'); await _set('store/settings',d); }
    async function saveCodes(c)   { _invalidate('store/codes');    await _set('store/codes',   {codes:c}); }
    async function saveReviews(l) { _invalidate('store/reviews');  await _set('store/reviews', {list:l}); }
    async function saveOrder(o)      { await push(ref(db,'orders'),o); }
    async function saveNotification(n){ await push(ref(db,'notifications'),n); }
    async function getNotifications() { const d=await _get('notifications'); return d?Object.values(d):[]; }

    // Use one-time fetch for store pages (faster than persistent listener)
    // Listeners only keep ONE connection open per path
    const _activeListeners = {};
    function listenGames(cb){
      if(_activeListeners['games']) return;
      _activeListeners['games'] = _listen('store/games', d=>{
        _cache['store/games']={data:d,ts:Date.now()};
        cb(d?.list||DEFAULT_GAMES);
      });
    }
    function listenSubs(cb){
      if(_activeListeners['subs']) return;
      _activeListeners['subs'] = _listen('store/subs', d=>{
        _cache['store/subs']={data:d,ts:Date.now()};
        cb(d?.list||DEFAULT_SUBS);
      });
    }
    function listenSettings(cb){
      if(_activeListeners['settings']) return;
      _activeListeners['settings'] = _listen('store/settings', d=>{
        _cache['store/settings']={data:d,ts:Date.now()};
        cb(d?Object.assign({},DEFAULT_SETTINGS,d):DEFAULT_SETTINGS);
      });
    }
    function listenReviews(cb){
      if(_activeListeners['reviews']) return;
      _activeListeners['reviews'] = _listen('store/reviews', d=>{
        _cache['store/reviews']={data:d,ts:Date.now()};
        cb(d?.list||DEFAULT_REVIEWS);
      });
    }

    window._KS_DB = {
      getGames,getSubs,getSettings,getCodes,getReviews,
      saveGames,saveSubs,saveSettings,saveCodes,saveReviews,saveOrder,
      saveNotification,getNotifications,
      listenGames,listenSubs,listenSettings,listenReviews
    };

    console.log('✅ Firebase connected!');
    window.dispatchEvent(new Event('ks_db_ready'));

  } catch(err) {
    console.error('❌ Firebase error:', err.message);
    window._KS_DB = null;
    window.dispatchEvent(new Event('ks_db_ready'));
  }
})();
