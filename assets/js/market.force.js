
/* === Marketplace force render (debug helper) ================================
   Ensures cards render even if auto-init got skipped. Logs helpful info.
============================================================================= */
(function(){
  function forceRender(){
    var grid = document.getElementById('market-grid');
    if (!grid) { console.warn('[GHS] market-grid not found'); return; }

    var sourceList = (window.State && Array.isArray(State.products) && State.products.length)
      ? State.products
      : (window.Catalog && Array.isArray(window.Catalog) ? window.Catalog : []);

    // Fallback sample list if nothing found (should never be needed)
    if (!sourceList.length){
      sourceList = [
        { id: 1, name: "Hemp Blend Tee", vendor: "GreenWeave", category: "Apparel", img: "assets/img/products/apparel-tee.png" },
        { id: 2, name: "Hemp Protein Powder", vendor: "NutriHemp", category: "Food", img: "assets/img/products/protein-powder.png" },
        { id: 3, name: "Hempcrete Brick", vendor: "EcoBuild Co.", category: "Construction", img: "assets/img/products/hempcrete-brick.png" },
        { id: 4, name: "Hemp Facial Oil", vendor: "Verdant Glow", category: "Wellness", img: "assets/img/products/facial-oil.png" },
        { id: 5, name: "Hemp Tote Bag", vendor: "Loom&Leaf", category: "Accessories", img: "assets/img/products/tote-bag.png" },
        { id: 6, name: "Hemp Rope 10m", vendor: "Mariner", category: "Industrial", img: "assets/img/products/rope-coil.png" },
      ];
    }

    if (typeof window.renderProducts === 'function'){
      window.renderProducts('market-grid', sourceList);
    } else {
      console.warn('[GHS] renderProducts missing. app.js not loaded?');
    }

    setTimeout(function(){
      var ok = grid.querySelector('.p-card');
      if (!ok){
        console.error('[GHS] Cards still missing. Debug info:', {
          hasRenderProducts: typeof window.renderProducts,
          productsLen: (sourceList && sourceList.length) || 0,
          hasState: !!window.State,
          cartCount: (window.State && Array.isArray(State.cart)) ? State.cart.length : 'n/a'
        });
      }
    }, 60);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', forceRender);
  else forceRender();
})();
