
/* ===== Global Hemp Service — app.js (clean consolidated build) ==============
   - Safe storage + toast
   - Cart + tokens persistence
   - Product cards with "Get it" (no price)
   - Single click handler (capture) to avoid double-adds
   - Off-canvas drawer (burger) + hide inline menu everywhere
   - Auto-render grids; render wallet/cart pages; demo reset
============================================================================= */

/* --------------- Safe storage wrapper --------------- */
const storage = (() => {
  try {
    const t="__ghs_t"; localStorage.setItem(t,"1"); localStorage.removeItem(t);
    return { get:(k)=>localStorage.getItem(k), set:(k,v)=>localStorage.setItem(k,v), remove:(k)=>localStorage.removeItem(k) };
  } catch(e){
    const mem={}; return { get:(k)=> (k in mem? mem[k] : null), set:(k,v)=>{mem[k]=v}, remove:(k)=>{delete mem[k]} };
  }
})();

/* --------------- Toast helper (non-blocking feedback) --------------- */
(function(){
  if (window.__ghsToastInit) return; window.__ghsToastInit = true;
  if (!document.getElementById('ghs-toast-style')){
    const s=document.createElement('style'); s.id='ghs-toast-style';
    s.textContent = `#ghs-toast{position:fixed;right:16px;bottom:16px;z-index:5000;background:#0b1a15;color:#c8fff0;border:1px solid #143d31;padding:10px 12px;border-radius:12px;box-shadow:0 8px 20px rgba(0,0,0,.25);display:flex;align-items:center;gap:10px;transform:translateY(8px);opacity:0;transition:opacity .18s, transform .18s}
#ghs-toast.show{opacity:1;transform:translateY(0)}
#ghs-toast .btn{background:#eafff6;color:#0b7c3f;border:1px solid #b2e8d9;border-radius:10px;padding:6px 10px;cursor:pointer}`;
    document.head.appendChild(s);
  }
  window.toast = function(msg, opts){
    let t=document.getElementById('ghs-toast');
    if(!t){
      t=document.createElement('div'); t.id='ghs-toast';
      t.innerHTML = `<span id="ghs-toast-msg"></span> <button class="btn" id="ghs-toast-ok">OK</button>`;
      document.body.appendChild(t);
      t.querySelector('#ghs-toast-ok').addEventListener('click', ()=>{ t.classList.remove('show'); clearTimeout(t.__timer); });
    }
    t.querySelector('#ghs-toast-msg').textContent = msg || 'Done';
    requestAnimationFrame(()=> t.classList.add('show'));
    clearTimeout(t.__timer);
    const dur = (opts && opts.duration) || 2200;
    t.__timer = setTimeout(()=> t.classList.remove('show'), dur);
    return t;
  };
})();

