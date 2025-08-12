
/* === GHS Brand Header helper (uses ghs_logo.svg) ============================
   - Inserts SVG logo into the green badge
   - Wraps badge + "Global Hemp Service" into a single link to index.html
   - Injects minimal CSS so nothing else needs editing
============================================================================= */
(function(){
  if (window.__ghsBrandHeaderInit) return; window.__ghsBrandHeaderInit = true;

  function injectCSS(){
    if (document.getElementById('ghs-brand-style')) return;
    const s = document.createElement('style'); s.id='ghs-brand-style';
    s.textContent = `
      .nav .brand-link{ display:inline-flex; align-items:center; gap:8px; color:inherit; text-decoration:none; font-weight:800; }
      .nav .brand-link:focus{ outline:2px solid #38E2B5; outline-offset:2px; border-radius:10px; }
      .nav .logo-badge{ display:inline-flex; align-items:center; justify-content:center; overflow:hidden; }
      .nav .logo-badge img{ width:70%; height:70%; display:block; object-fit:contain; }
      @media (max-width: 520px){
        .nav .logo-badge img{ width:64%; height:64%; }
      }
    `;
    document.head.appendChild(s);
  }

  function upgrade(){
    const wrap = document.querySelector('.nav .logo');
    if (!wrap) return;
    if (wrap.querySelector('a.brand-link')) return;

    // Keep timezone pill on the right
    const geo = wrap.querySelector('#geo-badge');

    // Prepare badge
    let badge = wrap.querySelector('.logo-badge');
    if (!badge){
      badge = document.createElement('span');
      badge.className = 'logo-badge';
    }
    // Ensure logo image
    let img = badge.querySelector('img');
    if (!img){
      img = document.createElement('img');
      img.src = 'assets/img/ghs_logo.svg';
      img.alt = 'Global Hemp Service logo';
      badge.appendChild(img);
    } else {
      img.src = 'assets/img/ghs_logo.svg';
      img.alt = 'Global Hemp Service logo';
    }

    // Build link
    const a = document.createElement('a');
    a.href = 'index.html';
    a.className = 'brand-link';
    a.setAttribute('aria-label','Global Hemp Service — Home');
    const name = document.createElement('span');
    name.className = 'brand-name';
    name.textContent = 'Global Hemp Service';

    // Rebuild
    wrap.innerHTML = '';
    a.appendChild(badge);
    a.appendChild(name);
    wrap.appendChild(a);
    if (geo) wrap.appendChild(geo);
  }

  function init(){ injectCSS(); upgrade(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
