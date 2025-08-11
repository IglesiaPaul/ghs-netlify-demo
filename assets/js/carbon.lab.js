/* === Hemp Swap Lab === */
(function(){
  // Confetti helper (inline)
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

  // Safe storage
  const storage = (()=>{ try{ const k="__t"; localStorage.setItem(k,"1"); localStorage.removeItem(k);
    return {get:(k)=>localStorage.getItem(k), set:(k,v)=>localStorage.setItem(k,v), remove:(k)=>localStorage.removeItem(k)};
  }catch(e){ const mem={}; return {get:(k)=>mem[k]||null,set:(k,v)=>{mem[k]=v},remove:(k)=>{delete mem[k]}}; }})();

  // Items & assumptions (illustrative demo values)
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

  const Lab = { swaps: [] }; // array of item ids
  const KEY = "ghs_lab_swaps";

  // UI Nodes
  const inv = document.getElementById("inv");
  const cauldron = document.getElementById("cauldron");
  const list = document.getElementById("swap-list");
  const totalCO2 = document.getElementById("total-co2");
  const totalWater = document.getElementById("total-water");
  const totalWetas = document.getElementById("total-wetas");

  function load(){
    try{ const s = JSON.parse(storage.get(KEY)||"[]"); if(Array.isArray(s)) Lab.swaps = s; }catch(e){}
  }
  function save(){
    try{ storage.set(KEY, JSON.stringify(Lab.swaps)); }catch(e){}
  }

  function fmtKg(n){ return (Math.round(n*10)/10).toFixed(1) + " kg"; }
  function fmtL(n){ return Math.round(n).toLocaleString() + " L"; }

  function renderInventory(){
    inv.innerHTML = "";
    Items.forEach(it => {
      const c = document.createElement("div");
      c.className = "inv-card";
      c.draggable = true;
      c.setAttribute("data-id", it.id);
      c.innerHTML = `
        <div class="img">${it.hempImg ? `<img src="${it.hempImg}" alt="${it.hemp}"/>` : "🧪"}</div>
        <div class="t">${it.base} → ${it.hemp}</div>
        <div class="s small">${it.category}</div>`;
      c.addEventListener("dragstart", (e)=>{
        e.dataTransfer.setData("text/plain", it.id);
      });
      inv.appendChild(c);
    });
  }

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

  function renderTotals(){
    const t = currentTotals();
    totalCO2.textContent = fmtKg(t.dCO2);
    totalWater.textContent = fmtL(t.dH2O);
    totalWetas.textContent = "+" + t.wetas + " WETAS";
  }

  function renderSwaps(){
    list.innerHTML = "";
    Lab.swaps.forEach((id, idx)=>{
      const it = Items.find(x=>x.id===id);
      if(!it) return;
      const chip = document.createElement("span");
      chip.className = "badge";
      chip.textContent = it.hemp;
      chip.title = "Click to undo";
      chip.addEventListener("click", ()=>{
        Lab.swaps.splice(idx,1);
        save(); renderSwaps(); renderTotals();
      });
      list.appendChild(chip);
    });
  }

  function dropHandler(e){
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const it = Items.find(x=>x.id===id);
    if(!it) return;
    Lab.swaps.push(id);
    save(); renderSwaps(); renderTotals();
    confettiBurst(e.clientX, e.clientY);
    // animate border flash
    cauldron.classList.add("drop");
    setTimeout(()=>cauldron.classList.remove("drop"), 500);
    // Show last result
    const last = document.getElementById("result");
    const savedCO2 = Math.max(0, it.co2e_base - it.co2e_hemp);
    const savedH2O = Math.max(0, it.water_base - it.water_hemp);
    last.innerHTML = `<b>Swapped!</b> ${it.base} → <b>${it.hemp}</b> • Saved ${fmtKg(savedCO2)} CO₂e and ${fmtL(savedH2O)} water.`;
    if(navigator.vibrate) try{ navigator.vibrate(12); }catch(e){}
  }
  function dragOver(e){ e.preventDefault(); }

  function resetLab(){
    Lab.swaps = [];
    save(); renderSwaps(); renderTotals();
    document.getElementById("result").textContent = "Lab reset.";
  }

  function addToWallet(){
    const t = currentTotals();
    if (t.wetas <= 0){ toast("Make a swap first!"); return; }
    try{
      if (typeof State !== "undefined" && State.tokens && typeof saveState === "function"){
        State.tokens.balance += t.wetas;
        saveState();
      } else {
        // lightweight fallback
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

  // Assumptions table
  function renderAssumptions(){
    const tbody = document.getElementById("assump-rows");
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
    // inventory
    renderInventory();
    // totals
    load(); renderSwaps(); renderTotals(); renderAssumptions();
    // dnd
    cauldron.addEventListener("dragover", dragOver, {passive:false});
    cauldron.addEventListener("drop", dropHandler);
    // buttons
    document.getElementById("reset-lab").addEventListener("click", resetLab);
    document.getElementById("add-wallet").addEventListener("click", addToWallet);
  });
})();