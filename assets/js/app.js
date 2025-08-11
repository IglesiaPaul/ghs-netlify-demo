/* ===== Global Hemp Service — app.js (single source) =====
   - Persists cart + WETAS to localStorage (with safe fallback)
   - Mobile menu (overlay + hamburger)
   - Product grid renders with links to product.html?id=...
   - Lazy-loaded images with fixed intrinsic size to prevent layout shift
   - No investor tour code
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
    country: Intl.DateTimeFormat().resolvedOptions().timeZone || "Local",
    currency: (Intl.NumberFormat().resolvedOptions().currency) || "EUR",
  },
  tokens: { ...DefaultTokens },
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

/* --------------- Reset --------------- */
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

/* --------------- Cart + Wallet --------------- */
function addToCart(id) {
  const p = Catalog.find((x) => x.id === id);
  if (!p) return;
  const found = State.cart.find((x) => x.id === id);
  if (found) found.qty += 1;
  else State.cart.push({ ...p, qty: 1 });
  saveState();
  renderCartBadge();
  // Small haptic/feedback on mobile (vibrate if supported)
  if (navigator.vibrate) try { navigator.vibrate(16); } catch(e){}
  alert(`Added to cart: ${p.name}`);
}

function renderCartBadge() {
  const n = State.cart.reduce((a, b) => a + b.qty, 0);
  const el = document.querySelector("#cart-badge");
  if (el) el.textContent = n;
}

function currency(n) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(n);
}

/* === Unified product renderer (home hero cards) === */
function renderProducts(containerId, items) {
  const el = document.getElementById(containerId) || document.querySelector(containerId);
  if (!el) return;

  // If your grid container is INSIDE a <section class="home-hero"> wrapper,
  // leave this as-is. (See Step 4 below.)
  if (!el.classList.contains('grid')) {
    el.classList.add('grid');
  }

  el.innerHTML = (items || []).map(p => {
    const price = (p.price != null) ? Number(p.price).toFixed(2) : "";
    const brand = p.brand || p.company || "";
    const category = p.category || "";
    const img = p.image || p.img || "";
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
          <button class="p-add" data-add="${p.id}" aria-label="Add ${p.name} to cart">${price ? `Add • $${price}` : `Add to cart`}</button>
        </div>
      </div>
    </article>`;
  }).join("");

  // Re-run hero micro-interactions if the page script listens to DOMContentLoaded
  try { if (window.dispatchEvent) window.dispatchEvent(new Event("DOMContentLoaded")); } catch(e){}
}

  // Delegate add-to-cart buttons
  grid.querySelectorAll("button[data-add]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(btn.getAttribute("data-add"), 10);
      addToCart(id);
    });
  });
}

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
    tr.innerHTML = `<td>${item.name}</td><td>${item.vendor}</td><td>${item.category}</td><td>${item.qty}</td><td>${currency(line).replace(/\u00a0/g,' ')}</td>`;
    table.appendChild(tr);
  }
  if (totalEl) totalEl.textContent = currency(total).replace(/\u00a0/g,' ');
  if (tokensEl) tokensEl.textContent = tokens + " WETAS";
}

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

/* --------------- Mobile menu --------------- */
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
  // Auto-close if switching to desktop width
  window.addEventListener("resize", () => { if (window.innerWidth > 900) close(); }, {passive:true});
}

/* --------------- Init --------------- */
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  renderCartBadge();
  setupMobileMenu();
  // Wire Reset button if present
  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) resetBtn.addEventListener("click", (e) => { e.preventDefault(); resetDemo(); });
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
    // Drop trailing slash
    if (p.endsWith("/")) p = p.slice(0,-1);
    // Canonicalize Carbon Lab variants
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
      // Keep the first; remove the rest, and normalize the first
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
        // Canonicalize lab variants to a single key
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

    new MutationObserver(()=>{ ensureSingleLabLink(); rebuild(); })
      .observe(src, {childList:true, subtree:true});

    window.__ghsRebuildOffcanvas = rebuild;
  }

  function init(){
    ensureSingleLabLink();
    initOffcanvas();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  setTimeout(init, 600); // catch late injections
})();

/* === Wallet link highlight (gold glow, low-impact, no balance) === */
(function(){
  if (window.__ghsWalletGlowInit) return;
  window.__ghsWalletGlowInit = true;

  // 1) Inject styles once (works in header .menu and mobile .ghs-menu)
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

  // 2) Tag the Wallet link(s) so clones in the off-canvas keep the look
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
    // If a mobile drawer exists already, re-clone to pick up the class
    if (window.__ghsRebuildOffcanvas) window.__ghsRebuildOffcanvas();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markWalletLinks);
  } else {
    markWalletLinks();
  }
  // Re-apply after any nav mutations (e.g., when Carbon Lab is injected/deduped)
  const nav = document.getElementById('main-menu') || document.querySelector('.menu');
  if (nav) new MutationObserver(markWalletLinks).observe(nav, {childList:true, subtree:true});
  setTimeout(markWalletLinks, 400); // catch late injections
})();