/* --------------- Keys, defaults, and global State --------------- */
const STORAGE = { cart:'ghs_cart', tokens:'ghs_tokens' };
const DefaultTokens = { balance: 120, tier: 'Green' };
const State = {
  cart: [],
  tokens: { ...DefaultTokens },
  user: {
    name: 'Guest',
    country: (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'),
    currency: (Intl.NumberFormat().resolvedOptions().currency) || 'EUR',
  },
  products: []
};

/* --------------- Persistence --------------- */
function saveState(){
  try {
    storage.set(STORAGE.cart, JSON.stringify(State.cart));
    storage.set(STORAGE.tokens, JSON.stringify(State.tokens));
  } catch(e){}
}
function loadState(){
  try {
    const cart = JSON.parse(storage.get(STORAGE.cart) || '[]');
    const tokens = JSON.parse(storage.get(STORAGE.tokens) || 'null');
    if (Array.isArray(cart)) State.cart = cart;
    if (tokens && typeof tokens === 'object') State.tokens = tokens;
  } catch(e){}
}
function resetDemo(){
  State.cart = [];
  State.tokens = { ...DefaultTokens };
  saveState(); renderCartBadge();
  if (typeof toast==='function') toast('Demo reset. Cart cleared and WETAS set to default.');
  if (document.querySelector('#cart-table')) renderCartPage();
  if (document.querySelector('#token-balance')) renderWallet();
}

/* --------------- Catalog + token rules --------------- */
const Catalog = [
  { id: 1, name: "Hemp Blend Tee", vendor: "GreenWeave", category: "Apparel", price: 29, img: "assets/img/products/apparel-tee.png" },
  { id: 2, name: "Hemp Protein Powder", vendor: "NutriHemp", category: "Food", price: 19, img: "assets/img/products/protein-powder.png" },
  { id: 3, name: "Hempcrete Brick", vendor: "EcoBuild Co.", category: "Construction", price: 8, img: "assets/img/products/hempcrete-brick.png" },
  { id: 4, name: "Hemp Facial Oil", vendor: "Verdant Glow", category: "Wellness", price: 24, img: "assets/img/products/facial-oil.png" },
  { id: 5, name: "Hemp Tote Bag", vendor: "Loom&Leaf", category: "Accessories", price: 18, img: "assets/img/products/tote-bag.png" },
  { id: 6, name: "Hemp Rope 10m", vendor: "Mariner", category: "Industrial", price: 12, img: "assets/img/products/rope-coil.png" },
];
const TokenRules = { Apparel: 2, Food: 3, Construction: 8, Wellness: 2, Accessories: 1, Industrial: 5 };
State.products = Catalog;

/* --------------- Cart helpers --------------- */
function renderCartBadge(){
  const n = State.cart.reduce((a,b)=> a + (b.qty||0), 0);
  const el = document.querySelector('#cart-badge');
  if (el) el.textContent = n;
}
function currency(n){
  try { return new Intl.NumberFormat(undefined,{style:'currency',currency:'EUR'}).format(n).replace(/ /g,' '); }
  catch(e){ return '€' + Number(n).toFixed(2); }
}
function addToCart(id){
  const p = Catalog.find(x => x.id === id);
  if(!p) return;
  const found = State.cart.find(x => x.id === id);
  if (found) found.qty += 1;
  else State.cart.push({ ...p, qty: 1 });
  saveState(); renderCartBadge();
  try{ if(navigator.vibrate) navigator.vibrate(16); }catch(e){}
  if (typeof window.toast === 'function') toast(`Added to cart: ${p.name}`);
}

/* --------------- Product cards (home + marketplace) --------------- */
function renderProducts(containerId, items){
  const el = document.getElementById(containerId) || document.querySelector(containerId);
  if(!el) return;
  if(!el.classList.contains('grid')) el.classList.add('grid');
  const list = Array.isArray(items) ? items : (Array.isArray(State.products) ? State.products : []);
  el.innerHTML = list.map(p => {
    const brand = p.brand || p.vendor || p.company || "";
    const category = p.category || "";
    const img = p.image || p.img || p.thumbnail || "";
    const imgSrc = /^assets\//.test(img) ? img : ("assets/img/products/" + img);
    const viewHref = "product.html?id=" + encodeURIComponent(p.id);
    return `
<article class="p-card" data-id="${p.id}" tabindex="0">
  <div class="p-media">
    <img src="${imgSrc}" alt="${p.name}" loading="lazy" width="400" height="300"/>
    ${brand ? `<span class="p-badge">${brand}</span>` : ``}
  </div>
  <div class="p-body">
    <h3 class="p-title">${p.name}</h3>
    ${category ? `<div class="p-meta"><span class="p-tag">${category}</span></div>` : `<div class="p-meta"></div>`}
    ${p.desc ? `<div class="p-desc">${p.desc}</div>` : ``}
    <div class="p-actions">
      <a class="p-link" href="${viewHref}" aria-label="View ${p.name}">View</a>
      <button class="p-add" data-add="${p.id}" aria-label="Get ${p.name} now">Get it</button>
    </div>
  </div>
</article>`;
  }).join("");

  // Bind once; capture phase so older handlers can’t double-fire
  if (!el.__ghsAddBound){
    el.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-add]');
      if(!btn || !el.contains(btn)) return;
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      const id = parseInt(btn.getAttribute('data-add'), 10);
      if(!isNaN(id)) addToCart(id);
    }, true);
    el.__ghsAddBound = true;
  }
}

