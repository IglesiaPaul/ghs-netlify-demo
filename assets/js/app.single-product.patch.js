/* Augment: Catalog details + single product view + WETAS card + optional link wrapper */
if (typeof storage === "undefined") {
  var storage = (() => {
    try { const t="__ghs_t"; localStorage.setItem(t,"1"); localStorage.removeItem(t);
      return { get:(k)=>localStorage.getItem(k), set:(k,v)=>localStorage.setItem(k,v), remove:(k)=>localStorage.removeItem(k) };
    } catch(e){ const mem={}; return { get:(k)=>mem[k]||null, set:(k,v)=>{mem[k]=v}, remove:(k)=>{delete mem[k]} }; }
  })();
}
if (typeof STORAGE === "undefined") { var STORAGE = { cart:"ghs_cart", tokens:"ghs_tokens" }; }
if (typeof DefaultTokens === "undefined") { var DefaultTokens = { balance:120, tier:"Green" }; }
if (typeof State === "undefined") {
  var State = { cart:[], user:{ name:"Guest", country:Intl.DateTimeFormat().resolvedOptions().timeZone||"Local", currency:(Intl.NumberFormat().resolvedOptions().currency)||"EUR" }, tokens:{...DefaultTokens} };
}
if (typeof saveState === "undefined") {
  function saveState(){ try{ storage.set(STORAGE.cart, JSON.stringify(State.cart)); storage.set(STORAGE.tokens, JSON.stringify(State.tokens)); }catch(e){} }
  function loadState(){ try{ const c=JSON.parse(storage.get(STORAGE.cart)||"[]"); const t=JSON.parse(storage.get(STORAGE.tokens)||"null"); if(Array.isArray(c)) State.cart=c; if(t&&typeof t==="object") State.tokens=t; }catch(e){} }
  function renderCartBadge(){ const n=State.cart.reduce((a,b)=>a+b.qty,0); const el=document.querySelector("#cart-badge"); if(el) el.textContent=n; }
  document.addEventListener("DOMContentLoaded", ()=>{ loadState(); renderCartBadge(); });
}

