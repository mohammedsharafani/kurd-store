// ═══════════════════════════════════════════
//  KURD STORE — APP UTILITIES
// ═══════════════════════════════════════════

function iqd(n){ return Number(n).toLocaleString()+' IQD'; }

function getTheme(){ return localStorage.getItem('ks_theme')||'light'; }
function initTheme(){ document.documentElement.setAttribute('data-theme',getTheme()); }
function toggleTheme(){
  const n=getTheme()==='dark'?'light':'dark';
  localStorage.setItem('ks_theme',n);
  document.documentElement.setAttribute('data-theme',n);
  const b=document.getElementById('darkBtn');
  if(b) b.textContent=n==='dark'?'☀️':'🌙';
}
function getLang(){ return localStorage.getItem('ks_lang')||'en'; }
function toggleLang(){
  const cur=getLang();
  const next = cur==='en'?'kd': cur==='kd'?'ar':'en';
  localStorage.setItem('ks_lang',next);
  applyLang();
  // Rebuild nav so translated links + cart direction update
  const activePage = document.querySelector('.navlinks a.active')?.getAttribute('href')?.replace('.html','').replace('index','home') || 'home';
  if(typeof buildNav === 'function') buildNav(activePage);
}
function applyLang(){
  const l=getLang();
  document.querySelectorAll('[data-en]').forEach(el=>{
    if(l==='en')      el.textContent=el.dataset.en;
    else if(l==='kd') el.textContent=el.dataset.kd;
    else if(l==='ar') el.textContent=el.dataset.ar||el.dataset.en;
  });
  // RTL for Arabic
  document.documentElement.setAttribute('dir', l==='ar'?'rtl':'ltr');
  const b=document.getElementById('langBtn');
  if(b) b.textContent = l==='en'?'🌐 عربي / کوردی': l==='kd'?'🌐 العربية / English':'🌐 English / کوردی';
  // Update cart RTL class
  const sidebar = document.getElementById('cartSidebar');
  if(sidebar){
    if(l==='ar') sidebar.classList.add('cart-rtl');
    else sidebar.classList.remove('cart-rtl');
    // Clear any stale inline styles
    sidebar.style.transform=''; sidebar.style.left=''; sidebar.style.right='';
  }
}
function showToast(msg){
  const t=document.getElementById('toast');
  if(!t) return;
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}
function getCart(){ try{return JSON.parse(localStorage.getItem('ks_cart'))||[];}catch(e){return[];} }
function saveCart(c){ localStorage.setItem('ks_cart',JSON.stringify(c)); }
function updateCartBadge(animate){
  const n = getCart().length;
  document.querySelectorAll('.cart-count').forEach(el=>{
    el.textContent = n;
    if(animate){
      el.classList.remove('bounce');
      void el.offsetWidth; // reflow
      el.classList.add('bounce');
      setTimeout(()=>el.classList.remove('bounce'), 600);
    }
  });
}
function getAppliedDisc(){ try{return JSON.parse(localStorage.getItem('ks_disc'));}catch(e){return null;} }
function saveAppliedDisc(d){ localStorage.setItem('ks_disc',JSON.stringify(d)); }
function calcDisc(sub, cart){
  const d=getAppliedDisc(); if(!d) return 0;
  // If appliesTo is set, only discount matching items
  if(d.appliesTo && d.appliesTo!=='all' && cart && cart.length){
    const eligible = cart.filter(i=>{
      if(d.appliesTo==='subs')     return i.type==='sub';
      if(d.appliesTo==='sale')     return i.badge==='sale';
      return i.category===d.appliesTo || i.platform?.toLowerCase()===d.appliesTo;
    });
    const eligibleSub = eligible.reduce((s,x)=>s+x.price,0);
    if(!eligibleSub) return 0;
    return d.type==='percent'?Math.round(eligibleSub*d.value/100):Math.min(d.value,eligibleSub);
  }
  return d.type==='percent'?Math.round(sub*d.value/100):Math.min(d.value,sub);
}
function addGameToCart(g){
  // Check game expiry
  if(g.expiryDate && new Date(g.expiryDate) < new Date()){
    showToast('❌ This deal has expired!'); return;
  }
  if(!g.stock){showToast('Out of stock!');return;}
  const cart=getCart();
  const l=getLang();
  const gname = l==='ar'?(g.titleAr||g.title): l==='kd'?g.titleKd:g.title;
  cart.push({uid:Date.now(),gameId:g.id,name:gname,platform:g.platform,price:g.price,icon:g.icon,type:'game',category:g.category});
  saveCart(cart); updateCartBadge(true);
  showToast(gname+' added!');
}
function addSubToCart(s,label,price){
  const cart=getCart();
  const _l=getLang();
  const _sname=_l==='ar'?(s.nameAr||s.name):_l==='kd'?s.nameKd:s.name;
  cart.push({uid:Date.now(),subId:s.id,name:_sname+' — '+label,platform:'Subscription',price,icon:s.icon,type:'sub'});
  saveCart(cart); updateCartBadge(true);
  showToast('Subscription added!');
}
function removeFromCart(uid){
  saveCart(getCart().filter(x=>x.uid!==uid));
  updateCartBadge(); renderCartItems();
}
function renderCartItems(){
  const cart=getCart();
  const el=document.getElementById('cartItems');
  const ft=document.getElementById('cartFt');
  if(!el) return;
  if(!cart.length){
    el.innerHTML='<div class="cart-empty"><div style="font-size:2.5rem">🎮</div><p>Cart is empty</p></div>';
    if(ft) ft.style.display='none'; return;
  }
  el.innerHTML=cart.map(i=>`
    <div class="cart-item">
      <div class="ci-icon">${i.icon}</div>
      <div class="ci-info"><div class="ci-name">${i.name}</div><div class="ci-plat">${i.platform}</div></div>
      <div class="ci-price">${iqd(i.price)}</div>
      <button class="ci-rm" onclick="removeFromCart(${i.uid})">✕</button>
    </div>`).join('');
  const sub=cart.reduce((s,x)=>s+x.price,0);
  const disc=calcDisc(sub,cart);
  const dl=document.getElementById('cartDiscLine');
  const da=document.getElementById('cartDiscAmt');
  if(dl&&da){if(disc>0){dl.style.display='flex';da.textContent='-'+iqd(disc);}else dl.style.display='none';}
  const tp=document.getElementById('cartTotalPrice');
  if(tp) tp.textContent=iqd(sub-disc);
  if(ft) ft.style.display='block';
}
function openCart(){
  const sidebar  = document.getElementById('cartSidebar');
  const overlay  = document.getElementById('cartOverlay');
  if(!sidebar || !overlay) return;
  const isAr = getLang()==='ar';
  if(isAr) sidebar.classList.add('cart-rtl');
  else     sidebar.classList.remove('cart-rtl');
  overlay.classList.add('open');
  sidebar.classList.add('open');
  renderCartItems();
}
function closeCart(){
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  if(overlay) overlay.classList.remove('open');
  if(sidebar) sidebar.classList.remove('open');
}
async function applyCartDisc(){
  const code=document.getElementById('cartDiscInput').value.trim().toUpperCase();
  const msg=document.getElementById('discMsg');
  const codes=await window._KS_DB.getCodes();
  const c=codes[code];
  if(c){ saveAppliedDisc({code,...c}); if(msg){msg.textContent='✅ '+c.desc;msg.className='disc-msg ok';} renderCartItems(); }
  else { if(msg){msg.textContent='❌ Invalid code';msg.className='disc-msg err';} }
}
let _selMethod=null;
function openCheckout(){
  const cart=getCart();
  if(!cart.length){showToast('Cart is empty!');return;}
  closeCart();
  document.getElementById('orderItems').innerHTML=cart.map(i=>`<div class="order-item"><span>${i.icon} ${i.name}</span><span>${iqd(i.price)}</span></div>`).join('');
  const sub=cart.reduce((s,x)=>s+x.price,0);
  document.getElementById('orderTotal').textContent=iqd(sub-calcDisc(sub,cart));
  _selMethod=null; _screenshotDone=false; _screenshotData=null; _verifyCode=null; _emailVerified=false;
  document.querySelectorAll('.pay-method').forEach(m=>m.classList.remove('sel'));
  document.querySelectorAll('.pm-check').forEach(c=>c.textContent='');
  const si=document.getElementById('screenshotInput'); if(si) si.value='';
  const vi=document.getElementById('verifyCodeInput'); if(vi) vi.value='';
  const vw=document.getElementById('verifyCodeWrap'); if(vw) vw.style.display='none';
  const vb=document.getElementById('emailVerifiedBadge'); if(vb) vb.style.display='none';
  const sb=document.getElementById('sendCodeBtn'); if(sb){sb.style.display='inline-flex';sb.textContent='📧 Send Code';}
  goStep(1);
  document.getElementById('checkoutModal').classList.add('open');
}
function closeCheckout(){ document.getElementById('checkoutModal').classList.remove('open'); }
function selMethod(id){
  _selMethod=id;
  document.querySelectorAll('.pay-method').forEach(m=>m.classList.remove('sel'));
  document.querySelectorAll('.pm-check').forEach(c=>c.textContent='');
  document.getElementById('pm-'+id).classList.add('sel');
  document.getElementById('pmc-'+id).textContent='✓';
}
function goStep(n){
  if(n===2&&!_selMethod){showToast('Please choose a payment method!');return;}
  if(n===2){
    const m=PAYMENT_METHODS.find(x=>x.id===_selMethod);
    document.getElementById('pdbMethod').textContent=m.icon+' '+m.name;
    document.getElementById('pdbNum').textContent=m.number;
    document.getElementById('instrMethod').textContent=m.name;
    document.getElementById('instrMethodKd').textContent=m.nameKd;
    const cart2=getCart();
    const sub=cart2.reduce((s,x)=>s+x.price,0);
    document.getElementById('instrAmt').textContent=iqd(sub-calcDisc(sub,cart2));
  }
  document.querySelectorAll('.step-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('sp'+n).classList.add('active');
  document.querySelectorAll('.mstep').forEach((s,i)=>s.classList.toggle('active',i+1===n||(n===4&&i<3)));
  const titles={1:'Complete Order',2:'Send Payment',3:'Your Details'};
  if(n<=3) document.getElementById('modalTitle').textContent=titles[n];
}
function copyPayNum(){ navigator.clipboard.writeText(document.getElementById('pdbNum').textContent).then(()=>showToast('✅ Copied!')); }
// ── EMAIL VERIFICATION ──
async function sendVerifyCode(){
  const email = document.getElementById('custEmail').value.trim();
  if(!email || !email.includes('@') || !email.includes('.')){
    showToast('⚠️ Enter a valid email first!'); return;
  }
  _verifyCode = String(Math.floor(1000 + Math.random()*9000));
  _emailVerified = false;

  // Show code input immediately
  const vw = document.getElementById('verifyCodeWrap');
  const sb = document.getElementById('sendCodeBtn');
  if(vw) vw.style.display='block';
  if(sb){ sb.textContent='🔄 Resend Code'; sb.disabled=true; }

  // Try EmailJS if configured
  let sent = false;
  try{
    const s = await window._KS_DB.getSettings();
    if(s.emailKey && s.emailService && s.emailTemplate){
      if(!window.emailjs){
        await new Promise((res,rej)=>{
          const sc=document.createElement('script');
          sc.src='https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
          sc.onload=res; sc.onerror=rej;
          document.head.appendChild(sc);
        });
      }
      window.emailjs.init(s.emailKey);
      await window.emailjs.send(s.emailService, s.emailTemplate, {
        to_email: email,
        customer_name: document.getElementById('custName')?.value||'Customer',
        order_items: 'Your verification code: ' + _verifyCode,
        order_total: '—',
        payment_method: '—',
        store_name: s.storeName||'Kurd Store',
        telegram: '@'+(s.telegram||'sharafaani')
      });
      sent = true;
      showToast('📧 Code sent to ' + email + '!');
    }
  } catch(e){ console.log('EmailJS error:', e); }

  // If EmailJS not configured or failed — show code on screen
  if(!sent){
    const codeDisplay = document.getElementById('verifyCodeDisplay');
    if(codeDisplay){
      codeDisplay.textContent = _verifyCode;
      codeDisplay.parentElement.style.display='block';
    }
    showToast('🔑 Your code is shown below (EmailJS not configured)');
  }

  if(sb) sb.disabled=false;
}

function checkVerifyCode(){
  const entered = document.getElementById('verifyCodeInput')?.value.trim();
  if(!entered){ showToast('⚠️ Enter the 4-digit code!'); return; }
  if(entered === _verifyCode){
    _emailVerified = true;
    const vw = document.getElementById('verifyCodeWrap');
    const badge = document.getElementById('emailVerifiedBadge');
    const sb = document.getElementById('sendCodeBtn');
    const cd = document.getElementById('codeDisplayWrap');
    if(vw) vw.style.display='none';
    if(badge) badge.style.display='flex';
    if(sb) sb.style.display='none';
    if(cd) cd.style.display='none';
    showToast('✅ Email verified!');
  } else {
    showToast('❌ Wrong code! Try again.');
    if(document.getElementById('verifyCodeInput')) document.getElementById('verifyCodeInput').value='';
  }
}

async function submitOrder(){
  const name=document.getElementById('custName').value.trim();
  const email=document.getElementById('custEmail').value.trim();
  if(!name){showToast('⚠️ Please enter your name!');return;}
  if(!email||!email.includes('@')||!email.includes('.')){showToast('⚠️ Please enter a valid email!');return;}
  if(!_screenshotDone){showToast('⚠️ Please upload your payment screenshot!');goStep(3);return;}
  if(!_emailVerified){showToast('⚠️ Please verify your email with the code!');return;}
  const cart=getCart();
  const sub=cart.reduce((s,x)=>s+x.price,0);
  const disc=calcDisc(sub,cart);
  const total=sub-disc;
  const d=getAppliedDisc();
  const method=_selMethod?PAYMENT_METHODS.find(x=>x.id===_selMethod)?.name:'';
  const items=cart.map(i=>i.name).join(', ');
  try{ await window._KS_DB.saveOrder({name,email,items,total,method,discount:d?.code||'',date:new Date().toISOString(),status:'pending',screenshot:_screenshotData||null}); }catch(e){}
  const hist=JSON.parse(localStorage.getItem('ks_history')||'[]');
  hist.unshift({id:Date.now(),items:[...cart],total,method,name,date:new Date().toLocaleDateString(),status:'pending'});
  localStorage.setItem('ks_history',JSON.stringify(hist));
  const s=await window._KS_DB.getSettings();
  const msg=encodeURIComponent(`🛒 New Order — Kurd Store!\n\nName: ${name}\nEmail: ${email}\nItems: ${items}\nTotal: ${iqd(total)}\nPaid via: ${method}${d?'\nDiscount: '+d.code:''}`);
  window.open(`https://t.me/${s.telegram||'sharafaani'}?text=${msg}`,'_blank');
  saveCart([]); saveAppliedDisc(null); updateCartBadge();

  // Fire bot notification + confirmation email in background
  const orderPayload = {name,email,items,total:iqd(total),method,discount:d?.code||'',date:new Date().toISOString()};
  if(typeof sendBotNotification === 'function')    sendBotNotification(orderPayload).catch(()=>{});
  if(typeof sendConfirmationEmail === 'function')  sendConfirmationEmail({...orderPayload,email}).catch(()=>{});

  // Google Analytics event
  if(typeof gtag === 'function'){
    gtag('event','purchase',{value:total,currency:'IQD',items:items});
  }

  // Award loyalty points + spins BEFORE showing success
  await awardLoyaltyAndSpins(name, email, total);

  goStep(4);
  document.getElementById('modalTitle').textContent='🎉 Almost Done!';
  // Init wheel
  await initSpinWheel(email);
}

// ══════════════════════════════════════
//  LOYALTY POINTS SYSTEM
// ══════════════════════════════════════
async function awardLoyaltyAndSpins(name, email, total){
  if(!window._KS_DB) return;
  try{
    const key = email.toLowerCase().replace(/[.#$[\]]/g,'_');
    const [loySettings, vipSettings, vipMember, existingProfile] = await Promise.all([
      window._KS_DB.getLoyaltySettings(),
      window._KS_DB.getVIPSettings(),
      window._KS_DB.getVIPMember(key),
      window._KS_DB.getLoyalty(key)
    ]);

    const isVIP = vipMember && vipMember.active && (!vipMember.expiryDate || new Date(vipMember.expiryDate) > new Date());
    const pointsPer = loySettings.pointsPer || 10000;
    const basePoints = Math.floor(total / pointsPer);
    const bonusPoints = isVIP ? (vipSettings.pointsBonus || 1) : 0;
    const pointsEarned = Math.max(1, basePoints) + bonusPoints;

    const profile = existingProfile || {name, email, points:0, orders:0, totalSpent:0, referralCode: name.split(' ')[0].toUpperCase() + Math.floor(Math.random()*90+10)};
    profile.name = name;
    profile.email = email;
    profile.points = (profile.points||0) + pointsEarned;
    profile.orders = (profile.orders||0) + 1;
    profile.totalSpent = (profile.totalSpent||0) + total;
    profile.lastOrder = new Date().toISOString();

    // Spins: 1 base + 1 extra if VIP
    const spinsToAward = isVIP ? 2 : 1;
    profile.spinsAvailable = (profile.spinsAvailable||0) + spinsToAward;

    await window._KS_DB.saveLoyalty(key, profile);

    // Check referral — if this customer came via ref= link, award referrer
    const refCode = localStorage.getItem('ks_ref');
    if(refCode && refCode !== profile.referralCode){
      const refData = await window._KS_DB.getReferral(refCode);
      if(refData){
        const refSettings = await window._KS_DB.getReferralSettings();
        const refKey = refData.email.toLowerCase().replace(/[.#$[\]]/g,'_');
        const refProfile = await window._KS_DB.getLoyalty(refKey);
        if(refProfile){
          // Award referrer
          if(refSettings.referrerType === 'percent'){
            refProfile.points = (refProfile.points||0) + Math.floor(total/10000);
          }
          refProfile.referralEarned = (refProfile.referralEarned||0) + (refSettings.referrerValue||15000);
          await window._KS_DB.saveLoyalty(refKey, refProfile);
        }
        // Update referral count
        refData.uses = (refData.uses||0) + 1;
        await window._KS_DB.saveReferral(refCode, refData);
        localStorage.removeItem('ks_ref');
      }
    }

    // Store for display
    window._lastLoyalty = {profile, loySettings, vipSettings, isVIP, pointsEarned, spinsToAward};
  }catch(e){ console.log('Loyalty error:', e); }
}

// ══════════════════════════════════════
//  SPIN WHEEL
// ══════════════════════════════════════
let _spinData = null;
let _spinsRemaining = 0;
let _spinning = false;

async function initSpinWheel(email){
  if(!window._KS_DB) return;
  try{
    const spinSettings = await window._KS_DB.getSpinSettings();
    _spinData = spinSettings.prizes || [];
    const key = email.toLowerCase().replace(/[.#$[\]]/g,'_');
    const profile = await window._KS_DB.getLoyalty(key);
    _spinsRemaining = profile?.spinsAvailable || 1;

    document.getElementById('spinSection').style.display='block';
    document.getElementById('successSection').style.display='none';
    document.getElementById('spinsLeftBadge').textContent = _spinsRemaining + ' spin' + (_spinsRemaining!==1?'s':'') + ' remaining';

    drawWheel();

    // Show loyalty info for success page
    if(window._lastLoyalty){
      const {profile:lp, loySettings, isVIP, pointsEarned} = window._lastLoyalty;
      const tiers = loySettings.tiers||[];
      let tier = tiers[0];
      for(const t of tiers){ if((lp.points||0) >= t.min) tier = t; }
      const nextTier = tiers.find(t=>t.min > (lp.points||0));
      const cardLink = document.getElementById('cardLinkBtn');
      if(cardLink) cardLink.href = 'card.html?email='+encodeURIComponent(email);
      document.getElementById('loyaltyInfoText').innerHTML =
        `+${pointsEarned} point${pointsEarned!==1?'s':''} earned! ${isVIP?'👑 VIP bonus included!':''}<br>` +
        `Total: <strong>${lp.points} pts</strong> — ${tier.icon} ${tier.name}` +
        (nextTier ? `<br>Need <strong>${nextTier.min - lp.points} more</strong> to reach ${nextTier.icon} ${nextTier.name}` : '<br>🏆 Maximum tier!');
      document.getElementById('loyaltyInfo').style.display='block';

      // Referral link
      if(lp.referralCode){
        const base = window.location.origin + window.location.pathname.replace(/[^\/]*$/, '');
        const refLink = base + 'index.html?ref=' + lp.referralCode;
        const inputEl = document.getElementById('referralLinkInput');
        if(inputEl) inputEl.value = refLink;
        const refTg = document.getElementById('refTgShare');
        const refWa = document.getElementById('refWaShare');
        if(refTg) refTg.href = 'https://t.me/share/url?url='+encodeURIComponent(refLink)+'&text='+encodeURIComponent('🎮 Shop on Kurd Store and get a discount with my link!');
        if(refWa) refWa.href = 'https://wa.me/?text='+encodeURIComponent('🎮 Shop on Kurd Store! Use my link for a discount: '+refLink);
        document.getElementById('referralInfo').style.display='block';

        // Save referral to Firebase
        await window._KS_DB.saveReferral(lp.referralCode, {email, name:lp.name, uses:lp.uses||0});
      }
    }
  }catch(e){ console.log('Spin init error:', e); showSuccess(); }
}

function drawWheel(highlightIndex=-1){
  const canvas = document.getElementById('wheelCanvas');
  if(!canvas || !_spinData.length) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width/2, cy = canvas.height/2, r = cx-6;
  const slices = _spinData.length;
  const arc = (Math.PI*2)/slices;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  _spinData.forEach((p,i)=>{
    const start = arc*i - Math.PI/2;
    const end = start + arc;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,start,end);
    ctx.closePath();
    ctx.fillStyle = i===highlightIndex ? '#fff' : (p.color||'#7c3aed');
    ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
    // Text
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(start+arc/2);
    ctx.textAlign='right'; ctx.fillStyle = i===highlightIndex?p.color:'#fff';
    ctx.font='bold '+(p.label.length>8?'9':'11')+'px sans-serif';
    ctx.fillText(p.label, r-8, 4);
    ctx.restore();
  });
}

function doSpin(){
  if(_spinning || _spinsRemaining<=0) return;
  _spinning=true;
  document.getElementById('spinBtn').disabled=true;
  document.getElementById('spinPrizeResult').style.display='none';

  // Determine prize by chance
  const total = _spinData.reduce((s,p)=>s+(p.chance||0),0);
  let rand = Math.random()*total, prizeIdx=0;
  for(let i=0;i<_spinData.length;i++){ rand-=(_spinData[i].chance||0); if(rand<=0){prizeIdx=i;break;} }

  // Animate wheel
  const slices = _spinData.length;
  const arc = 360/slices;
  const targetAngle = 360*5 + (360 - prizeIdx*arc - arc/2) + Math.random()*20-10;
  let current=0, speed=15, decelRate=0.97;
  const canvas=document.getElementById('wheelCanvas');
  const ctx=canvas.getContext('2d');
  const cx=canvas.width/2, cy=canvas.height/2, r=cx-6;
  let totalAngle=0;

  function animate(){
    totalAngle+=speed; speed*=decelRate;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(totalAngle*Math.PI/180); ctx.translate(-cx,-cy);
    drawWheel(); ctx.restore();
    if(speed>0.3){ requestAnimationFrame(animate); }
    else{
      _spinning=false; _spinsRemaining--;
      document.getElementById('spinsLeftBadge').textContent = _spinsRemaining + ' spin' + (_spinsRemaining!==1?'s':'') + ' remaining';
      showPrize(prizeIdx);
      if(_spinsRemaining>0){
        document.getElementById('spinBtn').disabled=false;
        document.getElementById('spinBtn').textContent='🎰 Spin Again! ('+_spinsRemaining+' left)';
      } else {
        document.getElementById('spinBtn').style.display='none';
        setTimeout(showSuccess, 2500);
      }
    }
  }
  animate();
}

async function showPrize(idx){
  const prize = _spinData[idx];
  const prizeEl = document.getElementById('spinPrizeResult');
  const prizeText = document.getElementById('spinPrizeText');
  const prizeCode = document.getElementById('spinPrizeCode');

  if(prize.type==='none'){
    prizeText.textContent='😢 Better luck next time!';
    prizeCode.textContent="You'll win next purchase!";
  } else {
    prizeText.textContent='🎉 You won: '+prize.label+'!';
    const code='SPIN'+Math.random().toString(36).substr(2,6).toUpperCase();
    prizeCode.textContent='Your code: '+code+' (check your email)';
    // Save prize to Firebase
    if(window._KS_DB && window._lastLoyalty){
      const key=window._lastLoyalty.profile.email.toLowerCase().replace(/[.#$[\]]/g,'_');
      await window._KS_DB.saveSpinResult(key, {prize:prize.label, code, date:new Date().toISOString()});
      // Save code so customer can use it
      const codes = await window._KS_DB.getCodes();
      codes[code] = {type:prize.type==='percent'?'percent':'fixed', value:prize.value, desc:prize.label+' — Spin Win!', appliesTo:'all', expiry: new Date(Date.now()+30*24*60*60*1000).toISOString().split('T')[0]};
      await window._KS_DB.saveCodes(codes);
      // Deduct spin
      window._lastLoyalty.profile.spinsAvailable = _spinsRemaining;
      await window._KS_DB.saveLoyalty(key, window._lastLoyalty.profile);
    }
  }
  prizeEl.style.display='block';
}

function showSuccess(){
  document.getElementById('spinSection').style.display='none';
  document.getElementById('successSection').style.display='block';
  document.getElementById('modalTitle').textContent='🎉 Order Sent!';
}

function copyReferralLink(){
  const v = document.getElementById('referralLinkInput').value;
  navigator.clipboard.writeText(v).then(()=>showToast('✅ Referral link copied!'));
}

function gameCardHTML(g){
  const l=getLang();
  const now=new Date();
  const isExpired = g.expiryDate && new Date(g.expiryDate)<now;
  const isOos = !g.stock || isExpired;
  // Sale timer
  let timerHTML='';
  if(g.expiryDate && !isExpired && g.stock){
    const diff = new Date(g.expiryDate)-now;
    const days = Math.floor(diff/(1000*60*60*24));
    const hrs  = Math.floor((diff%(1000*60*60*24))/(1000*60*60));
    const mins = Math.floor((diff%(1000*60*60))/(1000*60));
    if(days<3){
      timerHTML=`<div class="sale-timer" data-expiry="${g.expiryDate}">⏰ ${days>0?days+'d ':''}${hrs}h ${mins}m</div>`;
    }
  }
  return `<div class="pcard${isOos?' oos':''}" onclick="window.location.href='product.html?id=${g.id}'" style="cursor:pointer;">
    ${g.badge&&g.stock&&!isExpired?`<div class="pcard-badges"><span class="pbadge pb-${g.badge}">${g.badge==='sale'?'SALE':'NEW'}</span></div>`:''}
    ${isOos?'<div class="pcard-oos-overlay"><span>OUT OF STOCK</span></div>':''}
    ${timerHTML}
    <div class="pcard-img">
      <img src="${g.img||''}" alt="${g.title}" loading="lazy" onerror="this.style.display='none'"/>
      <span class="femoji">${g.icon}</span>
    </div>
    <div class="pcard-body">
      <div class="pcard-plat">${g.platform}</div>
      <div class="pcard-title">${l==='ar'?(g.titleAr||g.title):l==='kd'?g.titleKd:g.title}</div>
      <div class="pcard-footer">
        <div>
          ${g.variants&&g.variants.length
            ? `<span style="font-size:.7rem;color:var(--gray);font-weight:600;">From</span> <span class="pcard-price">${iqd(Math.min(...g.variants.map(v=>v.price)))}</span>`
            : `<span class="pcard-price">${iqd(g.price)}</span>${g.oldPrice?`<span class="pcard-old">${iqd(g.oldPrice)}</span>`:''}`
          }
        </div>
        ${g.stock?(g.variants&&g.variants.length?`<span class="add-btn" style="background:var(--p);color:#fff;font-size:.55rem;padding:0 5px;width:auto;border-radius:7px;white-space:nowrap;">Choose</span>`:`<button class="add-btn" onclick='event.stopPropagation();addGameToCart(${JSON.stringify(g)})'>+</button>`):'<span class="oos-tag">Unavailable</span>'}
      </div>
    </div>
  </div>`;
}
function subCardHTML(s){
  const l=getLang();
  return `<div class="sub-card ${s.cls||'purple'}">
    <div class="sub-icon">${s.icon}</div>
    <div class="sub-name">${l==='ar'?(s.nameAr||s.name):l==='kd'?s.nameKd:s.name}</div>
    <div class="sub-name-kd">${l==='ar'?s.name:l==='kd'?s.name:s.nameKd}</div>
    <div class="sub-desc">${s.desc}</div>
    <div class="sub-opts">${s.options.map(o=>`<div class="sub-opt" onclick='addSubToCart(${JSON.stringify(s)},"${o.label}",${o.price})'><span class="sub-opt-label">${o.label}</span><span class="sub-opt-price">${iqd(o.price)}</span></div>`).join('')}</div>
  </div>`;
}
async function buildNav(activePage){
  // STEP 1: Render nav immediately with defaults (no Firebase needed)
  let s=Object.assign({},DEFAULT_SETTINGS);
  renderNav(activePage,s);
  // STEP 2: Load real settings and re-render if available
  try{
    if(window._KS_DB){
      const loaded=await window._KS_DB.getSettings();
      if(loaded){ s=Object.assign({},DEFAULT_SETTINGS,loaded); renderNav(activePage,s); }
    }
  }catch(e){}
}
function renderNav(activePage,s){
  const logoHTML=s.logoImg?`<img src="${s.logoImg}" style="width:36px;height:36px;border-radius:10px;object-fit:cover;" alt="logo"/>`:`<div class="site-logo-emoji">${s.logoEmoji||'🎮'}</div>`;
  document.getElementById('navMount').innerHTML=`
  <nav class="topnav">
    <a class="nav-logo" href="index.html">${logoHTML}<span>${getLang()==='ar'?(s.storeNameAr||s.storeName||'Kurd Store'):getLang()==='kd'?(s.storeNameKd||s.storeName||'Kurd Store'):(s.storeName||'Kurd Store')}</span></a>
    <ul class="navlinks">
      <li><a href="index.html" ${activePage==='home'?'class="active"':''}>🏠 Home</a></li>
      <li><a href="playstation.html" ${activePage==='ps'?'class="active"':''}>🎮 PlayStation</a></li>
      <li><a href="xbox.html" ${activePage==='xbox'?'class="active"':''}>🟢 Xbox</a></li>
      <li><a href="pc.html" ${activePage==='pc'?'class="active"':''}>💻 PC/Steam</a></li>
      <li><a href="nintendo.html" ${activePage==='nintendo'?'class="active"':''}>🔴 Nintendo</a></li>
      <li><a href="subscriptions.html" ${activePage==='subs'?'class="active"':''}>📦 Subscriptions</a></li>
      <li><a href="discounts.html" ${activePage==='discounts'?'class="active"':''}>🏷️ Discounts</a></li>
      <li><a href="vip.html" style="background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#1a0533;border-radius:99px;padding:4px 14px;font-weight:700;font-size:.82rem;">👑 VIP</a></li>
    </ul>
    <div class="nav-right">
      <button class="nav-icon-btn" id="darkBtn" onclick="toggleTheme()">${getTheme()==='dark'?'☀️':'🌙'}</button>
      <button class="nav-icon-btn" id="langBtn" onclick="toggleLang()">${getLang()==='en'?'🌐 عربي/کوردی':getLang()==='kd'?'🌐 العربية/EN':'🌐 English/KD'}</button>
      <a href="card.html" style="display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1a0533;border-radius:99px;padding:6px 13px;font-size:.78rem;font-weight:700;text-decoration:none;white-space:nowrap;">🏆 My Card</a>
      <button class="cart-btn" onclick="openCart()">🛒 ${getLang()==='ar'?'السلة':getLang()==='kd'?'سەبەتە':'Cart'} <span class="cart-count">0</span></button>
    </div>
  </nav>`;
  updateCartBadge();
  // Google Analytics — load if configured
  (async ()=>{
    try{
      const s = await window._KS_DB.getSettings();
      if(s.gaId && !document.getElementById('gaScript')){
        const s1=document.createElement('script');
        s1.id='gaScript';
        s1.async=true;
        s1.src=`https://www.googletagmanager.com/gtag/js?id=${s.gaId}`;
        document.head.appendChild(s1);
        const s2=document.createElement('script');
        s2.textContent=`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${s.gaId}');`;
        document.head.appendChild(s2);
      }
    }catch(e){}
  })();

  // Inject mobile nav (once only)
  const mobileNavId = 'mobileNavEl';
  if(!document.getElementById(mobileNavId)){
    const mobileNav = document.createElement('div');
    mobileNav.id = mobileNavId;
    mobileNav.className = 'mobile-nav';
    const _ml = getLang();
    mobileNav.innerHTML = `
      <a href="index.html">🏠 ${_ml==='ar'?'الرئيسية':_ml==='kd'?'ماڵەوە':'Home'}</a>
      <a href="playstation.html">🎮 PlayStation</a>
      <a href="xbox.html">🟢 Xbox</a>
      <a href="pc.html">💻 PC/Steam</a>
      <a href="nintendo.html">🔴 Nintendo</a>
      <a href="subscriptions.html">📦 ${_ml==='ar'?'الاشتراكات':_ml==='kd'?'ئەبوونەمەندی':'Subscriptions'}</a>
      <a href="discounts.html">🏷️ ${_ml==='ar'?'العروض':_ml==='kd'?'داشکاندن':'Discounts'}</a>
      <a href="vip.html" style="background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#1a0533;font-weight:700;border-radius:10px;text-align:center;">👑 VIP Club</a>`;
    document.body.insertBefore(mobileNav, document.body.firstChild.nextSibling);
    // Mark active
    document.querySelectorAll('#'+mobileNavId+' a').forEach(a=>{
      if(window.location.href.includes(a.getAttribute('href').replace('./',''))){
        a.classList.add('active');
      }
    });
  }
  // Add hamburger to nav (once only)
  const navRight = document.querySelector('.nav-right');
  if(navRight && !document.getElementById('hamburgerBtn')){
    const hbtn = document.createElement('button');
    hbtn.className = 'hamburger'; hbtn.id = 'hamburgerBtn';
    hbtn.innerHTML = '<span></span><span></span><span></span>';
    hbtn.onclick = function(){
      this.classList.toggle('open');
      document.getElementById(mobileNavId).classList.toggle('open');
    };
    navRight.insertBefore(hbtn, navRight.firstChild);
  }

  // Auto-apply referral code from URL
  checkReferralCode();

  if(document.getElementById('payMethodsEl')){
    document.getElementById('payMethodsEl').innerHTML=PAYMENT_METHODS.map(m=>`
      <div class="pay-method" onclick="selMethod('${m.id}')" id="pm-${m.id}">
        <div class="pm-icon">${m.icon}</div>
        <div><div class="pm-name">${m.name}</div><div class="pm-desc">${m.nameKd}</div></div>
        <div class="pm-check" id="pmc-${m.id}"></div>
      </div>`).join('');
  }
  if(document.getElementById('tgLinkWrap'))
    document.getElementById('tgLinkWrap').innerHTML=`<a class="tg-btn" href="https://t.me/${s.telegram||'sharafaani'}" target="_blank" style="margin-top:12px;">✈️ @${s.telegram||'sharafaani'}</a>`;
  if(document.getElementById('tgFollowWrap'))
    document.getElementById('tgFollowWrap').innerHTML=`<a class="tg-btn" href="https://t.me/${s.telegram||'sharafaani'}" target="_blank">✈️ Follow up</a>`;
  if(document.getElementById('footerMount')){
    const fe=s.logoImg?`<img src="${s.logoImg}" style="width:30px;height:30px;border-radius:8px;object-fit:cover;"/>`:`<div class="fe">${s.logoEmoji||'🎮'}</div>`;
    document.getElementById('footerMount').innerHTML=`
    <footer>
      <div class="footer-grid">
        <div><div class="footer-logo">${fe}<span>${s.storeName||'Kurd Store'}</span></div><div class="footer-desc">${s.tagline||'Your Kurdish Gaming Store'}</div></div>
        <div class="footer-col"><h4>${getLang()==='ar'?'الصفحات':getLang()==='kd'?'پەڕەکان':'Pages'}</h4><ul>
          <li><a href="index.html">🏠 ${getLang()==='ar'?'الرئيسية':getLang()==='kd'?'ماڵەوە':'Home'}</a></li>
          <li><a href="playstation.html">🎮 PlayStation</a></li>
          <li><a href="xbox.html">🟢 Xbox</a></li>
          <li><a href="pc.html">💻 PC/Steam</a></li>
          <li><a href="nintendo.html">🔴 Nintendo</a></li>
          <li><a href="subscriptions.html">📦 ${getLang()==='ar'?'الاشتراكات':getLang()==='kd'?'ئەبوونەمەندی':'Subscriptions'}</a></li>
          <li><a href="discounts.html">🏷️ ${getLang()==='ar'?'العروض':getLang()==='kd'?'داشکاندن':'Discounts'}</a></li>
        </ul></div>
        <div class="footer-col"><h4>${getLang()==='ar'?'تواصل معنا':getLang()==='kd'?'پەیوەندی':'Contact'}</h4><ul>
          <li><a href="https://t.me/${s.telegram||'sharafaani'}" target="_blank">✈️ @${s.telegram||'sharafaani'}</a></li>
        </ul></div>
      </div>
      <div class="footer-bottom"><span>© 2024 ${s.storeName||'Kurd Store'}.</span><span>${getLang()==='ar'?'صُنع بـ ❤️ للاعبين العراقيين':getLang()==='kd'?'بە ❤️ بۆ یاریزانانی کوردستان':'Made with ❤️ for Kurdish gamers'}</span></div>
    </footer>`;
  }
} // end renderNav

// ── AUTO EXPIRE GAMES ──
function autoExpireGames(games){
  const now = new Date();
  return games.map(g=>{
    if(g.expiryDate && new Date(g.expiryDate) < now && g.stock){
      return {...g, stock:false, badge:null};
    }
    return g;
  });
}

// ── SCREENSHOT PREVIEW ──
function previewScreenshot(input){
  if(!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = function(e){
    const prev = document.getElementById('screenshotPreview');
    const plch = document.getElementById('screenshotPlaceholder');
    const img  = document.getElementById('screenshotImg');
    if(prev && plch && img){
      img.src = e.target.result;
      prev.style.display = 'block';
      plch.style.display = 'none';
    }
  };
  reader.readAsDataURL(input.files[0]);
}

// ── OUT OF STOCK NOTIFICATION ──
function notifyMe(gameId, gameTitle){
  const email = prompt('Enter your email to be notified when "'+gameTitle+'" is back in stock:');
  if(!email || !email.includes('@')){ if(email!==null) showToast('⚠️ Please enter a valid email!'); return; }
  // Save to Firebase
  if(window._KS_DB){
    window._KS_DB.saveNotification({gameId, gameTitle, email, date:new Date().toISOString()}).then(()=>{
      showToast('✅ We will notify you at '+email+' when available!');
    }).catch(()=>{
      // Fallback - save to localStorage
      const notifs = JSON.parse(localStorage.getItem('ks_notifs')||'[]');
      notifs.push({gameId,gameTitle,email,date:new Date().toISOString()});
      localStorage.setItem('ks_notifs',JSON.stringify(notifs));
      showToast('✅ We will notify you at '+email+'!');
    });
  }
}

// ── PAGE LOADER ──
function showLoader(emoji){
  if(document.getElementById('pageLoader')) return;
  const el = document.createElement('div');
  el.id = 'pageLoader'; el.className = 'page-loader';
  el.innerHTML = `<div class="loader-logo">${emoji||'🎮'}</div><div class="loader-ring"></div><div class="loader-text">Loading<span class="loader-dots"></span></div>`;
  document.body.appendChild(el);
}
function hideLoader(){
  const el = document.getElementById('pageLoader');
  if(el){ el.classList.add('hidden'); setTimeout(()=>el.remove(), 500); }
}

// ── REFERRAL CODE AUTO-APPLY ──
async function checkReferralCode(){
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if(!ref) return;
  if(!window._KS_DB) return;
  // Save ref code for loyalty tracking
  localStorage.setItem('ks_ref', ref.toUpperCase());
  try{
    const codes = await window._KS_DB.getCodes();
    const code = ref.toUpperCase();
    const c = codes[code];
    if(c){
      if(c.expiry && new Date(c.expiry) < new Date()) return;
      localStorage.setItem('ks_disc', JSON.stringify({code,...c}));
      showToast('🎉 Referral discount "'+code+'" applied! '+c.desc);
      return;
    }
    // Check referral system codes
    const refSettings = await window._KS_DB.getReferralSettings();
    const refData = await window._KS_DB.getReferral(ref);
    if(refData && refSettings.newCustDiscount){
      const discCode = 'REF-'+ref+'-'+refSettings.newCustDiscount;
      localStorage.setItem('ks_disc', JSON.stringify({code:discCode,type:'percent',value:refSettings.newCustDiscount,desc:refSettings.newCustDiscount+'% off — Welcome gift!',appliesTo:'all'}));
      showToast('🎉 '+refSettings.newCustDiscount+'% welcome discount applied!');
    }
  }catch(e){}
}

// ── BACK TO TOP ──
function initBackToTop(){
  const btn = document.createElement('button');
  btn.className = 'back-to-top'; btn.innerHTML = '↑'; btn.title = 'Back to top';
  btn.onclick = ()=>window.scrollTo({top:0,behavior:'smooth'});
  document.body.appendChild(btn);
  window.addEventListener('scroll',()=>{
    btn.classList.toggle('visible', window.scrollY > 400);
  });
}

// ── KEY FIX: Poll for _KS_DB instead of relying on events ──
function waitForDB(callback){
  const needsLoader = !window._KS_DB_READY;
  if(needsLoader) showLoader('🎮');
  let done = false;
  function run(){
    if(done) return; done=true;
    if(needsLoader) hideLoader();
    callback();
  }
  // Already ready?
  if(window._KS_DB_READY){ run(); return; }
  // Listen for the event (in case it fires after this runs)
  window.addEventListener('ks_db_ready', run, {once:true});
  // Poll as final fallback
  let tries=0;
  const iv=setInterval(()=>{
    tries++;
    if(window._KS_DB_READY){ clearInterval(iv); run(); }
    else if(tries>80){ clearInterval(iv); run(); }
  },100);
}
