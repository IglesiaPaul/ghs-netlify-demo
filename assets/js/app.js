
/* ===== Global Hemp Service — app.js (clean build) =====
   - Persists cart + WETAS to localStorage (with safe fallback)
   - Catalog + unified product renderer
   - Mobile menu (overlay + hamburger)
   - Auto-render on Home (#products-grid) + Marketplace (#market-grid)
   - Carbon Lab link: canonicalize + dedupe
   - Wallet link: subtle gold glow
============================================================= */

/* --------------- Safe storage wrapper --------------- */
const storage = (() => {
  try {
    const testKey = "__ghs_t";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return {
      get: (k) => localStorage.getItem(k),
      set: (k, v) => localStorage.setItem(k, v),
      remove: (k) => localStorage.removeItem(k),
    };
  } catch (e) {
    const mem = {};
    return {
      get: (k) => (k in mem ? mem[k] : null),
      set: (k, v) => { mem[k] = v; },
      remove: (k) => { delete mem[k]; },
    };
  }
})();

/* --------------- Keys & Defaults --------------- */
const STORAGE = { cart: "ghs_cart", tokens: "ghs_tokens" };
const DefaultTokens = { balance: 120, tier: "Green" };

/* --------------- Global State --------------- */
const State = {
  cart: [],
  user: {
    name: "Guest",
    country: (Intl.DateTimeFormat().resolvedOptions().timeZone || "Local"),
    currency: (Intl.NumberFormat().resolvedOptions().currency) || "EUR",
  },
  tokens: { ...DefaultTokens },
  products: [] // set below to Catalog
};

/* --------------- Persistence helpers --------------- */
function saveState() {
  try {
    storage.set(STORAGE.cart, JSON.stringify(State.cart));
    storage.set(STORAGE.tokens, JSON.stringify(State.tokens));
  } catch (e) {}
}
function loadState() {
  try {
    const cart = JSON.parse(storage.get(STORAGE.cart) || "[]");
    const tokens = JSON.parse(storage.get(STORAGE.tokens) || "null");
    if (Array.isArray(cart)) State.cart = cart;
    if (tokens && typeof tokens === "object") State.tokens = tokens;
  } catch (e) {}
}

/* --------------- Reset (demo) --------------- */
function resetDemo() {
  State.cart = [];
  State.tokens = { ...DefaultTokens };
  saveState();
  renderCartBadge();
  alert("Demo reset. Cart cleared and WETAS set to default.");
  if (document.querySelector("#cart-table")) renderCartPage();
  if (document.querySelector("#token-balance")) renderWallet();
}

/* --------------- Catalog & Rewards --------------- */
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

/* --------------- Cart + Wallet --------------- */
function addToCart(id) {
  const p = Catalog.find((x) => x.id === id);
  if (!p) return;
  const found = State.cart.find((x) => x.id === id);
  if (found) found.qty += 1;
  else State.cart.push({ ...p, qty: 1 });
  saveState();
  renderCartBadge();
  // Small haptic/feedback on mobile
  if (navigator.vibrate) try { navigator.vibrate(16); } catch(e){}
  alert(`Added to cart: ${p.name}`);
}
function renderCartBadge() {
  const n = State.cart.reduce((a, b) => a + b.qty, 0);
  const el = document.querySelector("#cart-badge");
  if (el) el.textContent = n;
}
function currency(n) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(n).replace(/\u00a0/g,' ');
  } catch(e) {
    return "€" + Number(n).toFixed(2);
  }
}

