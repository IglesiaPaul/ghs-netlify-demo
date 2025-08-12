/* === Homepage teasers microinteractions === */
(function(){
  function ripple(e){
    const btn = e.currentTarget;
    const r = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.2;
    r.style.cssText = `position:absolute; left:${e.clientX-rect.left-size/2}px; top:${e.clientY-rect.top-size/2}px; width:${size}px; height:${size}px; border-radius:50%; background:rgba(0,0,0,.08); pointer-events:none; transform:scale(0); opacity:0.6;`;
    btn.appendChild(r);
    r.animate([{transform:'scale(0)', opacity:.6},{transform:'scale(1.6)', opacity:0}], {duration:600, easing:'cubic-bezier(.22,.61,.36,1)'}).onfinish=()=>r.remove();
  }
  function init(){
    document.querySelectorAll('.cta-btn').forEach(b=>{
      b.style.position = 'relative';
      b.addEventListener('click', ripple);
      const href=(b.getAttribute('href')||'').trim();
      if(href==='#' || b.hasAttribute('data-dead')){ b.addEventListener('click', e=>e.preventDefault()); }
    });
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();