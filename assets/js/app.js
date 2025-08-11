
const State = {
  cart: [],
  user: {
    name: "Guest",
    country: Intl.DateTimeFormat().resolvedOptions().timeZone || "Local",
    currency: (Intl.NumberFormat().resolvedOptions().currency) || "EUR"
  },
  tokens: { balance: 120, tier: "Green" },
};

const Catalog = [
  {id:1, name:"Hemp Blend Tee", vendor:"GreenWeave", category:"Apparel", price:29, img:"assets/img/ph1.svg"},
  {id:2, name:"Hemp Protein Powder", vendor:"NutriHemp", category:"Food", price:19, img:"assets/img/ph2.svg"},
  {id:3, name:"Hempcrete Brick", vendor:"EcoBuild Co.", category:"Construction", price:8, img:"assets/img/ph3.svg"},
  {id:4, name:"Hemp Facial Oil", vendor:"Verdant Glow", category:"Wellness", price:24, img:"assets/img/ph4.svg"},
  {id:5, name:"Hemp Tote Bag", vendor:"Loom&Leaf", category:"Accessories", price:18, img:"assets/img/ph5.svg"},
  {id:6, name:"Hemp Rope 10m", vendor:"Mariner", category:"Industrial", price:12, img:"assets/img/ph6.svg"}
];

const TokenRules = {
  "Apparel": 2,
  "Food": 3,
  "Construction": 8,
  "Wellness": 2,
  "Accessories": 1,
  "Industrial": 5
};

function addToCart(id){
  const p = Catalog.find(x=>x.id===id);
  if(!p) return;
  const found = State.cart.find(x=>x.id===id);
  if(found){ found.qty += 1; } else { State.cart.push({...p, qty:1}) }
  renderCartBadge();
  alert(`Added to cart: ${p.name}`);
}

function renderCartBadge(){
  const n = State.cart.reduce((a,b)=>a+b.qty,0);
  const el = document.querySelector("#cart-badge");
  if(el){ el.textContent = n; }
}

function currency(n){ return new Intl.NumberFormat(undefined, {style:"currency", currency:"EUR"}).format(n); }

function renderProducts(target="#product-grid"){
  const grid = document.querySelector(target);
  if(!grid) return;
  grid.innerHTML = "";
  for(const p of Catalog){
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <img src="${p.img}" alt="${p.name}"/>
      <div class="p-body">
        <div class="tag">${p.vendor}</div>
        <h4>${p.name}</h4>
        <div class="price">€${p.price}</div>
        <button class="btn" onclick="addToCart(${p.id})">Add to cart</button>
      </div>
    `;
    grid.appendChild(div);
  }
}

function renderCartPage(){
  const table = document.querySelector("#cart-table");
  const totalEl = document.querySelector("#cart-total");
  const tokensEl = document.querySelector("#cart-tokens");
  if(!table) return;
  table.innerHTML = "";
  let total = 0, tokens = 0;
  for(const item of State.cart){
    const line = item.price * item.qty;
    total += line;
    tokens += (TokenRules[item.category] || 1) * item.qty;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.name}</td><td>${item.vendor}</td><td>${item.category}</td><td>${item.qty}</td><td>€${line}</td>`;
    table.appendChild(tr);
  }
  if(totalEl) totalEl.textContent = "€"+total;
  if(tokensEl) tokensEl.textContent = tokens + " WETAS";
}

function checkout(){
  const tokensEarned = State.cart.reduce((sum, i)=> sum + (TokenRules[i.category]||1)*i.qty, 0);
  State.tokens.balance += tokensEarned;
  State.cart = [];
  renderCartBadge();
  alert(`Checkout simulated!\nWETAS earned: ${tokensEarned}`);
  window.location.href = "wallet.html";
}

function renderWallet(){
  const bal = document.querySelector("#token-balance");
  const tier = document.querySelector("#token-tier");
  if(bal) bal.textContent = State.tokens.balance;
  if(tier) tier.textContent = State.tokens.tier;
  const spot = document.querySelector("#spotlight");
  if(spot){
    spot.innerHTML = `
      <div class="card"><b>Buy 2 Apparel</b> → +10 WETAS bonus</div>
      <div class="card"><b>EcoBuild Co. week</b> → 5% off hempcrete</div>
      <div class="card"><b>WETAS Impact</b> → Your last order stored 2.4kg CO₂e</div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderCartBadge();
});
