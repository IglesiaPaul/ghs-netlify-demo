/* === Carbon Lab JS (safe selectors + WETAS fly) — v2025-08-11-6 === */
(function(){
  function confettiBurst(x=window.innerWidth/2, y=window.innerHeight/2){
    const n=18, dur=900;
    for(let i=0;i<n;i++){
      const s=document.createElement("span");
      s.style.cssText=`position:fixed; left:${x}px; top:${y}px; width:8px; height:8px; background:${i%3? "#38E2B5":"#8cf5db"}; border-radius:2px; transform:translate(-50%,-50%); pointer-events:none; z-index:3000;`;
      document.body.appendChild(s);
      const a={x:(Math.random()*2-1)*180, y:(Math.random()*-1-0.2)*240, r:(Math.random()*360)};
      s.animate([{transform:`translate(-50%,-50%) rotate(0deg)`},{transform:`translate(${a.x}px, ${a.y}px) rotate(${a.r}deg)`}],{duration:dur, easing:"cubic-bezier(.22,.61,.36,1)"}).onfinish=()=>s.remove();
    }
  }

  function flyWetas(n, fromEl){
    try{
      const badgeTarget = document.querySelector('a[href$="wallet.html"]') || document.querySelector("#cart-badge");
      const srcRect = (fromEl || document.body).getBoundingClientRect();
      const dstRect = badgeTarget ? badgeTarget.getBoundingClientRect() : {left: window.innerWidth-20, top: 10};
      const el = document.createElement("div");
      el.textContent = `+${n} WETAS`;
      el.style.cssText = `position:fixed; left:${srcRect.left+srcRect.width/2}px; top:${srcRect.top}px; font-weight:900; z-index:3500; pointer-events:none; background:#0d1b16; color:#c8fff0; border:1px solid #143d31; border-radius:999px; padding:6px 10px; box-shadow:0 6px 20px rgba(0,0,0,.2);`;
      document.body.appendChild(el);
      el.animate(
        [{ transform: `translate(0,0)`, opacity: 1 },
         { transform: `translate(${(dstRect.left||0) - (srcRect.left+srcRect.width/2)}px, ${(dstRect.top||0) - srcRect.top}px) scale(.92)`, opacity: .1 }],
        { duration: 900, easing: "cubic-bezier(.22,.61,.36,1)" }
      ).onfinish = ()=> el.remove();
    }catch(e){}
  }

  const storage = (()=>{ try{ const k="__t"; localStorage.setItem(k,"1"); localStorage.removeItem(k);
    return {get:(k)=>localStorage.getItem(k), set:(k,v)=>localStorage.setItem(k,v), remove:(k)=>localStorage.removeItem(k)};
  }catch(e){ const mem={}; return {get:(k)=>mem[k]||null,set:(k,v)=>{mem[k]=v},remove:(k)=>{delete mem[k]}}; }})();

  const Items = [
    { id: "tee", base:"Cotton Tee", hemp:"Hemp Blend Tee", category:"Apparel",
      baseImg:"", hempImg:"assets/img/products/apparel-tee.png",
      co2e_base: 4.0, co2e_hemp: 2.7, water_base: 2700, water_hemp: 1600 },
    { id: "tote", base:"Poly Tote Bag", hemp:"Hemp Tote Bag", category:"Accessories",
      baseImg:"", hempImg:"assets/img/products/tote-bag.png",
      co2e_base: 3.5, co2e_hemp: 2.1, water_base: 500, water_hemp: 300 },
    { id: "brick", base:"Concrete Block", hemp:"Hempcrete Brick", category:"Construction",
      baseImg:"", hempImg:"assets/img/products/hempcrete-brick.png",
      co2e_base: 12.0, co2e_hemp: 1.0, water_base: 50, water_hemp: 30 },
    { id: "protein", base:"Whey Protein (500g)", hemp:"Hemp Protein (500g)", category:"Food",
      baseImg:"", hempImg:"assets/img/products/protein-powder.png",
      co2e_base: 6.0, co2e_hemp: 1.7, water_base: 6000, water_hemp: 900 },
    { id: "oil", base:"Mineral Facial Oil", hemp:"Hemp Facial Oil", category:"Wellness",
      baseImg:"", hempImg:"assets/img/products/facial-oil.png",
      co2e_base: 1.2, co2e_hemp: 0.9, water_base: 50, water_hemp: 30 },
    { id: "rope", base:"Nylon Rope (10m)", hemp:"Hemp Rope (10m)", category:"Industrial",
      baseImg:"", hempImg:"assets/img/products/rope-coil.png",
      co2e_base: 2.5, co2e_hemp: 1.2, water_base: 150, water_hemp: 80 },
  ];
  const TokenRules = { Apparel:2, Food:3, Construction:8, Wellness:2, Accessories:1, Industrial:5 };

  const Lab = { swaps: [] };
  const KEY = "ghs_lab_swaps";

  function q(sel){ return document.querySelector(sel); }
  const inv = q(".lab-page #inv");
  const cauldron = q(".lab-page #cauldron");
  const list = q(".lab-page #swap-list");
  const totalCO2 = q(".lab-page #total-co2");
  const totalWater = q(".lab-page #total-water");
  const totalWetas = q(".lab-page #total-wetas");

  const sticky = q(".lab-page #sticky-cta");
  const stickyCO2 = q(".lab-page #sticky-co2");
  const stickyH2O = q(".lab-page #sticky-h2o");
  const stickyBtn = q(".lab-page #sticky-add");

  function load(){ try{ const s=JSON.parse(storage.get(KEY)||"[]"); if(Array.isArray(s)) Lab.swaps=s; }catch(e){} }
  function save(){ try{ storage.set(KEY, JSON.stringify(Lab.swaps)); }catch(e){} }

  function fmtKg(n){ return (Math.round(n*10)/10).toFixed(1) + " kg"; }
  function fmtL(n){ return Math.round(n).toLocaleString() + " L"; }

  function currentTotals(){
    let dCO2 = 0, dH2O = 0, wetas = 0;
    for(const id of Lab.swaps){
      const it = Items.find(x=>x.id===id);
      if(!it) continue;
      dCO2 += Math.max(0, it.co2e_base - it.co2e_hemp);
      dH2O += Math.max(0, it.water_base - it.water_hemp);
      wetas += (TokenRules[it.category] || 1);
    }
    return { dCO2, dH2O, wetas };
  }

  function updateSticky(){
    if (!sticky || !stickyCO2 || !stickyH2O) return;
    const t = currentTotals();
    stickyCO2.textContent = fmtKg(t.dCO2);
    stickyH2O.textContent = fmtL(t.dH2O);
    sticky.style.opacity = t.wetas > 0 ? "1" : ".92";
  }

  function renderTotals(){
    const t = currentTotals();
    if (totalCO2) totalCO2.textContent = fmtKg(t.dCO2);
    if (totalWater) totalWater.textContent = fmtL(t.dH2O);
    if (totalWetas) totalWetas.textContent = "+" + t.wetas + " WETAS";
    updateSticky();
  }

  function renderSwaps(){
    if (!list) return;
    list.innerHTML = "";
    Lab.swaps.forEach((id, idx)=>{
      const it = Items.find(x=>x.id===id);
      if(!it) return;
      const chip = document.createElement("span");
      chip.className = "badge";
      chip.textContent = it.hemp;
      chip.title = "Tap to undo";
      chip.tabIndex = 0;
      chip.setAttribute("role","button");
      chip.addEventListener("click", ()=>{ Lab.swaps.splice(idx,1); save(); renderSwaps(); renderTotals(); });
      chip.addEventListener("keydown", (e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); Lab.swaps.splice(idx,1); save(); renderSwaps(); renderTotals(); } });
      list.appendChild(chip);
    });
  }

  function toast(msg){
    const t = document.getElementById("toast") || q(".lab-page #toast") || q("#toast");
    if (!t) { console.warn("Toast placeholder missing; falling back to alert."); try{ alert(msg); }catch(e){} return; }
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"), 1600);
  }

  function addToWallet(evt){
    const t = currentTotals();
    if (t.wetas <= 0){ toast("Make a swap first!"); return; }
    try{
      if (typeof State !== "undefined" && State.tokens && typeof saveState === "function"){
        State.tokens.balance += t.wetas;
        saveState();
        const wb = document.getElementById("wallet-badge");
        if (wb) wb.textContent = State.tokens.balance;
      } else {
        const key = "ghs_tokens_fallback";
        const val = parseInt(storage.get(key)||"0",10);
        storage.set(key, String(val + t.wetas));
      }
    }catch(e){}
    toast(`Added ${t.wetas} WETAS to your wallet!`);
    flyWetas(t.wetas, evt && evt.target);
    confettiBurst();
    resetLab();
  }

  function addSwap(id, evt){
    const it = Items.find(x=>x.id===id);
    if(!it) return;
    Lab.swaps.push(id);
    save(); renderSwaps(); renderTotals();
    confettiBurst(evt?.clientX || window.innerWidth/2, evt?.clientY || window.innerHeight/2);
    if (cauldron) { cauldron.classList.add("drop"); setTimeout(()=>cauldron.classList.remove("drop"), 500); }
    const savedCO2 = Math.max(0, it.co2e_base - it.co2e_hemp);
    const savedH2O = Math.max(0, it.water_base - it.water_hemp);
    const last = q(".lab-page #result") || document.getElementById("result");
    if (last) last.innerHTML = `<b>Swapped!</b> ${it.base} → <b>${it.hemp}</b> • Saved ${fmtKg(savedCO2)} CO₂e and ${fmtL(savedH2O)} water.`;
    if(navigator.vibrate) try{ navigator.vibrate(12); }catch(e){}
  }

  function dropHandler(e){ e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if(id) addSwap(id, e); }
  function resetLab(){ Lab.swaps = []; save(); renderSwaps(); renderTotals(); const r = q(".lab-page #result") || document.getElementById("result"); if (r) r.textContent = "Lab reset."; }

  function renderAssumptions(){
    const tbody = q(".lab-page #assump-rows") || document.getElementById("assump-rows");
    if (!tbody) return;
    tbody.innerHTML = Items.map(it=>{
      const dC = Math.max(0, it.co2e_base - it.co2e_hemp).toFixed(1);
      const dW = Math.max(0, it.water_base - it.water_hemp);
      return `<tr>
        <td>${it.base} → ${it.hemp}</td>
        <td>${it.category}</td>
        <td>${it.co2e_base.toFixed(1)}</td>
        <td>${it.co2e_hemp.toFixed(1)}</td>
        <td>${dC}</td>
        <td>${it.water_base}</td>
        <td>${it.water_hemp}</td>
        <td>${dW}</td>
      </tr>`;
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    // Build inventory
    if (inv) {
      Items.forEach(it => {
        const c = document.createElement("div");
        c.className = "inv-card";
        c.draggable = true;
        c.tabIndex = 0;
        c.setAttribute("role","button");
        c.setAttribute("aria-label", `Swap ${it.base} for ${it.hemp}`);
        c.setAttribute("data-id", it.id);
        c.innerHTML = `
          <div class="img">${it.hempImg ? `<img src="${it.hempImg}" alt="${it.hemp}"/>` : "🧪"}</div>
          <div class="t">${it.base} → ${it.hemp}</div>
          <div class="s small">${it.category}</div>
          <div class="btn-row">
            <button class="btn-sm" data-add="${it.id}">Add</button>
            <button class="btn-sm ghost" data-info="${it.id}">Info</button>
          </div>`;
        c.addEventListener("dragstart", (e)=>{ e.dataTransfer.setData("text/plain", it.id); });
        c.addEventListener("click", (e)=>{
          const t = e.target;
          if (t && t.matches('[data-add]')) { addSwap(it.id, e); return; }
          if (t && t.matches('[data-info]')) {
            alert(`${it.base} → ${it.hemp}\nCategory: ${it.category}\nCO₂e: ${it.co2e_base} → ${it.co2e_hemp} kg\nWater: ${it.water_base} → ${it.water_hemp} L`);
            return;
          }
          if (matchMedia("(pointer: coarse)").matches) addSwap(it.id, e);
        });
        c.addEventListener("keydown", (e)=>{ if (e.key==="Enter"||e.key===" ") { e.preventDefault(); addSwap(it.id, e); } });
        inv.appendChild(c);
      });
    }

    // Initial render
    load(); renderSwaps(); renderTotals(); renderAssumptions();

    // DnD
    if (cauldron) {
      cauldron.addEventListener("dragover", (e)=>{ e.preventDefault(); }, {passive:false});
      cauldron.addEventListener("drop", dropHandler);
    }

    // Buttons
    const mainAdd = document.getElementById("add-wallet");
    if (mainAdd) mainAdd.addEventListener("click", addToWallet);
    const resetBtn = document.getElementById("reset-lab");
    if (resetBtn) resetBtn.addEventListener("click", resetLab);
    if (stickyBtn) stickyBtn.addEventListener("click", addToWallet);
  });
})();