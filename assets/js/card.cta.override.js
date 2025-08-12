
/* === Product Card CTA Override (label -> "Get it") =========================
   Drop-in after assets/js/app.js. It overrides renderProducts to use a
   price-free CTA that simply says "Get it" while keeping Add-to-Cart behavior.
============================================================================= */
(function(){
  if (window.__ghsCardCtaOverride) return; window.__ghsCardCtaOverride = true;
  const original = window.renderProducts;

  function currency(n){ try{ return new Intl.NumberFormat(undefined,{style:"currency",currency:"EUR"}).format(n).replace(/\u00a0/g,' ');}catch(e){return "€"+Number(n).toFixed(2);} }

  window.renderProducts = function(containerId, items){
    const el = document.getElementById(containerId) || document.querySelector(containerId);
    if (!el) return;

    const list = Array.isArray(items) ? items : (window.State && Array.isArray(State.products)) ? State.products : [];

    // Build card HTML with "Get it" CTA
    el.innerHTML = list.map(p => {
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
            <button class="p-add" data-add="${p.id}" aria-label="Get ${p.name} now">Get it</button>
          </div>
        </div>
      </article>`;
    }).join("");

    // Event delegation for add buttons
    el.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-add]");
      if (!btn) return;
      const id = parseInt(btn.getAttribute("data-add"), 10);
      if (!isNaN(id) && typeof window.addToCart === "function") window.addToCart(id);
    }, { passive: true });
  };

  // Re-render if a grid is present (so the new label appears immediately)
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("products-grid")) window.renderProducts("products-grid", (window.State && State.products) || []);
    if (document.getElementById("market-grid")) window.renderProducts("market-grid", (window.State && State.products) || []);
  });
})();
