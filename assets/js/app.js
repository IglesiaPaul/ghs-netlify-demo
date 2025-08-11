
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
  { id: 1, name: "Hemp Blend Tee", vendor: "GreenWeave", category: "Apparel", price: 29, img: "assets/img/products/apparel-tee.jpg" },
  { id: 2, name: "Hemp Protein Powder", vendor: "NutriHemp", category: "Food", price: 19, img: "assets/img/products/protein-powder.jpg" },
  { id: 3, name: "Hempcrete Brick", vendor: "EcoBuild Co.", category: "Construction", price: 8, img: "assets/img/products/hempcrete-brick.jpg" },
  { id: 4, name: "Hemp Facial Oil", vendor: "Verdant Glow", category: "Wellness", price: 24, img: "assets/img/products/facial-oil.jpg" },
  { id: 5, name: "Hemp Tote Bag", vendor: "Loom&Leaf", category: "Accessories", price: 18, img: "assets/img/products/tote-bag.jpg" },
  { id: 6, name: "Hemp Rope 10m", vendor: "Mariner", category: "Industrial", price: 12, img: "assets/img/products/rope-coil.jpg" },
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
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <img src="${p.img}" alt="${p.name}" loading="lazy" width="800" height="600"/>
      <div class="p-body">
        <div class="tag">${p.vendor}</div>
        <h4>${p.name}</h4>
        <div class="price">€${p.price}</div>
        <button class="btn" onclick="addToCart(${p.id})">Add to cart</button>
      </div>`;
    grid.appendChild(div);
  }
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
    tr.innerHTML = `<td>${item.name}</td><td>${item.vendor}</td><td>${item.category}</td><td>${item.qty}</td><td>€${line}</td>`;
    table.appendChild(tr);
  }
  if (totalEl) totalEl.textContent = "€" + total;
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
  btn.addEventListener("click", () => { menu.classList.contains("open") ? close() : open(); });
  overlay.addEventListener("click", close);
  menu.addEventListener("click", (e) => { if (e.target.tagName === "A") close(); });
}

/* --------------- Init --------------- */
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  renderCartBadge();
  setupMobileMenu();

  // If any tour elements exist from older HTML, remove them.
  for (const sel of ["#tour-fab", "#tour-overlay", "#tour-card"]) {
    const el = document.querySelector(sel);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  // Wire Reset button if present
  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) resetBtn.addEventListener("click", (e) => { e.preventDefault(); resetDemo(); });
});
