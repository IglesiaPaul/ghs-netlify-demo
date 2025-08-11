/* === Hemp Swap Lab (mobile + flair) === */
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

  const inv = document.getElementById("inv");
  const cauldron = document.getElementById("cauldron");
  const list = document.getElementById("swap-list");
  const totalCO2 = document.getElementById("total-co2");
  const totalWater = document.getElementById("total-water");
  const totalWetas = document.getElementById("total-wetas");

  const sticky = document.getElementById("sticky-cta");
  const stickyCO2 = document.getElementById("sticky-co2");
  const stickyH2O = document.getElementById("sticky-h2o");

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
    if (!sticky) return;
    const t = currentTotals();
    stickyCO2.textContent = fmtKg(t.dCO2);
    stickyH2O.textContent = fmtL(t.dH2O);
    sticky.style.opacity = t.wetas > 0 ? "1" : ".92";
  }

  function renderTotals(){
    const t = currentTotals();
    totalCO2.textContent = fmtKg(t.dCO2);
    totalWater.textContent = fmtL(t.dH2O);
    totalWetas.textContent = "+" + t.wetas + " WETAS";
    updateSticky();
  }

  function renderSwaps(){
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

  function addSwap(id, evt){
    const it = Items.find(x=>x.id===id);
    if(!it) return;
    Lab.swaps.push(id);
    save(); renderSwaps(); renderTotals();
    confettiBurst(evt?.clientX || window.innerWidth/2, evt?.clientY || window.innerHeight/2);
    cauldron.classList.add("drop");
    setTimeout(()=>cauldron.classList.remove("drop"), 500);
    const savedCO2 = Math.max(0, it.co2e_base - it.co2e_hemp);
    const savedH2O = Math.max(0, it.water_base - it.water_hemp);
    const last = document.getElementById("result");
    last.innerHTML = `<b>Swapped!</b> ${it.base} → <b>${it.hemp}</b> • Saved ${fmtKg(savedCO2)} CO₂e and ${fmtL(savedH2O)} water.`;
    if(navigator.vibrate) try{ navigator.vibrate(12); }catch(e){}
  }

  function dropHandler(e){ e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if(id) addSwap(id, e); }
  function dragOver(e){ e.preventDefault(); }

  function resetLab(){ Lab.swaps = []; save(); renderSwaps(); renderTotals(); document.getElementById("result").textContent = "Lab reset."; }

  function addToWallet(){
    const t = currentTotals();
    if (t.wetas <= 0){ toast("Make a swap first!"); return; }
    try{
      if (typeof State !== "undefined" && State.tokens && typeof saveState === "function"){
        State.tokens.balance += t.wetas;
        saveState();
      } else {
        const key = "ghs_tokens_fallback";
        const val = parseInt(storage.get(key)||"0",10);
        storage.set(key, String(val + t.wetas));
      }
    }catch(e){}
    toast(`Added ${t.wetas} WETAS to your wallet!`);
    confettiBurst();
    resetLab();
  }

  function toast(msg){
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"), 1600);
  }

  function renderAssumptions(){
    const tbody = document.getElementById("assump-rows");
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

  function spawnBubbles(){
    const layer = document.querySelector(".bubbles");
    if (!layer) return;
    const count = 14;
    layer.innerHTML = "";
    for(let i=0; i<count; i++){
      const b = document.createElement("span");
      b.className = "bubble";
      const left = Math.random()*92 + 4;
      const size = 6 + Math.random()*10;
      const dur = 3.5 + Math.random()*3.5;
      const delay = Math.random()*3;
      b.style.left = left + "%";
      b.style.width = size + "px";
      b.style.height = size + "px";
      b.style.animation = `rise ${dur}s linear ${delay}s infinite`;
      layer.appendChild(b);
    }
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    // Inventory
    const inv = document.getElementById("inv");
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

    // Load and render
    load(); renderSwaps(); renderTotals(); renderAssumptions();

    // DnD + bubble layer
    const cauldron = document.getElementById("cauldron");
    cauldron.addEventListener("dragover", (e)=>{ e.preventDefault(); }, {passive:false});
    cauldron.addEventListener("drop", dropHandler);
    spawnBubbles();

    // Buttons
    document.getElementById("reset-lab").addEventListener("click", resetLab);
    document.getElementById("add-wallet").addEventListener("click", addToWallet);
    const stickyBtn = document.getElementById("sticky-add");
    if (stickyBtn) stickyBtn.addEventListener("click", addToWallet);
  });
})();