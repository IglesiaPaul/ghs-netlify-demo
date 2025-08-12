/* === Product Single: Add-to-Cart Binder =====================================
   Makes the "Add / Get it" button on product.html behave like cards.
   - Reads ?id= from URL
   - Finds a button by [data-add], #add-to-cart, .p-add, or a generic button
   - Ensures one click -> one add, with toast + cart badge
============================================================================= */
(function(){
  if (window.__ghsProductBinder) return; window.__ghsProductBinder = true;

  function getId(){
    try{
      const id = parseInt(new URL(location.href).searchParams.get('id'), 10);
      return isNaN(id) ? null : id;
    }catch(e){ return null; }
  }

  function bind(){
    const pid = getId();
    // Prefer existing [data-add] button if present
    let btn = document.querySelector('[data-add]')
          || document.getElementById('add-to-cart')
          || document.querySelector('.p-add')
          || document.querySelector('button.add, button[type="submit"], .actions button');

    if (!btn) return; // nothing to bind

    // Set data-add if missing and we know the id
    if (!btn.getAttribute('data-add') && pid) btn.setAttribute('data-add', String(pid));

    if (btn.__ghsBound) return;
    btn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      const idAttr = parseInt(btn.getAttribute('data-add') || '', 10);
      const id = (!isNaN(idAttr) ? idAttr : pid);
      if (typeof window.addToCart === 'function' && !isNaN(id)){
        addToCart(id);
      }
    }, true); // capture to avoid other bubbling handlers
    btn.__ghsBound = true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();