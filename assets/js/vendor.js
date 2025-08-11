/* ===== Brand (Vendor) Single View logic ===== */
(function(){
  const Vendors = {
    greenweave: { name:"GreenWeave", country:"Portugal", tagline:"Soft fiber, softer footprint.", founded:"2018", categories:["Apparel","Lifestyle"], provenance:"Verified spinning + EU mill chain.", metrics:{ co2e_saved:"12.4 t", renewable:"72%", circular:"38%" } },
    nutrihemp: { name:"NutriHemp", country:"Netherlands", tagline:"Protein with provenance.", founded:"2016", categories:["Food","Nutrition"], provenance:"Farm-to-jar traceability with batch IDs.", metrics:{ co2e_saved:"6.1 t", renewable:"54%", circular:"22%" } },
    ecobuild: { name:"EcoBuild Co.", country:"France", tagline:"Carbon-storing materials for real buildings.", founded:"2015", categories:["Construction","Materials"], provenance:"Lime binder certificates + batch QA.", metrics:{ co2e_saved:"48.7 t", renewable:"81%", circular:"45%" } },
    verdantglow: { name:"Verdant Glow", country:"Italy", tagline:"Botanical care that plays nice with skin.", founded:"2019", categories:["Wellness","Beauty"], provenance:"COSMOS-aligned line with audited suppliers.", metrics:{ co2e_saved:"3.3 t", renewable:"68%", circular:"28%" } },
    loomleaf: { name:"Loom&Leaf", country:"India", tagline:"Everyday carry, built to last.", founded:"2014", categories:["Accessories","Textiles"], provenance:"GOTS-aligned dyehouse & reinforced stitching.", metrics:{ co2e_saved:"5.6 t", renewable:"62%", circular:"31%" } },
    mariner: { name:"Mariner", country:"UK", tagline:"Classic rope for modern work.", founded:"2009", categories:["Industrial","Marine"], provenance:"Audit-backed sourcing and twist QA.", metrics:{ co2e_saved:"9.8 t", renewable:"49%", circular:"19%" } }
  };

  function q(name, dflt=null){ return new URLSearchParams(location.search).get(name) || dflt; }
  function el(sel){ return document.querySelector(sel); }
  function currency(n){ return new Intl.NumberFormat(undefined,{style:"currency",currency:"EUR"}).format(n); }

  const followKey = slug => `ghs_follow_vendor_${slug}`;
  function isFollowed(slug){ try{ return localStorage.getItem(followKey(slug)) === "1"; }catch(e){ return false; } }
  function setFollow(slug, on){ try{ if(on) localStorage.setItem(followKey(slug), "1"); else localStorage.removeItem(followKey(slug)); }catch(e){} }
  function initialLetter(name){ return (name||"?").trim().charAt(0).toUpperCase(); }

  function renderProductsForVendor(slug){
    const grid = el("#vendor-products");
    if(!grid) return;
    let items = [];
    try{
      if (typeof Catalog !== "undefined" && Array.isArray(Catalog)) {
        items = Catalog.filter(p => (p.vendor||"").toLowerCase().replace(/[^a-z]/g,"") === slug.replace(/[^a-z]/g,""));
      }
    }catch(e){}
    if(!items.length){ grid.innerHTML = `<div class="small">No products found for this brand (yet!).</div>`; return; }
    grid.innerHTML = "";
    for(const p of items){
      const a = document.createElement("a");
      a.href = `product.html?id=${p.id}`;
      a.className = "product-card";
      a.innerHTML = `
        <img src="${p.img}" alt="${p.name}" loading="lazy" width="800" height="600"/>
        <div class="p">
          <div class="vendor">${p.vendor}</div>
          <div class="t">${p.name}</div>
          <div class="price">${currency(p.price).replace(/\\u00a0/g,' ')}</div>
        </div>`;
      grid.appendChild(a);
    }
  }

  function renderVendor(){
    const slug = (q("v","")||"").toLowerCase();
    const v = Vendors[slug];
    const root = el("#vendor-root");
    if(!root){ return; }
    if(!v){ root.innerHTML = `<div class="card"><b>Brand not found.</b> <a href="marketplace.html">Back to marketplace</a></div>`; return; }

    const followed = isFollowed(slug);
    root.innerHTML = `
      <div class="vendor-hero">
        <div class="vendor-cover"></div>
        <div class="vendor-row">
          <div class="vendor-logo" aria-label="Brand logo">${initialLetter(v.name)}</div>
          <div style="flex:1">
            <h1 class="vendor-name">${v.name}</h1>
            <div class="small">${v.tagline}</div>
            <div class="vendor-chiprow">
              <span class="vchip">${v.country}</span>
              <span class="vchip">Founded ${v.founded}</span>
              ${v.categories.map(c=>`<span class="vchip">${c}</span>`).join("")}
            </div>
            <div class="actions-row">
              <button class="follow-btn ${followed ? "" : "outline"}" id="follow-btn">${followed ? "Following" : "Follow brand"}</button>
              <a class="btn ghost" href="marketplace.html">View marketplace</a>
            </div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card-neo" role="region" aria-label="WETAS & Provenance">
          <div class="row">
            <div><b>WETAS & Provenance</b></div>
            <div class="badge-verify">Verified</div>
          </div>
          <div class="kpi">
            <div class="box"><div class="label">CO₂e saved to date</div><div class="value">${v.metrics.co2e_saved}</div></div>
            <div class="box"><div class="label">Renewable energy</div><div class="value">${v.metrics.renewable}</div></div>
            <div class="box"><div class="label">Circular materials</div><div class="value">${v.metrics.circular}</div></div>
          </div>
          <div class="small" style="margin-top:10px">Provenance: ${v.provenance}</div>
        </div>

        <div class="card contact-card">
          <h3>Contact ${v.name}</h3>
          <form name="brand-inquiry" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thank-you">
            <input type="hidden" name="form-name" value="brand-inquiry">
            <input type="hidden" name="brand" value="${v.name}">
            <p style="display:none"><label>Don’t fill this out: <input name="bot-field"></label></p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
              <input name="name" placeholder="Your name" required>
              <input name="email" placeholder="Email" type="email" required>
            </div>
            <textarea name="message" placeholder="Message for the brand" required></textarea>
            <div style="margin-top:10px"><button class="btn">Send</button></div>
          </form>
          <div class="small" style="margin-top:6px">Goes to your Netlify Forms.</div>
        </div>
      </div>

      <div class="section">
        <h3>Products by ${v.name}</h3>
        <div class="prod-grid" id="vendor-products"></div>
      </div>
    `;

    const fb = el("#follow-btn");
    if (fb){
      fb.addEventListener("click", ()=>{
        const on = fb.classList.contains("outline");
        setFollow(slug, on);
        fb.classList.toggle("outline");
        fb.textContent = fb.classList.contains("outline") ? "Follow brand" : "Following";
        if (navigator.vibrate) try{ navigator.vibrate(12); }catch(e){}
      }, {passive:true});
    }

    renderProductsForVendor(slug);
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    try{ renderVendor(); }catch(e){ console.error(e); }
  });
})();