const CatalogDetails=[
  {id:1,slug:"hemp-blend-tee",name:"Hemp Blend Tee",vendor:"GreenWeave",vendorSlug:"greenweave",category:"Apparel",price:29,img:"assets/img/products/apparel-tee.jpg",desc:"Soft, breathable hemp-cotton blend tee with minimal water footprint. Pre-washed for comfort.",origin:"Portugal",sku:"GW-TEE-HEMP-001",co2e:{production:2.3,transport:0.4},provenance:"Verified supply chain (EU mills)",specs:{Material:"60% Hemp / 40% Cotton",Weight:"180 gsm",Fit:"Regular",Care:"Machine wash cold"}},
  {id:2,slug:"hemp-protein-powder",name:"Hemp Protein Powder",vendor:"NutriHemp",vendorSlug:"nutrihemp",category:"Food",price:19,img:"assets/img/products/protein-powder.jpg",desc:"Cold-pressed hemp protein with complete amino acid profile. Naturally nutty, no additives.",origin:"Netherlands",sku:"NH-PROT-500",co2e:{production:1.1,transport:0.6},provenance:"Farm-to-jar traceability",specs:{Weight:"500g",Protein:"50%",Allergens:"None",Storage:"Cool & dry"}},
  {id:3,slug:"hempcrete-brick",name:"Hempcrete Brick",vendor:"EcoBuild Co.",vendorSlug:"ecobuild",category:"Construction",price:8,img:"assets/img/products/hempcrete-brick.jpg",desc:"Structural hempcrete brick with excellent insulation and carbon-storing lime binder.",origin:"France",sku:"EB-HCB-STD",co2e:{production:-0.8,transport:0.7},provenance:"Batch QA with lime binder certs",specs:{Size:"300×150×100 mm",Density:"~110 kg/m³",RValue:"High",Use:"Non-load bearing walls"}},
  {id:4,slug:"hemp-facial-oil",name:"Hemp Facial Oil",vendor:"Verdant Glow",vendorSlug:"verdantglow",category:"Wellness",price:24,img:"assets/img/products/facial-oil.jpg",desc:"Lightweight facial oil infused with hemp seed extract for calm, balanced skin.",origin:"Italy",sku:"VG-HEMPOIL-30",co2e:{production:0.6,transport:0.3},provenance:"COSMOS-compliant line",specs:{Volume:"30 ml",Skin:"Sensitive / Combo",Scent:"Herbal",Shelf:"12M PAO"}},
  {id:5,slug:"hemp-tote-bag",name:"Hemp Tote Bag",vendor:"Loom&Leaf",vendorSlug:"loomleaf",category:"Accessories",price:18,img:"assets/img/products/tote-bag.jpg",desc:"Durable hemp tote with reinforced seams — built for markets and daily carry.",origin:"India",sku:"LL-TOTE-H01",co2e:{production:0.9,transport:0.8},provenance:"GOTS-aligned dyehouse",specs:{Size:"38×42 cm",Handle:"62 cm drop",Pocket:"Inner slip",Weight:"240 gsm"}},
  {id:6,slug:"hemp-rope-10m",name:"Hemp Rope 10m",vendor:"Mariner",vendorSlug:"mariner",category:"Industrial",price:12,img:"assets/img/products/rope-coil.jpg",desc:"Natural fiber rope with high grip and low stretch — classic marine utility length (10m).",origin:"UK",sku:"MR-ROPE-10M",co2e:{production:1.2,transport:0.5},provenance:"Audit-backed sourcing",specs:{Length:"10 m",Diameter:"10 mm",Twist:"3-strand",Use:"General purpose"}}
];
const CatalogById=Object.fromEntries(CatalogDetails.map(p=>[p.id,p]));
function q(name,dflt=null){ return new URLSearchParams(location.search).get(name)||dflt; }
function currency(n){ return new Intl.NumberFormat(undefined,{style:"currency",currency:"EUR"}).format(n); }
function tokensFor(p){ const rules={Apparel:2,Food:3,Construction:8,Wellness:2,Accessories:1,Industrial:5}; return rules[p.category]||1; }

function animateXP(el,pct){ if(!el) return; requestAnimationFrame(()=>{ el.style.width=Math.max(0,Math.min(100,pct))+"%"; }); }
function tiltHover(container){ if(!container) return; container.addEventListener("mousemove",(e)=>{ const r=container.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width; const y=(e.clientY-r.top)/r.height; container.style.setProperty("--ry",((x-0.5)*8)+"deg"); container.style.setProperty("--rx",((0.5-y)*6)+"deg"); }); container.addEventListener("mouseleave",()=>{ container.style.setProperty("--ry","0deg"); container.style.setProperty("--rx","0deg"); }); }
function confettiBurst(x=window.innerWidth/2,y=window.innerHeight/2){ const n=18,dur=900; for(let i=0;i<n;i++){ const s=document.createElement("span"); s.style.cssText=`position:fixed; left:${x}px; top:${y}px; width:8px; height:8px; background:${i%3?"#38E2B5":"#8cf5db"}; border-radius:2px; transform:translate(-50%,-50%); pointer-events:none; z-index:3000;`; document.body.appendChild(s); const a={x:(Math.random()*2-1)*180, y:(Math.random()*-1-0.2)*240, r:(Math.random()*360)}; s.animate([{transform:`translate(-50%,-50%) rotate(0deg)`},{transform:`translate(${a.x}px, ${a.y}px) rotate(${a.r}deg)`}],{duration:dur, easing:"cubic-bezier(.22,.61,.36,1)"}).onfinish=()=>s.remove(); } }

