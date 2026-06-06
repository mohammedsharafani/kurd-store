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
function toggleLang(){ const n=getLang()==='en'?'kd':'en'; localStorage.setItem('ks_lang',n); applyLang(); }
function applyLang(){
  const l=getLang();
  document.querySelectorAll('[data-en]').forEach(el=>el.textContent=l==='en'?el.dataset.en:el.dataset.kd);
  const b=document.getElementById('langBtn');
  if(b) b.textContent=l==='en'?'🌐 کوردی':'🌐 English';
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
  cart.push({uid:Date.now(),gameId:g.id,name:getLang()==='en'?g.title:g.titleKd,platform:g.platform,price:g.price,icon:g.icon,type:'game'});
  saveCart(cart); updateCartBadge(true);
  showToast((getLang()==='en'?g.title:g.titleKd)+' added!');
}
function addSubToCart(s,label,price){
  const cart=getCart();
  cart.push({uid:Date.now(),subId:s.id,name:(getLang()==='en'?s.name:s.nameKd)+' — '+label,platform:'Subscription',price,icon:s.icon,type:'sub'});
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
function openCart(){ document.getElementById('cartOverlay').classList.add('open'); document.getElementById('cartSidebar').classList.add('open'); renderCartItems(); }
function closeCart(){ document.getElementById('cartOverlay').classList.remove('open'); document.getElementById('cartSidebar').classList.remove('open'); }
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
  _selMethod=null;
  document.querySelectorAll('.pay-method').forEach(m=>m.classList.remove('sel'));
  document.querySelectorAll('.pm-check').forEach(c=>c.textContent='');
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
async function submitOrder(){
  const name=document.getElementById('custName').value.trim();
  const email=document.getElementById('custEmail').value.trim();
  if(!name||!email){showToast('Please enter name and email!');return;}
  const cart=getCart();
  const sub=cart.reduce((s,x)=>s+x.price,0);
  const disc=calcDisc(sub,cart);
  const total=sub-disc;
  const d=getAppliedDisc();
  const method=_selMethod?PAYMENT_METHODS.find(x=>x.id===_selMethod)?.name:'';
  const items=cart.map(i=>i.name).join(', ');
  try{ await window._KS_DB.saveOrder({name,email,items,total,method,discount:d?.code||'',date:new Date().toISOString(),status:'pending'}); }catch(e){}
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

  goStep(4); document.getElementById('modalTitle').textContent='🎉 Order Sent!';
}
function gameCardHTML(g){
  const l=getLang();
  return `<div class="pcard${g.stock?'':' oos'}" onclick="window.location.href='product.html?id=${g.id}'" style="cursor:pointer;">
    ${g.badge&&g.stock?`<div class="pcard-badges"><span class="pbadge pb-${g.badge}">${g.badge==='sale'?'SALE':'NEW'}</span></div>`:''}
    ${!g.stock?'<div class="pcard-badges"><span class="pbadge pb-oos">OUT OF STOCK</span></div>':''}
    <div class="pcard-img">
      <img src="${g.img||''}" alt="${g.title}" loading="lazy" onerror="this.style.display='none'"/>
      <span class="femoji">${g.icon}</span>
    </div>
    <div class="pcard-body">
      <div class="pcard-plat">${g.platform}</div>
      <div class="pcard-title">${l==='en'?g.title:g.titleKd}</div>
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
    <div class="sub-name">${l==='en'?s.name:s.nameKd}</div>
    <div class="sub-name-kd">${l==='en'?s.nameKd:s.name}</div>
    <div class="sub-desc">${s.desc}</div>
    <div class="sub-opts">${s.options.map(o=>`<div class="sub-opt" onclick='addSubToCart(${JSON.stringify(s)},"${o.label}",${o.price})'><span class="sub-opt-label">${o.label}</span><span class="sub-opt-price">${iqd(o.price)}</span></div>`).join('')}</div>
  </div>`;
}
async function buildNav(activePage){
  const s=await window._KS_DB.getSettings();
  const logoHTML=s.logoImg?`<img src="${s.logoImg}" style="width:36px;height:36px;border-radius:10px;object-fit:cover;" alt="logo"/>`:`<div class="site-logo-emoji">${s.logoEmoji||'🎮'}</div>`;
  document.getElementById('navMount').innerHTML=`
  <nav class="topnav">
    <a class="nav-logo" href="index.html">${logoHTML}<span>${s.storeName||'Kurd Store'}</span></a>
    <ul class="navlinks">
      <li><a href="index.html" ${activePage==='home'?'class="active"':''}>🏠 Home</a></li>
      <li><a href="playstation.html" ${activePage==='ps'?'class="active"':''}>🎮 PlayStation</a></li>
      <li><a href="xbox.html" ${activePage==='xbox'?'class="active"':''}>🟢 Xbox</a></li>
      <li><a href="pc.html" ${activePage==='pc'?'class="active"':''}>💻 PC/Steam</a></li>
      <li><a href="nintendo.html" ${activePage==='nintendo'?'class="active"':''}>🔴 Nintendo</a></li>
      <li><a href="subscriptions.html" ${activePage==='subs'?'class="active"':''}>📦 Subscriptions</a></li>
      <li><a href="discounts.html" ${activePage==='discounts'?'class="active"':''}>🏷️ Discounts</a></li>
    </ul>
    <div class="nav-right">
      <button class="nav-icon-btn" id="darkBtn" onclick="toggleTheme()">${getTheme()==='dark'?'☀️':'🌙'}</button>
      <button class="nav-icon-btn" id="langBtn" onclick="toggleLang()">${getLang()==='en'?'🌐 کوردی':'🌐 English'}</button>
      <button class="cart-btn" onclick="openCart()">🛒 Cart <span class="cart-count">0</span></button>
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
    mobileNav.innerHTML = `
      <a href="index.html">🏠 Home</a>
      <a href="playstation.html">🎮 PlayStation</a>
      <a href="xbox.html">🟢 Xbox</a>
      <a href="pc.html">💻 PC/Steam</a>
      <a href="nintendo.html">🔴 Nintendo</a>
      <a href="subscriptions.html">📦 Subscriptions</a>
      <a href="discounts.html">🏷️ Discounts</a>`;
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
        <div class="footer-col"><h4>Pages</h4><ul>
          <li><a href="index.html">🏠 Home</a></li>
          <li><a href="playstation.html">🎮 PlayStation</a></li>
          <li><a href="xbox.html">🟢 Xbox</a></li>
          <li><a href="pc.html">💻 PC/Steam</a></li>
          <li><a href="nintendo.html">🔴 Nintendo</a></li>
          <li><a href="subscriptions.html">📦 Subscriptions</a></li>
          <li><a href="discounts.html">🏷️ Discounts</a></li>
        </ul></div>
        <div class="footer-col"><h4>Contact</h4><ul>
          <li><a href="https://t.me/${s.telegram||'sharafaani'}" target="_blank">✈️ @${s.telegram||'sharafaani'}</a></li>
        </ul></div>
      </div>
      <div class="footer-bottom"><span>© 2024 ${s.storeName||'Kurd Store'}.</span><span>Made with ❤️ for Kurdish gamers</span></div>
    </footer>`;
  }
}

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

