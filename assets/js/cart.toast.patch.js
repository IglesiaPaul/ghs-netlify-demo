/* === Cart toast patch ========================================================
   Replaces any blocking alert/confirm popup on Add-to-Cart with an in-page toast.
============================================================================= */
(function(){
  if (window.__ghsCartToastPatched) return; window.__ghsCartToastPatched = true;

  // Inject minimal styles
  if (!document.getElementById('ghs-toast-style')){
    const s = document.createElement('style'); s.id='ghs-toast-style';
    s.textContent = `
      #ghs-toast{ position: fixed; right: 16px; bottom: 16px; z-index: 5000;
                  background: #0b1a15; color: #c8fff0; border:1px solid #143d31;
                  padding: 10px 12px; border-radius: 12px; box-shadow:0 8px 20px rgba(0,0,0,.25);
                  display:flex; align-items:center; gap:10px; transform: translateY(8px); opacity: 0;
                  transition: opacity .18s, transform .18s; }
      #ghs-toast.show{ opacity: 1; transform: translateY(0); }
      #ghs-toast .btn{ background:#eafff6; color:#0b7c3f; border:1px solid #b2e8d9; border-radius:10px; padding:6px 10px; cursor:pointer; }
    `;
    document.head.appendChild(s);
  }
  function toast(msg){
    let t = document.getElementById('ghs-toast');
    if (!t){
      t = document.createElement('div'); t.id='ghs-toast';
      t.innerHTML = `<span id="ghs-toast-msg"></span> <button class="btn" id="ghs-toast-ok">OK</button>`;
      document.body.appendChild(t);
      t.querySelector('#ghs-toast-ok').addEventListener('click', ()=>hide());
    }
    t.querySelector('#ghs-toast-msg').textContent = msg || 'Added to cart';
    requestAnimationFrame(()=> t.classList.add('show'));
    // auto hide after 2.2s
    clearTimeout(t.__timer);
    t.__timer = setTimeout(hide, 2200);
    function hide(){
      t.classList.remove('show');
      clearTimeout(t.__timer);
    }
    return t;
  }

  const orig = window.addToCart;
  window.addToCart = function(id){
    if (typeof orig === 'function'){
      try{ orig(id); }catch(e){ console.warn('[GHS] addToCart error:', e); }
    }
    toast('Added to cart');
    return false;
  };
})();