/* Product Single: ensure "Get it" adds to cart (capture, single bind) */
(function(){
  if (window.__ghsProductBinder) return; window.__ghsProductBinder = true;
  function idFromUrl(){ try{ const v = parseInt(new URL(location.href).searchParams.get('id'),10); return isNaN(v)?null:v; }catch(e){ return null; } }
  function bind(){
    const pid = idFromUrl();
    let btn = document.querySelector('[data-add]') || document.getElementById('add-to-cart') || document.querySelector('.p-add') || document.querySelector('.actions button, .cta-row button');
    if(!btn) return;
    if (!btn.getAttribute('data-add') && pid) btn.setAttribute('data-add', String(pid));
    if (btn.__ghsBound) return;
    btn.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      const idAttr = parseInt(btn.getAttribute('data-add') || '', 10);
      const id = (!isNaN(idAttr) ? idAttr : pid);
      if (typeof window.addToCart === 'function' && !isNaN(id)) addToCart(id);
    }, true);
    btn.__ghsBound = true;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();