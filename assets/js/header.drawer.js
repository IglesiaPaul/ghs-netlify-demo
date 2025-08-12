// === Header Drawer (independent) ============================================
(function(){
  if (window.__ghsHeaderDrawer) return; window.__ghsHeaderDrawer = true;

  function open(){ document.body.classList.add('drawer-open'); setAria(true); }
  function close(){ document.body.classList.remove('drawer-open'); setAria(false); }
  function toggle(){ document.body.classList.toggle('drawer-open'); setAria(document.body.classList.contains('drawer-open')); }

  function setAria(isOpen){
    var btn = document.getElementById('menu-toggle');
    if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  function bind(){
    var btn = document.getElementById('menu-toggle');
    var menu = document.getElementById('main-menu');
    var overlay = document.getElementById('menu-overlay');
    if (!btn || !menu || !overlay) return;

    if (!btn.__bound){
      btn.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        toggle();
      }, true); // capture to beat other handlers
      btn.__bound = true;
    }
    if (!overlay.__bound){
      overlay.addEventListener('click', function(){ close(); });
      overlay.__bound = true;
    }
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();