function renderProductDetail(){
  const id=parseInt(q("id","0"),10);
  const p=CatalogById[id];
  const root=document.getElementById("product-root");
  if(!root){ return; }
  if(!p){ root.innerHTML=`<div class="card"><b>Product not found.</b> <a href="marketplace.html">Back to marketplace</a></div>`; return; }
  const tokens=tokensFor(p);
  const co2eTotal=p.co2e.production+p.co2e.transport;
  root.innerHTML=`
    <div class="product-hero">
      <div class="product-gallery tilt" id="gal">
        <img src="${p.img}" alt="${p.name}" width="1200" height="900"/>
      </div>
      <div class="product-info">
        <div class="chips">
          <span class="chip">${p.vendor}</span>
          <span class="chip">${p.category}</span>
          <span class="chip">SKU: ${p.sku}</span>
          <span class="chip">Origin: ${p.origin}</span>
        </div>
        <h1>${p.name}</h1>
        <div class="price-lg">${currency(p.price)}</div>
        <p>${p.desc}</p>
        <div class="card-neo" role="region" aria-label="WETAS ID">
          <div class="row">
            <div><b>WETAS ID</b> <span class="id">#${String(p.id).padStart(4,"0")}-${p.vendorSlug}</span></div>
            <div class="badge-verify">Verified provenance</div>
          </div>
          <div class="kpi">
            <div class="box">
              <div class="label">Estimated CO₂e (production + transport)</div>
              <div class="value">${co2eTotal.toFixed(1)} kg</div>
            </div>
            <div class="box">
              <div class="label">WETAS on purchase</div>
              <div class="value">+${tokens} WETAS</div>
            </div>
          </div>
          <div class="xp">
            <div class="label">Impact meter</div>
            <div class="bar"><div class="fill" id="xp-fill"></div></div>
          </div>
          <div class="small" style="margin-top:8px;opacity:.85">
            Provenance: ${p.provenance}. <a href="vendor.html?v=${encodeURIComponent(p.vendorSlug)}">View brand profile →</a>
          </div>
        </div>
        <div class="actions-row">
          <button class="btn" id="add-btn">Add to cart</button>
          <a class="btn ghost" href="wallet.html">Open wallet</a>
          <a class="btn ghost" href="vendor.html?v=${encodeURIComponent(p.vendorSlug)}">Explore brand</a>
        </div>
        <div class="card" style="margin-top:8px">
          <b>Specs</b>
          <div class="grid cols-3" style="margin-top:8px">
            ${Object.entries(p.specs).map(([k,v])=>`<div class="small"><b>${k}:</b> ${v}</div>`).join("")}
          </div>
        </div>
      </div>
    </div>`;
  tiltHover(document.getElementById("gal"));
  const xp=document.getElementById("xp-fill"); const pct=Math.min(100,Math.max(10,Math.round((tokens/8)*100))); animateXP(xp,pct);
  const btn=document.getElementById("add-btn");
  if(btn){ btn.addEventListener("click",(e)=>{ if(typeof addToCart==="function") addToCart(p.id); confettiBurst(e.clientX||window.innerWidth/2, e.clientY||window.innerHeight/2); }); }
}

/* Optional: if site still uses old renderProducts, link cards to product page */
(function patchRenderProducts(){
  if (typeof renderProducts !== "function") return;
  const orig = renderProducts;
  window.renderProducts = function(target="#product-grid"){
    orig.call(this, target);
    const grid = document.querySelector(target);
    if(!grid) return;
    grid.querySelectorAll(".product").forEach((card)=>{
      const id = parseInt(card.getAttribute("data-id") || "0", 10) || Array.from(grid.children).indexOf(card)+1;
      const img = card.querySelector("img");
      const title = card.querySelector("h4");
      if (img && !img.parentElement.closest("a")) {
        const link = document.createElement("a");
        link.href = `product.html?id=${id}`; link.setAttribute("aria-label","View product");
        img.replaceWith(img.cloneNode(true));
        link.appendChild(card.querySelector("img") || img);
        card.insertBefore(link, card.firstChild);
      }
      if (title && !title.querySelector("a")){
        const t = title.textContent;
        title.innerHTML = `<a href="product.html?id=${id}">${t}</a>`;
      }
    });
  }
})();