/* --------------- Cart page render --------------- */
function renderCartPage(){
  const table = document.querySelector('#cart-table');
  const totalEl = document.querySelector('#cart-total');
  const tokensEl = document.querySelector('#cart-tokens');
  if (!table) return;
  table.innerHTML = '';
  let total = 0, tokens = 0;
  for (const item of State.cart){
    const line = item.price * item.qty; total += line;
    tokens += (TokenRules[item.category] || 1) * item.qty;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${item.name}</td><td>${item.vendor||""}</td><td>${item.category||""}</td><td>${item.qty}</td><td>${currency(line)}</td>`;
    table.appendChild(tr);
  }
  if (totalEl) totalEl.textContent = currency(total);
  if (tokensEl) tokensEl.textContent = tokens + ' WETAS';
}

/* --------------- Checkout + Wallet --------------- */
function checkout(){
  const tokensEarned = State.cart.reduce((sum, i)=> sum + (TokenRules[i.category] || 1) * i.qty, 0);
  State.tokens.balance += tokensEarned;
  State.cart = [];
  saveState(); renderCartBadge();
  if (typeof toast==='function') toast(`Checkout simulated! WETAS earned: ${tokensEarned}`, {duration:1800});
  window.location.href = 'wallet.html';
}
function renderWallet(){
  const bal = document.querySelector('#token-balance');
  const tier = document.querySelector('#token-tier');
  if (bal) bal.textContent = State.tokens.balance;
  if (tier) tier.textContent = State.tokens.tier;
  const spot = document.querySelector('#spotlight');
  if (spot){
    spot.innerHTML = `
      <div class="card"><b>Buy 2 Apparel</b> → +10 WETAS bonus</div>
      <div class="card"><b>EcoBuild Co. week</b> → 5% off hempcrete</div>
      <div class="card"><b>WETAS Impact</b> → Your last order stored 2.4kg CO₂e</div>`;
  }
}

/* --------------- Off-canvas drawer (site-wide) --------------- */
(function(){
  if (window.__ghsDrawerInit) return; window.__ghsDrawerInit = true;

  // Hide inline menu everywhere; keep burger visible
  if (!document.getElementById('ghs-drawer-style')){
    const s=document.createElement('style'); s.id='ghs-drawer-style';
    s.textContent = `.nav > .menu{display:none !important}.hamburger{display:inline-flex;align-items:center;justify-content:center}
#ghs-overlay{position:fixed;inset:0;background:rgba(0,0,0,.25);opacity:0;pointer-events:none;transition:opacity .2s;z-index:2990}
#ghs-overlay.open{opacity:1;pointer-events:auto}
#ghs-offcanvas{position:fixed;top:0;left:0;bottom:0;width:min(82vw,380px);transform:translateX(-110%);transition:transform .22s ease;z-index:4000;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,.25);padding:16px 12px;overflow:auto}
#ghs-offcanvas.open{transform:translateX(0)}
#ghs-offcanvas .ghs-menu a{display:block;padding:12px 12px;border-radius:12px;font-weight:700;text-decoration:none;color:#0b4b3f;margin:2px 0}
#ghs-offcanvas .ghs-menu a:hover{background:#f0fffb}`;
    document.head.appendChild(s);
  }

  // Ensure overlay + panel exist
  let overlay = document.getElementById('ghs-overlay');
  if (!overlay){ overlay = document.createElement('div'); overlay.id='ghs-overlay'; document.body.appendChild(overlay); }
  let panel = document.getElementById('ghs-offcanvas');
  if (!panel){ panel = document.createElement('aside'); panel.id='ghs-offcanvas'; panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','true'); panel.innerHTML = `<nav class="ghs-menu" aria-label="Site menu"></nav>`; document.body.appendChild(panel); }
  const menu = panel.querySelector('.ghs-menu');

  function normalizeHref(href){
    const raw = (href||'').replace(location.origin,'').replace(/^[a-z]+:\/\//i,'').replace(/^\//,'').replace(/\?.*$/,'').replace(/#.*$/,'');
    if (/^carbon-lab(\/|$|\.html)/i.test(raw)) return 'carbon-lab.html';
    return raw || '';
  }

  function rebuild(){
    const src = document.getElementById('main-menu') || document.querySelector('.menu');
    if (!src) return;
    const seen = new Set(); menu.innerHTML = '';
    src.querySelectorAll('a').forEach(a=>{
      let key = normalizeHref(a.getAttribute('href'));
      if (!key || seen.has(key)) return; seen.add(key);
      const c = a.cloneNode(true); c.removeAttribute('id');
      if (key === 'carbon-lab.html') c.setAttribute('href','carbon-lab.html');
      c.addEventListener('click', ()=>{ close(); });
      menu.appendChild(c);
    });
    // Cart link with live badge if present
    const cartLink = Array.from(menu.querySelectorAll('a')).find(a=>/cart/i.test((a.getAttribute('href')||'') + (a.textContent||'')));
    if (cartLink){
      let b = cartLink.querySelector('.badge');
      if (!b){ b = document.createElement('span'); b.className='badge'; cartLink.appendChild(b); }
      b.id = 'drawer-cart-badge'; b.textContent = String(State.cart.reduce((a,b)=>a+(b.qty||0),0));
    }
  }

  function open(){ rebuild(); panel.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow='hidden'; setAria(true); }
  function close(){ panel.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow=''; setAria(false); }
  function toggle(){ panel.classList.contains('open') ? close() : open(); }
  function setAria(isOpen){ const btn=document.getElementById('menu-toggle'); if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false'); }

  function bind(){
    const btn = document.getElementById('menu-toggle');
    if (!btn) return;
    if (!btn.__ghsBound){
      btn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); toggle(); }, true);
      btn.__ghsBound = true;
    }
    if (!overlay.__ghsBound){ overlay.addEventListener('click', close); overlay.__ghsBound = true; }
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') close(); });
    const src = document.getElementById('main-menu') || document.querySelector('.menu');
    if (src && !src.__obs){ src.__obs = new MutationObserver(()=>rebuild()); src.__obs.observe(src,{childList:true,subtree:true}); }
  }

  // Keep drawer badge in sync
  const _badge = window.renderCartBadge;
  window.renderCartBadge = function(){ if (_badge) _badge(); const b=document.getElementById('drawer-cart-badge'); if (b) b.textContent = String(State.cart.reduce((a,b)=>a+(b.qty||0),0)); };

  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', bind); }
  else { bind(); }
  setTimeout(bind, 400);
})();

/* --------------- Auto-render on Home + Marketplace + Page hooks --------------- */
function renderHomeAndMarket(){ if (document.getElementById('products-grid')) renderProducts('products-grid', State.products); if (document.getElementById('market-grid')) renderProducts('market-grid', State.products); }

document.addEventListener('DOMContentLoaded', ()=>{
  loadState(); renderCartBadge(); renderHomeAndMarket();
  const resetBtn = document.getElementById('reset-btn'); if (resetBtn) resetBtn.addEventListener('click', (e)=>{ e.preventDefault(); resetDemo(); });
  if (document.querySelector('#cart-table')) renderCartPage();
  if (document.querySelector('#token-balance')) renderWallet();
});
