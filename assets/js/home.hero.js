/* === Card micro-interactions === */
(function(){
  function activate(card){
    if (!card) return;
    card.classList.add('is-active');
    clearTimeout(card.__liftTimer);
    card.__liftTimer = setTimeout(()=>card.classList.remove('is-active'), 180);
  }
  function init(){
    document.querySelectorAll('.p-card').forEach(card=>{
      card.addEventListener('pointerdown', ()=>activate(card));
      card.addEventListener('mouseenter', ()=>{ card.classList.add('is-hover'); });
      card.addEventListener('mouseleave', ()=>{ card.classList.remove('is-hover'); card.classList.remove('is-active'); });
      card.addEventListener('keydown', (e)=>{
        if (e.key==='Enter' || e.key===' ') { e.preventDefault(); const link=card.querySelector('.p-link'); if (link) link.click(); }
      });
    });
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();