// ── OUT OF STOCK NOTIFICATION ──
function notifyMe(gameId, gameTitle){
  const email = prompt('Enter your email to be notified when "'+gameTitle+'" is back in stock:');
  if(!email || !email.includes('@')){ if(email!==null) showToast('⚠️ Please enter a valid email!'); return; }
  // Save to Firebase
  if(window._KS_DB){
    window._KS_DB.saveNotification({gameId, gameTitle, email, date:new Date().toISOString()}).then(()=>{
      showToast('✅ We will notify you at '+email+' when it's back!');
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
  try{
    const codes = await window._KS_DB.getCodes();
    const code = ref.toUpperCase();
    const c = codes[code];
    if(c){
      // Check expiry
      if(c.expiry && new Date(c.expiry) < new Date()) return;
      // Auto-apply discount
      localStorage.setItem('ks_disc', JSON.stringify({code,...c}));
      showToast('🎉 Referral discount "'+code+'" applied automatically! '+c.desc);
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
  // Only show loader if DB not ready yet
  const needsLoader = !window._KS_DB;
  if(needsLoader) showLoader('🎮');
  const run = ()=>{ if(needsLoader) hideLoader(); callback(); };
  if(window._KS_DB){ run(); return; }
  let tries=0;
  const interval=setInterval(()=>{
    tries++;
    if(window._KS_DB){ clearInterval(interval); run(); }
    else if(tries>40){ clearInterval(interval); run(); } // 4 second max
  },100);
}
