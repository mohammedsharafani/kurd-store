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

    async function getGames()   { const d=await _get('store/games');   return d?.list?.length?d.list:DEFAULT_GAMES; }
    async function getSubs()    { const d=await _get('store/subs');    return d?.list?.length?d.list:DEFAULT_SUBS; }
    async function getSettings(){ const d=await _get('store/settings');return d?Object.assign({},DEFAULT_SETTINGS,d):DEFAULT_SETTINGS; }
    async function getCodes()   { const d=await _get('store/codes');   return d?.codes?d.codes:DEFAULT_CODES; }
    async function getReviews() { const d=await _get('store/reviews'); return d?.list?.length?d.list:DEFAULT_REVIEWS; }

    async function saveGames(l)   { await _set('store/games',   {list:l}); }
    async function saveSubs(l)    { await _set('store/subs',    {list:l}); }
    async function saveSettings(d){ await _set('store/settings',d); }
    async function saveCodes(c)   { await _set('store/codes',   {codes:c}); }
    async function saveReviews(l) { await _set('store/reviews', {list:l}); }
    async function saveOrder(o)   { await push(ref(db,'orders'),o); }

    function listenGames(cb)   { _listen('store/games',   d=>cb(d?.list||DEFAULT_GAMES)); }
    function listenSubs(cb)    { _listen('store/subs',    d=>cb(d?.list||DEFAULT_SUBS)); }
    function listenSettings(cb){ _listen('store/settings',d=>cb(d?Object.assign({},DEFAULT_SETTINGS,d):DEFAULT_SETTINGS)); }
    function listenReviews(cb) { _listen('store/reviews', d=>cb(d?.list||DEFAULT_REVIEWS)); }

    window._KS_DB = {
      getGames,getSubs,getSettings,getCodes,getReviews,
      saveGames,saveSubs,saveSettings,saveCodes,saveReviews,saveOrder,
      listenGames,listenSubs,listenSettings,listenReviews
    };

    console.log('✅ Firebase connected!');

  } catch(err) {
    console.error('❌ Firebase error:', err.message);
    window._KS_DB = null;
  }
})();
