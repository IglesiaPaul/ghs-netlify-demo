
/* === Marketplace Force Render — Hardened v2 ================================
   Why this exists:
   - Ensures cards appear even if auto-init is skipped or script order changes.
   - Works with both original renderProducts (expects p.image) and the override
     (accepts p.image or p.img).
============================================================================= */
(function(){
  var tries = 0, maxTries = 12; // ~12 * 150ms = 1.8s
  function sampleProducts(){
    // Provide both image + img so either renderer works
    return [
      { id: 1, name: "Hemp Blend Tee", brand:"GreenWeave", vendor:"GreenWeave", category: "Apparel", image: "apparel-tee.png", img: "assets/img/products/apparel-tee.png" },
      { id: 2, name: "Hemp Protein Powder", brand:"NutriHemp", vendor:"NutriHemp", category: "Food", image: "protein-powder.png", img: "assets/img/products/protein-powder.png" },
      { id: 3, name: "Hempcrete Brick", brand:"EcoBuild Co.", vendor:"EcoBuild Co.", category: "Construction", image: "hempcrete-brick.png", img: "assets/img/products/hempcrete-brick.png" },
      { id: 4, name: "Hemp Facial Oil", brand:"Verdant Glow", vendor:"Verdant Glow", category: "Wellness", image: "facial-oil.png", img: "assets/img/products/facial-oil.png" },
      { id: 5, name: "Hemp Tote Bag", brand:"Loom&Leaf", vendor:"Loom&Leaf", category: "Accessories", image: "tote-bag.png", img: "assets/img/products/tote-bag.png" },
      { id: 6, name: "Hemp Rope 10m", brand:"Mariner", vendor:"Mariner", category: "Industrial", image: "rope-coil.png", img: "assets/img/products/rope-coil.png" },
    ];
  }
  function getList(){
    if (window.State && Array.isArray(State.products) && State.products.length) return State.products;
    if (window.Catalog && Array.isArray(window.Catalog) && window.Catalog.length) return window.Catalog;
    return sampleProducts();
  }
  function onceRendered(grid){
    return !!grid.querySelector('.p-card');
  }
  function tick(){
    var grid = document.getElementById('market-grid');
    if (!grid){ if (tries===0) console.warn('[GHS] market-grid not found'); return; }

    if (typeof window.renderProducts !== 'function'){
      if (tries===0) console.warn('[GHS] renderProducts not ready yet; waiting...');
      if (++tries <= maxTries) return void setTimeout(tick, 150);
      console.error('[GHS] renderProducts never appeared. Is assets/js/app.js loaded?');
      return;
    }

    var list = getList();
    try{
      window.renderProducts('market-grid', list);
    }catch(e){
      console.error('[GHS] renderProducts threw:', e);
      return;
    }

    setTimeout(function(){
      if (!onceRendered(grid)){
        if (++tries <= maxTries){
          console.warn('[GHS] Cards not visible yet, retry', tries, 'of', maxTries);
          setTimeout(tick, 150);
        } else {
          console.error('[GHS] Gave up after retries. Debug:', {
            hasRenderProducts: typeof window.renderProducts,
            productsLen: (list && list.length) || 0,
            hasState: !!window.State,
            appVersion: (window.GHS && GHS.version) || 'n/a'
          });
        }
      }
    }, 0);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick);
  else tick();
})();