/* === Unified product renderer (home + marketplace cards) === */
function renderProducts(containerId, items) {
  const el = document.getElementById(containerId) || document.querySelector(containerId);
  if (!el) return;

  if (!el.classList.contains('grid')) el.classList.add('grid');

  el.innerHTML = (items || []).map(p => {
    const price = (p.price != null) ? Number(p.price) : null;
    const brand = p.brand || p.vendor || p.company || "";
    const category = p.category || "";
    const img = p.image || p.img || p.thumbnail || "";
    const imgSrc = img.startsWith("assets/") ? img : ("assets/img/products/" + img);
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
          <button class="p-add" data-add="${p.id}" aria-label="Add ${p.name} to cart">${price != null ? `Add • ${currency(price)}` : `Add to cart`}</button>
        </div>
      </div>
    </article>`;
  }).join("");

  // Event delegation for add buttons within this container
  el.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-add]");
    if (!btn) return;
    const id = parseInt(btn.getAttribute("data-add"), 10);
    if (!isNaN(id)) addToCart(id);
  }, { passive: true });
}

/* --------------- Cart page render --------------- */
function renderCartPage() {
  const table = document.querySelector("#cart-table");
  const totalEl = document.querySelector("#cart-total");
  const tokensEl = document.querySelector("#cart-tokens");
  if (!table) return;
  table.innerHTML = "";
  let total = 0, tokens = 0;
  for (const item of State.cart) {
    const line = item.price * item.qty;
    total += line;
    tokens += (TokenRules[item.category] || 1) * item.qty;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.name}</td><td>${item.vendor||""}</td><td>${item.category||""}</td><td>${item.qty}</td><td>${currency(line)}</td>`;
    table.appendChild(tr);
  }
  if (totalEl) totalEl.textContent = currency(total);
  if (tokensEl) tokensEl.textContent = tokens + " WETAS";
}

/* --------------- Checkout + Wallet --------------- */
function checkout() {
  const tokensEarned = State.cart.reduce((sum, i) => sum + (TokenRules[i.category] || 1) * i.qty, 0);
  State.tokens.balance += tokensEarned;
  State.cart = [];
  saveState();
  renderCartBadge();
  alert(`Checkout simulated!\nWETAS earned: ${tokensEarned}`);
  window.location.href = "wallet.html";
}
function renderWallet() {
  const bal = document.querySelector("#token-balance");
  const tier = document.querySelector("#token-tier");
  if (bal) bal.textContent = State.tokens.balance;
  if (tier) tier.textContent = State.tokens.tier;
  const spot = document.querySelector("#spotlight");
  if (spot) {
    spot.innerHTML = `
      <div class="card"><b>Buy 2 Apparel</b> → +10 WETAS bonus</div>
      <div class="card"><b>EcoBuild Co. week</b> → 5% off hempcrete</div>
      <div class="card"><b>WETAS Impact</b> → Your last order stored 2.4kg CO₂e</div>`;
  }
}

/* --------------- Mobile menu (baseline) --------------- */
function setupMobileMenu() {
  const btn = document.getElementById("menu-toggle");
  const menu = document.getElementById("main-menu");
  const overlay = document.getElementById("menu-overlay");
  if (!btn || !menu || !overlay) return;
  const close = () => { menu.classList.remove("open"); overlay.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); };
  const open = () => { menu.classList.add("open"); overlay.classList.add("open"); btn.setAttribute("aria-expanded", "true"); };
  btn.addEventListener("click", () => { menu.classList.contains("open") ? close() : open(); }, {passive:true});
  overlay.addEventListener("click", close, {passive:true});
  menu.addEventListener("click", (e) => { if (e.target.tagName === "A") close(); }, {passive:true});
  window.addEventListener("resize", () => { if (window.innerWidth > 900) close(); }, {passive:true});
}

/* --------------- Auto-render on Home + Marketplace --------------- */
function renderHomeAndMarket(){
  if (document.getElementById("products-grid")) {
    renderProducts("products-grid", State.products);
  }
  if (document.getElementById("market-grid")) {
    renderProducts("market-grid", State.products);
  }
}

/* --------------- Init --------------- */
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  renderCartBadge();
  setupMobileMenu();
  renderHomeAndMarket();

  // Wire Reset button if present
  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) resetBtn.addEventListener("click", (e) => { e.preventDefault(); resetDemo(); });

  // If we're on wallet or cart pages, render their sections
  if (document.querySelector("#cart-table")) renderCartPage();
  if (document.querySelector("#token-balance")) renderWallet();
});

