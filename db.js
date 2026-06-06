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

    const _cache = {};
    const _CACHE_TTL = 30000;

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

    function _warnRules(fn, e){
      if(e.message && e.message.includes('PERMISSION_DENIED')){
        console.error(`⛔ Firebase PERMISSION_DENIED on ${fn}. Fix: Firebase Console → Realtime Database → Rules → set ".read" and ".write" to true`);
      } else {
        console.warn(`⚠️ ${fn} failed:`, e.message);
      }
    }

    async function getGames()   { try{ const d=await _getCached('store/games',null);   return d?.list?.length?d.list:DEFAULT_GAMES; }catch(e){ _warnRules('getGames',e);   return DEFAULT_GAMES; } }
    async function getSubs()    { try{ const d=await _getCached('store/subs',null);    return d?.list?.length?d.list:DEFAULT_SUBS;  }catch(e){ _warnRules('getSubs',e);    return DEFAULT_SUBS;  } }
    async function getSettings(){ try{ const d=await _getCached('store/settings',null);return d?Object.assign({},DEFAULT_SETTINGS,d):DEFAULT_SETTINGS; }catch(e){ _warnRules('getSettings',e); return DEFAULT_SETTINGS; } }
    async function getCodes()   { try{ const d=await _getCached('store/codes',null);   return d?.codes?d.codes:{};               }catch(e){ _warnRules('getCodes',e);   return {}; } }
    async function getReviews() { try{ const d=await _getCached('store/reviews',null); return d?.list?.length?d.list:DEFAULT_REVIEWS; }catch(e){ _warnRules('getReviews',e); return DEFAULT_REVIEWS; } }
    async function getNotifications(){ try{ const d=await _get('notifications'); return d?Object.values(d):[]; }catch(e){ _warnRules('getNotifications',e); return []; } }

    async function saveGames(l)   { _invalidate('store/games');    await _set('store/games',   {list:l}); }
    async function saveSubs(l)    { _invalidate('store/subs');     await _set('store/subs',    {list:l}); }
    async function saveSettings(d){ _invalidate('store/settings'); await _set('store/settings',d); }
    async function saveCodes(c)   { _invalidate('store/codes');    await _set('store/codes',   {codes:c}); }
    async function saveReviews(l) { _invalidate('store/reviews');  await _set('store/reviews', {list:l}); }
    async function saveOrder(o)      { await push(ref(db,'orders'),o); }
    async function saveNotification(n){ await push(ref(db,'notifications'),n); }

    const _activeListeners = {};
    function listenGames(cb){
      if(_activeListeners['games']) return;
      _activeListeners['games'] = _listen('store/games', d=>{ _cache['store/games']={data:d,ts:Date.now()}; cb(d?.list||DEFAULT_GAMES); });
    }
    function listenSubs(cb){
      if(_activeListeners['subs']) return;
      _activeListeners['subs'] = _listen('store/subs', d=>{ _cache['store/subs']={data:d,ts:Date.now()}; cb(d?.list||DEFAULT_SUBS); });
    }
    function listenSettings(cb){
      if(_activeListeners['settings']) return;
      _activeListeners['settings'] = _listen('store/settings', d=>{ _cache['store/settings']={data:d,ts:Date.now()}; cb(d?Object.assign({},DEFAULT_SETTINGS,d):DEFAULT_SETTINGS); });
    }
    function listenReviews(cb){
      if(_activeListeners['reviews']) return;
      _activeListeners['reviews'] = _listen('store/reviews', d=>{ _cache['store/reviews']={data:d,ts:Date.now()}; cb(d?.list||DEFAULT_REVIEWS); });
    }

    window._KS_DB = {
      getGames,getSubs,getSettings,getCodes,getReviews,
      saveGames,saveSubs,saveSettings,saveCodes,saveReviews,saveOrder,
      saveNotification,getNotifications,
      listenGames,listenSubs,listenSettings,listenReviews
    };

    console.log('✅ Firebase connected!');

  } catch(err) {
    console.error('❌ Firebase error:', err.message);
    window._KS_DB = {
      getGames:    async () => DEFAULT_GAMES,
      getSubs:     async () => DEFAULT_SUBS,
      getSettings: async () => DEFAULT_SETTINGS,
      getCodes:    async () => ({}),
      getReviews:  async () => DEFAULT_REVIEWS,
      getNotifications: async () => ([]),
      saveGames:    async () => { throw new Error('Firebase not connected'); },
      saveSubs:     async () => { throw new Error('Firebase not connected'); },
      saveSettings: async () => { throw new Error('Firebase not connected'); },
      saveCodes:    async () => { throw new Error('Firebase not connected'); },
      saveReviews:  async () => { throw new Error('Firebase not connected'); },
      saveOrder:    async () => { throw new Error('Firebase not connected'); },
      saveNotification: async () => { throw new Error('Firebase not connected'); },
      listenGames:    (cb) => cb(DEFAULT_GAMES),
      listenSubs:     (cb) => cb(DEFAULT_SUBS),
      listenSettings: (cb) => cb(DEFAULT_SETTINGS),
      listenReviews:  (cb) => cb(DEFAULT_REVIEWS),
    };
    console.warn('⚠️ Running in read-only mode. Fix Firebase rules to restore full functionality.');
  }
})();
