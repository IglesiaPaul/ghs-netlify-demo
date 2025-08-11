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

function renderProducts(target = "#product-grid") {
  const grid = document.querySelector(target);
  if (!grid) return;
  grid.innerHTML = "";
  for (const p of Catalog) {
    const card = document.createElement("div");
    card.className = "product";
    card.setAttribute("data-id", String(p.id));
    card.innerHTML = `
      <a href="product.html?id=${p.id}" aria-label="View ${p.name}">
        <img src="${p.img}" alt="${p.name}" loading="lazy" width="800" height="600"/>
      </a>
      <div class="p-body">
        <div class="tag">${p.vendor}</div>
        <h4><a href="product.html?id=${p.id}">${p.name}</a></h4>
        <div class="price">${currency(p.price).replace(/\u00a0/g,' ')}</div>
        <button class="btn" data-add="${p.id}">Add to cart</button>
      </div>
    `;
    grid.appendChild(card);
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

/* === Inject "Carbon Lab" nav link + styles on every page === */
(function () {
  // 1) Add the twist/glow styles if not present
  if (!document.getElementById("lab-link-style")) {
    const css = `
      .menu a.lab-link{position:relative; display:inline-block; border-radius:999px; padding:6px 10px; font-weight:700; overflow:hidden; border:1px solid #d9f8ef}
      .menu a.lab-link::before{content:""; position:absolute; inset:-30%; background:conic-gradient(from 0deg, rgba(56,226,181,.4), transparent 40%, rgba(56,226,181,.35) 60%, transparent 100%); animation:twist 4.8s linear infinite; z-index:0; filter:blur(10px)}
      .menu a.lab-link span{position:relative; z-index:1}
      @keyframes twist{ to { transform:rotate(360deg);} }
      @media (prefers-reduced-motion: reduce){ .menu a.lab-link::before{ animation:none !important } }
    `;
    const style = document.createElement("style");
    style.id = "lab-link-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // 2) Add the nav link if it's missing
  function addLink() {
    const nav = document.querySelector("#main-menu") || document.querySelector(".menu");
    if (!nav) return;

    // Already there? bail.
    if (nav.querySelector('a[href$="carbon-lab.html"]')) return;

    const link = document.createElement("a");
    link.className = "lab-link";
    link.href = "carbon-lab.html";
    link.innerHTML = '<span>Carbon Lab ✨</span>';

    // Try to place it right after "Carbon Program" if that exists
    const afterCarbon = Array.from(nav.querySelectorAll("a")).find(a =>
      /carbon\s*program/i.test(a.textContent || "")
    );
    if (afterCarbon && afterCarbon.parentNode) {
      afterCarbon.insertAdjacentElement("afterend", link);
    } else {
      // Otherwise put it near the front
      nav.insertAdjacentElement("afterbegin", link);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addLink);
  } else {
    addLink();
  }
})();

/* === Mobile menu fix (idempotent) === */
(function () {
  if (window.__ghsMenuInit) return; // don't double-init
  window.__ghsMenuInit = true;

  // 1) Ensure minimal CSS exists
  if (!document.getElementById("ghs-menu-style")) {
    const style = document.createElement("style");
    style.id = "ghs-menu-style";
    style.textContent = `
      #menu-overlay{position:fixed; inset:0; background:rgba(0,0,0,.2); opacity:0; pointer-events:none; transition:opacity .2s; z-index:1500}
      #menu-overlay.open{opacity:1; pointer-events:auto}
      .menu-panel{position:fixed; top:0; left:0; bottom:0; width:min(78vw,360px); max-width:90%;
        transform:translateX(-110%); transition:transform .2s; background:#fff; padding:16px; z-index:2000; overflow:auto; box-shadow:0 20px 60px rgba(0,0,0,.2)}
      .menu-panel.open{transform:translateX(0)}
      @media (min-width: 900px){
        .menu-panel{position:static; transform:none; width:auto; box-shadow:none; padding:0}
        #menu-overlay{display:none}
      }
    `;
    document.head.appendChild(style);
  }

  function setupMobileMenu() {
    const btn = document.getElementById("menu-toggle");
    const panel = document.getElementById("main-menu") || document.querySelector(".menu");
    let overlay = document.getElementById("menu-overlay");
    if (!overlay) { overlay = document.createElement("div"); overlay.id = "menu-overlay"; document.body.prepend(overlay); }
    if (!btn || !panel) return;

    function open() {
      panel.classList.add("open");
      overlay.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      trapFocus();
    }
    function close() {
      panel.classList.remove("open");
      overlay.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      releaseFocus();
    }
    function toggle() { panel.classList.contains("open") ? close() : open(); }

    btn.addEventListener("click", toggle);
    overlay.addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    panel.addEventListener("click", (e) => { if (e.target.tagName === "A") close(); });

    // simple focus trap
    let lastFocus = null;
    function trapFocus(){
      lastFocus = document.activeElement;
      panel.addEventListener("keydown", loop);
      const f = panel.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
      if (f.length) f[0].focus();
    }
    function loop(e){
      if (e.key !== "Tab") return;
      const f = panel.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
      const first = f[0], last = f[f.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    function releaseFocus(){ panel.removeEventListener("keydown", loop); if (lastFocus) lastFocus.focus(); }

    // expose (optional)
    window.openSiteMenu = open;
    window.closeSiteMenu = close;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupMobileMenu);
  } else {
    setupMobileMenu();
  }
})();