/* === Carbon Lab nav module (v2): canonicalize + dedupe desktop & mobile === */
(function(){
  if (window.__ghsLabModuleV2) return;
  window.__ghsLabModuleV2 = true;

  // One-time style for the fancy link
  if (!document.getElementById("lab-link-style")) {
    const style = document.createElement("style");
    style.id = "lab-link-style";
    style.textContent = `
      .menu a.lab-link{position:relative; display:inline-block; border-radius:999px; padding:6px 10px; font-weight:700; overflow:hidden; border:1px solid #d9f8ef}
      .menu a.lab-link::before{content:""; position:absolute; inset:-30%; background:conic-gradient(from 0deg, rgba(56,226,181,.4), transparent 40%, rgba(56,226,181,.35) 60%, transparent 100%); animation:twist 4.8s linear infinite; z-index:0; filter:blur(10px)}
      .menu a.lab-link span{position:relative; z-index:1}
      @keyframes twist{ to { transform:rotate(360deg);} }
      @media (prefers-reduced-motion: reduce){ .menu a.lab-link::before{ animation:none !important } }
    `;
    document.head.appendChild(style);
  }

  function normalizeHref(a){
    const raw = (typeof a === "string" ? a : (a.getAttribute && a.getAttribute("href")) || "") || "";
    let p = raw
      .replace(location.origin, "")
      .replace(/^[a-z]+:\/\//i, "")
      .replace(/^\//, "")
      .replace(/\?.*$/, "")
      .replace(/#.*$/, "");
    if (p.endsWith("/")) p = p.slice(0,-1);
    const pl = p.toLowerCase();
    if (pl === "carbon-lab" || pl === "carbon-lab/index" || pl === "carbon-lab/index.html") p = "carbon-lab.html";
    return p;
  }

  function ensureSingleLabLink(){
    const nav = document.getElementById("main-menu") || document.querySelector(".menu");
    if (!nav) return;
    const anchors = Array.from(nav.querySelectorAll("a"));
    const labAnchors = anchors.filter(a => normalizeHref(a) === "carbon-lab.html");
    if (labAnchors.length === 0){
      const link = document.createElement("a");
      link.className = "lab-link";
      link.href = "carbon-lab.html";
      link.innerHTML = "<span>Carbon Lab ✨</span>";
      const afterCarbon = anchors.find(a => /carbon\s*program/i.test(a.textContent || ""));
      if (afterCarbon && afterCarbon.parentNode) afterCarbon.insertAdjacentElement("afterend", link);
      else nav.insertAdjacentElement("afterbegin", link);
    } else {
      for (let i=1;i<labAnchors.length;i++) labAnchors[i].remove();
      const first = labAnchors[0];
      first.classList.add("lab-link");
      first.setAttribute("href", "carbon-lab.html");
      if (!/carbon\s*lab/i.test(first.textContent || "")) first.innerHTML = "<span>Carbon Lab ✨</span>";
    }
  }

  function initOffcanvas(){
    if (window.__ghsOffcanvasV2) return;
    window.__ghsOffcanvasV2 = true;
    const btn = document.getElementById("menu-toggle");
    const src = document.getElementById("main-menu") || document.querySelector(".menu");
    if (!btn || !src) return;

    if (!document.getElementById("ghs-offcanvas-style")){
      const s = document.createElement("style"); s.id = "ghs-offcanvas-style";
      s.textContent = `
#ghs-overlay{position:fixed;inset:0;background:rgba(0,0,0,.25);opacity:0;pointer-events:none;transition:opacity .2s;z-index:2990}
#ghs-overlay.open{opacity:1;pointer-events:auto}
#ghs-offcanvas{position:fixed;top:0;left:0;bottom:0;width:min(82vw,380px);transform:translateX(-110%);transition:transform .22s ease;z-index:3000;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,.25);padding:16px 12px;overflow:auto}
#ghs-offcanvas.open{transform:translateX(0)}
#ghs-offcanvas .ghs-menu a{display:block;padding:12px 10px;border-radius:10px;font-weight:700;text-decoration:none;color:#0b4b3f}
#ghs-offcanvas .ghs-menu a:hover{background:#f0fffb}
@media (min-width:900px){#ghs-overlay{display:none}#ghs-offcanvas{display:none}}
      `;
      document.head.appendChild(s);
    }
    let overlay = document.getElementById("ghs-overlay");
    if (!overlay){ overlay = document.createElement("div"); overlay.id="ghs-overlay"; document.body.appendChild(overlay); }
    let panel = document.getElementById("ghs-offcanvas");
    if (!panel){
      panel = document.createElement("aside");
      panel.id="ghs-offcanvas"; panel.setAttribute("role","dialog"); panel.setAttribute("aria-modal","true");
      panel.innerHTML = `<nav class="ghs-menu" aria-label="Mobile"></nav>`;
      document.body.appendChild(panel);
    }
    const menu = panel.querySelector(".ghs-menu");

    function rebuild(){
      const seen = new Set();
      menu.innerHTML = "";
      src.querySelectorAll("a").forEach(a=>{
        let key = normalizeHref(a);
        if (!key) return;
        if (key === "carbon-lab") key = "carbon-lab.html";
        if (seen.has(key)) return;
        seen.add(key);
        const c = a.cloneNode(true);
        if (key === "carbon-lab.html") c.setAttribute("href","carbon-lab.html");
        c.removeAttribute("id");
        c.addEventListener("click", () => {
          overlay.classList.remove("open");
          panel.classList.remove("open");
          document.body.style.overflow="";
        });
        menu.appendChild(c);
      });
    }

    function open(){ rebuild(); panel.classList.add("open"); overlay.classList.add("open"); document.body.style.overflow="hidden"; }
    function close(){ panel.classList.remove("open"); overlay.classList.remove("open"); document.body.style.overflow=""; }
    function toggle(){ panel.classList.contains("open") ? close() : open(); }
    btn.addEventListener("click", toggle);
    overlay.addEventListener("click", close);
    document.addEventListener("keydown", e=>{ if(e.key==="Escape") close(); });
    new MutationObserver(()=>{ ensureSingleLabLink(); rebuild(); }).observe(src, {childList:true, subtree:true});
    window.__ghsRebuildOffcanvas = rebuild;
  }

  function init(){
    ensureSingleLabLink();
    initOffcanvas();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  setTimeout(init, 600);
})();

/* === Wallet link highlight (gold glow, low-impact, no balance) === */
(function(){
  if (window.__ghsWalletGlowInit) return;
  window.__ghsWalletGlowInit = true;
  if (!document.getElementById("wallet-link-style")) {
    const style = document.createElement("style");
    style.id = "wallet-link-style";
    style.textContent = `
      .menu a.wallet-link, .ghs-menu a.wallet-link{
        position:relative; display:inline-block; border-radius:999px;
        padding:6px 10px; font-weight:700; border:1px solid #ffe8b3;
        overflow:hidden; background:#fff;
      }
      .menu a.wallet-link::before, .ghs-menu a.wallet-link::before{
        content:""; position:absolute; inset:-30%;
        background:conic-gradient(from 0deg, rgba(255,216,107,.45), transparent 40%, rgba(255,216,107,.35) 60%, transparent 100%);
        filter:blur(10px); z-index:0; animation:walletSpin 6s linear infinite;
      }
      .menu a.wallet-link span, .ghs-menu a.wallet-link span{ position:relative; z-index:1 }
      @keyframes walletSpin{ to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce){
        .menu a.wallet-link::before, .ghs-menu a.wallet-link::before{ animation:none !important }
      }
    `;
    document.head.appendChild(style);
  }
  function markWalletLinks(){
    const nav = document.getElementById('main-menu') || document.querySelector('.menu');
    if (!nav) return;
    nav.querySelectorAll('a').forEach(a=>{
      const href = (a.getAttribute('href') || '').replace(/\?.*$/,'').replace(/#.*$/,'').replace(/^\//,'').toLowerCase();
      const isWalletHref = href === 'wallet.html' || href === 'wallet';
      const isWalletText = /wallet/i.test(a.textContent || '');
      if (isWalletHref || isWalletText){
        a.classList.add('wallet-link');
        if (!/wallet/i.test(a.innerHTML)) { a.innerHTML = '<span>Wallet</span>'; }
      }
    });
    if (window.__ghsRebuildOffcanvas) window.__ghsRebuildOffcanvas();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', markWalletLinks);
  else markWalletLinks();
  const nav = document.getElementById('main-menu') || document.querySelector('.menu');
  if (nav) new MutationObserver(markWalletLinks).observe(nav, {childList:true, subtree:true});
  setTimeout(markWalletLinks, 400);
})();

/* === Desktop header update: use off-canvas drawer site-wide ==================
   - Hides inline link row on desktop; shows burger that opens the left panel
   - Drawer ordering: Marketplace (purple) → Wallet (gold) → Carbon Lab (green) → Services→Contact → Cart (green with count)
   - Injects styles; no HTML edits required
============================================================================= */

(function(){
  if (window.__ghsDesktopHeaderInit) return;
  window.__ghsDesktopHeaderInit = true;

  // 1) Global header styles (hide inline nav on desktop; keep burger visible)
  if (!document.getElementById("ghs-desktop-header-style")){
    const s = document.createElement("style");
    s.id = "ghs-desktop-header-style";
    s.textContent = `
/* Hide the inline menu row across breakpoints; we'll use the drawer */
.menu.menu-panel{ display:none !important; }
/* Make sure hamburger is visible on desktop */
.hamburger{ display:inline-flex; align-items:center; justify-content:center; }

/* Drawer visuals + highlight pills */
#ghs-overlay{position:fixed;inset:0;background:rgba(0,0,0,.25);opacity:0;pointer-events:none;transition:opacity .2s;z-index:2990}
#ghs-overlay.open{opacity:1;pointer-events:auto}
#ghs-offcanvas{position:fixed;top:0;left:0;bottom:0;width:min(82vw,380px);transform:translateX(-110%);transition:transform .22s ease;z-index:3000;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,.25);padding:16px 12px;overflow:auto}
#ghs-offcanvas.open{transform:translateX(0)}
#ghs-offcanvas .ghs-menu a{display:block;padding:12px 12px;border-radius:12px;font-weight:700;text-decoration:none;color:#0b4b3f;margin:2px 0}
#ghs-offcanvas .ghs-menu a:hover{background:#f0fffb}

/* Order header label */
#ghs-offcanvas .ghs-group{margin-top:8px; padding-top:8px; border-top:1px solid #eef2ef}
#ghs-offcanvas .ghs-group:first-child{margin-top:0; padding-top:0; border-top:none}

/* Highlight variants */
a.marketplace-link{position:relative; border:1px solid #ead9ff; background:#fff;}
a.marketplace-link::before{content:""; position:absolute; inset:-30%; background:conic-gradient(from 0deg, rgba(149, 93, 255, .45), transparent 40%, rgba(149, 93, 255, .35) 60%, transparent 100%); filter:blur(10px); z-index:0; animation:mpSpin 6s linear infinite;}
a.marketplace-link span{position:relative; z-index:1}
@keyframes mpSpin{ to { transform: rotate(360deg);} }

/* Wallet (gold) is injected elsewhere; Carbon Lab (green) styles already exist */

/* Cart link (green) */
a.cart-link{ position:relative; border:1px solid #d9f8ef; background:#eafff6; color:#0b7c3f; display:flex; align-items:center; gap:8px; }
a.cart-link .badge{ background:#0d1b16; color:#c8fff0; border:1px solid #143d31; }
    `;
    document.head.appendChild(s);
  }

  // 2) Ensure off-canvas infra exists (desktop too)
  if (!document.getElementById("ghs-overlay")){
    const ov = document.createElement("div"); ov.id = "ghs-overlay"; document.body.appendChild(ov);
  }
  if (!document.getElementById("ghs-offcanvas")){
    const as = document.createElement("aside"); as.id = "ghs-offcanvas"; as.setAttribute("role","dialog"); as.setAttribute("aria-modal","true");
    as.innerHTML = `<nav class="ghs-menu" aria-label="Site menu"></nav>`;
    document.body.appendChild(as);
  }

  // 3) Drawer builder with ordering and highlights
  function normalizeHref(href){
    const raw = (href || "")
      .replace(location.origin,"")
      .replace(/^[a-z]+:\/\//i,"")
      .replace(/^\//,"")
      .replace(/\?.*$/,"")
      .replace(/#.*$/,"");
    if (/^carbon-lab(\/|$|\.html)/i.test(raw)) return "carbon-lab.html";
    if (/^marketplace(\/|$|\.html)/i.test(raw)) return "marketplace.html";
    if (/^wallet(\/|$|\.html)/i.test(raw)) return "wallet.html";
    if (/^cart(\/|$|\.html)/i.test(raw)) return "cart.html";
    return raw || "";
  }

  function cartCount(){ try{ return (window.State && Array.isArray(State.cart)) ? State.cart.reduce((a,b)=>a + (b.qty||0),0) : 0; }catch(e){ return 0; } }

  function rebuildDrawer(){
    const src = document.getElementById("main-menu") || document.querySelector(".menu");
    const wrap = document.querySelector("#ghs-offcanvas .ghs-menu");
    if (!src || !wrap) return;

    const links = Array.from(src.querySelectorAll("a"));
    const map = new Map();
    links.forEach(a => {
      const key = normalizeHref(a.getAttribute("href"));
      if (!key || map.has(key)) return;
      map.set(key, a);
    });

    function cloneFor(key, textOverride, extraClass=""){
      const srcA = map.get(key);
      let a;
      if (srcA){
        a = srcA.cloneNode(true);
        a.removeAttribute("id");
      } else {
        a = document.createElement("a");
        a.href = key;
        a.textContent = textOverride || key.replace(".html","");
      }
      if (textOverride) a.innerHTML = `<span>${textOverride}</span>`;
      if (extraClass) a.classList.add(...extraClass.split(" "));
      return a;
    }

    wrap.innerHTML = "";

    // Primary group: Marketplace (purple), Wallet (gold), Carbon Lab (green)
    const g1 = document.createElement("div"); g1.className = "ghs-group";
    const aMarket = cloneFor("marketplace.html","Marketplace","marketplace-link");
    const aWallet = cloneFor("wallet.html","Wallet","wallet-link");
    const aLab    = cloneFor("carbon-lab.html","Carbon Lab ✨","lab-link");
    g1.appendChild(aMarket); g1.appendChild(aWallet); g1.appendChild(aLab);
    wrap.appendChild(g1);

    // Secondary group: the rest (Services → Contact), keep original menu order
    const g2 = document.createElement("div"); g2.className = "ghs-group";
    const preferred = new Set(["index.html","marketplace.html","wallet.html","carbon-lab.html","cart.html"]);
    links.forEach(a => {
      const key = normalizeHref(a.getAttribute("href"));
      const label = (a.textContent || "").trim();
      if (!key || preferred.has(key)) return;
      // Include from Services to Contact (based on existing labels)
      if (/^(services|knowledge|carbon program|token|partner|about|contact)/i.test(label)){
        const c = a.cloneNode(true); c.removeAttribute("id");
        g2.appendChild(c);
      }
    });
    wrap.appendChild(g2);

    // Final group: Cart with live count
    const g3 = document.createElement("div"); g3.className = "ghs-group";
    const aCart = cloneFor("cart.html", "Cart", "cart-link");
    // badge
    const b = document.createElement("span"); b.className = "badge"; b.id = "drawer-cart-badge"; b.textContent = String(cartCount());
    aCart.appendChild(b);
    g3.appendChild(aCart);
    wrap.appendChild(g3);
  }

  // 4) Wire open/close and keep in sync
  function setup(){
    const btn = document.getElementById("menu-toggle");
    const overlay = document.getElementById("ghs-overlay");
    const panel = document.getElementById("ghs-offcanvas");
    if (!btn || !overlay || !panel) return;

    function open(){ rebuildDrawer(); panel.classList.add("open"); overlay.classList.add("open"); document.body.style.overflow="hidden"; btn.setAttribute("aria-expanded","true"); }
    function close(){ panel.classList.remove("open"); overlay.classList.remove("open"); document.body.style.overflow=""; btn.setAttribute("aria-expanded","false"); }
    function toggle(){ panel.classList.contains("open") ? close() : open(); }

    if (!btn.__ghsBound){ btn.addEventListener("click", toggle); btn.__ghsBound = true; }
    if (!overlay.__ghsBound){ overlay.addEventListener("click", close); overlay.__ghsBound = true; }
    document.addEventListener("keydown", (e)=>{ if (e.key === "Escape") close(); });
    // Keep in sync with header nav changes
    const src = document.getElementById("main-menu") || document.querySelector(".menu");
    if (src && !src.__obs){
      src.__obs = new MutationObserver(()=>rebuildDrawer());
      src.__obs.observe(src,{childList:true, subtree:true});
    }
  }

  // 5) Update drawer cart badge whenever cart changes
  const origRenderCartBadge = (typeof renderCartBadge === "function") ? renderCartBadge : null;
  window.renderCartBadge = function(){
    if (origRenderCartBadge) origRenderCartBadge();
    const b = document.getElementById("drawer-cart-badge");
    if (b) b.textContent = String((window.State && Array.isArray(State.cart)) ? State.cart.reduce((a,b)=>a+(b.qty||0),0) : 0);
  };

  // Bootstrap
  function init(){
    rebuildDrawer();
    setup();
    // also ensure Wallet & Lab styling markers are present in header links (for cloning)
    try{
      const nav = document.getElementById('main-menu') || document.querySelector('.menu');
      if (nav){
        nav.querySelectorAll('a').forEach(a=>{
          const key = (a.getAttribute('href')||'').toLowerCase();
          if (/wallet/.test(key)) a.classList.add('wallet-link');
          if (/carbon-lab/.test(key)) a.classList.add('lab-link');
          if (/marketplace/.test(key)) a.classList.add('marketplace-link');
        });
      }
    }catch(e){}
  }

  if (document.readyState === "loading"){ document.addEventListener("DOMContentLoaded", init); }
  else { init(); }
  setTimeout(init, 400); // late injections
})();
