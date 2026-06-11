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
    const _CACHE_TTL = 5000; // 5 seconds — refreshes quickly after admin saves

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

    // ── LOYALTY ──
    async function getLoyalty(emailKey){ const d=await _get('loyalty/'+emailKey); return d; }
    async function saveLoyalty(emailKey,data){ await _set('loyalty/'+emailKey,data); }
    async function getAllLoyalty(){ const d=await _get('loyalty'); return d?Object.values(d):[]; }
    async function getLoyaltySettings(){ const d=await _get('system/loyaltySettings'); return d||{pointsPer:10000,tiers:[{name:'Bronze',icon:'🥉',min:0,discount:5,color:'#cd7f32'},{name:'Silver',icon:'🥈',min:10,discount:10,color:'#9ca3af'},{name:'Gold',icon:'🥇',min:25,discount:15,color:'#f59e0b'},{name:'Diamond',icon:'💎',min:50,discount:20,color:'#06b6d4'}]}; }
    async function saveLoyaltySettings(d){ await _set('system/loyaltySettings',d); }

    // ── SPIN WHEEL ──
    async function getSpinSettings(){ const d=await _get('system/spinSettings'); return d||{prizes:[{label:'5% Off',type:'percent',value:5,chance:35,color:'#7c3aed'},{label:'10% Off',type:'percent',value:10,chance:25,color:'#059669'},{label:'15% Off',type:'percent',value:15,chance:15,color:'#3b82f6'},{label:'50,000 IQD Off',type:'fixed',value:50000,chance:12,color:'#f59e0b'},{label:'Free Game <30k',type:'freegame',value:30000,chance:8,color:'#ec4899'},{label:'Try Again',type:'none',value:0,chance:5,color:'#6b7280'}]}; }
    async function saveSpinSettings(d){ await _set('system/spinSettings',d); }
    async function saveSpinResult(emailKey,result){ await push(ref(db,'spinHistory/'+emailKey),result); }

    // ── REFERRAL ──
    async function getReferralSettings(){ const d=await _get('system/referralSettings'); return d||{referrerType:'fixed',referrerValue:15000,newCustDiscount:5,expiryDays:30}; }
    async function saveReferralSettings(d){ await _set('system/referralSettings',d); }
    async function getReferral(code){ const d=await _get('referrals/'+code); return d; }
    async function saveReferral(code,data){ await _set('referrals/'+code,data); }
    async function getAllReferrals(){ const d=await _get('referrals'); return d?Object.entries(d).map(([k,v])=>({code:k,...v})):[]; }

    // ── VIP ──
    async function getVIPSettings(){ const d=await _get('system/vipSettings'); return d||{monthlyPrice:5000,annualPrice:25000,lifetimePrice:80000,discount:15,spinBonus:1,pointsBonus:1,benefits:['15% off all games forever','2 spins per purchase (1 extra)','Earn 1 extra loyalty point per purchase','VIP-only exclusive deals','Early access to new games 48h before everyone','Instant key replacement — no questions asked','Monthly surprise game gift','Birthday month special discount','Listed on VIP Members Wall','Direct Telegram support']}; }
    async function saveVIPSettings(d){ await _set('system/vipSettings',d); }
    async function getVIPMember(emailKey){ const d=await _get('vipMembers/'+emailKey); return d; }
    async function saveVIPMember(emailKey,data){ await _set('vipMembers/'+emailKey,data); }
    async function getAllVIPMembers(){ const d=await _get('vipMembers'); return d?Object.values(d):[]; }

    window._KS_DB = {
      getGames,getSubs,getSettings,getCodes,getReviews,
      saveGames,saveSubs,saveSettings,saveCodes,saveReviews,saveOrder,
      saveNotification,getNotifications,
      listenGames,listenSubs,listenSettings,listenReviews,
      // Loyalty
      getLoyalty,saveLoyalty,getAllLoyalty,getLoyaltySettings,saveLoyaltySettings,
      // Spin
      getSpinSettings,saveSpinSettings,saveSpinResult,
      // Referral
      getReferralSettings,saveReferralSettings,getReferral,saveReferral,getAllReferrals,
      // VIP
      getVIPSettings,saveVIPSettings,getVIPMember,saveVIPMember,getAllVIPMembers
    };

    console.log('✅ Firebase connected!');
    window.dispatchEvent(new Event('ks_db_ready'));

  } catch(err) {
    console.error('❌ Firebase error:', err.message);
    window._KS_DB = null;
    window.dispatchEvent(new Event('ks_db_ready'));
  }
})();
