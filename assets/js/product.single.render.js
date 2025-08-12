// === Product Single: render content from Catalog/State =======================
(function(){
  function getId(){
    try{ const id = parseInt(new URL(location.href).searchParams.get('id'), 10);
      return isNaN(id) ? null : id; }catch(e){ return null; }
  }
  function guessDesc(p){
    const map = {
      Apparel: "Soft, breathable hemp-blend tee for everyday wear.",
      Food: "Clean plant protein from sustainably grown hemp.",
      Construction: "Durable, low-carbon hempcrete component.",
      Wellness: "Cold-pressed hemp goodness for skin vitality.",
      Accessories: "Sturdy, natural-fiber carry-all.",
      Industrial: "High-tensile natural fiber rope for daily tasks."
    };
    return p.desc || map[p.category] || "Premium hemp-based product.";
  }
  function co2Estimate(p){
    const perCat = { Apparel: "0.7 kg CO₂e", Food: "0.4 kg CO₂e", Construction: "1.2 kg CO₂e", Wellness: "0.3 kg CO₂e", Accessories: "0.5 kg CO₂e", Industrial: "0.6 kg CO₂e" };
    return perCat[p.category] || "—";
  }
  function render(){
    const pid = getId();
    const list = (window.State && Array.isArray(State.products) && State.products.length) ? State.products : (window.Catalog || []);
    const p = list.find(x=> String(x.id) === String(pid)) || list[0];
    if (!p) return;

    // Fill media and text
    const img = p.image || p.img || p.thumbnail || "";
    const imgSrc = /^assets\\//.test(img) ? img : ("assets/img/products/" + img);
    document.getElementById('p-img').setAttribute('src', imgSrc);
    document.getElementById('p-name').textContent = p.name;
    document.getElementById('p-desc').textContent = guessDesc(p);
    const brand = p.brand || p.vendor || p.company || "—";
    document.getElementById('p-brand-badge').textContent = brand;
    document.getElementById('p-category-pill').textContent = p.category || "";
    document.getElementById('p-provenance').textContent = brand;
    document.getElementById('p-wetas-per').textContent = (window.TokenRules && TokenRules[p.category]) || 1;
    document.getElementById('p-co2').textContent = co2Estimate(p);
    document.getElementById('p-trace').textContent = "GHS-" + (p.category||"HEMP").toUpperCase().slice(0,4) + "-" + String(p.id).padStart(4,'0');

    // Brand links
    const brandHref = "brand.html?name=" + encodeURIComponent(brand);
    const bl = document.getElementById('p-brand-link'); if (bl) bl.setAttribute('href', brandHref);
    const vb = document.getElementById('btn-viewbrand'); if (vb) vb.setAttribute('href', brandHref);

    // Bind Get it button
    const btn = document.getElementById('btn-getit');
    if (btn){
      btn.setAttribute('data-add', String(p.id));
      // click handling delegated to product.add.bind.js (capture + toast)
    }

    // Title
    try{ document.title = p.name + " • Global Hemp Service"; }catch(e){}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
