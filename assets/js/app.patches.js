/* === GHS Add-on Patches (v2025-08-12-2) ================================== */

/* 1) Carbon Lab nav module (canonicalize + dedupe desktop & mobile) */
(function(){
  if (window.__ghsLabModuleV2) return;
  window.__ghsLabModuleV2 = true;

  function normalizeHref(a){
    const raw = (typeof a === "string" ? a : (a.getAttribute && a.getAttribute("href")) || "") || "";
    let p = raw
      .replace(location.origin, "")
      .replace(/^[a-z]+:\/\//i, "")
      .replace(/^\//, "")
      .replace(/\?.*$/, "")
      .replace(/#.*$/, "");
    if (p.endsWith("/")) p = p.slice(0,-1);
    const pl = p.toLowerCase();
    if (pl === "carbon-lab" || pl === "carbon-lab/index" || pl === "carbon-lab/index.html") p = "carbon-lab.html";
    return p;
  }

  // Styles once
  if (!document.getElementById("lab-link-style")) {
    const style = document.createElement("style");
    style.id = "lab-link-style";
    style.textContent = `
      .menu a.lab-link{position:relative; display:inline-block; border-radius:999px; padding:6px 10px; font-weight:700; overflow:hidden; border:1px solid #d9f8ef}
      .menu a.lab-link::before{content:""; position:absolute; inset:-30%; background:conic-gradient(from 0deg, rgba(56,226,181,.4), transparent 40%, rgba(56,226,181,.35) 60%, transparent 100%); animation:twist 4.8s linear infinite; z-index:0; filter:blur(10px)}
      .menu a.lab-link span{position:relative; z-index:1}
      @keyframes twist{ to { transform:rotate(360deg);} }
      @media (prefers-reduced-motion: reduce){ .menu a.lab-link::before{ animation:none !important } }
    `;
    document.head.appendChild(style);
  }

  function ensureSingleLabLink(){
    const nav = document.getElementById("main-menu") || document.querySelector(".menu");
    if (!nav) return;
    const anchors = Array.from(nav.querySelectorAll("a"));
    const labAnchors = anchors.filter(a => normalizeHref(a) === "carbon-lab.html");
    if (labAnchors.length === 0){
      const link = document.createElement("a");
      link.className = "lab-link";
      link.href = "carbon-lab.html";
      link.innerHTML = "<span>Carbon Lab ✨</span>";
      const afterCarbon = anchors.find(a => /carbon\s*program/i.test(a.textContent || ""));
      if (afterCarbon && afterCarbon.parentNode) afterCarbon.insertAdjacentElement("afterend", link);
      else nav.insertAdjacentElement("afterbegin", link);
    } else {
      for (let i=1;i<labAnchors.length;i++) labAnchors[i].remove();
      const first = labAnchors[0];
      first.classList.add("lab-link");
      first.setAttribute("href","carbon-lab.html");
      if (!/carbon\s*lab/i.test(first.textContent || "")) first.innerHTML = "<span>Carbon Lab ✨</span>";
    }
  }

  function init(){ ensureSingleLabLink(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  setTimeout(init, 600);
  const nav = document.getElementById("main-menu") || document.querySelector(".menu");
  if (nav) new MutationObserver(init).observe(nav, {childList:true, subtree:true});
})();


/* 2) Wallet link highlight (gold glow, no balance UI) */
(function(){
  if (window.__ghsWalletGlowInit) return;
  window.__ghsWalletGlowInit = true;

  if (!document.getElementById("wallet-link-style")) {
    const style = document.createElement("style");
    style.id = "wallet-link-style";
    style.textContent = `
      .menu a.wallet-link, .ghs-menu a.wallet-link{
        position:relative; display:inline-block; border-radius:999px;
        padding:6px 10px; font-weight:700; border:1px solid #ffe8b3;
        overflow:hidden; background:#fff;
      }
      .menu a.wallet-link::before, .ghs-menu a.wallet-link::before{
        content:""; position:absolute; inset:-30%;
        background:conic-gradient(from 0deg, rgba(255,216,107,.45), transparent 40%, rgba(255,216,107,.35) 60%, transparent 100%);
        filter:blur(10px); z-index:0; animation:walletSpin 6s linear infinite;
      }
      .menu a.wallet-link span, .ghs-menu a.wallet-link span{ position:relative; z-index:1 }
      @keyframes walletSpin{ to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce){
        .menu a.wallet-link::before, .ghs-menu a.wallet-link::before{ animation:none !important }
      }
    `;
    document.head.appendChild(style);
  }

  function markWalletLinks(){
    const nav = document.getElementById('main-menu') || document.querySelector('.menu');
    if (!nav) return;
    nav.querySelectorAll('a').forEach(a=>{
      const href = (a.getAttribute('href') || '').replace(/\?.*$/,'').replace(/#.*$/,'').replace(/^\//,'').toLowerCase();
      const isWalletHref = href === 'wallet.html' || href === 'wallet';
      const isWalletText = /wallet/i.test(a.textContent || '');
      if (isWalletHref || isWalletText){
        a.classList.add('wallet-link');
        if (!/wallet/i.test(a.innerHTML)) { a.innerHTML = '<span>Wallet</span>'; }
      }
    });
    if (window.__ghsRebuildOffcanvas) window.__ghsRebuildOffcanvas();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', markWalletLinks);
  else markWalletLinks();
  const nav = document.getElementById('main-menu') || document.querySelector('.menu');
  if (nav) new MutationObserver(markWalletLinks).observe(nav, {childList:true, subtree:true});
  setTimeout(markWalletLinks, 400);
})();


/* 3) Auto-render products on Home + Marketplace (robust, doesn't double-render) */
(function(){
  if (window.__ghsAutoRenderInit) return;
  window.__ghsAutoRenderInit = true;

  function getProducts(){
    try{
      if (window.State && Array.isArray(State.products) && State.products.length) return State.products;
    }catch(e){}
    return []; // we'll just show empty if not available
  }

  function renderIfPresent(sel){
    const el = document.querySelector(sel);
    if (!el) return false;
    if (typeof renderProducts !== 'function') return false;
    // Avoid re-render if cards already exist
    if (el.querySelector('.p-card')) return true;
    renderProducts(sel.startsWith('#') || sel.startsWith('.') ? sel : el.id || sel, getProducts());
    return true;
  }

  function init(){
    // Home hero container
    renderIfPresent('#products-grid');
    // Marketplace typical ids/classes
    renderIfPresent('#market-grid') || renderIfPresent('#marketplace-grid') || renderIfPresent('.market-grid');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // Try again shortly in case products or DOM arrive late
  setTimeout(init, 300);
})();